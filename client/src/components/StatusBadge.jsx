import { getVisaStatus } from '../lib/utils'
import { AlertTriangle } from 'lucide-react'

export function StatusBadge({ status }) {
  const map = {
    Active: 'badge-active',
    'On Hold': 'badge-hold',
    Completed: 'badge-complete',
  }
  return <span className={map[status] || 'badge-hold'}>{status}</span>
}

export function VisaExpiryBadge({ visaEndDate }) {
  const vs = getVisaStatus(visaEndDate)
  if (!vs) return null

  if (vs.type === 'ok') return null

  const cls = vs.type === 'expired' || vs.type === 'danger' ? 'badge-danger' : 'badge-warning'
  const pulse = vs.type === 'danger' || vs.type === 'expired'

  return (
    <span className={`${cls} ${pulse ? 'pulse-danger' : ''} flex items-center gap-1`}>
      <AlertTriangle size={10} strokeWidth={2} />
      {vs.type === 'expired' ? 'Expired' : `Visa ${vs.label}`}
    </span>
  )
}

export function EnrolmentStatusBadge({ status }) {
  const map = {
    Pending: 'badge-hold',
    Active: 'badge-active',
    Completed: 'badge-complete',
  }
  return <span className={map[status] || 'badge-hold'}>{status}</span>
}
