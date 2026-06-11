const { google } = require('googleapis')

const SHEET_NAMES = ['Students', 'Updates', 'Payments', 'Enrolments', 'Checklist']

const HEADERS = {
  Students: ['file_no','vto_no','family_name','first_name','dob','gender','address','email','tel_mob','visa_type','visa_end_date','previous_school','new_school','consultant','drive_folder_id','gmail_query','created_at','status'],
  Updates: ['update_id','file_no','date','time','staff','description'],
  Payments: ['payment_id','file_no','date','provider','type','amount','notes'],
  Enrolments: ['enrolment_id','file_no','provider','course_type','start_date','end_date','duration','tuition_fee','application_fee','material_fee','oshc','status'],
  Checklist: ['file_no','application_form','letter_of_offer','first_payment','coe','visa_applied','medical_check','visa_approved'],
}

function getSheets(auth) {
  return google.sheets({ version: 'v4', auth })
}

async function ensureSheets(auth) {
  const sheets = getSheets(auth)
  const spreadsheetId = process.env.SPREADSHEET_ID
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const existing = meta.data.sheets.map(s => s.properties.title)

  for (const name of SHEET_NAMES) {
    if (!existing.includes(name)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: name } } }],
        },
      })
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${name}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS[name]] },
      })
    }
  }
}

async function getRows(auth, sheetName) {
  const sheets = getSheets(auth)
  const spreadsheetId = process.env.SPREADSHEET_ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
  })
  const [headers, ...rows] = res.data.values || [[]]
  if (!headers) return []
  return rows.map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] || '' })
    return obj
  })
}

async function appendRow(auth, sheetName, rowObj) {
  const sheets = getSheets(auth)
  const spreadsheetId = process.env.SPREADSHEET_ID
  const headers = HEADERS[sheetName]
  const values = headers.map(h => rowObj[h] ?? '')
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
}

async function updateRow(auth, sheetName, matchField, matchValue, rowObj) {
  const sheets = getSheets(auth)
  const spreadsheetId = process.env.SPREADSHEET_ID
  const headers = HEADERS[sheetName]
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
  })
  const allRows = res.data.values || []
  const [headerRow, ...dataRows] = allRows
  if (!headerRow) return false
  const matchIdx = headerRow.indexOf(matchField)
  if (matchIdx === -1) return false
  const rowIdx = dataRows.findIndex(r => r[matchIdx] === matchValue)
  if (rowIdx === -1) return false
  const existing = {}
  headerRow.forEach((h, i) => { existing[h] = dataRows[rowIdx][i] || '' })
  const merged = { ...existing, ...rowObj }
  const values = headers.map(h => merged[h] ?? '')
  const sheetRowNum = rowIdx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${sheetRowNum}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
  return true
}

async function createSpreadsheet(auth, title = 'U&I Student CRM') {
  const sheets = getSheets(auth)
  const res = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
  })
  const spreadsheetId = res.data.spreadsheetId
  process.env.SPREADSHEET_ID = spreadsheetId
  return spreadsheetId
}

module.exports = { ensureSheets, getRows, appendRow, updateRow, createSpreadsheet, HEADERS }
