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
    res.redirect('/?setup=1')
  } catch (e) {
    res.status(500).send(`OAuth error: ${e.message}`)
  }
})

router.get('/status', (req, res) => {
  const { hasTokens } = require('../lib/auth')
  res.json({ authenticated: hasTokens() })
})

module.exports = router
