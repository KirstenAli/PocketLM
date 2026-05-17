"""MCP server CRUD + header encryption + JSON-action agent loop tests."""
from __future__ import annotations

import json

from pocketlm.services import mcp_client


def test_header_encryption_roundtrip():
    enc = mcp_client.encrypt_headers({"Authorization": "Bearer xyz", "X-Empty": ""})
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
    assert "SECRET" not in json.dumps(listed)

    client.delete(f"/api/agent/servers/{sid}")
    assert all(s["id"] != sid for s in client.get("/api/agent/servers").json())


async def test_agent_loop_json_action_tool_then_final(monkeypatch):
    """The loop should detect  ground blocks, dispatch them, then emit a
    final assistant turn when the model stops calling tools."""
    from pocketlm.services import agent_loop

    async def _fake_tools(server_ids):
        return [agent_loop.ToolBinding(
            server_id=1,
            server_name="srv",
            tool_name="add",
            description="adds",
            input_schema={"a": "int", "b": "int"},
        )], []

    turns = iter([
        '{"action":"tool","name":"add","arguments":{"a":2,"b":3}}',
        '{"action":"final","text":"The answer is 5."}',
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
    assert any(e.get("text") == "The answer is 5." for e in events if e["event"] == "token")


async def test_agent_loop_rejects_non_json(monkeypatch):
    from pocketlm.services import agent_loop

    async def _fake_tools(server_ids):
        return [], []

    async def _fake_stream(model_id, history, **kwargs):
        yield "not-json"

    monkeypatch.setattr(agent_loop, "_gather_tools", _fake_tools)
    monkeypatch.setattr(agent_loop, "stream_chat", _fake_stream)

    events = []
    async for evt in agent_loop.run_agent(
        "owner/tiny",
        "hello",
        server_ids=[],
        max_tool_calls=1,
    ):
        events.append(evt)

    assert events[-1]["event"] == "error"
    assert "JSON action" in events[-1]["message"]


def test_builtin_tools_list_and_call():
    from pocketlm.services import builtin_tools

    tools = builtin_tools.list_tools()
    assert any(t["name"] == "run_command" for t in tools)

    out = builtin_tools.call_tool("run_command", {"command": "pwd"})
    assert out and out[0]["type"] == "text"
    assert "exit_code" in out[0]["text"]


def test_builtin_tools_rejects_empty_command():
    from pocketlm.services import builtin_tools

    try:
        builtin_tools.call_tool("run_command", {"command": ""})
        assert False, "expected ValueError"
    except ValueError as e:
        assert "required" in str(e)


def test_agent_chat_persists_conversation_history(client, monkeypatch):
    from pocketlm.services import agent_loop

    async def _fake_run_agent(*args, **kwargs):
        yield {"event": "start", "tools": []}
        yield {"event": "token", "text": "agent reply"}
        yield {"event": "done"}

    monkeypatch.setattr(agent_loop, "run_agent", _fake_run_agent)

    conv = client.post("/api/conversations", json={"model_id": "owner/tiny", "title": "Agent test"}).json()
    r = client.post("/api/agent/chat", json={
        "conversation_id": conv["id"],
        "model_id": "owner/tiny",
        "message": "hello from agent",
        "server_ids": [],
    })
    assert r.status_code == 200

    msgs = client.get(f"/api/conversations/{conv['id']}/messages?limit=10").json()
    assert [m["role"] for m in msgs] == ["user", "assistant"]
    assert msgs[0]["content"] == "hello from agent"
    assert msgs[1]["content"] == "agent reply"

