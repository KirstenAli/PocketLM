"""Shared pytest fixtures.

We set POCKETLM_HOME to a fresh tmp dir BEFORE importing pocketlm so the
SQLite engine + filesystem paths land outside the user's real ~/.pocketlm.
The fixtures also stub the heavy ML-side functions (model download,
streaming chat) so tests run without GPUs / network / Hugging Face."""
from __future__ import annotations

import os
import tempfile
import sys
from pathlib import Path

# --- Sandbox env (must run before any `import pocketlm.*`) ---------------
_TMP_HOME = tempfile.mkdtemp(prefix="pocketlm-tests-")
os.environ.setdefault("POCKETLM_HOME", _TMP_HOME)
# Avoid touching the user's real HF token / device.
os.environ.pop("HF_TOKEN", None)
os.environ.pop("POCKETLM_DEVICE", None)
os.environ.setdefault("POCKETLM_NO_BROWSER", "1")
# Per-test, generate a fresh Fernet key so settings tests don't depend on
# whatever key the host machine may already have written.
try:
    from cryptography.fernet import Fernet  # type: ignore

    os.environ.setdefault("POCKETLM_SECRET_KEY", Fernet.generate_key().decode())
except Exception:
    pass

import pytest
from fastapi.testclient import TestClient

# Now safe to import.
from pocketlm.db import init_db, session_scope  # noqa: E402
from pocketlm.server import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _init_db_once() -> None:
    init_db()


def _wipe_tables() -> None:
    from pocketlm.models_schema import (
        AppSetting,
        Conversation,
        MCPServer,
        Message,
        ModelRecord,
        TrainingJob,
    )
    from sqlmodel import delete

    with session_scope() as s:
        for model in (Message, Conversation, ModelRecord, TrainingJob, AppSetting, MCPServer):
            s.exec(delete(model))
        s.commit()


@pytest.fixture(autouse=True)
def _clean_db() -> None:
    _wipe_tables()
    yield
    _wipe_tables()


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def fake_stream_chat(monkeypatch):
    """Replace the LLM streaming with a deterministic token sequence.

    Returns the list `captured_kwargs` so tests can assert the routers
    forwarded their generation parameters correctly."""
    captured: dict = {}

    async def _fake_stream_chat(model_id, history, **kwargs):
        captured["model_id"] = model_id
        captured["history"] = history
        captured["kwargs"] = kwargs
        for tok in ("Hello", ", ", "world", "!"):
            yield tok

    monkeypatch.setattr("pocketlm.routers.chat.stream_chat", _fake_stream_chat)
    return captured


@pytest.fixture()
def fake_downloader_success(monkeypatch, tmp_path):
    """Make `stream_download` succeed without contacting Hugging Face."""

    async def _ok(repo_id):
        target = tmp_path / repo_id.replace("/", "__")
        target.mkdir(parents=True, exist_ok=True)
        (target / "config.json").write_text('{"model_type": "fake"}')
        yield {"event": "start", "repo_id": repo_id, "target": str(target)}
        yield {"event": "progress", "message": "Downloading…"}
        yield {"event": "done", "path": str(target)}

    # Patch in the router module — that's where the route imports from.
    monkeypatch.setattr("pocketlm.routers.downloads.stream_download", _ok)
    # Also point `local_path_for` at the tmp tree so size + folder lookups work.
    monkeypatch.setattr(
        "pocketlm.routers.downloads.local_path_for",
        lambda rid: tmp_path / rid.replace("/", "__"),
    )
    return tmp_path


@pytest.fixture()
def fake_downloader_gated(monkeypatch):
    """Make `stream_download` emit a gated-model error event."""

    async def _gated(repo_id):
        yield {"event": "start", "repo_id": repo_id, "target": ""}
        yield {
            "event": "error",
            "message": f"{repo_id} is gated. Accept the license and add an HF token in Settings.",
            "repo_id": repo_id,
            "code": "gated",
        }

    monkeypatch.setattr("pocketlm.routers.downloads.stream_download", _gated)

