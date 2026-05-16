"""Agent endpoints: MCP server CRUD + agent chat (SSE)."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from sqlmodel import select
from sse_starlette.sse import EventSourceResponse

from ..db import session_scope
from ..models_schema import MCPServer
from ..schemas import AgentChatRequest, MCPServerIn, MCPServerOut
from ..services import agent_loop, mcp_client

router = APIRouter()


def _row_to_out(row: MCPServer) -> MCPServerOut:
    d = mcp_client.server_to_dict(row, mask_headers=True)
    return MCPServerOut(**d)


@router.get("/agent/servers", response_model=list[MCPServerOut])
def list_servers():
    with session_scope() as s:
        rows = s.exec(select(MCPServer).order_by(MCPServer.id)).all()
        return [_row_to_out(r) for r in rows]


@router.post("/agent/servers", response_model=MCPServerOut)
def create_server(payload: MCPServerIn):
    enc_headers = mcp_client.encrypt_headers(payload.headers or {})
    row = MCPServer(
        name=payload.name.strip() or "Untitled",
        transport=(payload.transport or "http").lower(),
        url=payload.url or "",
        command=payload.command or "",
        args_json=json.dumps(payload.args or []),
        headers_json=json.dumps(enc_headers),
        enabled=bool(payload.enabled),
    )
    with session_scope() as s:
        s.add(row)
        s.commit()
        s.refresh(row)
        return _row_to_out(row)


@router.patch("/agent/servers/{sid}", response_model=MCPServerOut)
def update_server(sid: int, payload: MCPServerIn):
    with session_scope() as s:
        row = s.get(MCPServer, sid)
        if not row:
            raise HTTPException(404, "Not found")
        row.name = payload.name.strip() or row.name
        row.transport = (payload.transport or row.transport).lower()
        row.url = payload.url or ""
        row.command = payload.command or ""
        row.args_json = json.dumps(payload.args or [])
        # Preserve existing header values when the client sends masked placeholders.
        existing = json.loads(row.headers_json or "{}")
        merged_plain = {}
        for k, v in (payload.headers or {}).items():
            if v == "••••••" and k in existing:
                merged_plain_enc = existing[k]
                # keep existing encrypted blob
                existing[k] = merged_plain_enc
            else:
                merged_plain[k] = v
        new_enc = mcp_client.encrypt_headers(merged_plain)
        existing.update(new_enc)
        # Drop any header keys the client removed.
        existing = {k: v for k, v in existing.items() if k in (payload.headers or {})}
        row.headers_json = json.dumps(existing)
        row.enabled = bool(payload.enabled)
        s.add(row)
        s.commit()
        s.refresh(row)
        return _row_to_out(row)


@router.delete("/agent/servers/{sid}")
def delete_server(sid: int):
    with session_scope() as s:
        row = s.get(MCPServer, sid)
        if row:
            s.delete(row)
            s.commit()
    return {"ok": True}


@router.get("/agent/servers/{sid}/tools")
async def list_tools(sid: int):
    with session_scope() as s:
        row = s.get(MCPServer, sid)
        if not row:
            raise HTTPException(404, "Not found")
    try:
        tools = await mcp_client.list_tools(row)
        return {"tools": tools}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, str(e))


@router.post("/agent/chat")
async def agent_chat(req: AgentChatRequest):
    async def gen():
        try:
            async for evt in agent_loop.run_agent(
                req.model_id,
                req.message,
                server_ids=req.server_ids,
                max_tool_calls=req.max_tool_calls,
                system_prompt=req.system_prompt,
                temperature=req.temperature,
                top_p=req.top_p,
                max_new_tokens=req.max_new_tokens,
            ):
                yield {"data": json.dumps(evt)}
        except Exception as e:  # noqa: BLE001
            yield {"data": json.dumps({"event": "error", "message": str(e)})}

    return EventSourceResponse(gen())

