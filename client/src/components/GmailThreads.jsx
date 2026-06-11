import { Mail, ExternalLink } from 'lucide-react'
import { useGmailThreads } from '../hooks/useGoogleData'

export default function GmailThreads({ fileNo, gmailQuery }) {
  const { threads, loading, error } = useGmailThreads(fileNo)

  if (!gmailQuery) {
    return (
      <div className="card p-6 text-center h-full flex flex-col items-center justify-center gap-2">
        <Mail size={28} className="text-text-muted" strokeWidth={1} />
        <p style={{ fontFamily: 'Caveat', fontSize: 17, color: '#8FA8A5' }}>
          No emails matched this search query.
        </p>
        <p className="text-text-muted text-xs">Update the search query in student settings.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} strokeWidth={1.5} className="text-brand-primary" />
          <h4 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#1A2E2B' }}>Email Threads</h4>
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="py-3 border-b border-border animate-pulse">
            <div className="h-3 bg-border rounded w-3/4 mb-2" />
            <div className="h-2.5 bg-border rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-500 text-sm">Failed to load emails: {error}</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ background: '#F0FBF9' }}>
        <Mail size={15} strokeWidth={1.5} className="text-brand-primary" />
        <h4 style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#1A2E2B' }}>
          Email Threads
        </h4>
        <span className="ml-auto text-text-muted" style={{ fontSize: 11 }}>{threads.length} threads</span>
      </div>

      {threads.length === 0 ? (
        <div className="py-10 text-center px-4">
          <p style={{ fontFamily: 'Caveat', fontSize: 17, color: '#8FA8A5' }}>No emails found for this query.</p>
          <p className="text-text-muted text-xs mt-1 break-all">{gmailQuery}</p>
        </div>
      ) : (
        <div>
          {threads.map(t => (
            <a
              key={t.id}
              href={`https://mail.google.com/mail/#all/${t.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-brand-light transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-text-primary text-sm truncate">{t.subject || '(no subject)'}</span>
                  <ExternalLink size={11} className="text-text-muted opacity-0 group-hover:opacity-100 flex-shrink-0" />
                </div>
                <p className="text-text-secondary text-xs truncate mb-0.5">{t.from}</p>
                <p className="text-text-muted text-xs truncate">{t.snippet}</p>
              </div>
              <span className="text-text-muted text-xs flex-shrink-0">{t.date}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
