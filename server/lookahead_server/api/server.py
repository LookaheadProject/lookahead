from aiohttp import web
import logging
import os

from .static_routes import routes as static_routes
from .api_routes import routes as api_routes

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)

def main():
    log.debug("Started server")

    app = web.Application()

    app.add_routes(static_routes)
    app.add_routes(api_routes)

    web.run_app(app, port=int(os.getenv("PORT", 8096)))

if __name__ == "__main__":
    main()
