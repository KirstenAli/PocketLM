"""Conversation CRUD."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..db import session_scope
from ..models_schema import Conversation, Message
from ..schemas import ConversationCreate, ConversationOut, MessageOut

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations():
    with session_scope() as s:
        rows = s.exec(select(Conversation).order_by(Conversation.updated_at.desc())).all()
        return [ConversationOut(**r.dict()) for r in rows]


@router.post("/conversations", response_model=ConversationOut)
def create_conversation(req: ConversationCreate):
    with session_scope() as s:
        c = Conversation(model_id=req.model_id, title=req.title or "New chat")
        s.add(c)
        s.commit()
        s.refresh(c)
        return ConversationOut(**c.dict())


@router.delete("/conversations/{cid}")
def delete_conversation(cid: int):
    with session_scope() as s:
        c = s.get(Conversation, cid)
        if not c:
            raise HTTPException(404, "Not found")
        for m in s.exec(select(Message).where(Message.conversation_id == cid)).all():
            s.delete(m)
        s.delete(c)
        s.commit()
    return {"ok": True}


@router.get("/conversations/{cid}/messages", response_model=list[MessageOut])
def list_messages(cid: int):
    with session_scope() as s:
        rows = s.exec(
            select(Message).where(Message.conversation_id == cid).order_by(Message.id)
        ).all()
        return [MessageOut(**m.dict()) for m in rows]


@router.patch("/conversations/{cid}")
def rename_conversation(cid: int, payload: dict):
    title = (payload or {}).get("title", "").strip()
    if not title:
        raise HTTPException(400, "title required")
    with session_scope() as s:
        c = s.get(Conversation, cid)
        if not c:
            raise HTTPException(404, "Not found")
        c.title = title[:200]
        c.updated_at = datetime.utcnow()
        s.add(c)
        s.commit()
    return {"ok": True}

