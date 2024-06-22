from dataclasses import dataclass
from typing import List, Dict, Set
from datetime import time, date


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


class Stream:
    """Stores one instance of a lecture/tute"""

    def __init__(self, raw: dict, raw_keys: List[str], stream_key: str):
        """
        Takes in raw data, keys, and the key to the stream and populates it
        with appropriate details
        """
        # Note: stream_id is unique within each activity; remember that a stream of an activity with the same id is paired with another stream of another activity with the same id if it is within an activity group.
        # e.g.s
        # - weeks: [1, 2, ...] converted from parsing data
        # - day: "Mon", etc.
        self.__stream_id: int = int(
            raw[stream_key]["activity_code"].split("-")[0]
        )
        self.__weeks: List[int] = self.__find_weeks()
        self.__day: str = raw[stream_key]["day_of_week"]
        self.__times: Times = self.__find_times()
        self.__location: str = raw[stream_key]["location"]

    def __find_weeks(self):
        # TO-DO
        return []

    def __find_times(self):
        # TO-DO
        return Times(time(), time())

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        return {
            "stream_id": self.__stream_id,
            "weeks": self.__weeks,
            "day": self.__day,
            "times": self.__times.to_dict(),
            "location": self.__location,
        }

    # A getter method
    @property
    def stream_id(self):
        return self.__stream_id


class Activity:
    """Stores the different Stream's of an Activity"""

    __default_id = 1
    __id = __default_id  # counter across one ActivityGroup object

    def __init__(
        self, raw: dict, raw_keys: List[str], activity_name_type: (str, str)
    ):
        """
        Takes in raw data, keys, and the activity name and type and adds
        appropriate streams
        """
        # e.g.s
        # - activity_type: Lecture recording" or "Tutorial"
        # - name: "Lecture 1" or "Practical 3"
        # - activity_id: Unique for one entire Subject object
        self.__activity_name: str = activity_name_type[0]
        self.__activity_type: str = activity_name_type[1]
        self.__activity_id: int = self.__use_id()
        self.__stream_list: List[Stream] = self.__find_stream_list(
            raw, raw_keys
        )

    def __find_stream_list(self, raw: dict, raw_keys: List[str]):
        """
        Takes in the keys to the dictionary and the dictionary from the JSON
        which represents the various activities, and generates the
        stream_list defined above.
        """
        # Get all streams in the activity,
        # and generate all Stream objects;
        # populating it is handled by Stream
        # Assumes each stream is unique, so no sets here
        stream_keys: List[(str, str)] = [
            stream_key
            for stream_key in raw_keys
            if raw[stream_key]["description"] == self.__activity_name
        ]
        stream_list: List[Stream] = [
            Stream(raw, raw_keys, stream_key) for stream_key in stream_keys
        ]
        # No resetting id's here since id is taken from raw data
        # instead of manually generated
        stream_list.sort(key=lambda Stream: Stream.stream_id)

        return stream_list

    def __use_id(self):
        curr_id = Activity.__id
        Activity.__id += 1
        return curr_id

    @classmethod
    def reset_id(self):
        Activity.__id = Activity.__default_id

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        stream_list = [stream.to_dict() for stream in self.__stream_list]
        return {
            "activity_type": self.__activity_type,
            "name": self.__activity_name,
            "activity_id": self.__activity_id,
            "stream_list": stream_list,
        }


class ActivityGroup:
    """Stores the activities whose streams must be picked at the same time"""

    __default_id = 1
    __id = __default_id  # counter across one Subject object

    def __init__(
        self, raw: dict, raw_keys: List[str], activity_group_name: str
    ):
        """
        Takes in raw data, keys, and the group name and adds appropriate
        activities
        """
        # e.g.s
        # - name: "Lecture" or "Tutorial" or "Practical" or "ComputerLab"
        # - group_id: Unique within one Subject object
        self.__group_name: str = activity_group_name
        self.__group_id: int = self.__use_id()
        self.__activity_list: List[Activity] = self.__find_activity_list(
            raw, raw_keys
        )

    def __use_id(self):
        curr_id = ActivityGroup.__id
        ActivityGroup.__id += 1
        return curr_id

    @classmethod
    def reset_id(self):
        ActivityGroup.__id = ActivityGroup.__default_id

    def __find_activity_list(self, raw: dict, raw_keys: List[str]):
        """
        Takes in the keys to the dictionary and the dictionary from the JSON
        which represents the various activities, and generates the
        activity_list defined above.
        """
        # Get all activities in the activity group,
        # and generate all Activity objects;
        # populating it is handled by Activity
        activity_names_types: Set[(str, str)] = {
            (raw[key]["description"], raw[key]["activityType"])
            for key in raw_keys
            if raw[key]["activity_group_code"] == self.__group_name
        }
        activity_names_types: List[(str, str)] = sorted(activity_names_types)
        activity_list: List[Activity] = [
            Activity(raw, raw_keys, activity_name_type)
            for activity_name_type in activity_names_types
        ]
        Activity.reset_id()

        return activity_list

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        activity_list = [
            activity.to_dict() for activity in self.__activity_list
        ]
        return {
            "name": self.__group_name,
            "group_id": self.__group_id,
            "activity_list": activity_list,
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
            activity_group.to_dict()
            for activity_group in self.__activity_group_list
        ]
        return {
            "code": self.__code,
            "name": self.__name,
            "year": self.__year,
            "offering": self.__offering,
            "activity_group_list": activity_group_list,
        }
