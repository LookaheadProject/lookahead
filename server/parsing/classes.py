from dataclasses import dataclass
from typing import List
from datetime import time, date


@dataclass
class Times:
    """Stores an Activity's duration"""

    start: time
    end: time


@dataclass
class Activity:
    """Stores one instance of a lecture/tute"""

    code: int
    name: str  # e.g. "Lecture 1" or "Practical 3"
    atype: str  # e.g. "Lecture recording" or "Tutorial"

    day: str  # e.g. "Mon", etc. using .strftime("%A"); thanks StackOverflow
    times: Times
    location: str
    online: bool


@dataclass
class Stream:
    """Stores the Activity's that make up a lecture/tute stream"""

    code: int
    weeks: List[int]  # e.g. 1, etc. converted using `weeks-config.json`
    activity_list: List[Activity]


@dataclass
class Subject:
    """Stores the lecture/tute streams of a subject"""

    code: str
    offering: str  # e.g. "Semester 1", "Summer Term", etc. as listed in CSV
    stream_list: List[Stream]
