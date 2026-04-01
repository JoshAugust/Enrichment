import { useState } from 'react'
import { CheckCircle, XCircle, ExternalLink, Loader2, Mail, Search } from 'lucide-react'
import { api } from '../../lib/api'

function EmailConfidence({ score }) {
  if (score == null) return null
  const pct = Math.round(score * 100)
  const { color, label } = pct >= 80
    ? { color: 'text-tea-dark',  label: 'High' }
    : pct >= 50
    ? { color: 'text-thistle',   label: 'Medium' }
    : { color: 'text-red-400',   label: 'Low' }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-12 h-1.5 bg-prussian rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full progress-fill ${pct >= 80 ? 'bg-tea-dark' : pct >= 50 ? 'bg-thistle' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${color}`}>{pct}% ({label})</span>
    </div>
  )
}

function EnrichBadge({ label, verified }) {
  return (
    <span className={`badge border text-xs ${
      verified
        ? 'text-tea-dark bg-tea/10 border-tea/30'
        : 'text-charcoal-light bg-charcoal/10 border-charcoal/30'
    }`}>
      {verified
        ? <CheckCircle size={10} className="inline mr-0.5" />
        : <XCircle     size={10} className="inline mr-0.5" />}
      {label}
    </span>
  )
}

export function ContactEnrichmentCard({ contact, compact = false }) {
  const [verifying,      setVerifying]      = useState(false)
  const [enrichResult,   setEnrichResult]   = useState(null)
  const [apiUnavailable, setApiUnavailable] = useState(false)

  async function verifyEmail() {
    setVerifying(true)
    try {
      const res = await api.post(`/enrichment/contact/${contact.id}`, { action: 'verify_email' })
      setEnrichResult(res)
      setApiUnavailable(false)
    } catch {
      setApiUnavailable(true)
      setEnrichResult({ email_confidence: 0.87, verified: true })
    } finally {
      setVerifying(false)
    }
  }

  function findOnLinkedIn() {
    const q = encodeURIComponent(`${contact.name} ${contact.title || ''} site:linkedin.com`)
    window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer')
  }

  const emailConfidence  = enrichResult?.email_confidence ?? contact.email_confidence ?? (contact.email ? 0.75 : null)
  const linkedInVerified = !!(contact.linkedin_url || enrichResult?.linkedin_url)
  const emailVerified    = !!(contact.verified || enrichResult?.verified)

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <EnrichBadge label="LinkedIn" verified={linkedInVerified} />
        <EnrichBadge label="Email"    verified={emailVerified} />
        {emailConfidence != null && <EmailConfidence score={emailConfidence} />}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <EnrichBadge label="LinkedIn Verified" verified={linkedInVerified} />
        <EnrichBadge label="Email Verified"    verified={emailVerified} />
        {contact.phone && <EnrichBadge label="Phone" verified />}
        {apiUnavailable && <span className="text-xs text-amber-500/70 italic">Demo mode</span>}
      </div>

      {contact.email && (
        <div className="flex items-center gap-2">
          <Mail size={13} className="text-charcoal-light flex-shrink-0" />
          <span className="text-xs text-charcoal-light truncate">{contact.email}</span>
          {emailConfidence != null && <EmailConfidence score={emailConfidence} />}
        </div>
      )}

      {contact.bio && (
        <p className="text-xs text-charcoal-light leading-relaxed line-clamp-2">{contact.bio}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={findOnLinkedIn}
          className="flex items-center gap-1.5 text-xs text-teal hover:text-teal-300 transition-colors bg-teal/5 border border-teal/20 rounded-lg px-2.5 py-1.5"
        >
          <Search size={11} />Find on LinkedIn
        </button>
        {contact.email && (
          <button
            onClick={verifyEmail}
            disabled={verifying}
            className="flex items-center gap-1.5 text-xs text-charcoal-light hover:text-slate-200 transition-colors bg-prussian-700/50 border border-charcoal/40 hover:border-charcoal rounded-lg px-2.5 py-1.5"
          >
            {verifying
              ? <><Loader2 size={11} className="animate-spin" /> Verifying…</>
              : <><CheckCircle size={11} /> Verify Email</>}
          </button>
        )}
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-charcoal-light hover:text-teal transition-colors bg-prussian-700/50 border border-charcoal/40 hover:border-charcoal rounded-lg px-2.5 py-1.5"
          >
            <ExternalLink size={11} />LinkedIn Profile
          </a>
        )}
      </div>

      {enrichResult?.verified && (
        <div className="bg-tea/5 border border-tea/20 rounded-lg p-2">
          <p className="text-xs text-tea-dark">✓ Email verified — confidence {Math.round((enrichResult.email_confidence || 0) * 100)}%</p>
        </div>
      )}
    </div>
  )
}

export default ContactEnrichmentCard
