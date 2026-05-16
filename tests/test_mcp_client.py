"""MCP server CRUD + header encryption + agent loop tool-call parsing."""
from __future__ import annotations

import json

from pocketlm.services import mcp_client


def test_header_encryption_roundtrip():
    enc = mcp_client.encrypt_headers({"Authorization": "Bearer xyz", "X-Empty": ""})
    # Empty values are dropped, non-empty values are prefixed with "enc:".
    assert "X-Empty" not in enc
    assert enc["Authorization"].startswith(mcp_client.HEADER_PREFIX)
    assert "Bearer xyz" not in enc["Authorization"]

    dec = mcp_client.decrypt_headers(enc)
    assert dec["Authorization"] == "Bearer xyz"


def test_server_crud_masks_headers(client):
    payload = {
        "name": "test-mcp",
        "transport": "http",
        "url": "https://mcp.example.com",
        "command": "",
        "args": [],
        "headers": {"Authorization": "Bearer SECRET"},
        "enabled": True,
    }
    created = client.post("/api/agent/servers", json=payload).json()
    assert created["headers"]["Authorization"] == "••••••"
    sid = created["id"]

    listed = client.get("/api/agent/servers").json()
    assert any(s["id"] == sid for s in listed)
    # Plain secret never appears in the API response.
    assert "SECRET" not in json.dumps(listed)

    client.delete(f"/api/agent/servers/{sid}")
    assert all(s["id"] != sid for s in client.get("/api/agent/servers").json())


async def test_agent_loop_parses_tool_calls(monkeypatch):
    """The loop should detect <tool_call> blocks, dispatch them, then emit a
    final assistant turn when the model stops calling tools."""
    from pocketlm.services import agent_loop

    async def _fake_tools(server_ids):
        return [agent_loop.ToolBinding(
            server_id=1, server_name="srv", tool_name="add",
            description="adds", input_schema={"a": "int", "b": "int"},
        )], []

    turns = iter([
        '<tool_call>{"name": "add", "arguments": {"a": 2, "b": 3}}</tool_call>',
        "The answer is 5.",
    ])

    async def _fake_stream(model_id, history, **kwargs):
        yield next(turns)

    async def _fake_call_tool(server, name, args):
        return [{"type": "text", "text": str(args["a"] + args["b"])}]

    monkeypatch.setattr(agent_loop, "_gather_tools", _fake_tools)
    monkeypatch.setattr(agent_loop, "stream_chat", _fake_stream)
    monkeypatch.setattr(mcp_client, "call_tool", _fake_call_tool)

    events = []
    async for evt in agent_loop.run_agent(
        "owner/tiny",
        "what is 2 + 3?",
        server_ids=[1],
        max_tool_calls=2,
    ):
        events.append(evt)

    kinds = [e["event"] for e in events]
    assert "tool_call" in kinds
    assert "tool_result" in kinds
    assert kinds[-1] == "done"
    tokens = "".join(e["text"] for e in events if e["event"] == "token")
    assert "5" in tokens

