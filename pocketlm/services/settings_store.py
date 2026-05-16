"""DB-backed application settings with at-rest encryption for secrets.

Schema is declared in `SETTINGS_SCHEMA` so the UI can render typed inputs and
group them by category. Reads consult the DB first then fall back to env vars
and finally the declared default. Secret values (HF tokens, etc.) are never
returned in plaintext from `list_settings()` — callers see the masked
sentinel `SECRET_MASK` plus a `has_value` boolean."""
from __future__ import annotations

import json
import os
import threading
from dataclasses import dataclass, field
from typing import Any, Optional

from sqlmodel import select

from ..config import SECRET_KEY_PATH

SECRET_MASK = "••••••••"

# ----------------------------------------------------------------------
# Schema declaration. Keep this the single source of truth for what
# environment variables / runtime knobs PocketLM exposes to the UI.
# ----------------------------------------------------------------------

@dataclass(frozen=True)
class SettingDef:
    key: str
    category: str
    type: str  # "text" | "password" | "number" | "select" | "toggle"
    label: str
    description: str = ""
    default: Any = None
    secret: bool = False
    restart_required: bool = False
    options: tuple = field(default_factory=tuple)  # for "select"


SETTINGS_SCHEMA: list[SettingDef] = [
    SettingDef(
        key="HF_TOKEN",
        category="Hugging Face",
        type="password",
        label="Hugging Face access token",
        description="Required to download gated / private models. Create one at "
                    "https://huggingface.co/settings/tokens.",
        secret=True,
    ),
]

_SCHEMA_BY_KEY: dict[str, SettingDef] = {d.key: d for d in SETTINGS_SCHEMA}


def get_def(key: str) -> Optional[SettingDef]:
    return _SCHEMA_BY_KEY.get(key)


# ----------------------------------------------------------------------
# Encryption helpers (Fernet). We persist the key in the PocketLM HOME
# folder with restrictive perms; if cryptography isn't available we fall
# back to a simple obfuscation so the app still boots.
# ----------------------------------------------------------------------

_key_lock = threading.Lock()
_fernet = None


def _load_fernet():
    global _fernet
    if _fernet is not None:
        return _fernet
    with _key_lock:
        if _fernet is not None:
            return _fernet
        try:
            from cryptography.fernet import Fernet  # type: ignore
        except Exception:
            _fernet = False  # sentinel: cryptography unavailable
            return _fernet
        env_key = os.getenv("POCKETLM_SECRET_KEY")
        if env_key:
            key = env_key.encode()
        elif SECRET_KEY_PATH.exists():
            key = SECRET_KEY_PATH.read_bytes().strip()
        else:
            key = Fernet.generate_key()
            try:
                SECRET_KEY_PATH.write_bytes(key)
                os.chmod(SECRET_KEY_PATH, 0o600)
            except Exception:
                pass
        try:
            _fernet = Fernet(key)
        except Exception:
            _fernet = False
        return _fernet


def encrypt_secret(plaintext: str) -> str:
    if not plaintext:
        return ""
    f = _load_fernet()
    if not f:
        # Fallback: base64 with a marker. Not secure, but keeps the app
        # functional in minimal-deps environments (e.g. CI).
        import base64
        return "b64:" + base64.b64encode(plaintext.encode()).decode()
    return "fer:" + f.encrypt(plaintext.encode()).decode()


def decrypt_secret(blob: str) -> str:
    if not blob:
        return ""
    if blob.startswith("fer:"):
        f = _load_fernet()
        if not f:
            return ""
        try:
            return f.decrypt(blob[4:].encode()).decode()
        except Exception:
            return ""
    if blob.startswith("b64:"):
        import base64
        try:
            return base64.b64decode(blob[4:].encode()).decode()
        except Exception:
            return ""
    return blob  # legacy plaintext


# ----------------------------------------------------------------------
# DB accessors. Imported lazily by config.py to avoid circulars.
# ----------------------------------------------------------------------

def _get_raw(key: str) -> Optional[str]:
    from ..db import session_scope
    from ..models_schema import AppSetting
    with session_scope() as s:
        row = s.get(AppSetting, key)
        return row.value if row else None


def get_effective(key: str) -> Any:
    """Decoded value from DB, or None if not stored. (Env / default fallback
    is handled by callers in config.py.)"""
    d = get_def(key)
    raw = _get_raw(key)
    if raw is None or raw == "":
        return None
    if d and d.secret:
        return decrypt_secret(raw) or None
    # Non-secrets are JSON-encoded.
    try:
        return json.loads(raw)
    except Exception:
        return raw


def set_value(key: str, value: Any) -> None:
    from ..db import session_scope
    from ..models_schema import AppSetting
    from datetime import datetime
    d = get_def(key)
    if d is None:
        raise ValueError(f"Unknown setting key: {key}")
    if d.secret:
        encoded = encrypt_secret("" if value is None else str(value))
    else:
        encoded = json.dumps(value)
    with session_scope() as s:
        row = s.get(AppSetting, key)
        if row is None:
            row = AppSetting(key=key, value=encoded, is_secret=d.secret)
        else:
            row.value = encoded
            row.is_secret = d.secret
            row.updated_at = datetime.utcnow()
        s.add(row)
        s.commit()


def clear_value(key: str) -> None:
    from ..db import session_scope
    from ..models_schema import AppSetting
    with session_scope() as s:
        row = s.get(AppSetting, key)
        if row is not None:
            s.delete(row)
            s.commit()


def list_settings() -> list[dict]:
    """Return the schema with current effective values (secrets masked)."""
    out: list[dict] = []
    for d in SETTINGS_SCHEMA:
        env_value = os.getenv(d.key)
        db_value = get_effective(d.key)
        effective = db_value if db_value not in (None, "") else env_value
        has_value = effective not in (None, "")
        item = {
            "key": d.key,
            "category": d.category,
            "type": d.type,
            "label": d.label,
            "description": d.description,
            "default": d.default,
            "secret": d.secret,
            "restart_required": d.restart_required,
            "options": list(d.options) if d.options else [],
            "has_value": has_value,
            "env_present": env_value not in (None, ""),
        }
        if d.secret:
            item["value"] = SECRET_MASK if has_value else ""
        else:
            item["value"] = effective if effective is not None else d.default
        out.append(item)
    return out


def apply_update(updates: dict[str, Any]) -> list[str]:
    """Persist a {key: value} map. Values equal to the secret mask are skipped
    (means the user didn't change the field). Empty string for a secret means
    "clear it". Returns the list of keys that were actually written."""
    written: list[str] = []
    for key, val in (updates or {}).items():
        d = get_def(key)
        if d is None:
            continue  # ignore unknown keys defensively
        if d.secret and val == SECRET_MASK:
            continue
        if d.secret and (val is None or val == ""):
            clear_value(key)
            written.append(key)
            continue
        if d.type == "number":
            try:
                val = int(val) if isinstance(val, str) and "." not in val else float(val) if isinstance(val, str) else val
            except (TypeError, ValueError):
                continue
        if d.type == "toggle":
            val = bool(val)
        set_value(key, val)
        written.append(key)
    return written

