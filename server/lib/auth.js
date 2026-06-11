const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')
const os = require('os')

const TOKEN_DIR = path.join(os.homedir(), '.uandi-crm')
const TOKEN_PATH = path.join(TOKEN_DIR, 'tokens.json')
const TMP_TOKEN_PATH = '/tmp/uandi-tokens.json'

const isVercel = () => !!process.env.VERCEL

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/auth/callback'
  )
}

function getAuthUrl(client) {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    prompt: 'consent',
  })
}

function saveTokens(tokens) {
  if (isVercel()) {
    try {
      const current = readTmpTokens() || {}
      fs.writeFileSync(TMP_TOKEN_PATH, JSON.stringify({ ...current, ...tokens }))
    } catch {}
    return
  }
  if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true })
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
}

function readTmpTokens() {
  try { return JSON.parse(fs.readFileSync(TMP_TOKEN_PATH, 'utf8')) } catch { return null }
}

function loadTokens() {
  if (isVercel()) {
    const envRefresh = process.env.GOOGLE_REFRESH_TOKEN
    const tmp = readTmpTokens()
    if (!envRefresh && !tmp) return null
    // Merge: env var refresh_token wins (it's the stable one), tmp provides cached access_token
    return { ...(tmp || {}), ...(envRefresh ? { refresh_token: envRefresh } : {}) }
  }
  if (!fs.existsSync(TOKEN_PATH)) return null
  try { return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')) } catch { return null }
}

function getAuthedClient() {
  const tokens = loadTokens()
  if (!tokens) return null
  const client = getOAuthClient()
  client.setCredentials(tokens)
  client.on('tokens', (newTokens) => {
    const current = loadTokens() || {}
    saveTokens({ ...current, ...newTokens })
  })
  return client
}

function hasTokens() {
  return loadTokens() !== null
}

module.exports = { getOAuthClient, getAuthUrl, saveTokens, loadTokens, getAuthedClient, hasTokens }
