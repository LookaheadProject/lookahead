import aiosqlite
import sqlite3
import logging
import json

import os

from dotenv import load_dotenv

load_dotenv()


logging.basicConfig(level=os.getenv("VERBOSE", logging.INFO))
log = logging.getLogger(__name__)


class SubjectTimetableModel:
    def __init__(self, database_loc):
        log.info(f"Initialising database at {database_loc}")
        self.database_url = database_loc

        self.available_periods_memo = []
        self.available_periods_needs_update = True

    def _connect(self):
        return aiosqlite.connect(self.database_url)

    async def test_connect(self):
        log.info("Testing connection to database...")

        # TODO: add support for subject names!

        async with self._connect() as con:
            await con.execute(
                """
                CREATE TABLE IF NOT EXISTS "timetable" (
                    "code"	TEXT,
                    "year"	INTEGER,
                    "period"	TEXT,
                    "version"	INTEGER,
                    "timetable"	TEXT,
                    PRIMARY KEY("code","year","period","version")
                );
                """
            )

        log.info("Success.")

    async def upload(self, code, year, period, timetable):
        log.info(f"Uploading {code}_{year}_{period}...")

        self.available_periods_needs_update = True

        # TODO: check if already exists & if so, upload with latest 'version'
        # TODO: check parameters are valid

        if f"{period} {year}" not in self.available_periods():
            log.info("An error has occured. This is not an available period.")
            return 0

        version = 1
        while self.retrieve(code, year, period, version):
            version += 1

        async with self._connect() as con:
            payload = {
                "code": code,
                "year": year,
                "period": period,
                "version": version,
                "timetable": json.dumps(timetable),
            }

            await con.execute(
                "INSERT INTO timetable VALUES(:code, :year, :period, :version, :timetable);",
                payload,
            )
            await con.commit()
        log.info("Successfully uploaded.")

    async def retrieve(self, code, year, period, version):
        # TODO: error codes when nothing is returned
        # TODO: make the version 1 when this function is called normally
        query_string = "SELECT * FROM timetable WHERE code = :code AND year = :year AND period = :period AND version = :version LIMIT 1;"

        async with self._connect() as con:
            con.row_factory = sqlite3.Row
            async with con.execute(
                query_string,
                {"code": code, "year": year, "period": period, "version": version},
            ) as cursor:
                result = await cursor.fetchone()
                return result["timetable"]

    async def search(self, query, year, period):
        # sqlite named placeholders cannot interpret within a SQL string, see
        # https://stackoverflow.com/questions/1105463/sqlite-binding-within-string-literal
        query_string = "SELECT * FROM timetable WHERE year = :year AND period = :period AND code LIKE '%' || :query || '%';"
        log.debug("Search for %s", query)

        results = []
        async with self._connect() as con:
            con.row_factory = sqlite3.Row
            async with con.execute(
                query_string, {"query": query, "year": year, "period": period}
            ) as cursor:
                async for row in cursor:
                    results.append({"code": row["code"]})

        return results

    async def available_periods(self):
        if self.available_periods_needs_update:
            log.debug("Available periods needs updating")
            self.available_periods_needs_update = False

            query_string = "SELECT DISTINCT year, period FROM timetable;"
            results = []
            async with self._connect() as con:
                async with con.execute(query_string) as cursor:
                    async for value in cursor:
                        results.append(value)

            def key_func(v):
                lookup = {"SUM": 0, "SM1": 1, "WIN": 2, "SM2": 3}
                return (v[0], lookup.get(v[1], 0))

            results_sorted = sorted(results, reverse=True, key=key_func)

            self.available_periods_memo = [f"{v[1]} {v[0]}" for v in results_sorted]

        return self.available_periods_memo
