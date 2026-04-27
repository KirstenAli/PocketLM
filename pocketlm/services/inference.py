"""Streaming generation."""
from __future__ import annotations

import asyncio
import threading
from typing import AsyncIterator, Iterable, Optional

from . import model_manager


def _build_prompt(tokenizer, messages: list[dict]) -> str:
    if hasattr(tokenizer, "apply_chat_template") and getattr(tokenizer, "chat_template", None):
        return tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
    # Fallback: simple format
    parts = []
    for m in messages:
        parts.append(f"{m['role'].upper()}: {m['content']}")
    parts.append("ASSISTANT:")
    return "\n".join(parts)


def _ctx_window(model) -> int:
    """Return the model's max input length, falling back conservatively."""
    cfg = getattr(model, "config", None)
    for attr in ("max_position_embeddings", "n_positions", "seq_length", "max_seq_len"):
        v = getattr(cfg, attr, None) if cfg else None
        if isinstance(v, int) and v > 0:
            return v
    return 4096


def _fit_history(
    tokenizer,
    model,
    messages: list[dict],
    *,
    max_new_tokens: int,
    safety: int = 128,
) -> list[dict]:
    """Drop oldest non-system messages until prompt + max_new_tokens fits the
    model's context window. The system message (if any) is always preserved at
    index 0; the most recent user message is always preserved even if it alone
    exceeds the budget (let the tokenizer truncate it rather than dropping the
    user's actual question)."""
    ctx = _ctx_window(model)
    budget = max(256, ctx - max_new_tokens - safety)

    system = [m for m in messages if m["role"] == "system"]
    rest = [m for m in messages if m["role"] != "system"]

    # Per-message overhead covers role tags / special tokens added by chat templates.
    PER_MSG_OVERHEAD = 8
    FRAMING_SLACK = 16  # BOS + generation prompt suffix, etc.

    def msg_tokens(m: dict) -> int:
        try:
            return PER_MSG_OVERHEAD + len(
                tokenizer.encode(m.get("content") or "", add_special_tokens=False)
            )
        except Exception:
            return PER_MSG_OVERHEAD + max(1, len(m.get("content") or "") // 4)

    used = FRAMING_SLACK + sum(msg_tokens(m) for m in system)
    kept_reversed: list[dict] = []
    for m in reversed(rest):
        cost = msg_tokens(m)
        # Always keep at least the most recent message, even if it busts the budget.
        if kept_reversed and used + cost > budget:
            break
        used += cost
        kept_reversed.append(m)

    fitted = system + list(reversed(kept_reversed))
    dropped = len(messages) - len(fitted)
    if dropped > 0:
        # Lightweight breadcrumb in server logs — useful when a long chat starts
        # quietly forgetting old context. Avoid `print` floods on every turn by
        # only emitting when we actually trimmed.
        import logging
        logging.getLogger("pocketlm.inference").info(
            "history trimmed: dropped=%d kept=%d ctx=%d budget=%d",
            dropped, len(fitted), ctx, budget,
        )
    return fitted


async def stream_chat(
    model_id: str,
    messages: list[dict],
    *,
    temperature: float = 0.7,
    top_p: float = 0.95,
    max_new_tokens: int = 512,
    stop_event: Optional[threading.Event] = None,
) -> AsyncIterator[str]:
    """Yield generated text chunks. If stop_event is set, generation halts."""
    import torch
    from transformers import StoppingCriteria, StoppingCriteriaList, TextIteratorStreamer

    loaded = model_manager.load(model_id)
    tokenizer = loaded.tokenizer
    model = loaded.model
    device = loaded.device

    # Trim ancient turns so prompt + max_new_tokens stays within the model's
    # context window. System prompt and the latest user turn are preserved.
    messages = _fit_history(tokenizer, model, messages, max_new_tokens=max_new_tokens)

    prompt = _build_prompt(tokenizer, messages)
    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    streamer = TextIteratorStreamer(
        tokenizer, skip_prompt=True, skip_special_tokens=True
    )

    stop_event = stop_event or threading.Event()

    class _StopOnFlag(StoppingCriteria):
        def __call__(self, input_ids, scores, **kwargs) -> bool:
            return stop_event.is_set()

    gen_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=max_new_tokens,
        do_sample=temperature > 0,
        temperature=max(temperature, 1e-5),
        top_p=top_p,
        pad_token_id=tokenizer.pad_token_id,
        eos_token_id=tokenizer.eos_token_id,
        stopping_criteria=StoppingCriteriaList([_StopOnFlag()]),
    )

    error: dict = {}

    def _run() -> None:
        try:
            with torch.no_grad():
                model.generate(**gen_kwargs)
        except Exception as e:  # noqa: BLE001
            error["err"] = str(e)

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    loop = asyncio.get_running_loop()
    iterator = iter(streamer)

    try:
        while True:
            chunk = await loop.run_in_executor(None, lambda: next(iterator, None))
            if chunk is None:
                break
            if chunk:
                yield chunk
    except (asyncio.CancelledError, GeneratorExit):
        # Client disconnected — tell the model to stop ASAP.
        stop_event.set()
        raise
    finally:
        # Make sure the worker thread isn't left spinning.
        stop_event.set()

    if "err" in error:
        raise RuntimeError(error["err"])

