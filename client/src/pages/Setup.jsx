import { useState } from 'react'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { api } from '../lib/api'

const STEPS = ['Connect Google', 'Link Spreadsheet', 'Done']

export default function Setup({ onComplete }) {
  const [step, setStep] = useState(0)
  const [sheetId, setSheetId] = useState('')
  const [creating, setCreating] = useState(false)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState('')

  const handleOAuth = () => {
    window.location.href = '/auth/login'
  }

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await api.createSpreadsheet()
      setSheetId(res.spreadsheetId)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleLink = async () => {
    if (!sheetId.trim()) return
    setLinking(true)
    setError('')
    try {
      await api.linkSpreadsheet(sheetId.trim())
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center rounded-xl text-white mb-3"
            style={{ width: 56, height: 56, background: '#00B09B' }}
          >
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18 }}>U&I</span>
          </div>
          <h1 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 26, color: '#1A2E2B' }}>
            Student CRM Setup
          </h1>
          <p className="text-text-secondary text-sm mt-1">Get started in 3 simple steps</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                style={{
                  background: i < step ? '#00B09B' : i === step ? '#E6F7F5' : '#F1F5F9',
                  color: i < step ? 'white' : i === step ? '#00B09B' : '#94A3B8',
                  border: i === step ? '2px solid #00B09B' : '2px solid transparent',
                }}
              >
                {i < step ? <CheckCircle size={14} strokeWidth={2.5} color="white" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-0.5" style={{ background: i < step ? '#00B09B' : '#D1E8E5' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#1A2E2B' }}>
                Connect Google Account
              </h2>
              <p className="text-text-secondary text-sm">
                The CRM needs access to Google Sheets, Drive, and Gmail to store and read student data.
              </p>
              <ul className="text-sm text-text-secondary flex flex-col gap-1.5">
                {['Google Sheets (read & write)', 'Google Drive (read files)', 'Gmail (read email threads)'].map(s => (
                  <li key={s} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-brand-primary" strokeWidth={2} />
                    {s}
                  </li>
                ))}
              </ul>
              <button className="btn-primary flex items-center justify-center gap-2 mt-2" onClick={handleOAuth}>
                <ExternalLink size={14} />Sign in with Google
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#1A2E2B' }}>
                Link Spreadsheet
              </h2>
              <p className="text-text-secondary text-sm">
                Paste an existing Spreadsheet ID, or let the app create one automatically.
              </p>
              <div>
                <label className="label">Spreadsheet ID</label>
                <input
                  className="input-field"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  value={sheetId}
                  onChange={e => setSheetId(e.target.value)}
                />
                <p className="text-text-muted text-xs mt-1">
                  Found in the spreadsheet URL: …/d/<strong>ID</strong>/edit
                </p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button className="btn-primary flex-1" onClick={handleLink} disabled={linking || !sheetId.trim()}>
                  {linking ? 'Linking…' : 'Link Spreadsheet'}
                </button>
                <button className="btn-secondary flex-1" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating…' : 'Create New'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: '#E6F7F5' }}
              >
                <CheckCircle size={28} className="text-brand-primary" strokeWidth={2} />
              </div>
              <h2 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#1A2E2B' }}>
                All set!
              </h2>
              <p className="text-text-secondary text-sm text-center">
                Your CRM is connected and ready to use.
              </p>
              <button className="btn-primary w-full mt-2" onClick={onComplete}>
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
