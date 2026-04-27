"""Model download / delete endpoints."""
from __future__ import annotations

import json
import shutil

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from ..catalog import get as catalog_get
from ..db import session_scope
from ..models_schema import ModelRecord
from ..schemas import DownloadRequest
from ..services.downloader import folder_size, local_path_for, stream_download

router = APIRouter()


@router.post("/models/download")
async def download_model(req: DownloadRequest):
    if not catalog_get(req.repo_id):
        raise HTTPException(404, f"Unknown model: {req.repo_id}")

    async def gen():
        final_path = None
        async for evt in stream_download(req.repo_id):
            if evt["event"] == "done":
                final_path = evt["path"]
            yield {"data": json.dumps(evt)}

        if final_path:
            size = folder_size(local_path_for(req.repo_id))
            with session_scope() as s:
                rec = s.get(ModelRecord, req.repo_id)
                if rec is None:
                    rec = ModelRecord(
                        repo_id=req.repo_id,
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
            yield {"data": json.dumps({"event": "saved", "size_bytes": size})}

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

