"""Model download / delete endpoints."""
from __future__ import annotations

import json
import shutil

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from ..db import session_scope
from ..models_schema import ModelRecord
from ..schemas import DownloadRequest
from ..services.downloader import (
    folder_size,
    local_path_for,
    normalize_repo_id,
    stream_download,
)

router = APIRouter()


@router.post("/models/download")
async def download_model(req: DownloadRequest):
    # Accept any HF repo (curated or arbitrary). The catalog router will
    # surface installed-but-not-curated repos as "custom" cards.
    try:
        repo_id = normalize_repo_id(req.repo_id)
    except ValueError as e:
        raise HTTPException(400, str(e))

    async def gen():
        final_path = None
        async for evt in stream_download(repo_id):
            if evt["event"] == "done":
                final_path = evt["path"]
            yield {"data": json.dumps(evt)}

        if final_path:
            size = folder_size(local_path_for(repo_id))
            with session_scope() as s:
                rec = s.get(ModelRecord, repo_id)
                if rec is None:
                    rec = ModelRecord(
                        repo_id=repo_id,
                        local_path=final_path,
                        size_bytes=size,
                        status="ready",
                    )
                else:
                    rec.local_path = final_path
                    rec.size_bytes = size
                    rec.status = "ready"
                s.add(rec)
                s.commit()
            yield {"data": json.dumps({"event": "saved", "size_bytes": size, "repo_id": repo_id})}

    return EventSourceResponse(gen())


@router.delete("/models/{repo_id:path}")
def delete_model(repo_id: str):
    path = local_path_for(repo_id)
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)
    with session_scope() as s:
        rec = s.get(ModelRecord, repo_id)
        if rec:
            s.delete(rec)
            s.commit()
    return {"ok": True}

