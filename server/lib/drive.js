const { google } = require('googleapis')

async function listFiles(auth, folderId) {
  const drive = google.drive({ version: 'v3', auth })
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: 50,
  })
  return res.data.files || []
}

module.exports = { listFiles }
