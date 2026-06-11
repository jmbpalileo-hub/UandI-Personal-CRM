// Parse a Drive folder name into CRM name fields.
// Handles both:
//   "Surname, First Name"   (U&I Drive format)
//   "U25-001 - First Surname"  (file-number-prefixed)
//   "First Surname"            (plain name, no comma)

const FILE_NO_RE = /U\d{2}-\d{3,}/i

function parseFolderName(name) {
  // Check for embedded file number first
  const fileNoMatch = name.match(FILE_NO_RE)
  const file_no = fileNoMatch ? fileNoMatch[0].toUpperCase() : null

  let namePart = name
  if (file_no) {
    namePart = name.replace(file_no, '').replace(/^[\s\-_()–]+|[\s\-_()–]+$/g, '').trim()
  }

  let first_name = ''
  let family_name = ''

  if (namePart.includes(',')) {
    // "Surname, First Name" — the U&I Drive convention
    const [sur, ...rest] = namePart.split(',')
    family_name = sur.trim()
    first_name = rest.join(',').trim()
  } else {
    const parts = namePart.replace(/_/g, ' ').split(/\s+/).filter(Boolean)
    if (parts.length === 1) {
      family_name = parts[0]
    } else if (parts.length >= 2) {
      first_name = parts[0]
      family_name = parts.slice(1).join(' ')
    }
  }

  return { file_no, first_name, family_name, raw: name }
}

// Auto-generate the next available file number for a given year.
// existingFileNos: Set of strings already in the sheet.
function nextFileNo(existingFileNos, yearSuffix) {
  const prefix = `U${yearSuffix}-`
  let max = 0
  for (const fn of existingFileNos) {
    if (fn && fn.toUpperCase().startsWith(prefix)) {
      const num = parseInt(fn.slice(prefix.length), 10)
      if (!isNaN(num) && num > max) max = num
    }
  }
  const next = max + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

module.exports = { parseFolderName, nextFileNo }
