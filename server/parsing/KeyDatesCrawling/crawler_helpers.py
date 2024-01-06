from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import requests 
import re
import json

NUM_WEEKS = 12

def getHTMLdocument(url: str):
    """
        Sends a request to a desired url, returning 
        the html code as text/string
    """

    # Send an HTTP request to desired url
    response = requests.get(url)
    # Return HTML content as string
    return response.text

def get_text(parent: str):
    """
        Returns only the string contained within a parent tag from HTML code
        DOES NOT return any text contained within possible children
    """
    return ''.join(parent.find_all(string=True, recursive=False)).strip()

def contains_substring(string: str, substrings: list):
    """
        Checks if a target string is contained anywhere within a list of strings
        e.g.: "hello",   ["hello, bye-bye", "1234"] will return True
    """
    return any(sub in string for sub in substrings)

def parse_date(date: str):
    """
        Converts string date of form: "dd-mm-yy" into a datetime object
    """
    dt_date = datetime.strptime(date, '%d-%m-%Y')
    return dt_date

def get_weeks(semester_dates: list, midsem_brk: list, output: list):
    """
        Given a list of start & end dates for a semester & midsemester break,
        this calculates the dates of all 12 weeks that span the given semester
    """
    start = parse_date(semester_dates[0])
    end = parse_date(semester_dates[1])

    midsem_brk_start = parse_date(midsem_brk[1][0])
    midsem_brk_end = parse_date(midsem_brk[1][1])

    # loop over, adding each week to the output list
    iter = 0
    adj = 0
    while (iter <= NUM_WEEKS):
        # adjust start & end to the desired week
        week_dates = [
            (start + timedelta(days=7*iter)),
            (start + timedelta(7*(iter+1) - 1))
            ]
        
        # adjust for the missed week during midsemester break
        if (midsem_brk_start <= week_dates[0]) and (midsem_brk_end >= week_dates[1]):
            iter += 1
            adj = -1
            continue
        
        output.append((f"Week {iter+1+adj}", [date.strftime('%d-%m-%Y') for date in week_dates]))
        iter += 1

    return

import json

def dump_dates(dates: list, dataname: str, output_file: str):
    """
        Dumps a list of type:
        [(activity1, [start, end]), (activity2, [start, end])]
        into respective json file
    """
    formatted_dates = {}

    for activity, date_range in dates:
        # check if activity runs over a single day
        if type(date_range) == str:
            formatted_dates[activity] = {"date": date_range}
        else:
            # we know activity runs across multiple days
            formatted_dates[activity] = {
                "start": date_range[0],
                "end": date_range[1]
            }

    output_data = {dataname: formatted_dates}

    with open(output_file, 'w') as json_file:
        json.dump(output_data, json_file, indent=4)

    return
