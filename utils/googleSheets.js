const { google } = require("googleapis");
require("dotenv").config();

function getSheetsClient() {
  const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in .env");
  }
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function ensureSheetExists({ sheets, spreadsheetId, sheetName }) {
  // Fetch spreadsheet to check existing sheets
  const ss = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = (ss.data.sheets || []).some(
    (s) => s.properties && s.properties.title === sheetName
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: sheetName },
            },
          },
        ],
      },
    });
  }
}

async function writeSheet({ spreadsheetId, sheetName, headers, rows }) {
  if (!spreadsheetId) throw new Error("spreadsheetId is required");
  if (!sheetName) throw new Error("sheetName is required");
  const sheets = getSheetsClient();

  // Ensure the tab exists
  await ensureSheetExists({ sheets, spreadsheetId, sheetName });

  const range = `${sheetName}!A1`;
  const values = [headers, ...rows];

  // Clear existing data in the sheet tab
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!A:Z` });

  // Write headers + rows
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

module.exports = { getSheetsClient, writeSheet };
