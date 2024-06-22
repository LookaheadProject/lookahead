from aiohttp import web

import logging
import os

from lookahead_server import parsing

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)

routes = web.RouteTableDef()

@routes.post("/api/upload")
async def post(self):
    return web.Response(text="Successfully uploaded")

@routes.get("/api/getSubject")
async def api_getSubject(req):
    return web.Response(text="OK")
