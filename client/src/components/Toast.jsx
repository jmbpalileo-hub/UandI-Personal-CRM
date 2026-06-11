import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

function Toast({ msg, type, onClose }) {
  const icons = {
    success: <CheckCircle size={16} className="text-brand-primary" strokeWidth={1.5} />,
    error: <XCircle size={16} className="text-red-500" strokeWidth={1.5} />,
    warning: <AlertTriangle size={16} className="text-yellow-500" strokeWidth={1.5} />,
  }
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-card bg-white shadow-card-hover border border-border text-sm text-text-primary"
      style={{ minWidth: 260, maxWidth: 380, animation: 'fadeOut 4s ease-out forwards' }}
    >
      {icons[type]}
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="text-text-muted hover:text-text-secondary ml-1">
        <X size={14} />
      </button>
    </div>
  )
}
