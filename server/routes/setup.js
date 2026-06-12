const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const os = require('os')
const { getAuthedClient, hasTokens } = require('../lib/auth')
const { ensureSheets, createSpreadsheet } = require('../lib/sheets')

const CONFIG_PATH = path.join(os.homedir(), '.uandi-crm', 'config.json')

function loadConfig() {
  // On Vercel, spreadsheetId comes from the env var — no local file
  if (process.env.VERCEL) return { spreadsheetId: process.env.SPREADSHEET_ID || '' }
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) } catch { return {} }
}

function saveConfig(data) {
  // On Vercel there's no writable home directory — skip silently
  if (process.env.VERCEL) return
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data))
}

router.get('/status', (req, res) => {
  const config = loadConfig()
  const authenticated = hasTokens()
  const hasSheet = !!(process.env.SPREADSHEET_ID || config.spreadsheetId)
  // Tell the frontend when it needs to save the refresh token to Vercel env vars
  const needsRefreshTokenSave = !!process.env.VERCEL && !process.env.GOOGLE_REFRESH_TOKEN && authenticated
  res.json({ configured: authenticated && hasSheet, authenticated, hasSheet, needsRefreshTokenSave })
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
