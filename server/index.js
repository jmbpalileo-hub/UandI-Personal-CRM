require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Load persisted config on startup
const CONFIG_PATH = path.join(os.homedir(), '.uandi-crm', 'config.json')
try {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  if (config.spreadsheetId && !process.env.SPREADSHEET_ID) {
    process.env.SPREADSHEET_ID = config.spreadsheetId
  }
} catch {}

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))
app.use(express.json())

app.use('/auth', require('./routes/auth'))
app.use('/api/students', require('./routes/students'))
app.use('/api/updates', require('./routes/updates'))
app.use('/api/payments', require('./routes/payments'))
app.use('/api/enrolments', require('./routes/enrolments'))
app.use('/api/checklist', require('./routes/checklist'))
app.use('/api/gmail', require('./routes/gmail'))
app.use('/api/drive', require('./routes/drive'))
app.use('/api/setup', require('./routes/setup'))
app.use('/api/import', require('./routes/import'))

app.get('/health', (req, res) => res.json({ ok: true }))

// Catch-all: redirect any browser landing on the API server to the frontend
app.get('/', (req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000')
})

app.listen(PORT, () => {
  console.log(`U&I CRM server running on http://localhost:${PORT}`)
})
