"""Global paths & runtime configuration."""
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

for _p in (MODELS_DIR, ADAPTERS_DIR, DATASETS_DIR, LOGS_DIR):
    _p.mkdir(parents=True, exist_ok=True)


HF_TOKEN: str | None = os.getenv("HF_TOKEN") or None
DEVICE_OVERRIDE: str = os.getenv("POCKETLM_DEVICE", "auto").lower()

