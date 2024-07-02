from datetime import datetime, timedelta
import requests

NUM_WEEKS = 12
CURRENT_YEAR = 2024


def getHTMLdocument(url: str):
    """
    Sends a request to a desired url, returning
    the html code as text/string
    """

    # Send an HTTP request to desired url
    response = requests.get(url)
    # Return HTML content as string
    return response.text


def GetText(parent: str):
    """
    Returns only the string contained within a parent tag from HTML code
    DOES NOT return any text contained within possible children
    """
    return "".join(parent.find_all(string=True, recursive=False)).strip()


def ContainsSubstring(string: str, substrings: list):
    """
    Checks if a target string is contained anywhere within a list of strings
    e.g.: "hello",   ["hello, bye-bye", "1234"] will return True
    """
    return any(sub in string for sub in substrings)


def GenerateDayDict(year):
    """
    Generates a dictionary where the keys are all the days in the given year (input)
    All values are "holiday" - but this is a dummy variable to be changed in DayTypeClassify.py
    """
    StartDate = datetime(year, 1, 1)  # first day
    EndDate = datetime(year + 1, 1, 1)  # final day
    DayDict = {}
    CurrentDate = StartDate
    while CurrentDate < EndDate:
        # initialise all values as holiday - to be altered later
        DayDict[CurrentDate.strftime("%d-%m-%Y")] = "holiday"
        CurrentDate += timedelta(days=1)

    return DayDict


def GetWeeks(SemesterDates: list, MidsemBreak: list):
    """
    Given start and end date for semester, as well as the mid-semester break
    Generates a list of tuples: ("Week n", [Start of Week n, End of Week n])
    """
    # grab relevant dates
    SemesterStart = SemesterDates[0]
    SemesterEnd = SemesterDates[1]
    MidsemStart = MidsemBreak[0]
    MidsemEnd = MidsemBreak[1]

    # weeks is to be the final list returned
    Weeks = []
    Weeks.append(("Mid-Semester Break", MidsemBreak))

    CurrentDate = SemesterStart
    WeekCount = 0

    # iterate over relevant dates to generate weeks
    while (WeekCount < NUM_WEEKS) and (CurrentDate < SemesterEnd):
        # if we're in midsem - skip over
        if MidsemStart <= CurrentDate <= MidsemEnd:
            CurrentDate = MidsemEnd + timedelta(days=1)
            continue

        # start of current week
        WeekStart = CurrentDate
        WeekEnd = CurrentDate + timedelta(days=6)

        # check if week runs into the midsem - if so, cut it off before midsem begins
        if (WeekEnd >= MidsemStart) and (WeekEnd <= MidsemEnd):
            WeekEnd = MidsemStart - timedelta(days=1)

        # append week number and start/end dates to the list
        # note that we keep dates as datetime objects
        Weeks.append((f"Week {WeekCount + 1}", [WeekStart, WeekEnd]))
        # iterate date & week no. to continue
        CurrentDate = WeekEnd + timedelta(days=1)
        WeekCount += 1

    return Weeks
