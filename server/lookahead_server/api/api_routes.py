from aiohttp import web

import logging
import os

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)

routes = web.RouteTableDef()

@routes.get("/api")
async def api_hello(req):
    return web.Response(text="Hello world, from the api!")
