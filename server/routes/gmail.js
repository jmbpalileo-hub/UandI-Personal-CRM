const express = require('express')
const router = express.Router()
const { getAuthedClient } = require('../lib/auth')
const { getRows } = require('../lib/sheets')
const { getThreads } = require('../lib/gmail')

router.get('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Students')
    const student = rows.find(r => r.file_no === req.params.file_no)
    if (!student?.gmail_query) return res.json([])
    const threads = await getThreads(auth, student.gmail_query)
    res.json(threads)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
