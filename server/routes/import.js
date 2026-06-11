const express = require('express')
const router = express.Router()
const { getAuthedClient } = require('../lib/auth')
const { findStudentsFolder, listSubfolders } = require('../lib/drive')
const { parseFolderName } = require('../lib/importParser')
const { getRows, appendRow, updateRow } = require('../lib/sheets')
const { claimNextFileNos, buildNameLookup, populateRow } = require('../lib/referenceSheet')

function inferStatus(categoryName) {
  const n = (categoryName || '').toLowerCase()
  if (n.includes('cancel') || n.includes('refused')) return 'Completed'
  if (n.includes('complete') || n.includes('coe only') || n.includes('granted')) return 'Completed'
  if (n.includes('lead') || n.includes('migration') || n.includes('hold')) return 'On Hold'
  if (n.includes('lodged')) return 'Active'
  return 'Active'
}

function normaliseName(first, family) {
  return `${(first || '').trim()} ${(family || '').trim()}`.toLowerCase().replace(/\s+/g, ' ').trim()
}

// GET /api/import/scan
router.get('/scan', async (req, res) => {
  try {
    const auth = getAuthedClient()
    if (!auth) return res.status(401).json({ error: 'Not authenticated' })

    // Find Students Drive folder
    const folders = await findStudentsFolder(auth)
    if (!folders.length) {
      return res.json({ found: false, message: 'No folder named "Students" found in your Drive.' })
    }
    const studentFolder = folders[0]
    const topLevel = await listSubfolders(auth, studentFolder.id)
    if (!topLevel.length) {
      return res.json({ found: true, folderId: studentFolder.id, folderName: studentFolder.name, students: [], message: 'Students folder has no subfolders.' })
    }

    // Separate category folders vs direct student folders
    const directStudents = []
    const categoryFolders = []
    for (const f of topLevel) {
      const parsed = parseFolderName(f.name)
      const looksLikeCategory = !parsed.file_no && !f.name.includes(',')
      if (looksLikeCategory) categoryFolders.push(f)
      else directStudents.push({ folder: f, parsed, category: null })
    }

    // Scan one level deeper inside category folders
    const deepStudents = []
    for (const cat of categoryFolders) {
      const children = await listSubfolders(auth, cat.id)
      for (const f of children) {
        deepStudents.push({ folder: f, parsed: parseFolderName(f.name), category: cat.name })
      }
    }

    const allFound = [...directStudents, ...deepStudents]

    // Load CRM sheet + reference register
    const [existingRows, regNameLookup] = await Promise.all([
      getRows(auth, 'Students'),
      buildNameLookup(auth),
    ])
    const existingFileNos = new Set(existingRows.map(r => r.file_no).filter(Boolean))

    // Build CRM name → record lookup
    const crmNameLookup = {}
    for (const r of existingRows) {
      const key = normaliseName(r.first_name, r.family_name)
      if (key) crmNameLookup[key] = r
      // Also index family-first order
      const key2 = normaliseName(r.family_name, r.first_name)
      if (key2) crmNameLookup[key2] = r
    }

    // Claim enough file numbers from register for new students
    const newCount = allFound.filter(({ folder, parsed, category }) => {
      const nameKey = normaliseName(parsed.first_name, parsed.family_name)
      const revKey = normaliseName(parsed.family_name, parsed.first_name)
      return !crmNameLookup[nameKey] && !crmNameLookup[revKey] && !regNameLookup[nameKey] && !regNameLookup[revKey]
    }).length
    const availableNos = await claimNextFileNos(auth, newCount, existingFileNos)
    let fileNoIdx = 0

    const students = allFound.map(({ folder, parsed, category }) => {
      const nameKey = normaliseName(parsed.first_name, parsed.family_name)
      const revKey = normaliseName(parsed.family_name, parsed.first_name) // family first (Drive format)

      // 1. Check CRM by name
      const crmRecord = crmNameLookup[nameKey] || crmNameLookup[revKey]
      if (crmRecord) {
        return {
          drive_folder_id: folder.id,
          folder_name: folder.name,
          folder_url: folder.webViewLink,
          first_name: parsed.first_name,
          family_name: parsed.family_name,
          file_no: crmRecord.file_no,
          category,
          suggested_status: crmRecord.status || inferStatus(category),
          already_exists: true,
          drive_already_linked: !!crmRecord.drive_folder_id,
          source: 'crm',
        }
      }

      // 2. Check register by name (already assigned in register)
      const regFileNo = regNameLookup[nameKey] || regNameLookup[revKey]
      if (regFileNo) {
        return {
          drive_folder_id: folder.id,
          folder_name: folder.name,
          folder_url: folder.webViewLink,
          first_name: parsed.first_name,
          family_name: parsed.family_name,
          file_no: regFileNo,
          category,
          suggested_status: inferStatus(category),
          already_exists: existingFileNos.has(regFileNo),
          drive_already_linked: false,
          source: 'register',
        }
      }

      // 3. Assign next available from register
      const assignedNo = availableNos[fileNoIdx++] || null
      return {
        drive_folder_id: folder.id,
        folder_name: folder.name,
        folder_url: folder.webViewLink,
        first_name: parsed.first_name,
        family_name: parsed.family_name,
        file_no: assignedNo,
        auto_assigned: true,
        category,
        suggested_status: inferStatus(category),
        already_exists: false,
        drive_already_linked: false,
        source: 'new',
      }
    })

    // Sort: new first, then alphabetically by family name
    students.sort((a, b) => {
      if (!a.already_exists && b.already_exists) return -1
      if (a.already_exists && !b.already_exists) return 1
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
    let imported = 0, linked = 0, skipped = 0
    const errors = []

    for (const s of students) {
      try {
        if (s.already_exists && s.file_no) {
          if (!s.drive_already_linked) {
            await updateRow(auth, 'Students', 'file_no', s.file_no, { drive_folder_id: s.drive_folder_id })
            linked++
          } else {
            skipped++
          }
        } else if (s.file_no && !existingFileNos.has(s.file_no)) {
          const row = {
            file_no: s.file_no, vto_no: '',
            family_name: s.family_name || '', first_name: s.first_name || '',
            dob: '', gender: '', address: '', email: '', tel_mob: '',
            visa_type: '', visa_end_date: '', previous_school: '', new_school: '',
            consultant: '', drive_folder_id: s.drive_folder_id || '',
            gmail_query: '', created_at: now, status: s.suggested_status || 'Active',
          }
          await appendRow(auth, 'Students', row)
          existingFileNos.add(s.file_no)

          // Populate the register row for this file number
          await populateRow(auth, s.file_no, {
            family_name: s.family_name,
            first_name: s.first_name,
            new_school: '',
            created_at: now,
            consultant: '',
          }).catch(() => {}) // non-fatal if register row not found

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
