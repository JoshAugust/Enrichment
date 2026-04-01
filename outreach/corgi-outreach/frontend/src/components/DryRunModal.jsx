import { useEffect } from 'react'
import { X, AlertTriangle, Shield } from 'lucide-react'

export function DryRunModal({ onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-prussian-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-prussian border border-amber-700/40 rounded-xl w-full max-w-md animate-modal"
        style={{ boxShadow: '0 24px 64px rgba(1,15,34,0.9), 0 4px 16px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/15">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <h3 className="font-semibold text-amber-400 text-sm">DRY RUN Mode Active</h3>
          </div>
          <button onClick={onClose} className="text-charcoal-light hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">DRY RUN</span> is a safety mode that lets
            you run the full outreach tool without sending any real communications.
          </p>

          <div className="space-y-2">
            {[
              { icon: '📧', label: 'Email generation',        status: 'Simulated — no emails sent' },
              { icon: '📞', label: 'Call plans & scripts',    status: 'Fully operational' },
              { icon: '🔍', label: 'Research triggers',       status: 'Simulated — no external calls' },
              { icon: '🤖', label: 'AI generation',           status: 'Fully operational' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 bg-prussian-700/40 rounded-xl px-3 py-2.5 border border-charcoal/30">
                <span className="text-base">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-200">{item.label}</p>
                  <p className="text-xs text-charcoal-light">{item.status}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2.5 bg-amber-950/20 border border-amber-800/30 rounded-xl p-3">
            <Shield size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              To go live, a developer must disable{' '}
              <code className="font-mono bg-amber-950/40 px-1 rounded text-amber-300">DRY_RUN=true</code>{' '}
              in the backend config. This is an intentional safety gate.
            </p>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="btn-secondary w-full">Got it</button>
        </div>
      </div>
    </div>
  )
}
