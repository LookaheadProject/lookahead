import totp from 'totp-generator';
import got from 'got'; // solution for ESM
//const fetch = (...args) => import('got').then({default: got} => got(...args));
//const got = await import('got');
import {CookieJar} from 'tough-cookie';
import FormData from 'form-data';
import {parse} from 'node-html-parser';

import * as dotenv from 'dotenv';
dotenv.config();

let COOKIE_CACHE = new CookieJar();
const MAX_TRIES = 3;

interface OKTA_PRIMARY_API_SCHEMA {
  stateToken?: string;
  _embedded?: {
    factors: Array<{
      factorType: string;
      _links: {
        verify: {
          href: string;
        };
      };
    }>;
  };
  errorCode?: string;
}

interface OKTA_MFA_API_SCHEMA {
  errorCode?: string;
  sessionToken?: string;
}

const OKTA_ENDPOINT = 'https://sso.unimelb.edu.au/api/v1/authn';

export const getHTMLpastSSO = async (year: number, code: string): Promise<string> => {
  const SWS_URL = `https://sws.unimelb.edu.au/${year}/Reports/List.aspx?objects=${code}&weeks=1-52&days=1-7&periods=1-56&template=module_by_group_list`;

  let html: string;
  for (let i = 1; i <= MAX_TRIES; i++) {
    console.debug('Load timetable attempt #1');

    html = await got(SWS_URL, {cookieJar: COOKIE_CACHE}).text();

    // see if a login page is brought up; if so, get SAML payload
    let root = parse(html);
    let endpointSAML = root.querySelector(`form[method="POST"]`)?.getAttribute('action');
    let payloadSAML = root.querySelector(`input[name="SAMLResponse"]`)?.getAttribute('value');

    if (endpointSAML || payloadSAML) {
      // if one of endpointSAML or payloadSAML exists
      // then we need to reauthenticate

      let result = await authenticateSAMLAndDownload(endpointSAML, payloadSAML);
      COOKIE_CACHE = result.cookies;

      return result.html;
    }

    return html;
  }
};

const authenticateSAMLAndDownload = async (
  endpoint: string,
  payload: string
): Promise<{
  html: string;
  cookies: CookieJar;
}> => {
  let SESSION_COOKIES = new CookieJar();

  console.debug('Authenticating username and password');

  let primaryAuthnData: OKTA_PRIMARY_API_SCHEMA = await got
    .post(OKTA_ENDPOINT, {
      json: {
        username: process.env.UOM_USERNAME,
        password: process.env.UOM_PASSWORD,
        options: {
          multiOptionalFactorEnroll: true,
          warnBeforePasswordExpired: false,
        },
      },
      cookieJar: SESSION_COOKIES,
    })
    .json();

  // check if primary authentication was successful
  if ('errorCode' in primaryAuthnData) {
    // critical error, exit application
    console.error(
      'Primary authentication failed with error: \n' + JSON.stringify(primaryAuthnData, null, 2)
    );
    process.exit(1);
  }

  let stateToken = primaryAuthnData['stateToken'];
  let mfaVerifyURL = primaryAuthnData['_embedded']['factors'].find(e => {
    e.factorType == 'token:software:totp';
  })['_links']['verify']['href'];

  console.debug('Verifying MFA');

  let passCode = totp(process.env.UOM_MFA_SECRET);

  let mfaAuthnData: OKTA_MFA_API_SCHEMA = await got
    .post(mfaVerifyURL, {
      json: {
        stateToken,
        passCode,
      },
      cookieJar: SESSION_COOKIES,
    })
    .json();

  // check if secondary authn was successful
  if ('errorCode' in mfaAuthnData) {
    console.error(
      'Secondary authentication failed with error: \n' + JSON.stringify(mfaAuthnData, null, 2)
    );
    process.exit(1);
  }

  let sessionToken = mfaAuthnData['sessionToken'];
  console.debug('Authenticated: got session token');

  console.debug('Get ACS details');

  let formSAML = new FormData();
  formSAML.append('SAMLRequest', payload);

  let samlData = await got
    .post(endpoint, {
      body: formSAML,
      searchParams: {sessionToken: sessionToken},
      cookieJar: SESSION_COOKIES,
    })
    .text();
  let root = parse(samlData);

  let endpointACS = root.querySelector(`form[method="POST"]`).getAttribute('action');
  let payloadACS = root.querySelector(`input[name="SAMLResponse"]`).getAttribute('value');

  console.debug('Downloading webpage through ACS redirect');
  let formACS = new FormData();
  formACS.append('SAMLResponse', payloadACS);
  formACS.append('RelayState', '');

  let webpageHTML = await got.post(endpointACS, {body: formACS, cookieJar: SESSION_COOKIES}).text();

  return {
    html: webpageHTML,
    cookies: SESSION_COOKIES,
  };
};

getHTMLpastSSO(2023, 'MAST20005').then(x => console.log(x));
