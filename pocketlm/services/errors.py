"""Typed exceptions + helpers for surfacing actionable errors to the UI."""
from __future__ import annotations


class GatedModelError(Exception):
    """Raised when a Hugging Face repo requires license acceptance or a token."""

    def __init__(self, repo_id: str, message: str | None = None):
        self.repo_id = repo_id
        self.message = message or (
            f"{repo_id} is a gated Hugging Face model. Accept the license at "
            f"https://huggingface.co/{repo_id} and add your HF token in Settings."
        )
        super().__init__(self.message)


class RepoNotFoundError(Exception):
    def __init__(self, repo_id: str):
        self.repo_id = repo_id
        super().__init__(f"Repo not found: {repo_id}")


def classify_hf_exception(repo_id: str, exc: BaseException) -> Exception | None:
    """Return a typed PocketLM exception if `exc` looks like a recognised HF
    error, else None (caller should re-raise the original)."""
    # Prefer huggingface_hub's typed exceptions where available.
    try:
        from huggingface_hub.utils import (  # type: ignore
            GatedRepoError,
            RepositoryNotFoundError,
        )
        if isinstance(exc, GatedRepoError):
            return GatedModelError(repo_id)
        if isinstance(exc, RepositoryNotFoundError):
            return RepoNotFoundError(repo_id)
    except Exception:
        pass

    msg = str(exc)
    low = msg.lower()
    if "gated" in low or "restricted" in low or "401" in msg or "403" in msg:
        return GatedModelError(repo_id)
    if "not found" in low or "404" in msg or "repositorynotfound" in low:
        return RepoNotFoundError(repo_id)
    return None

