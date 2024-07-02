from dataclasses import dataclass
from typing import List, Set
from datetime import datetime, time, timedelta
import json
import os


@dataclass
class Times:
    """Stores an Activity's start and end times"""

    start: time
    end: time

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        return {
            "start": time.isoformat(self.start),
            "end": time.isoformat(self.end),
        }


class Activity:
    """Stores one instance of a lecture/tute"""

    __default_id = 0
    __id = __default_id  # counter across one Stream object

    def __init__(self, raw: dict, raw_keys: List[str], activity_key: str):
        """
        Takes in raw data, keys, and the key to the stream and populates it
        with appropriate details
        """
        # e.g.s
        # - activity_type: Lecture recording" or "Tutorial"
        # - name: "Lecture 1" or "Practical 3"
        # - weeks: [1, 2, ...] converted from parsing data
        # - day: "Mon", etc.
        self.__activity_type: str = raw[activity_key]["activityType"]
        self.__name: str = raw[activity_key]["description"]
        self.__activity_id: int = self.__use_id()
        # run week parsing with output from DayTypeClassify.py
        with open(os.path.join(os.path.dirname(__file__), "DayTypes.json"), "r") as f:
            day_types = json.load(f)
            self.__weeks: List[int] = self.__find_weeks(
                raw, raw_keys, activity_key, day_types
            )
        self.__day: str = raw[activity_key]["day_of_week"]
        self.__times: Times = self.__find_times(raw, raw_keys, activity_key)
        self.__location: str = raw[activity_key]["location"]

    def __find_weeks(
        self,
        raw: dict,
        raw_keys: List[str],
        activity_key: str,
        day_types: dict,
    ):
        weeks = []
        for activity_date in raw[activity_key]["activitiesDays"]:
            # reformatting
            formatted_date = datetime.strftime(
                datetime.strptime(activity_date, "%d/%m/%Y"), "%d-%m-%Y"
            )
            # check activity_date is not a holiday or midsemester break
            # if not, it must be teaching week, so add it
            if ("holiday" not in day_types[formatted_date].lower()) and (
                "break" not in day_types[formatted_date].lower()
            ):
                weeks.append(day_types[formatted_date])
        return weeks

    def __find_times(self, raw: dict, raw_keys: List[str], activity_key: str):
        # use datetime - negates issues with abnormal times
        start_time = datetime.strptime(raw[activity_key]["start_time"], "%H:%M")
        duration = int(raw[activity_key]["duration"])
        end_time = start_time + timedelta(minutes=duration)
        # typecase Date/Time into just Time
        return Times(start_time.time(), end_time.time())

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        return {
            "activity_type": self.__activity_type,
            "name": self.__name,
            "activity_id": self.__activity_id,
            "weeks": self.__weeks,
            "day": self.__day,
            "times": self.__times.to_dict(),
            "location": self.__location,
        }

    def __use_id(self):
        curr_id = Activity.__id
        Activity.__id += 1
        return curr_id

    @classmethod
    def reset_id(self):
        Activity.__id = Activity.__default_id


class Stream:
    """Stores the different Activity's of an Stream"""

    __default_id = 0
    __id = __default_id  # counter across one ActivityGroup object

    def __init__(self, raw: dict, raw_keys: List[str], stream_ID: int, group_name: str):
        """
        Takes in raw data, keys, stream ID, and activity group name and adds
        appropriate activities
        """
        # e.g.s
        # - stream_id: 0 (NOT the same as the one passed in; that is the one used in the raw data)
        self.__stream_id: int = self.__use_id()
        self.__activity_list: List[Activity] = self.__find_activity_list(
            raw, raw_keys, stream_ID, group_name
        )

    def __find_activity_list(
        self, raw: dict, raw_keys: List[str], stream_ID: id, group_name: str
    ):
        """
        Takes in the keys to the dictionary and the dictionary from the JSON
        which represents the various activities, and generates the
        activity_list defined above.
        """
        # Get all activities in the stream,
        # and generate all Activity objects;
        # populating it is handled by Activity
        # Assumes each activity within a stream is unique, so not a set but a list
        activity_keys: List[str] = [
            activity_key
            for activity_key in raw_keys
            if raw[activity_key]["activity_code"].split("-")[0] == str(stream_ID)
            and raw[activity_key]["activity_group_code"] == group_name
        ]
        activity_list: List[Activity] = [
            Activity(raw, raw_keys, activity_key) for activity_key in activity_keys
        ]
        Activity.reset_id()

        return activity_list

    def __use_id(self):
        curr_id = Stream.__id
        Stream.__id += 1
        return curr_id

    @classmethod
    def reset_id(self):
        Stream.__id = Stream.__default_id

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        activity_list = [activity.to_dict() for activity in self.__activity_list]
        return {"stream_id": self.__stream_id, "activity_list": activity_list}


class ActivityGroup:
    """Stores different Stream's of an ActivityGroup"""

    __default_id = 0
    __id = __default_id  # counter across one Subject object

    def __init__(self, raw: dict, raw_keys: List[str], activity_group_name: str):
        """
        Takes in raw data, keys, and the group name and adds appropriate
        streams
        """
        # e.g.s
        # - name: "Lecture" or "Tutorial" or "Practical" or "ComputerLab"
        # - group_id: Unique within one Subject object
        self.__group_name: str = activity_group_name
        self.__group_id: int = self.__use_id()
        self.__stream_list: List[Stream] = self.__find_stream_list(raw, raw_keys)

    def __use_id(self):
        curr_id = ActivityGroup.__id
        ActivityGroup.__id += 1
        return curr_id

    @classmethod
    def reset_id(self):
        ActivityGroup.__id = ActivityGroup.__default_id

    def __find_stream_list(self, raw: dict, raw_keys: List[str]):
        """
        Takes in the keys to the dictionary and the dictionary from the JSON
        which represents the various activities, and generates the
        stream_list defined above.
        """
        # Get all stream ID's (called the "activity_code" in raw data) in the ActivityGroup,
        # and generate all Stream objects;
        # populating it is handled by Stream.

        stream_IDs: Set[int] = {
            int(raw[key]["activity_code"].split("-")[0])
            for key in raw_keys
            if raw[key]["activity_group_code"] == self.__group_name
        }
        stream_IDs: List[int] = sorted(stream_IDs)
        stream_list: List[Stream] = [
            Stream(raw, raw_keys, stream_ID, self.__group_name)
            for stream_ID in stream_IDs
        ]
        Stream.reset_id()

        return stream_list

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        stream_list = [stream.to_dict() for stream in self.__stream_list]
        return {
            "name": self.__group_name,
            "group_id": self.__group_id,
            "stream_list": stream_list,
        }


class Subject:
    """
    Stores a subject's details and ActivityGroups.
    Note that some subjects don't e.g. group their lectures,
    e.g. 2024 Summer Statistics.
    """

    def __init__(self, raw: dict):
        """
        Takes in a dictionary generated from the JSON file from Allocate+,
        parses it, and assigns appropriate values to the object's attributes.
        """
        # don't matter which one we take, so pick [0]
        raw_keys = sorted(raw.keys())
        first = raw_keys[0]

        # e.g.s
        # - code: "MAST10008"
        # - name: "Accelerated Mathematics 1"
        # - year: 2024 (uses start date to determine)
        # - offering: "Semester 1", "Summer Term", etc.
        self.__code: str = raw[first]["subject_code"].split("_")[0]
        self.__name: str = raw[first]["subject_description"]
        self.__year: int = int(raw[first]["start_date"][-4:])
        self.__offering: str = self.__find_offering(raw, first)
        self.__activity_group_list: List[ActivityGroup] = (
            self.__find_activity_group_list(raw, raw_keys)
        )

    def __find_offering(self, raw, first):
        """
        Takes in the key to the first object in the dictionary from the JSON and
        returns which period the subject is offered in. Is a helper method.
        """
        # hardcoded based on current values
        match raw[first]["semester"]:
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
                raise Exception("Invalid/unimplemented offering")

    def __find_activity_group_list(self, raw: dict, raw_keys: List[str]):
        """
        Takes in the keys to the dictionary and the dictionary from the JSON
        which represents the various activities, and generates the
        activity_group_list defined above.
        """
        # Get all activity groups in the subject,
        # and generate all ActivityGroup objects;
        # populating it is handled by ActivityGroup
        activity_group_names: Set[str] = {
            raw[key]["activity_group_code"] for key in raw_keys
        }
        activity_group_names: List[str] = sorted(activity_group_names)
        activity_group_list: List[ActivityGroup] = [
            ActivityGroup(raw, raw_keys, activity_group_name)
            for activity_group_name in activity_group_names
        ]
        ActivityGroup.reset_id()

        return activity_group_list

    def __str__(self):
        return (
            self.__code
            + " "
            + self.__name
            + ", "
            + str(self.__year)
            + " "
            + self.__offering
        )

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        # Convert each element in activity group for serialization
        activity_group_list = [
            activity_group.to_dict() for activity_group in self.__activity_group_list
        ]
        return {
            "code": self.__code,
            "name": self.__name,
            "year": self.__year,
            "offering": self.__offering,
            "activity_group_list": activity_group_list,
        }
