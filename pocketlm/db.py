"""SQLite engine + session helpers."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlmodel import Session, SQLModel, create_engine

from .config import DB_PATH

_engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    # Import models so SQLModel sees them.
    from . import models_schema  # noqa: F401

    SQLModel.metadata.create_all(_engine)

    # Ensure pagination indexes exist for already-deployed databases where the
    # tables were created before we added index=True to the model fields.
    from sqlalchemy import text
    with _engine.begin() as conn:
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_conversation_updated_at ON conversation(updated_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_message_conversation_id_id ON message(conversation_id, id)"))


@contextmanager
def session_scope() -> Iterator[Session]:
    with Session(_engine) as session:
        yield session


def get_session() -> Iterator[Session]:
    """FastAPI dependency."""
    with Session(_engine) as session:
        yield session

