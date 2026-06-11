import { Link } from 'react-router-dom'
import { Hash, GraduationCap, Calendar } from 'lucide-react'
import { StatusBadge, VisaExpiryBadge } from './StatusBadge'
import { formatDate } from '../lib/utils'

export default function StudentCard({ student }) {
  const { file_no, first_name, family_name, visa_type, visa_end_date, status, new_school, created_at } = student

  return (
    <Link
      to={`/student/${encodeURIComponent(file_no)}`}
      className="card block p-5 hover:shadow-card-hover hover:-translate-y-px transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 16, color: '#1A2E2B' }}>
            {first_name} {family_name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-text-muted" style={{ fontSize: 12 }}>
            <Hash size={11} strokeWidth={2} />
            <span>{file_no}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex flex-col gap-1.5">
        {new_school && (
          <div className="flex items-center gap-1.5 text-text-secondary" style={{ fontSize: 13 }}>
            <GraduationCap size={13} strokeWidth={1.5} />
            <span className="truncate">{new_school}</span>
          </div>
        )}
        {visa_type && (
          <div className="flex items-center gap-1.5 text-text-secondary" style={{ fontSize: 13 }}>
            <span
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ background: '#E6F7F5', color: '#008C7E', fontSize: 11 }}
            >
              {visa_type}
            </span>
          </div>
        )}
        {visa_end_date && (
          <div className="flex items-center gap-1.5" style={{ fontSize: 12 }}>
            <Calendar size={12} strokeWidth={1.5} className="text-text-muted" />
            <span className="text-text-muted">Visa expires {formatDate(visa_end_date)}</span>
            <VisaExpiryBadge visaEndDate={visa_end_date} />
          </div>
        )}
      </div>
    </Link>
  )
}
