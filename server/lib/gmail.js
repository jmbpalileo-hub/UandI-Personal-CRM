const { google } = require('googleapis')

async function getThreads(auth, query, maxResults = 10) {
  const gmail = google.gmail({ version: 'v1', auth })
  const listRes = await gmail.users.threads.list({
    userId: 'me',
    q: query,
    maxResults,
  })
  const threads = listRes.data.threads || []
  const detailed = await Promise.all(
    threads.map(async t => {
      try {
        const res = await gmail.users.threads.get({
          userId: 'me',
          id: t.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'To', 'Date'],
        })
        const msg = res.data.messages?.[0]
        const headers = msg?.payload?.headers || []
        const get = (name) => headers.find(h => h.name === name)?.value || ''
        return {
          id: t.id,
          subject: get('Subject') || '(no subject)',
          from: get('From'),
          date: get('Date'),
          snippet: res.data.messages?.[res.data.messages.length - 1]?.snippet || '',
        }
      } catch {
        return { id: t.id, subject: '(error)', from: '', date: '', snippet: '' }
      }
    })
  )
  return detailed
}

module.exports = { getThreads }
