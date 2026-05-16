"""JSON-action agent loop for MCP tools.

The model chooses the next action by returning a JSON object. The runtime does
no heuristic intent guessing; it only parses JSON and executes what the model
requested.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import AsyncIterator

from sqlmodel import select

from ..db import session_scope
from ..models_schema import MCPServer
from . import mcp_client
from .inference import stream_chat


@dataclass
class ToolBinding:
    server_id: int
    server_name: str
    tool_name: str
    description: str
    input_schema: dict


def _build_system_prompt(user_system: str | None, tools: list[ToolBinding]) -> str:
    header = (user_system or "You are PocketLM Agent, a helpful local assistant.").strip()
    catalog_lines = []
    for t in tools:
        schema = json.dumps(t.input_schema or {}, indent=2)
        catalog_lines.append(
            f"- name: {t.tool_name}\n  server: {t.server_name}\n  description: {t.description}\n  input_schema: {schema}"
        )
    catalog = "\n".join(catalog_lines) if catalog_lines else "(no tools available)"
    return (
        f"{header}\n\n"
        "You have access to the following tools:\n"
        f"{catalog}\n\n"
        "Return ONLY one JSON object per turn using exactly one of these shapes:\n"
        "1) Tool call:\n"
        '{"action":"tool","name":"tool_name","arguments":{...}}\n'
        "2) Final answer:\n"
        '{"action":"final","text":"..."}\n\n'
        "Rules:\n"
        "- Do not return markdown, code fences, or prose outside JSON.\n"
        "- Choose the next action yourself.\n"
        "- If tool output is needed, emit a tool action first."
    )


def _strip_fence(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        lines = t.splitlines()
        if len(lines) >= 2 and lines[-1].strip().startswith("```"):
            t = "\n".join(lines[1:-1]).strip()
    return t


def _parse_action(text: str) -> dict | None:
    """Parse a JSON action object from model output."""
    t = _strip_fence(text)
    if not t:
        return None
    if not (t.startswith("{") and t.endswith("}")):
        a, b = t.find("{"), t.rfind("}")
        if a == -1 or b == -1 or b <= a:
            return None
        t = t[a : b + 1]
    try:
        obj = json.loads(t)
    except Exception:
        return None
    return obj if isinstance(obj, dict) else None


def _coerce_action(obj: dict) -> tuple[str, str | None, dict | None, str | None]:
    """Return (kind, tool_name, arguments, final_text)."""
    action = str(obj.get("action") or "").strip().lower()

    # Back-compat: allow {"name":...,"arguments":...} as implicit tool action.
    if not action and isinstance(obj.get("name") or obj.get("tool"), str):
        action = "tool"

    if action == "tool":
        name = obj.get("name") or obj.get("tool")
        args = obj.get("arguments") or obj.get("args") or {}
        if not isinstance(name, str) or not name.strip():
            return "error", None, None, "tool action requires non-empty 'name'"
        if not isinstance(args, dict):
            return "error", None, None, "tool action requires object 'arguments'"
        return "tool", name.strip(), args, None

    if action == "final":
        text = obj.get("text")
        if text is None:
            return "error", None, None, "final action requires 'text'"
        return "final", None, None, str(text)

    return "error", None, None, "action must be 'tool' or 'final'"


async def _gather_tools(server_ids: list[int]) -> tuple[list[ToolBinding], list[dict]]:
    bindings: list[ToolBinding] = []
    errors: list[dict] = []
    if not server_ids:
        return bindings, errors
    with session_scope() as s:
        servers = {srv.id: srv for srv in s.exec(
            select(MCPServer).where(MCPServer.id.in_(server_ids))
        ).all()}
    for sid in server_ids:
        srv = servers.get(sid)
        if not srv or not srv.enabled:
            continue
        try:
            tools = await mcp_client.list_tools(srv)
        except Exception as e:  # noqa: BLE001
            errors.append({"server_id": sid, "server_name": srv.name, "error": str(e)})
            continue
        for t in tools:
            bindings.append(ToolBinding(
                server_id=srv.id,
                server_name=srv.name,
                tool_name=t["name"],
                description=t["description"],
                input_schema=t["input_schema"],
            ))
    return bindings, errors


async def run_agent(
    model_id: str,
    user_message: str,
    *,
    server_ids: list[int],
    max_tool_calls: int = 4,
    system_prompt: str | None = None,
    temperature: float = 0.2,
    top_p: float = 0.95,
    max_new_tokens: int = 512,
) -> AsyncIterator[dict]:
    """Yield SSE-shaped events: start, token, tool_call, tool_result, done, error."""
    tools, tool_errors = await _gather_tools(server_ids)
    for err in tool_errors:
        yield {"event": "tool_error", **err}

    by_name = {t.tool_name: t for t in tools}
    sys_prompt = _build_system_prompt(system_prompt, tools)
    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": user_message},
    ]

    yield {"event": "start", "tools": [
        {"name": t.tool_name, "server": t.server_name} for t in tools
    ]}

    calls_made = 0
    while True:
        buf: list[str] = []
        try:
            async for chunk in stream_chat(
                model_id,
                messages,
                temperature=temperature,
                top_p=top_p,
                max_new_tokens=max_new_tokens,
            ):
                buf.append(chunk)
        except Exception as e:  # noqa: BLE001
            yield {"event": "error", "message": str(e)}
            return

        raw = "".join(buf).strip()
        obj = _parse_action(raw)
        if obj is None:
            yield {"event": "error", "message": "Agent must return a JSON action object."}
            return

        kind, tool_name, arguments, final_text = _coerce_action(obj)
        if kind == "error":
            yield {"event": "error", "message": final_text or "Invalid action"}
            return

        if kind == "final":
            if final_text:
                yield {"event": "token", "text": final_text}
            yield {"event": "done"}
            return

        # tool action
        if calls_made >= max_tool_calls:
            yield {"event": "error", "message": "tool-call budget exhausted"}
            return
        calls_made += 1
        yield {"event": "tool_call", "name": tool_name, "arguments": arguments}

        binding = by_name.get(tool_name)
        if binding is None:
            tool_result = [{"type": "text", "text": f"Error: unknown tool '{tool_name}'."}]
        else:
            with session_scope() as s:
                srv = s.get(MCPServer, binding.server_id)
            try:
                tool_result = await mcp_client.call_tool(srv, tool_name, arguments or {})
            except Exception as e:  # noqa: BLE001
                tool_result = [{"type": "text", "text": f"Tool error: {e}"}]

        yield {"event": "tool_result", "name": tool_name, "result": tool_result}

        # Feed action + result back so model can choose next step.
        messages.append({"role": "assistant", "content": json.dumps(obj)})
        messages.append({
            "role": "user",
            "content": f"<tool_result name=\"{tool_name}\">{json.dumps(tool_result)}</tool_result>",
        })
