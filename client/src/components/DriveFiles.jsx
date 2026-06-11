import { FolderOpen, FileText, Image, File, ExternalLink } from 'lucide-react'
import { useDriveFiles } from '../hooks/useGoogleData'
import { formatDate, getMimeIcon } from '../lib/utils'

const ICON_MAP = {
  FileText: FileText,
  Image: Image,
  File: File,
  FolderOpen: FolderOpen,
  Sheet: FileText,
}

function MimeIcon({ mimeType }) {
  const name = getMimeIcon(mimeType)
  const Icon = ICON_MAP[name] || File
  return <Icon size={16} strokeWidth={1.5} className="text-brand-primary flex-shrink-0" />
}

export default function DriveFiles({ fileNo, driveFolderId }) {
  const { files, loading, error } = useDriveFiles(fileNo)

  if (!driveFolderId) {
    return (
      <div className="card p-6 text-center h-full flex flex-col items-center justify-center gap-2">
        <FolderOpen size={28} className="text-text-muted" strokeWidth={1} />
        <p style={{ fontFamily: 'Caveat', fontSize: 17, color: '#8FA8A5' }}>
          Link a Drive folder to see files here.
        </p>
        <p className="text-text-muted text-xs">Paste a folder ID in student settings.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen size={16} strokeWidth={1.5} className="text-brand-primary" />
          <h4 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#1A2E2B' }}>Drive Files</h4>
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="py-3 border-b border-border animate-pulse flex gap-3">
            <div className="w-4 h-4 bg-border rounded" />
            <div className="flex-1">
              <div className="h-3 bg-border rounded w-2/3 mb-2" />
              <div className="h-2.5 bg-border rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-500 text-sm">
          {error.includes('not found') || error.includes('invalid')
            ? 'Folder not found — check the Drive ID in student settings.'
            : `Failed to load files: ${error}`}
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ background: '#F0FBF9' }}>
        <FolderOpen size={15} strokeWidth={1.5} className="text-brand-primary" />
        <h4 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#1A2E2B' }}>Drive Files</h4>
        <span className="ml-auto text-text-muted" style={{ fontSize: 11 }}>{files.length} files</span>
      </div>

      {files.length === 0 ? (
        <div className="py-10 text-center px-4">
          <p style={{ fontFamily: 'Caveat', fontSize: 17, color: '#8FA8A5' }}>No files found in this folder.</p>
        </div>
      ) : (
        <div>
          {files.map(f => (
            <a
              key={f.id}
              href={f.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-brand-light transition-colors group"
            >
              <MimeIcon mimeType={f.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm truncate font-medium">{f.name}</p>
                <p className="text-text-muted text-xs">{formatDate(f.modifiedTime?.split('T')[0])}</p>
              </div>
              <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
