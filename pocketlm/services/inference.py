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

