if (!process.env.VERCEL) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

  // Load persisted spreadsheet ID from local config file (dev only)
  const fs = require('fs')
  const path = require('path')
  const os = require('os')
  const CONFIG_PATH = path.join(os.homedir(), '.uandi-crm', 'config.json')
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
    if (config.spreadsheetId && !process.env.SPREADSHEET_ID) {
      process.env.SPREADSHEET_ID = config.spreadsheetId
    }
  } catch {}
}

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 4000

// Allow same-origin on Vercel; allow localhost:3000 in local dev
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // No origin = same-domain request or server-to-server — always allow
    if (!origin) return cb(null, true)
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true)
    // On Vercel, frontend and API share the same domain so CORS isn't needed,
    // but Vercel preview URLs vary — allow *.vercel.app as a fallback
    if (process.env.VERCEL && origin.endsWith('.vercel.app')) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
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

app.get('/', (req, res) => {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000')
})

// Local dev: start the server directly
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`U&I CRM server running on http://localhost:${PORT}`)
  })
}

// Vercel: export the app as the serverless handler
module.exports = app
