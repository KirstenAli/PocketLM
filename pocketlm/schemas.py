"""Pydantic request/response DTOs."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DownloadRequest(BaseModel):
    repo_id: str


class ConversationCreate(BaseModel):
    model_id: str
    title: Optional[str] = None


class ConversationOut(BaseModel):
    id: int
    title: str
    model_id: str
    created_at: datetime
    updated_at: datetime


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


class ChatRequest(BaseModel):
    conversation_id: int
    model_id: str
    message: str
    temperature: float = 0.7
    top_p: float = 0.95
    max_new_tokens: int = 512
    system_prompt: Optional[str] = None


class TrainRequest(BaseModel):
    base_model: str
    dataset_path: str
    epochs: int = 1
    learning_rate: float = 2.0e-4
    lora_r: int = 8
    lora_alpha: int = 16
    lora_dropout: float = 0.05
    max_seq_len: int = 512
    batch_size: int = 1
    grad_accum: int = 8
    output_name: Optional[str] = Field(default=None, description="Adapter folder name")


class TrainingJobOut(BaseModel):
    id: int
    base_model: str
    dataset_path: str
    output_dir: str
    status: str
    step: int
    total_steps: int
    loss: float
    error: str
    started_at: datetime
    finished_at: Optional[datetime]

