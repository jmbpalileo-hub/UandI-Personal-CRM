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

async function findStudentsFolder(auth) {
  const drive = google.drive({ version: 'v3', auth })
  const res = await drive.files.list({
    q: `name = 'Students' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name,webViewLink)',
    pageSize: 10,
  })
  return res.data.files || []
}

async function listSubfolders(auth, parentFolderId) {
  const drive = google.drive({ version: 'v3', auth })
  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name,webViewLink)',
    orderBy: 'name',
    pageSize: 500,
  })
  return res.data.files || []
}

module.exports = { listFiles, findStudentsFolder, listSubfolders }
