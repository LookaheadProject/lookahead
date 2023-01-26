# -*- coding: utf-8 -*-
"""
Created on Mon Jan 16 16:23:12 2023

@author: stevenp115
"""

""" How to use:
1. Create a text file of the form (make sure there is no trailing newline):  
    username
    password
    secret_to_unimelb_login_auth
2. Call the program as follows:
    python timetable.py [YEAR]
    
"""


# Get subject data from json(s). We take the set union of all subjects.
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

from pyotp import *
import sys
import json
import os
import re

YEAR = int(sys.argv[1])

def get_SWS_URL(subject_code):
    return f"https://sws.unimelb.edu.au/{YEAR}/Reports/List.aspx?objects={subject_code}&weeks=1-52&days=1-7&periods=1-56&template=module_by_group_list"

# Fetch login credentials, and chrome driver path from text file

with open("subject-utils/scripts/cred.txt", 'r') as fp:
    details = [x.split("=")[1] for x in fp.readlines()]
    USERNAME = details[0].strip()
    PASSWORD = details[1].strip()
    GAUTH_SECRET = details[2].strip()
    DRIVER_PATH = details[3].strip()

# Get a list of all the json files of that year.

json_filenames = [f for f in os.listdir("subject-utils/subject-lists") if str(YEAR) in f]

# print(os.listdir("subject-utils/subject-lists"))
# print (json_filenames)
# exit(0)

subjects = set()
for json_file in json_filenames:
    with open(f"subject-utils/subject-lists/{json_file}", 'r') as fp:
        subject_data = json.load(fp)
        subjects.update([subj['code'] for subj in subject_data])
print(f"{len(subjects)} subjects loaded.")
subjects = sorted(list(subjects))

# Initialise web driver
options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
driver = webdriver.Chrome(DRIVER_PATH, chrome_options=options)

# Go to the first timetable page (with login).
init_url = get_SWS_URL(subjects[0])
driver.get(init_url)  
time.sleep(0.5)


# Input login credentials.
driver.find_element('id', 'okta-signin-username').send_keys(USERNAME)
driver.find_element('id', 'okta-signin-password').send_keys(PASSWORD)
driver.find_element('id', 'okta-signin-submit').click()

# Give the browser some loading time then fetch/input auth code.
time.sleep(4)
totp = TOTP(GAUTH_SECRET)
code = totp.now()
driver.find_element('xpath',
    '/html/body/div[2]/div/div[2]/div/div/form/div[1]/div[2]/div[1]/div[2]/span/input').send_keys(code)
driver.find_element('xpath',
    '/html/body/div[2]/div/div[2]/div/div/form/div[2]/input').click()

time.sleep(2)

### Now loop over the remaining subjects:

def scrape_timetable(subject, global_start_time):
    start_time = time.perf_counter()
    driver.get(get_SWS_URL(subject))
    WebDriverWait(driver, 5).until(EC.visibility_of_element_located((By.ID, "g-global-menu-logo")))
    time.sleep(0.1) # Just a bit extra.
    html_source = driver.page_source
    with open(f"subject-utils/scripts/subject-htmls/{subject}.html", 'w', encoding='utf-8') as fp:
        fp.write(html_source)
    end_time = time.perf_counter()
    print(
        f"Subject '{subject}' scraped || Time taken: {round(end_time-start_time, 3)} s || Total time elapsed: {round(end_time-global_start_time, 3)} s")

global_start_time = time.perf_counter()

for subject in subjects:
    scrape_timetable(subject, global_start_time)
