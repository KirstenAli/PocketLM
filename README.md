# PocketLM

A local-first, Ollama-style desktop app for chatting with — and fine-tuning — **small Hugging Face language models** on your laptop. Modern chat UI, conversation history, one-click model downloads, and LoRA fine-tuning from any text/JSONL file.

> Apple Silicon (MPS), CUDA, and CPU are all supported. Everything runs on your machine.

## Features

- 💬 **Modern chat UI** — streaming responses, markdown, code highlighting, conversation history, new chat, model switcher
- 🎛️ **Full generation controls** — temperature, top‑p / top‑k, repetition penalty, beam search, stop sequences, system prompt — collapsible per‑conversation
- 📦 **Curated model catalog** — only laptop-friendly models (SmolLM2, TinyLlama, Qwen2.5, Llama-3.2, Phi-3-mini, Gemma-2-2B…) with infinite‑scroll pagination
- ⬇️ **One-click downloads** from Hugging Face with live progress, friendly gated‑model guidance
- 🎯 **Fine-tune in the UI** — point at a `.txt` / `.jsonl` / `.csv` file, hit **Train**. LoRA + TRL `SFTTrainer` under the hood. Live loss chart.
- 🧠 **Use your adapter** in chat as soon as training finishes
- 🤖 **Agent mode** — connect to MCP (Model Context Protocol) servers and let the local model call tools
- 🧰 **Built-in MCP tools** — ships with a default local tool server (safe terminal `run_command`) so Agent mode works out of the box
- ⚙️ **In‑app Settings** — every `.env` value (HF token, device, host/port) editable from the UI; secrets encrypted at rest with Fernet
- 🗄️ Local SQLite for chat & job history
- 🔌 Pure Python — no Node build step

## Quickstart

```bash
# 1. Create venv (Python 3.10+)
python3 -m venv .venv && source .venv/bin/activate

# 2. Install
pip install -e .

# 3. (optional) Set HF token for gated models
cp .env.example .env  # then edit — or just open Settings in the UI

# 4. Run
pocketlm
```

The app opens at <http://127.0.0.1:8000>.

## Configuration

Every setting can be edited in‑app at **Settings** (gear icon in the sidebar) or via env / `.env`:

| Setting | Purpose |
|---|---|
| `HF_TOKEN` | Hugging Face access token (gated/private models). Stored encrypted. |
| `POCKETLM_DEVICE` | Force `cuda` / `mps` / `cpu` / `auto`. |
| `POCKETLM_HOST` | Bind interface (use `0.0.0.0` to expose on LAN). |
| `POCKETLM_PORT` | Bind port. |
| `POCKETLM_NO_BROWSER` | Don't pop a browser on launch. |
| `POCKETLM_HOME` | Override the storage root (default `~/.pocketlm`). |
| `POCKETLM_SECRET_KEY` | Fernet key for secret encryption. Auto‑generated to `~/.pocketlm/.secret_key` if absent. |

## Built-in MCP tools

PocketLM auto-creates a default MCP server named `PocketLM Built-in Tools`.

- Tool: `run_command`
- Allowed commands: `pwd`, `ls`, `cat`, `echo`, `head`, `tail`, `wc`, `grep`, `find`
- Guardrails: workspace-only `cwd`, timeout, and output truncation

You can manage/disable it from **Settings → Agent / MCP servers**.

## Tests

```bash
pip install -e ".[dev]"
pytest
```

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

