import aiosqlite
import sqlite3
import logging
import json

import os

logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)


class SubjectTimetableModel:
    def __init__(self, database_loc):
        self.database_url = database_loc

    def _connect(self):
        return aiosqlite.connect(self.database_url)

    async def test_connect(self):
        log.info("Testing connection to database...")

        # TODO: add support for subject names!

        async with self._connect() as con:
            await con.execute("""
                CREATE TABLE IF NOT EXISTS "timetable" (
                    "code"	TEXT,
                    "year"	INTEGER,
                    "period"	TEXT,
                    "version"	INTEGER,
                    "timetable"	TEXT,
                    PRIMARY KEY("code","year","period","version")
                );
                """)

        log.info("Success.")

    async def upload(self, code, year, period, timetable):
        log.info(f"Uploading {code}_{year}_{period}...")

        # TODO: check if already exists & if so, upload with latest 'version'
        # TODO: check parameters are valid
        async with self._connect() as con:
            payload = {
                "code": code,
                "year": year,
                "period": period,
                "version": 1,
                "timetable": json.dumps(timetable),
            }
            await con.execute(
                "INSERT INTO timetable VALUES(:code, :year, :period, :version, :timetable);",
                payload,
            )
            await con.commit()
        log.info("Successfully uploaded.")

    async def retrieve(self, code, year, period):
        # TODO: versioning & error codes when nothing is returned
        async with self._connect() as con:
            con.row_factory = sqlite3.Row
            query = "SELECT * FROM timetable WHERE code = :code AND year = :year AND period = :period AND version = 1 LIMIT 1;"
            async with con.execute(
                query, {"code": code, "year": year, "period": period}
            ) as cursor:
                result = await cursor.fetchone()
                return result["timetable"]
