from aiohttp import web

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)

STATIC_DIR = Path(os.environ["CLIENT_STATIC_DIR"])


async def serve_index(req):
    "The root directory should find and return index.html."
    return web.FileResponse(STATIC_DIR / "index.html")


def load(base_app, prefix):
    base_app.add_routes(
        [
            # root directory
            web.get(prefix, serve_index),
            # anything else
            web.static(prefix, STATIC_DIR, append_version=True),
        ]
    )

    log.info(f"Running static host on path {prefix}")
