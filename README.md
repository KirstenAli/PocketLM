# PocketLM

A local-first, Ollama-style desktop app for chatting with — and fine-tuning — **small Hugging Face language models** on your laptop. Modern chat UI, conversation history, one-click model downloads, and LoRA fine-tuning from any text/JSONL file.

> Apple Silicon (MPS), CUDA, and CPU are all supported. Everything runs on your machine.

## Features

- 💬 **Modern chat UI** — streaming responses, markdown, code highlighting, conversation history, new chat, model switcher
- 📦 **Curated model catalog** — only laptop-friendly models (SmolLM2, TinyLlama, Qwen2.5, Llama-3.2, Phi-3-mini, Gemma-2-2B…)
- ⬇️ **One-click downloads** from Hugging Face with live progress
- 🎯 **Fine-tune in the UI** — point at a `.txt` / `.jsonl` / `.csv` file, hit **Train**. LoRA + TRL `SFTTrainer` under the hood. Live loss chart.
- 🧠 **Use your adapter** in chat as soon as training finishes
- 🗄️ Local SQLite for chat & job history
- 🔌 Pure Python — no Node build step

## Quickstart

```bash
# 1. Create venv (Python 3.10+)
python3 -m venv .venv && source .venv/bin/activate

# 2. Install
pip install -e .

# 3. (optional) Set HF token for gated models
cp .env.example .env  # then edit

# 4. Run
pocketlm
```

The app opens at <http://127.0.0.1:8000>.

## Fine-tuning notes (laptop reality check)

- Stick to ≤ 1.5B params, `max_seq_len ≤ 1024`, `batch_size=1`, `grad_accum=8`.
- macOS: bf16 on MPS works for most models.
- Adapters are saved under `~/.pocketlm/adapters/<job_id>/` and become selectable in the chat model dropdown.

## Storage layout

```
~/.pocketlm/
  pocketlm.db        # SQLite (conversations, jobs, model records)
  models/            # HF snapshots
  adapters/          # LoRA adapters from training
  datasets/          # uploaded datasets
  logs/              # training logs
```

## License

MIT

