from dataclasses import dataclass
from typing import List
from datetime import time, date


@dataclass
class Times:
    """Stores an Activity's start and end times"""

    start: time
    end: time


@dataclass
class Stream:
    """Stores one instance of a lecture/tute"""

    code: int

    weeks: List[int]  # e.g. 1, etc. converted using `weeks-config.json`

    day: str  # e.g. "Mon", etc. using .strftime("%A"); thanks StackOverflow
    times: Times

    location: str
    online: bool


@dataclass
class Activity:
    """Stores the different Stream's of an Activity"""

    atype: str  # e.g. "Lecture recording" or "Tutorial"
    name: str  # e.g. "Lecture 1" or "Practical 3"
    stream_list: List[Stream]


@dataclass
class ActivityGroup:
    """Stores the activities whose streams must be picked at the same time"""

    name: str  # e.g. "Lecture" or "Tutorial" or "Practical" or "ComputerLab"
    activity_list: List[Activity]


@dataclass
class Subject:
    """
    Stores a subject's details and ActivityGroups.
    Note that some subjects don't e.g. group their lectures,
    e.g. 2024 Summer Statistics.
    """

    code: str  # e.g. "MAST20005"
    name: str  # e.g. "Statistics"
    year: int  # e.g. 2024
    offering: str  # e.g. "Semester 1", "Summer Term", etc. as seen in raw data
    activity_group_list: List[ActivityGroup]
