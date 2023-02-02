import totp from 'totp-generator';
import got from 'got'; // solution for ESM
//const fetch = (...args) => import('got').then({default: got} => got(...args));
//const got = await import('got');
import {CookieJar} from 'tough-cookie';
import {parse} from 'node-html-parser';
import AsyncLock from 'async-lock'

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

var lock = new AsyncLock();

export const getHTMLpastSSO = async (year: number, code: string): Promise<string> => {
  const SWS_URL = `https://sws.unimelb.edu.au/${year}/Reports/List.aspx?objects=${code}&weeks=1-52&days=1-7&periods=1-56&template=module_by_group_list`;

  let html: string;

  // TODO: use hooks to manage retries and reauthentication
  for (let i = 1; i <= MAX_TRIES; i++) {
    console.debug('Load timetable attempt #1');

    return await lock.acquire('lock', async function(){
      html = await got(SWS_URL, {cookieJar: COOKIE_CACHE}).text();

      // see if a login page is brought up; if so, get SAML payload
      let root = parse(html);
      let endpointSAML = root.querySelector(`form[method="POST"]`)?.getAttribute('action');
      let payloadSAML = root.querySelector(`input[name="SAMLRequest"]`)?.getAttribute('value');
  
      if (endpointSAML || payloadSAML) {
        // if one of endpointSAML or payloadSAML exists
        // then we need to reauthenticate
  
        let result = await authenticateSAMLAndDownload(endpointSAML, payloadSAML);
        //COOKIE_CACHE = result.cookies;
  
        return result.html;
      }
  
      return html;
    });

  }
};

const authenticateSAMLAndDownload = async (
  endpoint: string,
  payload: string
): Promise<{
  html: string;
  cookies: CookieJar;
}> => {
  //let COOKIE_CACHE = new CookieJar();

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
      cookieJar: COOKIE_CACHE,
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
    return e.factorType == 'token:software:totp';
  })['_links']['verify']['href'];

  console.debug('Verifying MFA');

  let passCode = totp(process.env.UOM_MFA_SECRET);

  let mfaAuthnData: OKTA_MFA_API_SCHEMA = await got
    .post(mfaVerifyURL, {
      json: {
        stateToken,
        passCode,
      },
      cookieJar: COOKIE_CACHE,
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

  let samlData = await got
    .post(endpoint, {
      form: {
        SAMLRequest: payload,
      },
      searchParams: {sessionToken: sessionToken},
      cookieJar: COOKIE_CACHE,
    })
    .text();
  let root = parse(samlData);

  let endpointACS = root.querySelector(`form[method="POST"]`).getAttribute('action');
  let payloadACS = root.querySelector(`input[name="SAMLResponse"]`).getAttribute('value');

  console.debug('Downloading webpage through ACS redirect');

  let webpageHTML = await got
    .post(endpointACS, {
      //body: formACS,
      form: {
        SAMLResponse: payloadACS,
        RelayState: '',
      },
      methodRewriting: true, // https://github.com/sindresorhus/got/issues/1502
      cookieJar: COOKIE_CACHE,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
      },
    })
    .text();
  console.debug('Downloaded');

  return {
    html: webpageHTML,
    cookies: COOKIE_CACHE,
  };
};
