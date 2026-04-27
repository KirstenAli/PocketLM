"""Loads & caches a single resident HF model + tokenizer (LRU=1)."""
from __future__ import annotations

import gc
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from ..config import ADAPTERS_DIR
from ..catalog import get as catalog_get
from .device import pick_device, pick_dtype
from .downloader import local_path_for


@dataclass
class LoadedModel:
    model_id: str
    base_repo: str
    adapter_path: Optional[str]
    tokenizer: object
    model: object
    device: str


_lock = threading.Lock()
_current: Optional[LoadedModel] = None


def _resolve_base_path(base_repo: str) -> str:
    p = local_path_for(base_repo)
    if p.exists() and any(p.iterdir()):
        return str(p)
    # fall back to repo id (will trigger HF download lazily)
    return base_repo


def _parse_model_id(model_id: str) -> tuple[str, Optional[str]]:
    """`base_repo` or `base_repo|adapter:<name>`."""
    if "|adapter:" in model_id:
        base, adapter = model_id.split("|adapter:", 1)
        return base, adapter
    return model_id, None


def get_loaded() -> Optional[LoadedModel]:
    return _current


def unload() -> None:
    global _current
    with _lock:
        _current = None
        gc.collect()
        try:
            import torch

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
                torch.mps.empty_cache()
        except Exception:
            pass


def load(model_id: str) -> LoadedModel:
    """Load (or return cached) model. `model_id` may include an adapter suffix."""
    global _current
    with _lock:
        if _current and _current.model_id == model_id:
            return _current

        base_repo, adapter_name = _parse_model_id(model_id)
        cat = catalog_get(base_repo)
        recommended = cat.recommended_dtype if cat else "bf16"

        from transformers import AutoModelForCausalLM, AutoTokenizer

        device = pick_device()
        dtype = pick_dtype(recommended)
        base_path = _resolve_base_path(base_repo)

        tokenizer = AutoTokenizer.from_pretrained(base_path, trust_remote_code=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        model = AutoModelForCausalLM.from_pretrained(
            base_path,
            torch_dtype=dtype,
            trust_remote_code=True,
            low_cpu_mem_usage=True,
        )
        model.to(device)
        model.eval()

        adapter_path: Optional[str] = None
        if adapter_name:
            from peft import PeftModel

            adapter_path = str(ADAPTERS_DIR / adapter_name)
            if not Path(adapter_path).exists():
                raise FileNotFoundError(f"Adapter not found: {adapter_path}")
            model = PeftModel.from_pretrained(model, adapter_path)
            model.to(device)
            model.eval()

        _current = LoadedModel(
            model_id=model_id,
            base_repo=base_repo,
            adapter_path=adapter_path,
            tokenizer=tokenizer,
            model=model,
            device=device,
        )
        return _current

