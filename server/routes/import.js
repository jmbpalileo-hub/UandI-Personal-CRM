const express = require('express')
const router = express.Router()
const { getAuthedClient } = require('../lib/auth')
const { findStudentsFolder, listSubfolders } = require('../lib/drive')
const { parseFolderName, nextFileNo } = require('../lib/importParser')
const { getRows, appendRow, updateRow } = require('../lib/sheets')

function inferStatus(categoryName) {
  const n = (categoryName || '').toLowerCase()
  if (n.includes('cancel') || n.includes('refused')) return 'Completed'
  if (n.includes('complete') || n.includes('coe only') || n.includes('granted')) return 'Completed'
  if (n.includes('lead') || n.includes('migration') || n.includes('hold')) return 'On Hold'
  if (n.includes('lodged')) return 'Active'
  return 'Active'
}

// Normalise a name for loose matching (lowercase, strip extra spaces)
function normaliseName(first, family) {
  return `${(first || '').trim()} ${(family || '').trim()}`.toLowerCase().replace(/\s+/g, ' ').trim()
}

// GET /api/import/scan
// Scans the "Students" Drive folder 2 levels deep, parses all student
// subfolders, matches against existing Sheet records by name, and
// assigns the next available file number to unmatched students.
router.get('/scan', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })

    const folders = await findStudentsFolder(auth)
    if (!folders.length) {
      return res.json({ found: false, message: 'No folder named "Students" found in your Drive.' })
    }

    const studentFolder = folders[0]
    const topLevel = await listSubfolders(auth, studentFolder.id)
    if (!topLevel.length) {
      return res.json({
        found: true, folderId: studentFolder.id,
        folderName: studentFolder.name, folderUrl: studentFolder.webViewLink,
        students: [], message: 'The "Students" folder contains no subfolders.',
      })
    }

    // Separate: direct student folders vs category folders
    const directStudents = []
    const categoryFolders = []
    for (const f of topLevel) {
      const parsed = parseFolderName(f.name)
      // Treat as a category if name has no comma AND no file number AND looks like a label
      const looksLikeCategory = !parsed.file_no && !f.name.includes(',')
      if (looksLikeCategory) {
        categoryFolders.push(f)
      } else {
        directStudents.push({ folder: f, parsed, category: null })
      }
    }

    // Scan one level deeper inside category folders
    const deepStudents = []
    for (const cat of categoryFolders) {
      const children = await listSubfolders(auth, cat.id)
      for (const f of children) {
        const parsed = parseFolderName(f.name)
        deepStudents.push({ folder: f, parsed, category: cat.name })
      }
    }

    const allFound = [...directStudents, ...deepStudents]

    // Load existing sheet records for matching
    const existingRows = await getRows(auth, 'Students')
    const existingFileNos = new Set(existingRows.map(r => r.file_no).filter(Boolean))

    // Build name → file_no lookup from existing records
    const nameToFileNo = {}
    const nameToDriveLinked = {}
    for (const r of existingRows) {
      const key = normaliseName(r.first_name, r.family_name)
      if (key) {
        nameToFileNo[key] = r.file_no
        nameToDriveLinked[key] = !!r.drive_folder_id
      }
    }

    // Current year suffix for auto file number generation (e.g. "25")
    const yearSuffix = String(new Date().getFullYear()).slice(-2)
    const assignedFileNos = new Set(existingFileNos)

    const students = allFound.map(({ folder, parsed, category }) => {
      const nameKey = normaliseName(parsed.first_name, parsed.family_name)

      // Check if already in sheet by file number or name
      let matched_file_no = parsed.file_no || nameToFileNo[nameKey] || null
      const already_exists = matched_file_no
        ? existingFileNos.has(matched_file_no)
        : !!(nameToFileNo[nameKey])
      const drive_already_linked = nameKey ? nameToDriveLinked[nameKey] : false

      // Auto-assign a file number for truly new students
      let auto_file_no = null
      if (!matched_file_no && !already_exists) {
        auto_file_no = nextFileNo(assignedFileNos, yearSuffix)
        assignedFileNos.add(auto_file_no)
      }

      return {
        drive_folder_id: folder.id,
        folder_name: folder.name,
        folder_url: folder.webViewLink,
        first_name: parsed.first_name,
        family_name: parsed.family_name,
        file_no: matched_file_no || auto_file_no,
        auto_assigned: !matched_file_no && !already_exists,
        category,
        suggested_status: inferStatus(category),
        already_exists,
        drive_already_linked,
      }
    })

    // Sort: new first, then alphabetically
    students.sort((a, b) => {
      if (a.already_exists !== b.already_exists) return a.already_exists ? 1 : -1
      return (a.family_name || '').localeCompare(b.family_name || '')
    })

    res.json({
      found: true,
      folderId: studentFolder.id,
      folderName: studentFolder.name,
      folderUrl: studentFolder.webViewLink,
      students,
      categoryFolders: categoryFolders.map(c => c.name),
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/import/confirm
// For each student:
//  - New student → appendRow with auto/parsed file_no and drive_folder_id
//  - Existing student, Drive not linked yet → updateRow to set drive_folder_id
router.post('/confirm', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })

    const { students } = req.body
    if (!Array.isArray(students) || !students.length) {
      return res.status(400).json({ error: 'No students provided' })
    }

    const existingRows = await getRows(auth, 'Students')
    const existingFileNos = new Set(existingRows.map(r => r.file_no).filter(Boolean))

    const now = new Date().toISOString().split('T')[0]
    let imported = 0
    let linked = 0
    let skipped = 0
    const errors = []

    for (const s of students) {
      try {
        if (s.already_exists && s.file_no) {
          // Just update the drive_folder_id if not already set
          if (!s.drive_already_linked) {
            await updateRow(auth, 'Students', 'file_no', s.file_no, {
              drive_folder_id: s.drive_folder_id,
            })
            linked++
          } else {
            skipped++
          }
        } else if (!existingFileNos.has(s.file_no)) {
          await appendRow(auth, 'Students', {
            file_no: s.file_no,
            vto_no: '',
            family_name: s.family_name || '',
            first_name: s.first_name || '',
            dob: '', gender: '', address: '', email: '', tel_mob: '',
            visa_type: '', visa_end_date: '',
            previous_school: '', new_school: '',
            consultant: '',
            drive_folder_id: s.drive_folder_id || '',
            gmail_query: '',
            created_at: now,
            status: s.suggested_status || 'Active',
          })
          existingFileNos.add(s.file_no)
          imported++
        } else {
          skipped++
        }
      } catch (e) {
        errors.push({ file_no: s.file_no, name: `${s.first_name} ${s.family_name}`, error: e.message })
      }
    }

    res.json({ imported, linked, skipped, errors })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
