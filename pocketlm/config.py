"""Global paths & runtime configuration.

Mutable settings (HF token, device override, host, port, etc.) are exposed as
*accessor functions* that consult the DB-backed settings store first, then
fall back to environment variables, then to a hard-coded default. This lets
users change runtime config from the in-app Settings page without editing
files. The legacy module-level `HF_TOKEN` / `DEVICE_OVERRIDE` constants are
kept as thin shims for any code that still imports them directly, but new
code should call the accessors so changes take effect without a restart.
"""
from __future__ import annotations

import os
from pathlib import Path


def _home() -> Path:
    override = os.getenv("POCKETLM_HOME")
    base = Path(override).expanduser() if override else Path.home() / ".pocketlm"
    base.mkdir(parents=True, exist_ok=True)
    return base


HOME: Path = _home()
DB_PATH: Path = HOME / "pocketlm.db"
MODELS_DIR: Path = HOME / "models"
ADAPTERS_DIR: Path = HOME / "adapters"
DATASETS_DIR: Path = HOME / "datasets"
LOGS_DIR: Path = HOME / "logs"
SECRET_KEY_PATH: Path = HOME / ".secret_key"

for _p in (MODELS_DIR, ADAPTERS_DIR, DATASETS_DIR, LOGS_DIR):
    _p.mkdir(parents=True, exist_ok=True)


def _store_get(key: str):
    """Lazy import so importing config doesn't pull in SQLModel during early
    bootstrap (and avoids a circular import with services.settings_store)."""
    try:
        from .services import settings_store  # noqa: WPS433
        return settings_store.get_effective(key)
    except Exception:
        return None


def get_hf_token() -> str | None:
    v = _store_get("HF_TOKEN")
    if v:
        return v
    return os.getenv("HF_TOKEN") or None


def get_device_override() -> str:
    v = _store_get("POCKETLM_DEVICE")
    if v:
        return str(v).lower()
    return os.getenv("POCKETLM_DEVICE", "auto").lower()


def get_host() -> str:
    v = _store_get("POCKETLM_HOST")
    if v:
        return str(v)
    return os.getenv("POCKETLM_HOST", "127.0.0.1")


def get_port() -> int:
    v = _store_get("POCKETLM_PORT")
    try:
        return int(v) if v is not None and v != "" else int(os.getenv("POCKETLM_PORT", "8000"))
    except (TypeError, ValueError):
        return 8000


# Legacy shims — read at import time. New code should use the accessors so
# changes from the Settings page apply without a restart.
HF_TOKEN: str | None = os.getenv("HF_TOKEN") or None
DEVICE_OVERRIDE: str = os.getenv("POCKETLM_DEVICE", "auto").lower()

