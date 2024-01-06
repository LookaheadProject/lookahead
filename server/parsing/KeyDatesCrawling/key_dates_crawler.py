from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import requests 
import re
import json
from crawler_helpers import getHTMLdocument, get_text, contains_substring, parse_date, get_weeks, dump_dates

# types of objects we are interested in
classifications = ["semester", "holiday", "examinations", "non-teaching"]

# empty lists defined for use below
key_dates = []
holidays = []
sem1_weeks = []
sem2_weeks = []
examinations = []
list_names = ["sem1_weeks", "sem2_weeks", "examinations", "holidays"]

# Get HTML code from the unimelb key dates website 
unimelb_key_dates_url = "https://www.unimelb.edu.au/dates"
html_doc = getHTMLdocument(unimelb_key_dates_url)
# Define a BeautifulSoup object used for crawling
soup = BeautifulSoup(html_doc, 'html.parser') # utilising default html parser

"""Objects in the Unimelb Key Dates page appear as a date/activity
   pair of children, coming from one tag """
# find all pairs of type listed above 
object_tags = soup.findAll('tr', itemtype="http://schema.org/InformAction")


""" loop through all items appearing front-end of Key Dates page,
    they all occur under the tag specified in object_tags
"""
for object_tag in object_tags:
    if not object_tag:
        continue
    
    # get the "activity" child of the parent tag (object_tag)
    td_tag = object_tag.find('td', attrs={"headers": re.compile(fr'\b{"activity"}\b', re.I)})

    if not td_tag:
        continue
        
    # get the string contained within the activity tag
    # this may be "Semester 1" or "Anzac Day Holiday" etc.
    activity_type = get_text(td_tag.find('span', itemprop="name"))

    # check if the activity we see is one we are interested in or not
    if (not activity_type) or (not contains_substring(activity_type.lower(), classifications)):
        continue

    activity_start = object_tag.find('span', itemprop="startTime")

    if not activity_start:
        continue

    start_time = activity_start.get('content')

    if not start_time:
        continue

    activity_end = object_tag.find('span', itemprop="endTime")

    if not activity_end:
        # we must check for activites that have no end-date, e.g.: one-day holidays
        # store seperately as (activity, date (str type))
        if object_tag.get('class')[0] == "holiday":
            key_dates.append((activity_type, start_time))
        continue

    end_time = activity_end.get('content')

    if not end_time:
        continue
    
    key_dates.append((activity_type, [start_time, end_time]))

# loop through all key_dates found, filtering by type of activity
for activity, dates in key_dates:
    if ("holiday" in activity):
        holidays.append((activity, dates))
    elif("examination" in activity.lower()):
        examinations.append((activity, dates))
    elif ("non-teaching" in activity.lower()):
        if ("easter" in activity.lower()):
            sem1_weeks.append((activity, dates))
        elif ("semester 2" in activity.lower()):
            sem2_weeks.append((activity, dates))


# get weeks contained within main semesters
# see helpers.py for documentation on get_weeks
for activity, dates in key_dates:
    if (activity == "Semester 1"):
        get_weeks(dates, sem1_weeks[0], sem1_weeks)
    elif (activity == "Semester 2"):
        get_weeks(dates, sem2_weeks[0], sem2_weeks)


# loop through all the dates we have, storing each in a seperate json file
all_lists = [sem1_weeks, sem2_weeks, examinations, holidays]
i = 0
while (i < len(all_lists)):
    if (i < 2):
        all_lists[i].sort(key=lambda x: datetime.strptime(x[1][0], '%d-%m-%Y'))

    dump_dates(all_lists[i], list_names[i], f"{list_names[i]}.json")
    i += 1

