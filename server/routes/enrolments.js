const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { getAuthedClient } = require('../lib/auth')
const { getRows, appendRow, updateRow } = require('../lib/sheets')

router.get('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Enrolments')
    res.json(rows.filter(r => r.file_no === req.params.file_no))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    await appendRow(auth, 'Enrolments', { ...req.body, enrolment_id: uuidv4() })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:enrolment_id', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    await updateRow(auth, 'Enrolments', 'enrolment_id', req.params.enrolment_id, req.body)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
