import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import StudentDetail from './pages/StudentDetail'
import Setup from './pages/Setup'
import { ToastProvider } from './components/Toast'
import { api } from './lib/api'
import { Copy, X, AlertTriangle } from 'lucide-react'

function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Navigate to="/" replace />} />
          <Route path="/student/:file_no" element={<StudentDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="flex-1 px-8 py-6">
      <h1 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 24, color: '#1A2E2B' }}>Settings</h1>
      <p className="text-text-secondary text-sm mt-1">Configuration and account settings.</p>
      <div className="card p-5 mt-6 max-w-md">
        <p className="text-text-secondary text-sm">
          To reconnect your Google account or change the spreadsheet, restart the server and visit{' '}
          <code className="bg-surface-alt px-1 py-0.5 rounded text-brand-primary text-xs">/auth/login</code>
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [refreshTokenBanner, setRefreshTokenBanner] = useState(null) // { token, copied }

  useEffect(() => {
    api.getSetupStatus()
      .then(({ configured, authenticated, needsRefreshTokenSave }) => {
        setNeedsSetup(!configured)
        setAuthenticated(!!authenticated)
        setReady(true)
        if (needsRefreshTokenSave) {
          api.getRefreshToken()
            .then(({ refresh_token }) => setRefreshTokenBanner({ token: refresh_token, copied: false }))
            .catch(() => {})
        }
      })
      .catch(() => {
        setNeedsSetup(false)
        setReady(true)
      })
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl text-white"
            style={{ width: 48, height: 48, background: '#00B09B' }}
          >
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 14 }}>U&I</span>
          </div>
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        {needsSetup
          ? <Setup authenticated={authenticated} onComplete={() => setNeedsSetup(false)} />
          : <>
              {refreshTokenBanner && (
                <RefreshTokenBanner
                  token={refreshTokenBanner.token}
                  copied={refreshTokenBanner.copied}
                  onCopy={() => {
                    navigator.clipboard.writeText(refreshTokenBanner.token).catch(() => {})
                    setRefreshTokenBanner(b => ({ ...b, copied: true }))
                  }}
                  onDismiss={() => setRefreshTokenBanner(null)}
                />
              )}
              <AppShell />
            </>
        }
      </BrowserRouter>
    </ToastProvider>
  )
}

function RefreshTokenBanner({ token, copied, onCopy, onDismiss }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-start gap-3"
      style={{ background: '#1A2E2B', color: 'white' }}
    >
      <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-yellow-400" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13 }}>
          Save your session permanently — copy this refresh token to Vercel
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8FA8A5' }}>
          Go to <strong style={{ color: 'white' }}>Vercel → Project → Settings → Environment Variables</strong> and add{' '}
          <code style={{ background: '#2D4A44', padding: '1px 4px', borderRadius: 3, color: '#7ECFC6' }}>GOOGLE_REFRESH_TOKEN</code>{' '}
          with the value below, then redeploy. Without this, you'll need to sign in again every few hours.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <code
            className="text-xs rounded px-2 py-1 flex-1 truncate select-all"
            style={{ background: '#0D1F1C', color: '#7ECFC6', maxWidth: 480 }}
          >
            {token}
          </code>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors flex-shrink-0"
            style={{ background: copied ? '#00B09B' : '#2D4A44', color: copied ? 'white' : '#7ECFC6' }}
          >
            <Copy size={12} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  )
}
