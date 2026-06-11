import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { StatusBadge, VisaExpiryBadge } from './StatusBadge'
import { formatDate } from '../lib/utils'

export default function StudentRow({ student }) {
  const { file_no, first_name, family_name, visa_end_date, status, new_school, consultant } = student

  return (
    <Link
      to={`/student/${encodeURIComponent(file_no)}`}
      className="grid grid-cols-[140px_1fr_1fr_120px_110px] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-brand-light transition-colors items-center group"
    >
      <span
        className="font-mono text-xs px-2 py-0.5 rounded-full inline-block w-fit"
        style={{ background: '#E6F7F5', color: '#008C7E' }}
      >
        {file_no}
      </span>

      <div className="min-w-0">
        <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#1A2E2B' }} className="truncate">
          {first_name} {family_name}
        </p>
        {consultant && (
          <p className="text-xs text-text-muted truncate">{consultant}</p>
        )}
      </div>

      <div className="min-w-0 flex items-center gap-1.5 text-text-secondary text-sm">
        {new_school ? (
          <>
            <GraduationCap size={13} strokeWidth={1.5} className="flex-shrink-0 text-text-muted" />
            <span className="truncate">{new_school}</span>
          </>
        ) : (
          <span className="text-text-muted italic text-xs">—</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {visa_end_date ? (
          <>
            <span className="text-xs text-text-secondary">{formatDate(visa_end_date)}</span>
            <VisaExpiryBadge visaEndDate={visa_end_date} />
          </>
        ) : (
          <span className="text-text-muted italic text-xs">—</span>
        )}
      </div>

      <StatusBadge status={status} />
    </Link>
  )
}
