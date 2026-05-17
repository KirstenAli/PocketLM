"""Pydantic request/response DTOs."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

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
    top_k: Optional[int] = None
    repetition_penalty: Optional[float] = None
    max_new_tokens: int = 512
    min_new_tokens: Optional[int] = None
    do_sample: Optional[bool] = None
    num_beams: Optional[int] = None
    seed: Optional[int] = None
    stop_sequences: Optional[list[str]] = None
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


# ---------------- Settings ----------------
class SettingsUpdate(BaseModel):
    values: dict[str, Any]


# ---------------- MCP / Agent ----------------
class MCPServerIn(BaseModel):
    name: str
    transport: str = "http"  # http | sse | stdio
    url: str = ""
    command: str = ""
    args: list[str] = Field(default_factory=list)
    headers: dict[str, str] = Field(default_factory=dict)
    enabled: bool = True


class MCPServerOut(BaseModel):
    id: int
    name: str
    transport: str
    url: str
    command: str
    args: list[str]
    headers: dict[str, str]  # header VALUES are masked
    enabled: bool
    created_at: datetime


class AgentChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    model_id: str
    message: str
    server_ids: list[int] = Field(default_factory=list)
    max_tool_calls: int = 4
    system_prompt: Optional[str] = None
    temperature: float = 0.2
    top_p: float = 0.95
    max_new_tokens: int = 512
