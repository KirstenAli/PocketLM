"""Wrap huggingface_hub.snapshot_download with progress reporting."""
from __future__ import annotations

import asyncio
import re
import threading
from pathlib import Path
from typing import AsyncIterator

from huggingface_hub import snapshot_download

from ..config import HF_TOKEN, MODELS_DIR


def _safe_dirname(repo_id: str) -> str:
    return repo_id.replace("/", "__")


def local_path_for(repo_id: str) -> Path:
    return MODELS_DIR / _safe_dirname(repo_id)


_VALID_REPO_RE = re.compile(r"^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$")


def normalize_repo_id(raw: str) -> str:
    """Accept any of:
        - "owner/name"
        - "https://huggingface.co/owner/name"
        - "https://huggingface.co/owner/name/tree/main"
        - "huggingface.co/owner/name"
    Returns a canonical "owner/name" or raises ValueError.
    """
    s = (raw or "").strip()
    if not s:
        raise ValueError("Empty repo id")
    # Strip protocol + host
    if "huggingface.co" in s:
        s = s.split("huggingface.co/", 1)[-1]
    # Drop query / fragment
    s = s.split("?", 1)[0].split("#", 1)[0]
    # Drop /tree/<ref>, /blob/<ref>, /resolve/<ref> suffixes
    for sep in ("/tree/", "/blob/", "/resolve/", "/commits/"):
        s = s.split(sep, 1)[0]
    s = s.strip().strip("/")
    if not _VALID_REPO_RE.match(s):
        raise ValueError(
            f"Not a valid Hugging Face model id: {raw!r}. "
            "Expected 'owner/name' or a huggingface.co URL."
        )
    return s


def _friendly_error(repo_id: str, exc: Exception) -> str:
    msg = str(exc)
    low = msg.lower()
    if "gated" in low or "restricted" in low or "401" in msg or "403" in msg:
        return (
            f"🔒 {repo_id} is a gated model. "
            f"1) Accept the license on https://huggingface.co/{repo_id}  "
            f"2) Put your token in the .env file as HF_TOKEN=hf_...  "
            f"3) Restart PocketLM."
        )
    if "not found" in low or "404" in msg:
        return f"Repo not found: {repo_id}"
    if "connection" in low or "timeout" in low or "name resolution" in low:
        return "Network error talking to Hugging Face. Check your internet connection."
    return msg


async def stream_download(repo_id: str) -> AsyncIterator[dict]:
    """Yield progress events while downloading a HF snapshot.

    Events:
        {"event": "start"}
        {"event": "progress", "message": "..."}
        {"event": "done", "path": "..."}
        {"event": "error", "message": "..."}
    """
    import shutil

    target = local_path_for(repo_id)
    # Don't pre-create the dir — only create it inside snapshot_download so
    # a failed/partial download doesn't leave behind an empty folder that
    # makes the model look "installed".
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    result: dict = {}

    def _run() -> None:
        try:
            target.mkdir(parents=True, exist_ok=True)
            path = snapshot_download(
                repo_id=repo_id,
                local_dir=str(target),
                token=HF_TOKEN,
                # Skip giant optional weights when possible.
                allow_patterns=[
                    "*.json",
                    "*.txt",
                    "*.model",
                    "*.safetensors",
                    "*.bin",
                    "tokenizer*",
                    "*.tiktoken",
                    "*.spm",
                    "*.vocab",
                    "*.merges",
                ],
            )
            result["path"] = path
            loop.call_soon_threadsafe(queue.put_nowait, {"event": "done", "path": path})
        except Exception as e:  # noqa: BLE001
            # Clean up partial / empty directory so the UI doesn't think it's installed.
            try:
                if target.exists():
                    shutil.rmtree(target, ignore_errors=True)
            except Exception:
                pass
            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"event": "error", "message": _friendly_error(repo_id, e)},
            )

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    yield {"event": "start", "repo_id": repo_id, "target": str(target)}

    # Heartbeat while download runs (HF hub doesn't expose easy byte-level callback;
    # we keep the connection warm so the UI shows it's alive).
    while thread.is_alive():
        try:
            evt = await asyncio.wait_for(queue.get(), timeout=1.0)
            yield evt
            if evt["event"] in {"done", "error"}:
                return
        except asyncio.TimeoutError:
            yield {"event": "progress", "message": "Downloading…"}

    # Drain anything the thread queued at the end.
    while not queue.empty():
        yield queue.get_nowait()


def folder_size(path: Path) -> int:
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except OSError:
                pass
    return total

