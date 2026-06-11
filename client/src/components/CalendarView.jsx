import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  parseISO, isValid, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isToday, addMonths, subMonths,
} from 'date-fns'
import { getVisaStatus } from '../lib/utils'

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Monday-first: Mon=0 … Sun=6
function weekdayMon(date) {
  return (getDay(date) + 6) % 7
}

function urgencyStyle(type) {
  switch (type) {
    case 'expired': return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' }
    case 'danger':  return { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' }
    case 'warning': return { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' }
    default:        return { bg: '#E6F7F5', text: '#008C7E', dot: '#00B09B' }
  }
}

export default function CalendarView({ students }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))

  // Group students by visa_end_date key (yyyy-MM-dd)
  const byDate = useMemo(() => {
    const map = {}
    for (const s of students) {
      if (!s.visa_end_date) continue
      try {
        const d = parseISO(s.visa_end_date)
        if (!isValid(d)) continue
        const key = format(d, 'yyyy-MM-dd')
        ;(map[key] ??= []).push(s)
      } catch {}
    }
    return map
  }, [students])

  const days = useMemo(() => eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  }), [month])

  const leadingEmpties = weekdayMon(days[0])
  const totalCells = leadingEmpties + days.length
  const trailingEmpties = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  const studentsWithVisa = students.filter(s => s.visa_end_date).length
  const studentsWithoutVisa = students.length - studentsWithVisa

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(m => subMonths(m, 1))}
            className="btn-ghost p-1.5 rounded-lg"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <h2 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#1A2E2B', minWidth: 160, textAlign: 'center' }}>
            {format(month, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="btn-ghost p-1.5 rounded-lg"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="btn-secondary text-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-4">
        {[
          { type: 'expired', label: 'Expired' },
          { type: 'danger',  label: 'Expiring ≤ 30 days' },
          { type: 'warning', label: 'Expiring ≤ 90 days' },
          { type: 'ok',      label: '90+ days remaining' },
        ].map(({ type, label }) => {
          const { dot, text } = urgencyStyle(type)
          return (
            <span key={type} className="flex items-center gap-1.5 text-xs" style={{ color: text }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
              {label}
            </span>
          )
        })}
        {studentsWithoutVisa > 0 && (
          <span className="text-xs text-text-muted ml-auto">
            {studentsWithoutVisa} student{studentsWithoutVisa !== 1 ? 's' : ''} have no visa date
          </span>
        )}
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-surface-alt">
          {DAY_HEADERS.map(d => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-text-secondary uppercase tracking-wide"
              style={{ fontFamily: 'Nunito' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(88px, auto)' }}>

          {/* Leading empty cells */}
          {Array.from({ length: leadingEmpties }).map((_, i) => (
            <div key={`pre-${i}`} className="border-r border-b border-border bg-surface-alt opacity-50" />
          ))}

          {/* Day cells */}
          {days.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayStudents = byDate[key] || []
            const today = isToday(day)
            const col = (leadingEmpties + i) % 7 // 0-6

            return (
              <div
                key={key}
                className={`border-b border-border p-1.5 ${col < 6 ? 'border-r' : ''}`}
                style={{ background: today ? '#F0FDF9' : 'white' }}
              >
                {/* Date number */}
                <div className="flex justify-end mb-1">
                  <span
                    className="text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full"
                    style={today
                      ? { background: '#00B09B', color: 'white', fontFamily: 'Nunito' }
                      : { color: col >= 5 ? '#B0C4C2' : '#8FA8A5', fontFamily: 'Nunito' }}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Student chips */}
                <div className="flex flex-col gap-0.5">
                  {dayStudents.slice(0, 3).map(s => {
                    const vs = getVisaStatus(s.visa_end_date)
                    const { bg, text } = urgencyStyle(vs?.type)
                    return (
                      <Link
                        key={s.file_no}
                        to={`/student/${encodeURIComponent(s.file_no)}`}
                        title={`${s.first_name} ${s.family_name} · ${s.file_no}`}
                        className="rounded px-1.5 py-px text-xs truncate leading-snug hover:opacity-75 transition-opacity"
                        style={{ background: bg, color: text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 11 }}
                      >
                        {s.first_name} {s.family_name[0]}.
                      </Link>
                    )
                  })}
                  {dayStudents.length > 3 && (
                    <span className="text-xs text-text-muted px-1" style={{ fontSize: 10 }}>
                      +{dayStudents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Trailing empty cells */}
          {Array.from({ length: trailingEmpties }).map((_, i) => (
            <div
              key={`post-${i}`}
              className={`border-b border-border bg-surface-alt opacity-50 ${i < trailingEmpties - 1 ? 'border-r' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
