from aiohttp import web
import aiohttp
import aiohttp_cors
import logging
import os

from . import api_routes, static_routes

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)


def main():
    log.debug("Started server")

    app = web.Application()

    api_routes.load(app, "/api/")
    static_routes.load(app, "/")

    web.run_app(app, port=int(os.getenv("PORT", 8096)))


if __name__ == "__main__":
    main()
