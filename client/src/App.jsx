import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import StudentDetail from './pages/StudentDetail'
import Setup from './pages/Setup'
import { ToastProvider } from './components/Toast'
import { api } from './lib/api'

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

  useEffect(() => {
    api.getSetupStatus()
      .then(({ configured, authenticated }) => {
        setNeedsSetup(!configured)
        setAuthenticated(!!authenticated)
        setReady(true)
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
          : <AppShell />
        }
      </BrowserRouter>
    </ToastProvider>
  )
}
