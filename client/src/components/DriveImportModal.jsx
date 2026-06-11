import { useState, useEffect } from 'react'
import { X, FolderOpen, ExternalLink, CheckSquare, Square, AlertTriangle, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'

export default function DriveImportModal({ onClose, onImported }) {
  const [phase, setPhase] = useState('scanning') // scanning | preview | importing | done | error
  const [scanResult, setScanResult] = useState(null)
  const [selected, setSelected] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { scan() }, [])

  const scan = async () => {
    setPhase('scanning')
    setError('')
    try {
      const data = await api.scanDriveStudents()
      setScanResult(data)
      if (data.found && data.students?.length) {
        // Pre-select new students + existing students whose Drive isn't linked yet
        const sel = {}
        data.students.forEach(s => {
          if (!s.drive_already_linked) sel[s.drive_folder_id] = true
        })
        setSelected(sel)
        setPhase('preview')
      } else {
        setPhase('preview')
      }
    } catch (e) {
      setError(e.message)
      setPhase('error')
    }
  }

  const toggleAll = () => {
    const importable = scanResult.students.filter(s => !s.drive_already_linked)
    const allSelected = importable.every(s => selected[s.drive_folder_id])
    const next = { ...selected }
    importable.forEach(s => { next[s.drive_folder_id] = !allSelected })
    setSelected(next)
  }

  const toggleOne = (id) => setSelected(p => ({ ...p, [id]: !p[id] }))

  const confirmImport = async () => {
    const toImport = scanResult.students.filter(s => selected[s.drive_folder_id])
    if (!toImport.length) return
    setPhase('importing')
    try {
      const res = await api.confirmDriveImport(toImport)
      setResult(res)
      setPhase('done')
      onImported?.()
    } catch (e) {
      setError(e.message)
      setPhase('error')
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-modal shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} strokeWidth={1.5} className="text-brand-primary" />
            <h2 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#1A2E2B' }}>
              Import from Drive
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {phase === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-text-secondary text-sm">Searching for "Students" folder in Drive…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <AlertTriangle size={32} className="text-red-400" strokeWidth={1.5} />
              <p className="text-red-600 text-sm">{error}</p>
              <button className="btn-secondary flex items-center gap-2" onClick={scan}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {phase === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-text-secondary text-sm">Importing {selectedCount} student{selectedCount !== 1 ? 's' : ''}…</p>
            </div>
          )}

          {phase === 'done' && result && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#E6F7F5' }}>
                <span style={{ fontSize: 28 }}>✓</span>
              </div>
              <h3 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#1A2E2B' }}>Import complete</h3>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 24, color: '#00B09B' }}>{result.imported}</p>
                  <p className="text-text-secondary">New records</p>
                </div>
                {result.linked > 0 && (
                  <div className="text-center">
                    <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 24, color: '#00B09B' }}>{result.linked}</p>
                    <p className="text-text-secondary">Drive linked</p>
                  </div>
                )}
                <div className="text-center">
                  <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 24, color: '#94A3B8' }}>{result.skipped}</p>
                  <p className="text-text-secondary">Skipped</p>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <p className="text-red-500 text-xs">{result.errors.length} record(s) had errors.</p>
              )}
              <p className="text-text-muted text-sm">
                New students have been added with auto-assigned file numbers and Drive folders linked.<br />
                Open each student to fill in remaining details.
              </p>
            </div>
          )}

          {phase === 'preview' && scanResult && (
            <>
              {/* Folder info */}
              {scanResult.found ? (
                <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: '#E6F7F5' }}>
                  <FolderOpen size={16} className="text-brand-primary flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">Found: <strong>{scanResult.folderName}</strong></p>
                    <p className="text-xs text-text-muted">
                      {scanResult.students?.length || 0} student folder{scanResult.students?.length !== 1 ? 's' : ''} found
                      {scanResult.categoryFolders?.length > 0 && ` across ${scanResult.categoryFolders.length} categories`}
                    </p>
                  </div>
                  {scanResult.folderUrl && (
                    <a href={scanResult.folderUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-lg mb-4" style={{ background: '#FEF3C7' }}>
                  <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">No "Students" folder found</p>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      Make sure you have a folder named exactly <strong>"Students"</strong> in your Google Drive (not inside a subfolder).
                    </p>
                  </div>
                </div>
              )}

              {/* Student list */}
              {scanResult.students?.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-text-primary">
                      Select students to import <span className="text-text-muted font-normal">({selectedCount} selected)</span>
                    </p>
                    <button className="btn-ghost text-xs" onClick={toggleAll}>
                      {scanResult.students.filter(s => !s.drive_already_linked).every(s => selected[s.drive_folder_id])
                        ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-header">
                          <th className="px-4 py-2.5 text-left w-8"></th>
                          <th className="px-3 py-2.5 text-left font-semibold">File No.</th>
                          <th className="px-3 py-2.5 text-left font-semibold">Name (from folder)</th>
                          <th className="px-3 py-2.5 text-left font-semibold">Category</th>
                          <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanResult.students.map((s, i) => {
                          const isSelectable = s.file_no && !s.already_exists
                          const isSelected = !!selected[s.drive_folder_id]
                          return (
                            <tr
                              key={s.drive_folder_id}
                              className={`border-t border-border cursor-pointer transition-colors ${
                                !s.drive_already_linked ? 'hover:bg-brand-light' : 'opacity-40 cursor-default'
                              } ${isSelected ? 'bg-brand-xlight' : i % 2 === 1 ? 'bg-surface-alt' : 'bg-white'}`}
                              onClick={() => !s.drive_already_linked && toggleOne(s.drive_folder_id)}
                            >
                              <td className="px-4 py-3">
                                {!s.drive_already_linked
                                  ? isSelected
                                    ? <CheckSquare size={16} className="text-brand-primary" strokeWidth={1.5} />
                                    : <Square size={16} className="text-text-muted" strokeWidth={1.5} />
                                  : null}
                              </td>
                              <td className="px-3 py-3 font-medium text-text-primary">
                                <div className="flex items-center gap-1.5">
                                  {s.file_no || <span className="text-text-muted italic text-xs">No file no.</span>}
                                  {s.folder_url && (
                                    <a href={s.folder_url} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="text-text-muted hover:text-brand-primary">
                                      <ExternalLink size={11} strokeWidth={1.5} />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-text-secondary">
                                {[s.first_name, s.family_name].filter(Boolean).join(' ') || '—'}
                              </td>
                              <td className="px-3 py-3 text-text-muted text-xs max-w-[140px] truncate">
                                {s.category || <span className="italic">—</span>}
                              </td>
                              <td className="px-3 py-3">
                                {s.already_exists && s.drive_already_linked
                                  ? <span className="badge-hold text-xs">Already linked</span>
                                  : s.already_exists
                                  ? <span className="badge-warning text-xs">Link Drive</span>
                                  : s.auto_assigned
                                  ? <span className="badge-active text-xs">New · auto ID</span>
                                  : <span className="badge-active text-xs">New</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {scanResult.students.some(s => !s.file_no) && (
                    <p className="text-text-muted text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle size={11} strokeWidth={2} className="text-yellow-500" />
                      Folders without a file number (e.g. U25-001) in their name will be skipped.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {phase === 'preview' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <div className="flex items-center gap-3">
              <span className="text-text-muted text-sm">{selectedCount} student{selectedCount !== 1 ? 's' : ''} selected</span>
              <button
                className="btn-primary"
                onClick={confirmImport}
                disabled={selectedCount === 0}
              >
                Import {selectedCount > 0 ? selectedCount : ''} Student{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex justify-end px-6 py-4 border-t border-border">
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
