"""Gated-model errors flow through to SSE with `code: gated`."""
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


def test_download_gated_emits_structured_error(client, fake_downloader_gated):
    r = client.post("/api/models/download", json={"repo_id": "meta-llama/Llama-2-7b"})
    assert r.status_code == 200
    events = _sse_events(r.text)
    gated = [e for e in events if e.get("event") == "error"]
    assert gated, f"expected an error event, got {events}"
    err = gated[0]
    assert err["code"] == "gated"
    assert err["repo_id"] == "meta-llama/Llama-2-7b"
    assert "Settings" in err["message"] or "gated" in err["message"].lower()


def test_classify_hf_exception_recognizes_gated_strings():
    from pocketlm.services.errors import GatedModelError, classify_hf_exception

    typed = classify_hf_exception("foo/bar", RuntimeError("403 access to gated repo"))
    assert isinstance(typed, GatedModelError)
    assert typed.repo_id == "foo/bar"


def test_download_success_then_listed_as_installed(client, fake_downloader_success):
    r = client.post("/api/models/download", json={"repo_id": "owner/tiny"})
    assert r.status_code == 200
    events = _sse_events(r.text)
    assert any(e.get("event") == "done" for e in events)
    assert any(e.get("event") == "saved" for e in events)

    listed = client.get("/api/models").json()["models"]
    assert any(m["repo_id"] == "owner/tiny" for m in listed)

