"""Settings CRUD."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..schemas import SettingsUpdate
from ..services import settings_store

router = APIRouter()


@router.get("/settings")
def list_settings() -> dict:
    """Return the full schema with masked values, grouped by category."""
    items = settings_store.list_settings()
    grouped: dict[str, list] = {}
    for it in items:
        grouped.setdefault(it["category"], []).append(it)
    return {
        "categories": [
            {"name": cat, "items": rows} for cat, rows in grouped.items()
        ],
        "mask": settings_store.SECRET_MASK,
    }


@router.put("/settings")
def update_settings(payload: SettingsUpdate) -> dict:
    written = settings_store.apply_update(payload.values or {})
    return {"ok": True, "updated": written}


@router.post("/settings/test-hf-token")
def test_hf_token(payload: dict | None = None) -> dict:
    """Validate an HF token by calling whoami. If `token` is omitted in the
    payload, the saved/effective token is used."""
    token = (payload or {}).get("token")
    if not token or token == settings_store.SECRET_MASK:
        from ..config import get_hf_token
        token = get_hf_token()
    if not token:
        raise HTTPException(400, "No token provided or stored.")
    try:
        from huggingface_hub import HfApi
        info = HfApi(token=token).whoami()
        return {"ok": True, "user": info.get("name") or info.get("fullname") or "Hugging Face user"}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(401, f"Token rejected by Hugging Face: {e}")

