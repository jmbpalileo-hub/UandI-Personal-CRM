const express = require('express')
const router = express.Router()
const { getOAuthClient, getAuthUrl, saveTokens } = require('../lib/auth')

router.get('/login', (req, res) => {
  const client = getOAuthClient()
  res.redirect(getAuthUrl(client))
})

router.get('/callback', async (req, res) => {
  const { code } = req.query
  if (!code) return res.status(400).send('Missing code')
  try {
    const client = getOAuthClient()
    const { tokens } = await client.getToken(code)
    saveTokens(tokens)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/?setup=1`)
  } catch (e) {
    res.status(500).send(`OAuth error: ${e.message}`)
  }
})

router.get('/status', (req, res) => {
  const { hasTokens } = require('../lib/auth')
  res.json({ authenticated: hasTokens() })
})

// Returns the current refresh token so the user can save it to Vercel env vars.
// Only shown when GOOGLE_REFRESH_TOKEN is not yet set (meaning auth is ephemeral).
router.get('/token', (req, res) => {
  const { loadTokens } = require('../lib/auth')
  const tokens = loadTokens()
  if (!tokens?.refresh_token) return res.status(404).json({ error: 'No refresh token available' })
  const needsSave = !!process.env.VERCEL && !process.env.GOOGLE_REFRESH_TOKEN
  res.json({ refresh_token: tokens.refresh_token, needsSave })
})

module.exports = router
