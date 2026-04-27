"""Load user-supplied dataset files into a 🤗 datasets.Dataset for SFT."""
from __future__ import annotations

import json
from pathlib import Path

from datasets import Dataset


def _read_text_file(path: Path, chunk_chars: int = 2000) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="ignore").strip()
    if not text:
        return []
    # Prefer paragraph splits; fall back to char chunking for huge blobs.
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text]
    out: list[dict] = []
    buf = ""
    for p in paragraphs:
        if len(buf) + len(p) + 2 > chunk_chars and buf:
            out.append({"text": buf.strip()})
            buf = p
        else:
            buf = (buf + "\n\n" + p) if buf else p
    if buf.strip():
        out.append({"text": buf.strip()})
    return out


def _read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            if "text" in obj and isinstance(obj["text"], str):
                rows.append({"text": obj["text"]})
            elif "messages" in obj and isinstance(obj["messages"], list):
                rows.append({"messages": obj["messages"]})
            elif "prompt" in obj and "response" in obj:
                rows.append(
                    {
                        "messages": [
                            {"role": "user", "content": str(obj["prompt"])},
                            {"role": "assistant", "content": str(obj["response"])},
                        ]
                    }
                )
            elif "instruction" in obj:
                user = str(obj.get("instruction", ""))
                if obj.get("input"):
                    user += "\n\n" + str(obj["input"])
                rows.append(
                    {
                        "messages": [
                            {"role": "user", "content": user},
                            {"role": "assistant", "content": str(obj.get("output", ""))},
                        ]
                    }
                )
    return rows


def _read_csv(path: Path) -> list[dict]:
    import csv

    rows: list[dict] = []
    with path.open("r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if "text" in r and r["text"]:
                rows.append({"text": r["text"]})
            elif "prompt" in r and "response" in r:
                rows.append(
                    {
                        "messages": [
                            {"role": "user", "content": r.get("prompt", "")},
                            {"role": "assistant", "content": r.get("response", "")},
                        ]
                    }
                )
    return rows


def _messages_to_text(rows: list[dict], tokenizer) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        if "text" in r:
            out.append({"text": r["text"]})
        elif "messages" in r:
            if hasattr(tokenizer, "apply_chat_template") and getattr(
                tokenizer, "chat_template", None
            ):
                txt = tokenizer.apply_chat_template(
                    r["messages"], tokenize=False, add_generation_prompt=False
                )
            else:
                txt = "\n".join(f"{m['role']}: {m['content']}" for m in r["messages"])
            out.append({"text": txt})
    return out


def load_for_sft(path: str, tokenizer) -> Dataset:
    p = Path(path).expanduser()
    if not p.exists():
        raise FileNotFoundError(p)
    suffix = p.suffix.lower()
    if suffix in {".jsonl", ".json"}:
        rows = _read_jsonl(p)
    elif suffix == ".csv":
        rows = _read_csv(p)
    else:
        rows = _read_text_file(p)
    rows = _messages_to_text(rows, tokenizer)
    if not rows:
        raise ValueError(f"No usable rows found in {p}")
    return Dataset.from_list(rows)

