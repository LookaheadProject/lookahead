from dataclasses import dataclass
from typing import List
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
        return {"start": time.isoformat(self.start), "end": time.isoformat(self.end)}


@dataclass
class Stream:
    """Stores one instance of a lecture/tute"""

    stream_id: int  # Unique within each activity; remember that a stream of an activity with the same id is paired with another stream of another activity with the same id if it is within an activity group.

    weeks: List[int]  # e.g. 1, etc. converted using `weeks-config.json`

    day: str  # e.g. "Mon", etc.
    times: Times
    location: str

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        return {
            "stream_id": self.stream_id,
            "weeks": self.weeks,
            "day": self.day,
            "times": self.times.to_dict(),
            "location": self.location,
        }


@dataclass
class Activity:
    """Stores the different Stream's of an Activity"""

    activity_type: str  # e.g. "Lecture recording" or "Tutorial"
    name: str  # e.g. "Lecture 1" or "Practical 3"
    activity_id: int  # Unique for one entire Subject object
    stream_list: List[Stream]

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        stream_list = [stream.to_dict() for stream in self.stream_list]
        return {
            "activity_type": self.activity_type,
            "name": self.name,
            "activity_id": self.activity_id,
            "stream_list": stream_list,
        }


@dataclass
class ActivityGroup:
    """Stores the activities whose streams must be picked at the same time"""

    name: str  # e.g. "Lecture" or "Tutorial" or "Practical" or "ComputerLab"
    group_id: int  # Unique for one entire Subject object
    activity_list: List[Activity]

    def to_dict(self):
        """
        Returns dictionary version of itself for JSON serialization
        """
        activity_list = [activity.to_dict() for activity in self.activity_list]
        return {
            "name": self.name,
            "group_id": self.group_id,
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

        # code, e.g. "MAST10008"
        self.__code: str = raw[first]["subject_code"].split("_")[0]

        # name, e.g. "Accelerated Mathematics 1"
        self.__name: str = raw[first]["subject_description"]

        # year, e.g. 2024
        # uses the last 4 characters of the start date,
        # assuming that's always the correct year.
        self.__year: int = raw[first]["start_date"][-4:]

        # offering: str, e.g. "Semester 1", "Summer Term", etc.
        self.__offering: str = self.__find_offering(raw, first)

        # activity_group_list: List[ActivityGroup]
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

    def __find_weeks(self):
        # TO-DO
        return []

    def __find_times(self):
        # TO-DO
        return Times(time(), time())

    def __find_activity_group_list(self, raw, raw_keys):
        """
        Takes in the keys to the dictionary and the dictionary from the JSON
        which represents the various activities, and generates the
        activity_group_list defined above.
        """
        # Citations
        # - thanks for the list comprehension https://stackoverflow.com/questions/2739800/extract-list-of-attributes-from-list-of-objects-in-python
        # - thanks for finding an index https://stackoverflow.com/questions/176918/how-to-find-the-index-for-a-given-item-in-a-list
        activity_group_list: List[ActivityGroup] = []
        activity_group_id: int = 1
        activity_id: int = 1

        for key in raw_keys:
            # 1. Handle the ActivityGroup
            activity_group_name: str = raw[key]["activity_group_code"]
            activity_group_names = [
                activity_group.name for activity_group in activity_group_list
            ]

            if activity_group_name not in activity_group_names:
                # Create a new ActivityGroup object
                activity_group_list.append(
                    ActivityGroup(activity_group_name, activity_group_id, [])
                )
                activity_group_names.append(activity_group_name)
                activity_group_id += 1
            # This index is the same as in the object so we exploit that
            activity_group_index = activity_group_names.index(activity_group_name)

            # 2. Now that the ActivityGroup exists, consider the Activity
            activity_type: str = raw[key]["activityType"]
            activity_name: str = raw[key]["description"]
            activity_names = [
                activity.name
                for activity in activity_group_list[activity_group_index].activity_list
            ]

            if activity_name not in activity_names:
                # Create a new Activity
                activity_group_list[activity_group_index].activity_list.append(
                    Activity(activity_type, activity_name, activity_id, [])
                )
                activity_names.append(activity_name)
                activity_id += 1
            activity_index = activity_names.index(activity_name)

            # 3. Finally, deal with the Stream once the two above exists
            stream_id: int = raw[key]["activity_code"].split("-")[0]
            weeks: List[int] = self.__find_weeks()
            day: str = raw[key]["day_of_week"]
            times: Times = self.__find_times()
            location: str = raw[key]["location"]

            activity_group_list[activity_group_index].activity_list[
                activity_index
            ].stream_list.append(Stream(stream_id, weeks, day, times, location))

        return activity_group_list

    def __str__(self):
        return (
            self.__code + " " + self.__name + ", " + self.__year + " " + self.__offering
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
