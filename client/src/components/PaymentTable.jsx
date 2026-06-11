import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { formatDate, formatCurrency, nowDate } from '../lib/utils'

const PAYMENT_TYPES = ['Tuition', 'Application', 'Material', 'OSHC', 'Visa', 'Medical', 'Other']

export default function PaymentTable({ payments, fileNo, onAdd }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ file_no: fileNo, date: nowDate(), provider: '', type: 'Tuition', amount: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totals = PAYMENT_TYPES.reduce((acc, t) => {
    acc[t] = payments.filter(p => p.type === t).reduce((s, p) => s + Number(p.amount || 0), 0)
    return acc
  }, {})
  const grand = payments.reduce((s, p) => s + Number(p.amount || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.provider) return
    setSaving(true)
    try {
      await onAdd({ ...form, file_no: fileNo })
      setForm({ file_no: fileNo, date: nowDate(), provider: '', type: 'Tuition', amount: '', notes: '' })
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#1A2E2B' }}>Payments</h3>
        <button className="btn-ghost flex items-center gap-1.5 text-xs" onClick={() => setAdding(a => !a)}>
          <PlusCircle size={14} />Add Payment
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} className="p-4 border-b border-border bg-surface-alt">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
                {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Provider</label>
              <input className="input-field" placeholder="School name" value={form.provider} onChange={e => set('provider', e.target.value)} />
            </div>
            <div>
              <label className="label">Amount (AUD)</label>
              <input type="number" className="input-field" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} step="0.01" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes (optional)</label>
              <input className="input-field" placeholder="Optional label" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs py-2 px-4" disabled={saving}>
              {saving ? 'Saving…' : 'Add Payment'}
            </button>
            <button type="button" className="btn-secondary text-xs py-2 px-4" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}

      {payments.length === 0 ? (
        <div className="py-10 text-center">
          <p style={{ fontFamily: 'Caveat', fontSize: 18, color: '#8FA8A5' }}>No payments recorded yet.</p>
        </div>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-3 py-3 text-left font-semibold">Provider</th>
                <th className="px-3 py-3 text-left font-semibold">Type</th>
                <th className="px-3 py-3 text-right font-semibold">Amount</th>
                <th className="px-5 py-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.payment_id || i} className={i % 2 === 1 ? 'bg-surface-alt' : 'bg-white'} style={{ transition: 'background 0.1s' }}>
                  <td className="px-5 py-3 text-text-secondary">{formatDate(p.date)}</td>
                  <td className="px-3 py-3 text-text-primary">{p.provider}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#E6F7F5', color: '#008C7E' }}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-text-primary">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3 text-text-muted text-xs">{p.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-5 py-3 bg-surface-alt">
            <div className="flex flex-wrap gap-4 text-xs text-text-secondary mb-2">
              {PAYMENT_TYPES.filter(t => totals[t] > 0).map(t => (
                <span key={t}><span className="font-medium text-text-primary">{t}:</span> {formatCurrency(totals[t])}</span>
              ))}
            </div>
            <div className="flex justify-end">
              <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#1A2E2B' }}>
                Total: {formatCurrency(grand)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
