from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import requests 
import re
import json
from DateCrawlerHelpers import getHTMLdocument, GetText, ContainsSubstring, GetWeeks, GenerateDayDict

CURRENT_YEAR = 2024

# types of objects we are interested in
classifications = ["semester", "holiday", "examinations", "non-teaching", "summer", "swot"]

# empty lists defined for use below
KeyDates = []

# Get HTML code from the unimelb key dates website 
DatesURL = "https://www.unimelb.edu.au/dates"
DatesHTML = getHTMLdocument(DatesURL)
# Define a BeautifulSoup object used for crawling
soup = BeautifulSoup(DatesHTML, 'html.parser') # utilising default html parser

"""Objects in the Unimelb Key Dates page appear as a date/activity
   pair of children, coming from one tag """
# find all pairs of type listed above 
ObjectTags = soup.findAll('tr', itemtype="http://schema.org/InformAction")


""" loop through all items appearing front-end of Key Dates page,
    they all occur under the tag specified in ObjectTags
"""
for ObjectTag in ObjectTags:
    if not ObjectTag:
        continue
    
    # get the "activity" child of the parent tag (ObjectTag)
    tdTag = ObjectTag.find('td', attrs={"headers": re.compile(fr'\b{"activity"}\b', re.I)})

    if not tdTag:
        continue
        
    # get the string contained within the activity tag
    # this may be "Semester 1" or "Anzac Day Holiday" etc.
    ActivityType = GetText(tdTag.find('span', itemprop="name"))

    # check if the activity we see is one we are interested in or not
    if (not ActivityType) or (not ContainsSubstring(ActivityType.lower(), classifications)):
        continue

    ActivityStart = ObjectTag.find('span', itemprop="startTime")

    if not ActivityStart:
        continue

    StartTime = datetime.strptime(ActivityStart.get('content'), "%d-%m-%Y")

    if not StartTime:
        continue

    ActivityEnd = ObjectTag.find('span', itemprop="endTime")

    if not ActivityEnd:
        # we must check for activites that have no end-date, e.g.: one-day Holidays
        # store seperately as (activity, [date, date])
        if ObjectTag.get('class')[0] == "holiday":
            KeyDates.append((ActivityType, [StartTime, StartTime]))
        continue

    EndTime = datetime.strptime(ActivityEnd.get('content'), "%d-%m-%Y")

    if not EndTime:
        continue
    
    KeyDates.append((ActivityType, [StartTime, EndTime]))

# same as KeyDates, but removes Semester 1 & 2 and their respective Midsem Breaks
AllDates = [Event for Event in KeyDates if (Event[0].lower() not in ["semester 1", "semester 2", "non-teaching"])]

# grab relevant dates
for Event in KeyDates:
    if Event[0] == "Semester 1":
        Sem1Dates = Event[1]
    elif Event[0] == "Semester 2":
        Sem2Dates = Event[1]
    elif ("Easter" in Event[0] or "Semester 1" in Event [0]) and ("non-teaching" in Event[0].lower()):
        MidSem1 = Event[1]
    elif ("Semester 2" in Event[0]) and ("non-teaching" in Event[0].lower()):
        MidSem2 = Event[1]

# check if non-empty, then split the Semester 1 tuple into all of its children/week lists
if Sem1Dates and MidSem1:
    Sem1Weeks = GetWeeks(Sem1Dates, MidSem1)
    AllDates = AllDates + Sem1Weeks
    
# same here
if Sem2Dates and MidSem2:
    Sem2Weeks = GetWeeks(Sem2Dates, MidSem2)
    AllDates = AllDates + Sem2Weeks

# dictionary of key = date, value = "holiday"
DayDict = GenerateDayDict(CURRENT_YEAR)

# iterate over all days
for key in DayDict.keys():
    # iterate over all relevant events considering unimbelb
    # we aim to match the day to a given event, e.g.: if the current day (key)
    # lands between the start and end of week 3 of sem1, we associate that day with week 3
    # if checks fail, the day is outside unimelb periods - must be a holiday 
    for Event in AllDates:
        KeyDateTime = datetime.strptime(key, "%d-%m-%Y")
        if (Event[1][0] <= KeyDateTime) and (KeyDateTime <= Event[1][1]):
            DayDict[key] = Event[0]
        elif (Event[1][0] <= KeyDateTime <= Event[1][1]):
            DayDict[key] = Event[0]

# dump into output folder
with open("DayTypes.json", "w") as f:
    json.dump(DayDict, f, indent=2)
    f.close()