const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const os = require('os')
const { getAuthedClient, hasTokens } = require('../lib/auth')
const { ensureSheets, createSpreadsheet } = require('../lib/sheets')

const CONFIG_PATH = path.join(os.homedir(), '.uandi-crm', 'config.json')

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) } catch { return {} }
}

function saveConfig(data) {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data))
}

router.get('/status', (req, res) => {
  const config = loadConfig()
  const authenticated = hasTokens()
  const hasSheet = !!(process.env.SPREADSHEET_ID || config.spreadsheetId)
  res.json({ configured: authenticated && hasSheet, authenticated, hasSheet })
})

router.post('/link-spreadsheet', async (req, res) => {
  try {
    const { spreadsheetId } = req.body
    if (!spreadsheetId) return res.status(400).json({ error: 'Missing spreadsheetId' })
    process.env.SPREADSHEET_ID = spreadsheetId
    saveConfig({ spreadsheetId })
    const auth = getAuthedClient()
    if (auth) await ensureSheets(auth)
    res.json({ ok: true, spreadsheetId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/create-spreadsheet', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const spreadsheetId = await createSpreadsheet(auth)
    saveConfig({ spreadsheetId })
    await ensureSheets(auth)
    res.json({ ok: true, spreadsheetId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
