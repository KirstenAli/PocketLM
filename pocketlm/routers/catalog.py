"""Catalog + installed-models endpoints."""
from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..catalog import CATALOG
from ..config import ADAPTERS_DIR
from ..db import session_scope
from ..models_schema import ModelRecord, TrainingJob
from ..services import model_manager
from ..services.device import device_info
from ..services.downloader import local_path_for

router = APIRouter()


def _adapter_size(path: str) -> int:
    p = Path(path)
    if not p.exists():
        return 0
    total = 0
    for f in p.rglob("*"):
        if f.is_file():
            try:
                total += f.stat().st_size
            except OSError:
                pass
    return total


@router.get("/catalog")
def get_catalog() -> dict:
    items = []
    with session_scope() as s:
        installed = {r.repo_id for r in s.exec(select(ModelRecord)).all()}
    for m in CATALOG:
        d = m.to_dict()
        # Only trust the DB. Stale/empty folders from failed downloads
        # should NOT be counted as installed.
        d["installed"] = m.repo_id in installed
        items.append(d)
    return {"models": items, "device": device_info()}


@router.get("/models")
def installed_models() -> dict:
    models: list[dict] = []
    with session_scope() as s:
        for rec in s.exec(select(ModelRecord)).all():
            models.append(
                {
                    "repo_id": rec.repo_id,
                    "local_path": rec.local_path,
                    "size_bytes": rec.size_bytes,
                    "type": "base",
                }
            )
        # Also list LoRA adapters from finished training jobs.
        for job in s.exec(select(TrainingJob).where(TrainingJob.status == "done")).all():
            adapter_name = job.output_dir.rstrip("/").split("/")[-1]
            models.append(
                {
                    "repo_id": f"{job.base_model}|adapter:{adapter_name}",
                    "local_path": job.output_dir,
                    "size_bytes": _adapter_size(job.output_dir),
                    "type": "adapter",
                    "base_model": job.base_model,
                    "adapter_name": adapter_name,
                    "job_id": job.id,
                    "created_at": job.finished_at.isoformat() if job.finished_at else None,
                }
            )
    # Deduplicate
    seen = set()
    out = []
    for m in models:
        if m["repo_id"] in seen:
            continue
        seen.add(m["repo_id"])
        out.append(m)
    return {"models": out, "adapters_dir": str(ADAPTERS_DIR)}


@router.delete("/adapters/{name}")
def delete_adapter(name: str):
    """Delete a fine-tuned adapter (folder + DB row)."""
    # Don't allow path traversal.
    if "/" in name or ".." in name:
        raise HTTPException(400, "Invalid adapter name")
    folder = ADAPTERS_DIR / name
    # Unload if currently in use.
    cur = model_manager.get_loaded()
    if cur and cur.adapter_path and Path(cur.adapter_path).name == name:
        model_manager.unload()
    if folder.exists():
        shutil.rmtree(folder, ignore_errors=True)
    with session_scope() as s:
        for job in s.exec(select(TrainingJob)).all():
            if job.output_dir.rstrip("/").split("/")[-1] == name:
                s.delete(job)
        s.commit()
    return {"ok": True}


