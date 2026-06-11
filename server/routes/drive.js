const express = require('express')
const router = express.Router()
const { getAuthedClient } = require('../lib/auth')
const { getRows } = require('../lib/sheets')
const { listFiles } = require('../lib/drive')

router.get('/:file_no', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })
    const rows = await getRows(auth, 'Students')
    const student = rows.find(r => r.file_no === req.params.file_no)
    if (!student?.drive_folder_id) return res.json([])
    const files = await listFiles(auth, student.drive_folder_id)
    res.json(files)
  } catch (e) {
    if (e.message?.includes('notFound') || e.message?.includes('not found')) {
      return res.status(404).json({ error: 'Drive folder not found' })
    }
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
