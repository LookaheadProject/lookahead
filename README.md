# Lookahead | UoM Semester Planner

Lookahead is an online application that allows students at the University of Melbourne to plan their
semester. A variety of customisations and optimisations are provided to help students make the most
out of their semester.

## Features

- Subject class list viewer
- Time restrictions
- Clash optimisations
- Lecture-skip provisioning
- Class cramming optimisations
- Break provisioning after a specified number of consecutive classes
- Support for streams
- Customisable timetable (drag and drop)
- Most importantly: dark mode

Published at: https://lookahead.rohyl.io/

## Installation Instructions

This project has been built in React frontend with a Node backend written in Typescript. This means
that to get this running locally, you will have to run two installation scripts. **You must have
Node.js version 14.18.2**, and consequentially `npm` installed.

### Yarn Package Manager Installation

In your terminal, run:

```shell
npm install --global yarn
```

### Node.js Dependency Installation

In the root folder, issue the following installation command:

```shell
yarn install
```

If that doesn't work, you may need to `sudo yarn install` depending on your operating system.

This should install a number of dependencies and development dependencies to a folder called
`node_modules`, where your packages live.

### React JS Dependency Installation

Now, go into the `client` folder and issue the same command. Like so:

```shell
cd client
yarn install
```

This should create a `node_modules` folder within the `client` folder.

### Running Locally

In the root folder run

```shell
yarn run dev
```

To concurrently boot the backend server and front-end. This might take a while, but should
eventually work. If there is some error you can't overcome, just reach out to me or a friend who
knows JS.

# How to update subjects, and timetable data.
As of right now, subject data needs to be manually cached under the supervision of a human. Here's how to do that.

NOTE I need to actually test all this stuff, as well as figure out if I managed to get all the commands right.

## (Should be) Optional: Update basic subject data

Firstly, if it's the start of a new year, to update the list of subject codes offered by the uni, you'd might like to go to line 195 of `subject-utils/scripts/subjectListScraper.ts`, and check that the `years` variable is up to date. Then you can (hypothetically) update the list of basic subject data with 
```shell
yarn run ts-node subject-utils/scripts/subjectListScraper.ts
```
All the new basic subject data (does not include timetables, just includes what can be found in the handbook) can now be found in `subject-utils/subject-lists`. 

## Setting up stuff to get past SSO and updating timetable data.
Now we need to scrape past SSO... Basically someone will have to use their unimelb account details to sign in... we're only automating this process.

Look at `subject-utils/scripts/cred.txt`. Fill it in with your username and password to log into `sso.unimelb.edu.au`. If you don't trust us (You should, you should only run this script clientside), just change your unimelb password to something else. Now what is this `GoogleAuthSecret` field you must fill in?

### Setup Google Authenticator as your only 2FA authenticator.
I don't know the exact URL that should conjure up the desired profile management page (`sso.unimelb.edu.au` would be my guess), but you should eventually be able to get to a screen where you can add and remove your 2FA options. You need to ensure that Google authenticator is your only authenticator. 

But careful now! When you setup google authenticator, you will be shown a QR code and asked to scan it. Make sure you scan it in an app that shows you the contents of the QR code, where you will find a conspicuous string of capital letters and numbers somewhere in the URL. This is the authenticator secret. Save that to cred.txt, and also make sure to actually set up google authenticator with your phone using that QR code so you can sign in normally!

### Install Google Chrome and chromedriver
Lastly, you need to download the relevant chromedriver binary for your version of google chrome, update the last field in cred.txt to reflect wherever you placed it. I've given you where I placed mine just so you can be less anxious about the input format.

### Install some python modules
I think you just need to do some variation of `pip install pyotp` and `pip install selenium` to install those modules

## Run timetable.py
TODO: Rename this file.
This file scrapes all HTML files that contain timetable information, and chucks them in subject-htmls. If the above setup went well, simply run 

```shell
python3 subject-utils/scripts/timetable.py
```

If something goes wrong with the web scraping, consider commenting (what is currently) line 54 (containing `options.add_argument('--headless')`), which should let you see what is going on. Sometimes commenting and uncommenting this line just fixes things.

## Run ProcessHTML.ts
This file takes all the cached HTML files, and refines them into some nice juicy json that the rest of the server can use. 

I think this should justWork(TM) 

```shell
yarn run ts-node subject-utils/scripts/subjectListScraper.ts
```

If you carefully observe the `subject-cache` folder it should slowly be filled up with empty files. Do not be alarmed, these files seem to be instantly filled with useful data once the script finishes. I should look into why this happens.