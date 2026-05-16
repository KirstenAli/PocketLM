"""Settings round-trip: read schema, write secret + non-secret, secrets stay masked."""
from __future__ import annotations

from pocketlm.services import settings_store


def test_schema_lists_known_keys(client):
    r = client.get("/api/settings")
    assert r.status_code == 200
    data = r.json()
    keys = {it["key"] for cat in data["categories"] for it in cat["items"]}
    assert "HF_TOKEN" in keys
    # HF_TOKEN starts un-set, value should be empty string and has_value False.
    hf = next(it for cat in data["categories"] for it in cat["items"] if it["key"] == "HF_TOKEN")
    assert hf["secret"] is True
    assert hf["has_value"] is False
    assert hf["value"] == ""


def test_write_secret_returns_masked_and_decrypts_internally(client):
    r = client.put("/api/settings", json={"values": {"HF_TOKEN": "hf_abc123"}})
    assert r.status_code == 200
    assert r.json()["updated"] == ["HF_TOKEN"]

    # API never echoes the plaintext back.
    listed = client.get("/api/settings").json()
    hf = next(it for cat in listed["categories"] for it in cat["items"] if it["key"] == "HF_TOKEN")
    assert hf["has_value"] is True
    assert hf["value"] == settings_store.SECRET_MASK
    assert "hf_abc123" not in r.text

    # But the internal accessor can read the real value.
    from pocketlm.config import get_hf_token
    assert get_hf_token() == "hf_abc123"


def test_mask_sentinel_does_not_overwrite_existing(client):
    client.put("/api/settings", json={"values": {"HF_TOKEN": "real_token"}})
    # Sending the mask back (as the UI does for untouched fields) must be a no-op.
    r = client.put("/api/settings", json={"values": {"HF_TOKEN": settings_store.SECRET_MASK}})
    assert r.json()["updated"] == []
    from pocketlm.config import get_hf_token
    assert get_hf_token() == "real_token"


def test_clearing_a_secret(client):
    client.put("/api/settings", json={"values": {"HF_TOKEN": "to_be_cleared"}})
    client.put("/api/settings", json={"values": {"HF_TOKEN": ""}})
    from pocketlm.config import get_hf_token
    assert get_hf_token() is None


