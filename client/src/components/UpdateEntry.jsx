import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function UpdateEntry({ update, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(update.description)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await onEdit(update.update_id, { description: desc })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex gap-4 py-3 border-b border-border last:border-0 group hover:bg-surface-alt px-3 -mx-3 rounded-lg transition-colors">
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-28">
        <span className="text-text-muted" style={{ fontSize: 12 }}>{formatDate(update.date)}</span>
        <span className="text-text-muted" style={{ fontSize: 11 }}>{update.time}</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs mt-1"
          style={{ background: '#E6F7F5', color: '#008C7E', fontSize: 11 }}
        >
          {update.staff || 'Staff'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="input-field resize-none text-sm"
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn-primary py-1 px-3 text-xs" onClick={save}>
                <Check size={13} className="inline mr-1" />Save
              </button>
              <button className="btn-secondary py-1 px-3 text-xs" onClick={() => { setEditing(false); setDesc(update.description) }}>
                <X size={13} className="inline mr-1" />Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p className="text-text-primary text-sm flex-1 whitespace-pre-wrap">{update.description}</p>
            <button
              className="opacity-0 group-hover:opacity-100 btn-ghost p-1 rounded-md transition-opacity"
              onClick={() => setEditing(true)}
            >
              <Edit2 size={13} />
            </button>
            {saved && (
              <span className="auto-save-indicator text-xs" style={{ color: '#00B09B' }}>Saved ✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
