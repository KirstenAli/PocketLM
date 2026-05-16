"""Server boots, healthcheck, schema basics."""
from __future__ import annotations


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True
    assert "version" in body


def test_index_serves_spa(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "<!" in r.text or "<html" in r.text.lower()


def test_openapi_includes_new_routers(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = r.json().get("paths", {})
    assert "/api/settings" in paths
    assert "/api/agent/servers" in paths
    assert "/api/agent/chat" in paths

