from datetime import time


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
    activity_list: list(Activity)


@dataclass
class Subject:
    """Stores the lecture/tute streams of a subject"""

    code: str
    offering: str  # e.g. "Semester 1", "Summer Term", etc. as lsited in CSV
    stream_list: list(Subject)
