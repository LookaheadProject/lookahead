import fs from "fs";
import { google } from "googleapis";
import readline from "readline";

const initialiseCredentials = () => {
  if (!process.env.GS_CRED) {
    return;
  }
  fs.writeFile(process.env.GS_KEY_FILE, process.env.GS_CRED, (err) => {
    if (!err) {
      return;
    }
    console.log("Error dumping the keyfile.", err);
  });
};
export const initialise = () => {
  initialiseCredentials();
};

export const getSponsorSheetData = (): Promise<string[][] | null> => {
  if (!fs.existsSync("google-sheets/credentials.json")) {
    return null;
  }
  return new Promise((resolve, reject) => {
    // Load client secrets from a local file.
    fs.readFile("google-sheets/credentials.json", (err, content) => {
      if (err) {
        reject(err);
        return console.log("Error loading client secret file:", err);
      }
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content.toString()), (auth) => {
        const sheets = google.sheets({ version: "v4", auth });
        sheets.spreadsheets.values.get(
          {
            range: "Sheet1!A2:Z",
            spreadsheetId: process.env.GS_SHEET_ID,
          },
          (err2, res) => {
            if (err2) {
              return console.log("The API returned an error: " + err2);
            }
            const rows = res.data.values;
            resolve(rows);
          }
        );
      });
    });
  });
};

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "google-sheets/token.json";

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials: any, callback: (client: any) => void) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      return getNewToken(oAuth2Client, callback);
    }
    oAuth2Client.setCredentials(JSON.parse(token.toString()));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client: any, callback: any) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err: any, token: any) => {
      if (err) {
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      }
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err2: any) => {
        if (err2) {
          return console.error(err2);
        }
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
