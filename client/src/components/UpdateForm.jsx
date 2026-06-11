import { useState } from 'react'
import { PlusCircle, Clock, Calendar } from 'lucide-react'
import { nowDate, nowTime } from '../lib/utils'

export default function UpdateForm({ fileNo, staff, onAdd }) {
  const [date, setDate] = useState(nowDate())
  const [time, setTime] = useState(nowTime())
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const setNow = () => { setDate(nowDate()); setTime(nowTime()) }

  const submit = async (e) => {
    e.preventDefault()
    if (!desc.trim()) return
    setSaving(true)
    try {
      await onAdd({ file_no: fileNo, date, time, staff: staff || '', description: desc.trim() })
      setDesc('')
      setDate(nowDate())
      setTime(nowTime())
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card p-4 mb-4">
      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label className="label flex items-center gap-1">
            <Calendar size={12} /> Date
          </label>
          <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="label flex items-center gap-1">
            <Clock size={12} /> Time
          </label>
          <input type="time" className="input-field" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div className="flex items-end pb-0.5">
          <button type="button" className="btn-secondary text-xs px-3 py-2" onClick={setNow}>
            Now
          </button>
        </div>
      </div>
      <div className="mb-3">
        <label className="label">Update Note</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="Enter consultation note…"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e) }}
        />
        <p className="text-text-muted text-xs mt-1">Ctrl+Enter to submit</p>
      </div>
      <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving || !desc.trim()}>
        <PlusCircle size={15} strokeWidth={2} />
        {saving ? 'Adding…' : 'Add Entry'}
      </button>
    </form>
  )
}
