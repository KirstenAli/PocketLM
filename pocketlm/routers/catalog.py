"""Catalog + installed-models endpoints."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from ..catalog import CATALOG
from ..config import ADAPTERS_DIR
from ..db import session_scope
from ..models_schema import ModelRecord, TrainingJob
from ..services import model_manager
from ..services.device import device_info

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


def _custom_card(rec: ModelRecord) -> dict:
    """Build a catalog-shaped dict for a user-added (non-curated) HF model.

    Best-effort enrichment from the local config.json (context window, model
    family). Param count is estimated from the on-disk size assuming ~fp16
    weights — accurate enough for a "≈" badge."""
    repo_id = rec.repo_id
    ctx = 0
    family = repo_id.split("/", 1)[0] if "/" in repo_id else "Custom"
    cfg_path = Path(rec.local_path) / "config.json" if rec.local_path else None
    if cfg_path and cfg_path.exists():
        try:
            cfg = json.loads(cfg_path.read_text())
            for k in ("max_position_embeddings", "n_positions", "seq_length", "max_seq_len"):
                v = cfg.get(k)
                if isinstance(v, int) and v > 0:
                    ctx = v
                    break
            mt = cfg.get("model_type")
            if isinstance(mt, str) and mt:
                family = mt.replace("_", " ").title()
        except Exception:
            pass
    params_b = round(rec.size_bytes / 2 / 1e9, 2) if rec.size_bytes else 0.0
    min_ram_gb = max(2, round(params_b * 2 + 2)) if params_b else 0
    size_mb = rec.size_bytes // (1024 * 1024) if rec.size_bytes else 0
    return {
        "repo_id": repo_id,
        "display_name": repo_id.split("/", 1)[-1],
        "family": family,
        "params_b": params_b,
        "min_ram_gb": min_ram_gb,
        "context": ctx,
        "recommended_dtype": "bf16",
        "gated": False,
        "description": f"Added from Hugging Face. {size_mb} MB on disk.",
        "installed": True,
        "custom": True,
        "downloaded_at": rec.downloaded_at.isoformat() if rec.downloaded_at else None,
    }


@router.get("/catalog")
def get_catalog(
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Paginated catalog. Ordering rules (applied server-side so the cursor
    is stable as the user scrolls):
      1. Freshly-installed entries (curated or custom) first, newest first.
      2. User-added custom installs next, newest first.
      3. Curated catalog entries in declared order.
    """
    NEW_WINDOW_S = 10 * 60
    from datetime import datetime as _dt
    now = _dt.utcnow()

    items: list[dict] = []
    catalog_ids = {m.repo_id for m in CATALOG}
    with session_scope() as s:
        installed_recs = {r.repo_id: r for r in s.exec(select(ModelRecord)).all()}
    for idx, m in enumerate(CATALOG):
        d = m.to_dict()
        rec = installed_recs.get(m.repo_id)
        d["installed"] = rec is not None
        d["custom"] = False
        d["downloaded_at"] = rec.downloaded_at.isoformat() if (rec and rec.downloaded_at) else None
        d["_order"] = idx
        items.append(d)
    for rid, rec in installed_recs.items():
        if rid in catalog_ids:
            continue
        c = _custom_card(rec)
        c["_order"] = 10_000_000
        items.append(c)

    def _fresh(d: dict) -> bool:
        ts = d.get("downloaded_at")
        if not ts or not d.get("installed"):
            return False
        try:
            t = _dt.fromisoformat(ts)
        except ValueError:
            return False
        return (now - t).total_seconds() < NEW_WINDOW_S

    def _sort_key(d: dict):
        fresh = _fresh(d)
        ts = d.get("downloaded_at") or ""
        return (
            0 if fresh else 1,
            # newest-first within fresh tier (reverse ISO sort works)
            -_ts_or_zero(ts) if fresh else 0,
            0 if d.get("custom") else 1,
            -_ts_or_zero(ts) if d.get("custom") else 0,
            d.get("_order", 0),
        )
    items.sort(key=_sort_key)
    for it in items:
        it.pop("_order", None)

    total = len(items)
    page = items[offset : offset + limit]
    next_offset = offset + len(page) if (offset + len(page)) < total else None
    return {
        "models": page,
        "device": device_info() if offset == 0 else None,
        "total": total,
        "next_offset": next_offset,
    }


def _ts_or_zero(iso: str) -> float:
    if not iso:
        return 0.0
    from datetime import datetime as _dt
    try:
        return _dt.fromisoformat(iso).timestamp()
    except ValueError:
        return 0.0


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


