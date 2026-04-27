"""Device & dtype detection."""
from __future__ import annotations

from functools import lru_cache

from ..config import DEVICE_OVERRIDE


@lru_cache(maxsize=1)
def pick_device() -> str:
    import torch

    if DEVICE_OVERRIDE in {"mps", "cuda", "cpu"}:
        return DEVICE_OVERRIDE
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def pick_dtype(recommended: str = "bf16"):
    import torch

    device = pick_device()
    if device == "cuda":
        return torch.float16 if recommended == "fp16" else torch.bfloat16
    if device == "mps":
        # MPS supports bf16 in recent torch versions; safe default.
        return torch.float16 if recommended == "fp16" else torch.bfloat16
    return torch.float32


def device_info() -> dict:
    import torch

    return {
        "device": pick_device(),
        "torch": torch.__version__,
        "cuda": torch.cuda.is_available(),
        "mps": bool(getattr(torch.backends, "mps", None) and torch.backends.mps.is_available()),
    }

