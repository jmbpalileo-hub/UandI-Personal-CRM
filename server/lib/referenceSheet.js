// Manages the file number register spreadsheet.
// Structure: Sheet1, columns A-G
//   A: row number  B: file_no  C: date  D: school  E: surname  F: first_name  G: staff

const { google } = require('googleapis')

const REF_SHEET = 'Sheet1'
const REF_COLS = { rowNo: 0, fileNo: 1, date: 2, school: 3, surname: 4, firstName: 5, staff: 6 }

function getSheets(auth) {
  return google.sheets({ version: 'v4', auth })
}

function refId() {
  const id = process.env.REFERENCE_SPREADSHEET_ID
  if (!id) throw new Error('REFERENCE_SPREADSHEET_ID not set in .env')
  return id
}

// Returns all register rows as objects. Skips header (row 0).
async function readRegister(auth) {
  const sheets = getSheets(auth)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: refId(),
    range: `${REF_SHEET}!A1:G`,
  })
  const rows = res.data.values || []
  return rows
    .slice(1) // skip header
    .filter(r => r[REF_COLS.fileNo]) // must have a file number
    .map((r, idx) => ({
      sheetRow: idx + 2, // 1-based, +1 for header skip +1 for 1-based indexing
      rowNo: r[REF_COLS.rowNo] || '',
      file_no: r[REF_COLS.fileNo],
      date: r[REF_COLS.date] || '',
      school: r[REF_COLS.school] || '',
      surname: r[REF_COLS.surname] || '',
      first_name: r[REF_COLS.firstName] || '',
      staff: r[REF_COLS.staff] || '',
      assigned: !!(r[REF_COLS.surname] || r[REF_COLS.firstName]),
    }))
}

// Returns all pre-allocated but unassigned file numbers in order.
async function getAvailableFileNos(auth, alreadyUsed = new Set()) {
  const rows = await readRegister(auth)
  return rows
    .filter(r => !r.assigned && !alreadyUsed.has(r.file_no))
    .map(r => r.file_no)
}

// Fill in the student details for a given file_no row.
// Called after a student is created or updated in the CRM.
async function populateRow(auth, file_no, { family_name, first_name, new_school, created_at, consultant }) {
  const spreadsheetId = refId()
  const sheets = getSheets(auth)

  // Find the row for this file_no
  const rows = await readRegister(auth)
  const row = rows.find(r => r.file_no === file_no)
  if (!row) return false // file_no not in register

  const values = [
    [
      row.rowNo,                          // A: row number (unchanged)
      file_no,                            // B: file_no (unchanged)
      created_at || '',                   // C: date
      new_school || '',                   // D: school
      family_name || '',                  // E: surname
      first_name || '',                   // F: first name
      consultant || '',                   // G: staff
    ],
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${REF_SHEET}!A${row.sheetRow}:G${row.sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
  return true
}

// Get the next N available file numbers, respecting ones already claimed.
async function claimNextFileNos(auth, count, alreadyUsed = new Set()) {
  const available = await getAvailableFileNos(auth, alreadyUsed)
  return available.slice(0, count)
}

// Build a name → file_no lookup from the register (for already-assigned rows).
async function buildNameLookup(auth) {
  const rows = await readRegister(auth)
  const lookup = {}
  for (const r of rows) {
    if (r.assigned && (r.surname || r.first_name)) {
      const key = `${r.surname} ${r.first_name}`.toLowerCase().replace(/\s+/g, ' ').trim()
      if (key) lookup[key] = r.file_no
      // Also index by "first last" in case CRM has it that way
      if (r.first_name && r.surname) {
        const key2 = `${r.first_name} ${r.surname}`.toLowerCase().replace(/\s+/g, ' ').trim()
        lookup[key2] = r.file_no
      }
    }
  }
  return lookup
}

module.exports = { readRegister, getAvailableFileNos, populateRow, claimNextFileNos, buildNameLookup }
