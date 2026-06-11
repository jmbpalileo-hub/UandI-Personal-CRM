import { differenceInDays, parseISO, format, isValid } from 'date-fns'

export function getVisaStatus(visaEndDate) {
  if (!visaEndDate) return null
  try {
    const end = parseISO(visaEndDate)
    if (!isValid(end)) return null
    const days = differenceInDays(end, new Date())
    if (days < 0) return { type: 'expired', days, label: 'Expired' }
    if (days <= 30) return { type: 'danger', days, label: `${days}d` }
    if (days <= 90) return { type: 'warning', days, label: `${days}d` }
    return { type: 'ok', days, label: `${days}d` }
  } catch {
    return null
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'd MMM yyyy') : dateStr
  } catch {
    return dateStr
  }
}

export function formatCurrency(amount) {
  if (amount == null || amount === '') return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(amount))
}

export function nowDate() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function nowTime() {
  return format(new Date(), 'HH:mm')
}

export function getMimeIcon(mimeType) {
  if (!mimeType) return 'File'
  if (mimeType.includes('pdf')) return 'FileText'
  if (mimeType.includes('image')) return 'Image'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Sheet'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'FileText'
  if (mimeType.includes('folder')) return 'FolderOpen'
  return 'File'
}

export function validateFileNo(val) {
  return /^U\d{2}-\d{3,}$/.test(val)
}
