"""Chat endpoint forwards generation parameters and handles gated errors."""
from __future__ import annotations

import json


def _sse_events(text: str) -> list[dict]:
    events = []
    for chunk in text.replace("\r\n", "\n").split("\n\n"):
        data_lines = [l[5:].lstrip() for l in chunk.splitlines() if l.startswith("data:")]
        if not data_lines:
            continue
        try:
            events.append(json.loads("\n".join(data_lines)))
        except json.JSONDecodeError:
            pass
    return events


def _new_conv(client, model_id="owner/tiny"):
    r = client.post("/api/conversations", json={"model_id": model_id, "title": "T"})
    assert r.status_code == 200, r.text
    return r.json()


def test_chat_forwards_all_extended_params(client, fake_stream_chat):
    conv = _new_conv(client)
    payload = {
        "conversation_id": conv["id"],
        "model_id": "owner/tiny",
        "message": "Hello there",
        "temperature": 0.42,
        "top_p": 0.8,
        "top_k": 40,
        "repetition_penalty": 1.15,
        "max_new_tokens": 128,
        "min_new_tokens": 4,
        "do_sample": False,
        "num_beams": 2,
        "seed": 1234,
        "stop_sequences": ["</end>"],
        "system_prompt": "You are concise.",
    }
    r = client.post("/api/chat", json=payload)
    assert r.status_code == 200, r.text
    events = _sse_events(r.text)
    tokens = [e for e in events if e["event"] == "token"]
    assert "".join(t["text"] for t in tokens) == "Hello, world!"

    kw = fake_stream_chat["kwargs"]
    for key in ("temperature", "top_p", "top_k", "repetition_penalty",
                "max_new_tokens", "min_new_tokens", "do_sample", "num_beams",
                "seed", "stop_sequences"):
        assert kw[key] == payload[key], f"{key} not forwarded correctly"

    # System prompt is injected at the top of history.
    history = fake_stream_chat["history"]
    assert history[0]["role"] == "system"
    assert history[0]["content"] == "You are concise."


def test_chat_emits_gated_code_on_error(client, monkeypatch):
    conv = _new_conv(client)
    from pocketlm.services.errors import GatedModelError

    async def _gated_stream(*a, **kw):
        raise GatedModelError("meta-llama/Llama-2-7b", "gated repo")
        # pragma: no cover - generator
        if False:
            yield ""

    monkeypatch.setattr("pocketlm.routers.chat.stream_chat", _gated_stream)
    r = client.post("/api/chat", json={
        "conversation_id": conv["id"],
        "model_id": "meta-llama/Llama-2-7b",
        "message": "hello",
    })
    assert r.status_code == 200
    events = _sse_events(r.text)
    err = next(e for e in events if e["event"] == "error")
    assert err["code"] == "gated"
    assert err["repo_id"] == "meta-llama/Llama-2-7b"


def test_chat_persists_messages(client, fake_stream_chat):
    conv = _new_conv(client)
    client.post("/api/chat", json={
        "conversation_id": conv["id"],
        "model_id": "owner/tiny",
        "message": "ping",
    })
    msgs = client.get(f"/api/conversations/{conv['id']}/messages?limit=10").json()
    roles = [m["role"] for m in msgs]
    assert roles == ["user", "assistant"]
    assert msgs[0]["content"] == "ping"
    assert msgs[1]["content"] == "Hello, world!"

