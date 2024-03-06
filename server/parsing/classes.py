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


class Subject:
    """
    Stores a subject's details and ActivityGroups.
    Note that some subjects don't e.g. group their lectures,
    e.g. 2024 Summer Statistics.
    """

    def __init__(self, raw: dict):
        # don't matter which one we take, so pick [0]
        raw_keys = sorted(raw.keys())
        first = raw_keys[0]

        # code, e.g. "MAST10008"
        self.code: str = first.split("_")[0]

        # name, e.g. "Accelerated Mathematics 1"
        self.name: str = raw[first]["subject_description"]

        # year, e.g. 2024
        # uses the last 4 characters of the start date,
        # assuming that's always the correct year.
        self.year: int = raw[first]["start_date"][-4:]

        # offering: str, e.g. "Semester 1", "Summer Term", etc.
        self.offering: str = self.__find_offering(first)

    def __find_offering(self, first):
        """
        Takes in the key to the first object in the dictionary from the JSON and
        returns which period the subject is offered in. Is a helper method.
        """
        # hardcoded based on current values
        offering_str = first.split("|")[0].split("_")[-1]

        match offering_str:
            case "SM1":
                return "Semester 1"
            case "SM2":
                return "Semester 2"
            case "SUM":
                return "Summer Term"
            case "WIN":
                return "Winter Term"
            case _:
                # not found one that is not in the list
                raise Exception("Invalid offering / unimplemented")

    def __str__(self):
        return self.code + " " + self.name + ", " + self.year + " " + self.offering

    # activity_group_list: List[ActivityGroup]
