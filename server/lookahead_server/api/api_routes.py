from aiohttp import web
import aiohttp_cors
import asyncio

import logging
import os
import json

from lookahead_server import parsing

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)

app = web.Application()
routes = web.RouteTableDef()


@routes.post("/upload")
async def upload(req):
    if "code" not in req.query:
        return web.HTTPBadRequest(
            text="Missing `code` query parameter (i.e. MAST10009_SM2_2024)"
        )
    if not req.can_read_body:
        return web.HTTPBadRequest(text="Missing body.")

    return await asyncio.shield(upload_and_mutate(req))


async def upload_and_mutate(req):
    data = await req.json()
    try:
        with open(f"cache/{req.query['code']}.json", "w") as f:
            json.dump(data, f)

        return web.Response(text="Successfully uploaded")
    except:
        return web.HTTPBadRequest(text="Malformed body data.")


@routes.get("/getSubject")
async def api_getSubject(req):
    log.info("Hello!")

    if "code" not in req.query:
        return web.HTTPBadRequest(
            text="Missing `code` query parameter (i.e. `MAST10009`)."
        )

    if "year" not in req.query:
        return web.HTTPBadRequest(text="Missing `year` query parameter (i.e. `2024`).")

    if "period" not in req.query:
        return web.HTTPBadRequest(text="Missing `period` query parameter (i.e. `SM2`).")

    print(req.query.get("subj"))
    return web.Response(text="OK")


@routes.get("/searchSubject")
async def api_searchSubject(req):
    if "query" not in req.query:
        return web.HTTPBadRequest(
            text="Missing `query` query parameter (i.e. `Statistics`)."
        )

    if "year" not in req.query:
        return web.HTTPBadRequest(text="Missing `year` query parameter (i.e. `2024`).")

    if "period" not in req.query:
        return web.HTTPBadRequest(text="Missing `period` query parameter (i.e. `SM2`).")

    return web.json_response(
        {"results": [{"code": "MAST20005", "title": "Statistics"}]}
    )


def enable_CORS(app):
    # Configure default CORS settings.
    cors = aiohttp_cors.setup(
        app,
        defaults={
            "https://mytimetable.students.unimelb.edu.au": aiohttp_cors.ResourceOptions()
        },
    )

    # Configure CORS on all routes.
    for route in list(app.router.routes()):
        cors.add(
            route,
        )


def load(base_app, subdir):
    app = web.Application()
    app.add_routes(routes)

    enable_CORS(app)

    base_app.add_subapp(subdir, app)

    log.info(f"API route loaded on path {subdir}")
