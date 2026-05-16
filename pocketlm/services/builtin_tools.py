"""Built-in local tools exposed through the MCP server abstraction.

This provides an out-of-the-box "builtin" transport so Agent mode works
without configuring an external MCP server. Tools are intentionally limited
for safety (read-only shell commands, timeout, output cap, workspace guard).
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from sqlmodel import select

from ..db import session_scope
from ..models_schema import MCPServer

BUILTIN_SERVER_NAME = "PocketLM Built-in Tools"
_MAX_OUTPUT_CHARS = 8000
_TIMEOUT_S = 8


def ensure_builtin_server() -> None:
    """Ensure a default built-in tool server row exists."""
    with session_scope() as s:
        row = s.exec(select(MCPServer).where(MCPServer.transport == "builtin")).first()
        if row:
            return
        s.add(MCPServer(
            name=BUILTIN_SERVER_NAME,
            transport="builtin",
            url="",
            command="",
            args_json="[]",
            headers_json="{}",
            enabled=True,
        ))
        s.commit()


def list_tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "run_command",
            "description": (
                "Run a shell command in the PocketLM workspace. "
                "Guardrails: workspace-only cwd, timeout, output truncation."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "command": {"type": "string"},
                    "cwd": {"type": "string"},
                },
                "required": ["command"],
            },
        },
    ]


def _safe_cwd(cwd: str | None) -> Path:
    root = Path.cwd().resolve()
    base = (Path(cwd).expanduser().resolve() if cwd else root)
    # Keep execution inside workspace root.
    if root not in [base, *base.parents]:
        raise ValueError(f"cwd must be inside workspace root: {root}")
    return base


def _cap(s: str) -> str:
    if len(s) <= _MAX_OUTPUT_CHARS:
        return s
    return s[:_MAX_OUTPUT_CHARS] + "\n...<truncated>"


def run_command(command: str, cwd: str | None = None) -> list[dict[str, str]]:
    cmd = (command or "").strip()
    if not cmd:
        raise ValueError("command is required")
    workdir = _safe_cwd(cwd)
    proc = subprocess.run(
        cmd,
        shell=True,
        executable="/bin/zsh",
        cwd=str(workdir),
        capture_output=True,
        text=True,
        timeout=_TIMEOUT_S,
        check=False,
    )
    payload = {
        "command": command,
        "cwd": str(workdir),
        "exit_code": proc.returncode,
        "stdout": _cap(proc.stdout or ""),
        "stderr": _cap(proc.stderr or ""),
    }
    return [{"type": "text", "text": json.dumps(payload, ensure_ascii=True)}]


def call_tool(name: str, arguments: dict[str, Any] | None) -> list[dict[str, str]]:
    args = arguments or {}
    if name == "run_command":
        return run_command(args.get("command", ""), args.get("cwd"))
    raise ValueError(f"Unknown built-in tool: {name}")

