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
    host = os.getenv("POCKETLM_HOST", "127.0.0.1")
    port = int(os.getenv("POCKETLM_PORT", "8000"))
    no_browser = os.getenv("POCKETLM_NO_BROWSER") == "1"

    if not no_browser:
        _open_browser(f"http://{host}:{port}")

    uvicorn.run(
        "pocketlm.server:app",
        host=host,
        port=port,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":
    main()

