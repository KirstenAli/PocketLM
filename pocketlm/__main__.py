"""Entry point: launch the PocketLM server and open a browser."""
from __future__ import annotations

import os
import threading
import time
import webbrowser

import uvicorn
from dotenv import load_dotenv


def _open_browser(url: str, delay: float = 1.2) -> None:
    def _open() -> None:
        time.sleep(delay)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    threading.Thread(target=_open, daemon=True).start()


def main() -> None:
    load_dotenv()
    # Initialize DB early so settings_store can be consulted for host/port.
    try:
        from .db import init_db
        init_db()
    except Exception:
        pass
    from .config import get_host, get_port
    host = get_host()
    port = get_port()
    no_browser = (
        os.getenv("POCKETLM_NO_BROWSER") == "1"
        or bool(_settings_no_browser())
    )

    if not no_browser:
        _open_browser(f"http://{host}:{port}")

    uvicorn.run(
        "pocketlm.server:app",
        host=host,
        port=port,
        log_level="info",
        reload=False,
    )


def _settings_no_browser() -> bool:
    try:
        from .services import settings_store
        return bool(settings_store.get_effective("POCKETLM_NO_BROWSER"))
    except Exception:
        return False


if __name__ == "__main__":
    main()

