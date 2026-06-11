const express = require('express')
const router = express.Router()
const { getAuthedClient } = require('../lib/auth')
const { getRows, appendRow, updateRow } = require('../lib/sheets')

router.get('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Checklist')
    const row = rows.find(r => r.file_no === req.params.file_no)
    if (!row) {
      const empty = {
        file_no: req.params.file_no,
        application_form: '', letter_of_offer: '', first_payment: '',
        coe: '', visa_applied: '', medical_check: '', visa_approved: '',
      }
      res.json(empty)
    } else {
      res.json(row)
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Checklist')
    const exists = rows.find(r => r.file_no === req.params.file_no)
    if (exists) {
      await updateRow(auth, 'Checklist', 'file_no', req.params.file_no, req.body)
    } else {
      await appendRow(auth, 'Checklist', { ...req.body, file_no: req.params.file_no })
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
