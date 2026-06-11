const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')
const os = require('os')

const TOKEN_DIR = path.join(os.homedir(), '.uandi-crm')
const TOKEN_PATH = path.join(TOKEN_DIR, 'tokens.json')

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
  if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true })
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))
}

function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
  } catch {
    return null
  }
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
