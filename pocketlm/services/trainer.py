"""LoRA fine-tuning with TRL SFTTrainer + live progress streaming."""
from __future__ import annotations

import asyncio
import threading
import traceback
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator

from ..config import ADAPTERS_DIR, LOGS_DIR
from ..db import session_scope
from ..models_schema import TrainingJob
from ..schemas import TrainRequest
from . import model_manager
from .datasets import load_for_sft
from .device import pick_device, pick_dtype
from .downloader import local_path_for


def _safe_name(s: str) -> str:
    return "".join(c if c.isalnum() or c in "-_." else "_" for c in s)


def _resolve_base_path(repo_id: str) -> str:
    p = local_path_for(repo_id)
    if p.exists() and any(p.iterdir()):
        return str(p)
    return repo_id


async def run_training(req: TrainRequest) -> AsyncIterator[dict]:
    """Run a LoRA SFT job, yielding SSE-friendly progress events."""

    # Ensure no big inference model is resident.
    model_manager.unload()

    output_name = req.output_name or f"{_safe_name(req.base_model)}__{datetime.utcnow():%Y%m%d-%H%M%S}"
    output_dir = ADAPTERS_DIR / output_name
    output_dir.mkdir(parents=True, exist_ok=True)
    log_path = LOGS_DIR / f"{output_name}.log"

    # Create DB job row
    with session_scope() as s:
        job = TrainingJob(
            base_model=req.base_model,
            dataset_path=req.dataset_path,
            output_dir=str(output_dir),
            status="running",
            log_path=str(log_path),
        )
        s.add(job)
        s.commit()
        s.refresh(job)
        job_id = job.id

    yield {"event": "start", "job_id": job_id, "output_dir": str(output_dir)}

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def emit(evt: dict) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, evt)

    def _train() -> None:
        try:
            import torch
            from peft import LoraConfig
            from transformers import (
                AutoModelForCausalLM,
                AutoTokenizer,
                TrainerCallback,
            )
            from trl import SFTConfig, SFTTrainer

            device = pick_device()
            dtype = pick_dtype("bf16")
            base_path = _resolve_base_path(req.base_model)

            emit({"event": "log", "message": f"Loading tokenizer/model on {device} ({dtype})…"})
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

            emit({"event": "log", "message": f"Loading dataset {req.dataset_path}…"})
            ds = load_for_sft(req.dataset_path, tokenizer)
            emit({"event": "log", "message": f"Dataset rows: {len(ds)}"})

            lora = LoraConfig(
                r=req.lora_r,
                lora_alpha=req.lora_alpha,
                lora_dropout=req.lora_dropout,
                bias="none",
                task_type="CAUSAL_LM",
            )

            sft_cfg_kwargs = dict(
                output_dir=str(output_dir),
                num_train_epochs=req.epochs,
                per_device_train_batch_size=req.batch_size,
                gradient_accumulation_steps=req.grad_accum,
                learning_rate=req.learning_rate,
                logging_steps=1,
                save_strategy="no",
                report_to=[],
                bf16=(dtype == torch.bfloat16 and device != "cpu"),
                fp16=(dtype == torch.float16 and device != "cpu"),
                dataset_text_field="text",
                gradient_checkpointing=False,
                optim="adamw_torch",
            )
            # TRL renamed `max_seq_length` -> `max_length` around 0.13. Try both.
            try:
                sft_cfg = SFTConfig(max_length=req.max_seq_len, **sft_cfg_kwargs)
            except TypeError:
                sft_cfg = SFTConfig(max_seq_length=req.max_seq_len, **sft_cfg_kwargs)

            class StreamCb(TrainerCallback):
                def on_train_begin(self, args, state, control, **kwargs):
                    total = state.max_steps or 0
                    emit({"event": "begin", "total_steps": total})
                    with session_scope() as s:
                        j = s.get(TrainingJob, job_id)
                        if j:
                            j.total_steps = total
                            s.add(j)
                            s.commit()

                def on_log(self, args, state, control, logs=None, **kwargs):
                    if not logs:
                        return
                    loss = float(logs.get("loss", 0.0))
                    step = int(state.global_step)
                    emit(
                        {
                            "event": "step",
                            "step": step,
                            "total": state.max_steps,
                            "loss": loss,
                        }
                    )
                    with session_scope() as s:
                        j = s.get(TrainingJob, job_id)
                        if j:
                            j.step = step
                            j.loss = loss
                            j.total_steps = state.max_steps or j.total_steps
                            s.add(j)
                            s.commit()

            trainer_kwargs = dict(
                model=model,
                args=sft_cfg,
                train_dataset=ds,
                peft_config=lora,
                callbacks=[StreamCb()],
            )
            # TRL renamed `tokenizer` -> `processing_class` around 0.12+. Try both.
            try:
                trainer = SFTTrainer(processing_class=tokenizer, **trainer_kwargs)
            except TypeError:
                trainer = SFTTrainer(tokenizer=tokenizer, **trainer_kwargs)
            trainer.train()
            trainer.model.save_pretrained(str(output_dir))
            tokenizer.save_pretrained(str(output_dir))

            with session_scope() as s:
                j = s.get(TrainingJob, job_id)
                if j:
                    j.status = "done"
                    j.finished_at = datetime.utcnow()
                    s.add(j)
                    s.commit()
            emit({"event": "done", "output_dir": str(output_dir), "adapter_name": output_name})
        except Exception as e:  # noqa: BLE001
            tb = traceback.format_exc()
            try:
                log_path.write_text(tb)
            except Exception:
                pass
            with session_scope() as s:
                j = s.get(TrainingJob, job_id)
                if j:
                    j.status = "error"
                    j.error = str(e)
                    j.finished_at = datetime.utcnow()
                    s.add(j)
                    s.commit()
            emit({"event": "error", "message": str(e)})

    thread = threading.Thread(target=_train, daemon=True)
    thread.start()

    while thread.is_alive() or not queue.empty():
        try:
            evt = await asyncio.wait_for(queue.get(), timeout=1.0)
            yield evt
            if evt["event"] in {"done", "error"}:
                # drain remaining
                while not queue.empty():
                    yield queue.get_nowait()
                return
        except asyncio.TimeoutError:
            yield {"event": "heartbeat"}

