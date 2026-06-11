const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const { getAuthedClient } = require('../lib/auth')
const { getRows, appendRow, updateRow } = require('../lib/sheets')

router.get('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Updates')
    const filtered = rows
      .filter(r => r.file_no === req.params.file_no)
      .sort((a, b) => {
        const ta = new Date(`${a.date}T${a.time || '00:00'}`).getTime()
        const tb = new Date(`${b.date}T${b.time || '00:00'}`).getTime()
        return tb - ta
      })
    res.json(filtered)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const entry = { ...req.body, update_id: uuidv4() }
    await appendRow(auth, 'Updates', entry)
    res.json({ ok: true, update_id: entry.update_id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:update_id', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    await updateRow(auth, 'Updates', 'update_id', req.params.update_id, req.body)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
