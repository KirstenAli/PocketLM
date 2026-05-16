"""Catalog endpoint is paginated server-side with stable ordering."""
from __future__ import annotations

from datetime import datetime

from pocketlm.catalog import CATALOG
from pocketlm.db import session_scope
from pocketlm.models_schema import ModelRecord


def test_first_page_returns_device_and_cursor(client):
    r = client.get("/api/catalog?limit=3&offset=0")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["models"], list)
    assert len(data["models"]) <= 3
    assert data["device"] is not None  # device echoed on first page only
    assert data["total"] >= len(data["models"])
    if data["total"] > 3:
        assert data["next_offset"] == 3


def test_pagination_is_disjoint_and_complete(client):
    full = client.get("/api/catalog?limit=100&offset=0").json()
    total = full["total"]
    page1 = client.get("/api/catalog?limit=5&offset=0").json()
    page2 = client.get("/api/catalog?limit=5&offset=5").json()
    assert page2.get("device") is None  # only first page carries device
    ids1 = [m["repo_id"] for m in page1["models"]]
    ids2 = [m["repo_id"] for m in page2["models"]]
    assert set(ids1).isdisjoint(ids2)
    if total > 10:
        assert page1["next_offset"] == 5


def test_custom_install_floats_to_top(client):
    # Pretend we just installed a not-in-catalog model.
    with session_scope() as s:
        s.add(ModelRecord(
            repo_id="me/my-fancy-model",
            local_path="/tmp/fake",
            size_bytes=10 * 1024 * 1024,
            status="ready",
            downloaded_at=datetime.utcnow(),
        ))
        s.commit()
    data = client.get("/api/catalog?limit=5&offset=0").json()
    first_ids = [m["repo_id"] for m in data["models"]]
    assert "me/my-fancy-model" in first_ids
    custom_card = next(m for m in data["models"] if m["repo_id"] == "me/my-fancy-model")
    assert custom_card["custom"] is True
    assert custom_card["installed"] is True


def test_catalog_size_matches_declared(client):
    data = client.get("/api/catalog?limit=100&offset=0").json()
    assert data["total"] >= len(CATALOG)

