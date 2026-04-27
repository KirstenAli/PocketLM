"""Training endpoints."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from sqlmodel import select
from sse_starlette.sse import EventSourceResponse

from ..config import DATASETS_DIR
from ..db import session_scope
from ..models_schema import TrainingJob
from ..schemas import TrainRequest, TrainingJobOut
from ..services.trainer import run_training

router = APIRouter()


@router.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(400, "Missing filename")
    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in file.filename)
    dest = DATASETS_DIR / safe
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"path": str(dest), "name": safe, "size_bytes": dest.stat().st_size}


@router.post("/train")
async def train(req: TrainRequest):
    if not Path(req.dataset_path).expanduser().exists():
        raise HTTPException(400, f"Dataset not found: {req.dataset_path}")

    async def gen():
        async for evt in run_training(req):
            yield {"data": json.dumps(evt)}

    return EventSourceResponse(gen())


@router.get("/train/jobs", response_model=list[TrainingJobOut])
def list_jobs():
    with session_scope() as s:
        rows = s.exec(select(TrainingJob).order_by(TrainingJob.id.desc())).all()
        return [TrainingJobOut(**r.dict()) for r in rows]


@router.get("/train/jobs/{jid}", response_model=TrainingJobOut)
def get_job(jid: int):
    with session_scope() as s:
        j = s.get(TrainingJob, jid)
        if not j:
            raise HTTPException(404, "Not found")
        return TrainingJobOut(**j.dict())

