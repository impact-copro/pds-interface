import { google } from "googleapis"

export const getGoogleSheetsClient = async (credentials: string) => {
  const serviceAccount = JSON.parse(credentials)

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  })

  return google.sheets({ version: "v4", auth })
}

export const getRowsFromSheet = async (spreadsheetId: string, range: string, credentials: string) => {
  const googleSheets = await getGoogleSheetsClient(credentials)
  const getRows = await googleSheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })
  if (getRows.data.values) {
    return getRows.data.values
  } else {
    // throw error
  }
}
