// Vercel serverless entry point — re-exports the Express app.
// Vercel detects files in api/ automatically; all /api/* and /auth/* traffic
// is rewritten here (see vercel.json), and Express handles the sub-routing.
module.exports = require('../server/index')
