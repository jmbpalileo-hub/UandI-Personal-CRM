const express = require('express')
const router = express.Router()
const { getAuthedClient } = require('../lib/auth')
const { getRows, appendRow, updateRow } = require('../lib/sheets')
const { populateRow } = require('../lib/referenceSheet')

router.get('/', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Students')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Students')
    const student = rows.find(r => r.file_no === req.params.file_no)
    if (!student) return res.status(404).json({ error: 'Not found' })
    res.json(student)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    await appendRow(auth, 'Students', req.body)
    // Sync name/school/staff to the file number register
    if (req.body.file_no) {
      populateRow(auth, req.body.file_no, req.body).catch(() => {})
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const updated = await updateRow(auth, 'Students', 'file_no', req.params.file_no, req.body)
    if (!updated) return res.status(404).json({ error: 'Not found' })
    // Sync updated fields to the file number register (non-fatal)
    populateRow(auth, req.params.file_no, req.body).catch(() => {})
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
