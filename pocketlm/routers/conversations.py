"""Conversation CRUD."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import or_, and_
from sqlmodel import select

from ..db import session_scope
from ..models_schema import Conversation, Message
from ..schemas import ConversationCreate, ConversationOut, MessageOut

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[int] = Query(None, description="id of the last conversation from the previous page"),
):
    """Cursor-paginated, ordered by (updated_at DESC, id DESC).

    Cursor is the `id` of the last row from the previous page. We resolve that
    row's `updated_at` and return everything strictly after it in the ordering.
    Stable across new conversations being created mid-scroll.
    """
    with session_scope() as s:
        stmt = select(Conversation).order_by(
            Conversation.updated_at.desc(), Conversation.id.desc()
        )
        if cursor is not None:
            anchor = s.get(Conversation, cursor)
            if anchor is not None:
                stmt = stmt.where(
                    or_(
                        Conversation.updated_at < anchor.updated_at,
                        and_(
                            Conversation.updated_at == anchor.updated_at,
                            Conversation.id < anchor.id,
                        ),
                    )
                )
        rows = s.exec(stmt.limit(limit)).all()
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
def list_messages(
    cid: int,
    limit: int = Query(50, ge=1, le=200),
    before: Optional[int] = Query(None, description="Return messages with id < `before` (load older)"),
):
    """Newest-first window, returned in chronological (ASC) order.

    Initial load: omit `before` → returns the latest `limit` messages.
    To load older messages as the user scrolls up, pass `before=<oldest id currently shown>`.
    """
    with session_scope() as s:
        stmt = select(Message).where(Message.conversation_id == cid)
        if before is not None:
            stmt = stmt.where(Message.id < before)
        # Take the latest `limit` rows by id DESC, then flip to ASC for the client.
        rows = s.exec(stmt.order_by(Message.id.desc()).limit(limit)).all()
        rows.reverse()
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

