"""Streaming chat endpoint."""
from __future__ import annotations

import json
import threading
from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select
from sse_starlette.sse import EventSourceResponse

from ..db import session_scope
from ..models_schema import Conversation, Message
from ..schemas import ChatRequest
from ..services.inference import stream_chat

router = APIRouter()


def _maybe_title(text: str) -> str:
    t = text.strip().splitlines()[0] if text.strip() else "New chat"
    return (t[:60] + "…") if len(t) > 60 else t


@router.post("/chat")
async def chat(req: ChatRequest):
    with session_scope() as s:
        conv = s.get(Conversation, req.conversation_id)
        if not conv:
            raise HTTPException(404, "Conversation not found")

        # Persist user message immediately.
        s.add(Message(conversation_id=conv.id, role="user", content=req.message))
        if conv.title in ("", "New chat"):
            conv.title = _maybe_title(req.message)
        conv.model_id = req.model_id
        conv.updated_at = datetime.utcnow()
        s.add(conv)
        s.commit()

        # Build history from DB.
        msgs = s.exec(
            select(Message).where(Message.conversation_id == conv.id).order_by(Message.id)
        ).all()
        history = [{"role": m.role, "content": m.content} for m in msgs]
        if req.system_prompt and not any(m["role"] == "system" for m in history):
            history.insert(0, {"role": "system", "content": req.system_prompt})

    stop_event = threading.Event()

    async def gen():
        full = []
        saved = False
        try:
            yield {"data": json.dumps({"event": "start", "model_id": req.model_id})}
            async for chunk in stream_chat(
                req.model_id,
                history,
                temperature=req.temperature,
                top_p=req.top_p,
                max_new_tokens=req.max_new_tokens,
                stop_event=stop_event,
            ):
                full.append(chunk)
                yield {"data": json.dumps({"event": "token", "text": chunk})}
            text = "".join(full).strip()
            with session_scope() as s:
                s.add(Message(conversation_id=req.conversation_id, role="assistant", content=text))
                conv = s.get(Conversation, req.conversation_id)
                if conv:
                    conv.updated_at = datetime.utcnow()
                    s.add(conv)
                s.commit()
            saved = True
            yield {"data": json.dumps({"event": "done"})}
        except Exception as e:  # noqa: BLE001
            yield {"data": json.dumps({"event": "error", "message": str(e)})}
        finally:
            # Stop the worker thread if still running.
            stop_event.set()
            # If client disconnected mid-stream, persist partial output so it's
            # not lost from history.
            if not saved and full:
                try:
                    text = "".join(full).strip() + "\n\n*[stopped]*"
                    with session_scope() as s:
                        s.add(Message(conversation_id=req.conversation_id, role="assistant", content=text))
                        conv = s.get(Conversation, req.conversation_id)
                        if conv:
                            conv.updated_at = datetime.utcnow()
                            s.add(conv)
                        s.commit()
                except Exception:
                    pass

    return EventSourceResponse(gen())



