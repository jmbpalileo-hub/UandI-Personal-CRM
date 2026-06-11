const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { getAuthedClient } = require('../lib/auth')
const { getRows, appendRow } = require('../lib/sheets')

router.get('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Payments')
    res.json(rows.filter(r => r.file_no === req.params.file_no))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    await appendRow(auth, 'Payments', { ...req.body, payment_id: uuidv4() })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
