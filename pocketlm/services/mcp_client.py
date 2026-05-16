"""Thin wrapper over the official `mcp` Python SDK.

If `mcp` isn't installed, every method raises a friendly RuntimeError so the
rest of the app still boots — tests + the Agent UI surface the missing-dep
message without crashing the server."""
from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from ..models_schema import MCPServer
from . import builtin_tools
from .settings_store import decrypt_secret, encrypt_secret


def _have_mcp() -> bool:
    try:
        import mcp  # noqa: F401
        return True
    except Exception:
        return False


# ----- header secret helpers -----------------------------------------
HEADER_PREFIX = "enc:"


def encrypt_headers(headers: dict[str, str]) -> dict[str, str]:
    """Encrypt every header value so the DB never stores raw bearer tokens."""
    return {k: HEADER_PREFIX + encrypt_secret(v) for k, v in (headers or {}).items() if v}


def decrypt_headers(headers: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in (headers or {}).items():
        if isinstance(v, str) and v.startswith(HEADER_PREFIX):
            out[k] = decrypt_secret(v[len(HEADER_PREFIX):])
        else:
            out[k] = v
    return out


def server_to_dict(s: MCPServer, *, mask_headers: bool = True) -> dict:
    headers = {}
    try:
        raw = json.loads(s.headers_json or "{}")
        if mask_headers:
            headers = {k: "••••••" for k in raw.keys()}
        else:
            headers = decrypt_headers(raw)
    except Exception:
        headers = {}
    try:
        args = json.loads(s.args_json or "[]")
    except Exception:
        args = []
    return {
        "id": s.id,
        "name": s.name,
        "transport": s.transport,
        "url": s.url,
        "command": s.command,
        "args": args,
        "headers": headers,
        "enabled": s.enabled,
        "created_at": s.created_at,
    }


# ----- connection ----------------------------------------------------
@asynccontextmanager
async def _connect(server: MCPServer):
    if not _have_mcp():
        raise RuntimeError(
            "The `mcp` Python package isn't installed. Add it to your environment "
            "(`pip install mcp`) to enable Agent mode."
        )
    from mcp import ClientSession  # type: ignore

    transport = (server.transport or "http").lower()
    headers = decrypt_headers(json.loads(server.headers_json or "{}"))
    if transport == "stdio":
        from mcp.client.stdio import StdioServerParameters, stdio_client  # type: ignore
        params = StdioServerParameters(
            command=server.command,
            args=json.loads(server.args_json or "[]"),
        )
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield session
    elif transport == "sse":
        from mcp.client.sse import sse_client  # type: ignore
        async with sse_client(server.url, headers=headers) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield session
    else:  # streamable http
        try:
            from mcp.client.streamable_http import streamablehttp_client  # type: ignore
        except Exception:
            from mcp.client.http import http_client as streamablehttp_client  # type: ignore
        async with streamablehttp_client(server.url, headers=headers) as ctx:
            # The HTTP transport returns either (read, write) or (read, write, _).
            read, write = ctx[0], ctx[1]
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield session


async def list_tools(server: MCPServer) -> list[dict]:
    if (server.transport or "").lower() == "builtin":
        return builtin_tools.list_tools()
    async with _connect(server) as session:
        resp = await session.list_tools()
        tools = []
        for t in getattr(resp, "tools", []) or []:
            tools.append({
                "name": t.name,
                "description": getattr(t, "description", "") or "",
                "input_schema": getattr(t, "inputSchema", {}) or {},
            })
        return tools


async def call_tool(server: MCPServer, name: str, arguments: dict[str, Any]) -> Any:
    if (server.transport or "").lower() == "builtin":
        return builtin_tools.call_tool(name, arguments or {})
    async with _connect(server) as session:
        result = await session.call_tool(name, arguments or {})
        # Normalise content blocks to a plain serialisable structure.
        out = []
        for block in getattr(result, "content", []) or []:
            kind = getattr(block, "type", "text")
            if kind == "text":
                out.append({"type": "text", "text": getattr(block, "text", "")})
            else:
                out.append({"type": kind, "data": str(block)})
        return out

