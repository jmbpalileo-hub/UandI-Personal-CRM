import { useState } from 'react'
import { PlusCircle, GraduationCap } from 'lucide-react'
import { EnrolmentStatusBadge } from './StatusBadge'
import { formatDate, formatCurrency, nowDate } from '../lib/utils'

const COURSE_TYPES = ['University', 'TAFE', 'Business College', 'English', 'Other']
const STATUSES = ['Pending', 'Active', 'Completed']

const EMPTY_FORM = {
  provider: '', course_type: 'English', start_date: '', end_date: '', duration: '',
  tuition_fee: '', application_fee: '', material_fee: '', oshc: '', status: 'Active',
}

export default function EnrolmentPanel({ enrolments, fileNo, onAdd }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.provider) return
    setSaving(true)
    try {
      await onAdd({ ...form, file_no: fileNo })
      setForm(EMPTY_FORM)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#1A2E2B' }}>Enrolments</h3>
        <button className="btn-ghost flex items-center gap-1.5 text-xs" onClick={() => setShowForm(s => !s)}>
          <PlusCircle size={14} />Add Enrolment
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className="label">Provider / School</label>
              <input className="input-field" placeholder="Institution name" value={form.provider} onChange={e => set('provider', e.target.value)} />
            </div>
            <div>
              <label className="label">Course Type</label>
              <select className="input-field" value={form.course_type} onChange={e => set('course_type', e.target.value)}>
                {COURSE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input-field" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input-field" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Duration</label>
              <input className="input-field" placeholder="e.g. 24 weeks" value={form.duration} onChange={e => set('duration', e.target.value)} />
            </div>
            <div>
              <label className="label">Tuition Fee (AUD)</label>
              <input type="number" className="input-field" placeholder="0.00" value={form.tuition_fee} onChange={e => set('tuition_fee', e.target.value)} step="0.01" />
            </div>
            <div>
              <label className="label">Application Fee</label>
              <input type="number" className="input-field" placeholder="0.00" value={form.application_fee} onChange={e => set('application_fee', e.target.value)} step="0.01" />
            </div>
            <div>
              <label className="label">Material Fee</label>
              <input type="number" className="input-field" placeholder="0.00" value={form.material_fee} onChange={e => set('material_fee', e.target.value)} step="0.01" />
            </div>
            <div>
              <label className="label">OSHC</label>
              <input type="number" className="input-field" placeholder="0.00" value={form.oshc} onChange={e => set('oshc', e.target.value)} step="0.01" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs py-2 px-4" disabled={saving}>
              {saving ? 'Saving…' : 'Add Enrolment'}
            </button>
            <button type="button" className="btn-secondary text-xs py-2 px-4" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {enrolments.length === 0 && !showForm ? (
        <div className="card py-12 text-center">
          <GraduationCap size={32} className="mx-auto mb-2 text-text-muted" strokeWidth={1} />
          <p style={{ fontFamily: 'Caveat', fontSize: 18, color: '#8FA8A5' }}>No enrolments yet. Add one above.</p>
        </div>
      ) : (
        enrolments.map((e, i) => (
          <div key={e.enrolment_id || i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#1A2E2B' }}>{e.provider}</h4>
                <span className="text-text-secondary text-sm">{e.course_type}</span>
              </div>
              <EnrolmentStatusBadge status={e.status} />
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-3">
              <div><span className="text-text-muted">Start:</span> <span className="text-text-primary">{formatDate(e.start_date)}</span></div>
              <div><span className="text-text-muted">End:</span> <span className="text-text-primary">{formatDate(e.end_date)}</span></div>
              {e.duration && <div className="col-span-2"><span className="text-text-muted">Duration:</span> <span className="text-text-primary">{e.duration}</span></div>}
            </div>
            <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
              {[
                { label: 'Tuition', val: e.tuition_fee },
                { label: 'Application', val: e.application_fee },
                { label: 'Material', val: e.material_fee },
                { label: 'OSHC', val: e.oshc },
              ].filter(f => f.val).map(f => (
                <div key={f.label} className="flex flex-col">
                  <span className="text-text-muted" style={{ fontSize: 11 }}>{f.label}</span>
                  <span className="font-medium text-text-primary text-sm">{formatCurrency(f.val)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
