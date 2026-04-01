import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

const ToastContext = createContext(null)
let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
    return id
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ id, message, type, onRemove }) {
  const config = {
    success: {
      icon: <CheckCircle size={15} className="flex-shrink-0" />,
      border: 'border-tea/40',
      iconColor: 'text-tea-dark',
      bg: 'bg-prussian',
      accent: 'border-l-2 border-l-tea-dark',
    },
    error: {
      icon: <AlertTriangle size={15} className="flex-shrink-0" />,
      border: 'border-red-700/50',
      iconColor: 'text-red-400',
      bg: 'bg-prussian',
      accent: 'border-l-2 border-l-red-400',
    },
    info: {
      icon: <Info size={15} className="flex-shrink-0" />,
      border: 'border-teal/40',
      iconColor: 'text-teal',
      bg: 'bg-prussian',
      accent: 'border-l-2 border-l-teal',
    },
  }
  const { icon, border, iconColor, bg, accent } = config[type] || config.info

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 ${bg} border ${border} ${accent} rounded-xl px-4 py-3 max-w-sm animate-toast`}
      style={{ boxShadow: '0 8px 32px rgba(1,15,34,0.8), 0 2px 8px rgba(0,0,0,0.4)' }}
    >
      <span className={iconColor}>{icon}</span>
      <span className="text-sm text-slate-200 flex-1 leading-snug">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="text-charcoal-light hover:text-slate-300 transition-colors ml-1 flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
