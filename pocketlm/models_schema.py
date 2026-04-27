"""SQLModel tables."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = "New chat"
    model_id: str
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", index=True)
    role: str  # "user" | "assistant" | "system"
    content: str
    created_at: datetime = Field(default_factory=_utcnow)


class ModelRecord(SQLModel, table=True):
    repo_id: str = Field(primary_key=True)
    local_path: str
    size_bytes: int = 0
    downloaded_at: datetime = Field(default_factory=_utcnow)
    status: str = "ready"  # "downloading" | "ready" | "error"


class TrainingJob(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    base_model: str
    dataset_path: str
    output_dir: str
    status: str = "pending"  # pending | running | done | error | cancelled
    step: int = 0
    total_steps: int = 0
    loss: float = 0.0
    error: str = ""
    started_at: datetime = Field(default_factory=_utcnow)
    finished_at: Optional[datetime] = None
    log_path: str = ""

