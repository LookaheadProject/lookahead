import fs from 'fs';
import Subject from './Subject';
import {SubjectPeriod} from './SubjectPeriods';

import {parseSubject} from './SubjectClassScraper'
import { cacheSubject } from './SubjectCacher';

export const processHTML = (subjectListFilename: string) => {
    let subjText = fs.readFileSync(`subject-utils/${subjectListFilename}`).toString('utf-8')
    let subjNames = subjText.split("\n")
    
    for (let subject of subjNames) {
      console.log(`Parsing ${subject}...`);
      subject = subject.replace(/[\n\r]+/g, ''); // Get rid of trailing carriage returns etc.
      for (var period of Object.values(SubjectPeriod)) {
        try {
            let subj = parseSubject(fs.readFileSync(`subject-utils/subject-htmls/${subject}.html`, 'utf-8'), subject, period)
            cacheSubject(2023, period, subj)
        }
        catch (err) {
            // console.log(`Could not parse ${subject} for ${period}`);
            // console.log(err);
        }
      }
    };
}

processHTML("subject_names.txt")