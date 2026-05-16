"""Minimal agent loop that lets a local LLM call MCP tools.

Protocol: the system prompt enumerates each tool as JSON-schema and tells the
model to emit either plain text (final answer) or a single tool call wrapped
in `<tool_call>{...}</tool_call>`. We parse on close-tag, dispatch via the
mcp_client, append a `tool` message with the result, and loop until either
the model emits a plain-text turn or `max_tool_calls` is exhausted.
"""
from __future__ import annotations

import asyncio
import json
import re
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


_TOOL_CALL_RE = re.compile(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", re.DOTALL)


def _build_system_prompt(user_system: str | None, tools: list[ToolBinding]) -> str:
    header = (user_system or "You are PocketLM Agent, a helpful local assistant.").strip()
    if not tools:
        return header
    catalog_lines = []
    for t in tools:
        schema = json.dumps(t.input_schema or {}, indent=2)
        catalog_lines.append(
            f"- name: {t.tool_name}\n  server: {t.server_name}\n  description: {t.description}\n  input_schema: {schema}"
        )
    catalog = "\n".join(catalog_lines)
    return (
        f"{header}\n\n"
        "You have access to the following tools:\n"
        f"{catalog}\n\n"
        "When you need to call a tool, respond with a SINGLE block:\n"
        '<tool_call>{\"name\": \"tool_name\", \"arguments\": {...}}</tool_call>\n'
        "Wait for the tool result (it will be appended as a `tool` message) before continuing.\n"
        "When you have the final answer, respond with plain text only."
    )


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
        # Stream one assistant turn, accumulating text. We don't forward
        # tokens to the client while a tool call may be in flight (tokens
        # inside <tool_call> would confuse the UI); instead we emit a
        # single 'token' event with the visible portion after each turn.
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

        text = "".join(buf).strip()
        match = _TOOL_CALL_RE.search(text)

        if match and calls_made < max_tool_calls:
            calls_made += 1
            # Anything before the tool_call is preamble — forward as a token.
            preamble = text[: match.start()].strip()
            if preamble:
                yield {"event": "token", "text": preamble}
            try:
                payload = json.loads(match.group(1))
                tool_name = payload.get("name") or payload.get("tool")
                arguments = payload.get("arguments") or payload.get("args") or {}
            except Exception as e:  # noqa: BLE001
                yield {"event": "error", "message": f"Failed to parse tool call: {e}"}
                return

            yield {"event": "tool_call", "name": tool_name, "arguments": arguments}

            binding = by_name.get(tool_name)
            if binding is None:
                tool_result = [{"type": "text", "text": f"Error: unknown tool '{tool_name}'."}]
            else:
                with session_scope() as s:
                    srv = s.get(MCPServer, binding.server_id)
                try:
                    tool_result = await mcp_client.call_tool(srv, tool_name, arguments)
                except Exception as e:  # noqa: BLE001
                    tool_result = [{"type": "text", "text": f"Tool error: {e}"}]

            yield {"event": "tool_result", "name": tool_name, "result": tool_result}

            # Feed the tool call + result back into the conversation so the
            # model can continue. We use plain `assistant`/`user` roles for
            # maximum compatibility with small chat templates.
            messages.append({"role": "assistant", "content": match.group(0)})
            messages.append({
                "role": "user",
                "content": f"<tool_result name=\"{tool_name}\">{json.dumps(tool_result)}</tool_result>",
            })
            continue

        # No more tool calls (or budget exhausted) — emit final answer.
        final = text
        if calls_made >= max_tool_calls and match:
            final = "(tool-call budget exhausted) " + text[: match.start()].strip()
        if final:
            yield {"event": "token", "text": final}
        yield {"event": "done"}
        return

