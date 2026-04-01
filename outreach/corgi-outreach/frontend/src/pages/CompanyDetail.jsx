import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Globe, Users, FileText, Phone,
  Mail, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
  CheckCircle, XCircle, Loader2, Play, LayoutDashboard, Microscope
} from 'lucide-react'
import { api } from '../lib/api'
import { priorityColor, typeBadge, scoreColor } from '../lib/utils'
import { useToast } from '../components/Toast'
import EnrichmentTab from '../components/enrichment/EnrichmentTab'

// ─── Sub-components ────────────────────────────────────────────────────────────

function ContactCard({ contact }) {
  return (
    <div className="bg-prussian-700/50 rounded-xl p-4 border border-charcoal/30 hover:border-teal/30 transition-all card-lift">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-slate-100">{contact.name}</p>
          <p className="text-charcoal-light text-sm">{contact.title}</p>
        </div>
        <span className={`badge border text-xs ${
          contact.verified
            ? 'text-tea-dark bg-tea/10 border-tea/30'
            : 'text-charcoal-light bg-charcoal/10 border-charcoal/30'
        }`}>
          {contact.verified
            ? <><CheckCircle size={10} className="inline mr-1" />Verified</>
            : <><XCircle    size={10} className="inline mr-1" />Unverified</>}
        </span>
      </div>
      <div className="mt-2 space-y-1">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-teal hover:text-teal-300 text-sm transition-colors">
            <Mail size={13} />{contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-charcoal-light text-sm">
            <Phone size={13} />{contact.phone}
          </a>
        )}
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-charcoal-light hover:text-teal text-sm transition-colors">
            <ExternalLink size={13} />LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

function ScriptCard({ script }) {
  const [expanded, setExpanded] = useState(false)
  let parsed = null
  try { parsed = JSON.parse(script.customized_script) } catch {}

  return (
    <div className="bg-prussian-700/40 rounded-xl border border-charcoal/30 overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-prussian-700/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal bg-teal/10 border border-teal/30 rounded px-2 py-0.5">
            Version {script.script_version}
          </span>
          <span className="text-sm font-medium text-slate-200">{parsed?.name || `Script ${script.script_version}`}</span>
          <span className="text-xs text-charcoal-light">({script.buyer_type})</span>
        </div>
        {expanded
          ? <ChevronUp   size={14} className="text-charcoal-light" />
          : <ChevronDown size={14} className="text-charcoal-light" />}
      </button>
      {expanded && parsed && (
        <div className="px-4 pb-4 space-y-3 border-t border-charcoal/20 tab-content">
          {parsed.opening && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-1 mt-3">Opening</p>
              <p className="text-sm text-slate-300 italic bg-prussian/60 rounded-lg p-3 border border-charcoal/20">"{parsed.opening}"</p>
            </div>
          )}
          {parsed.lines?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-1">Key Lines</p>
              <ul className="space-y-1">
                {parsed.lines.map((l, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-charcoal-light/60 flex-shrink-0">{i+1}.</span><span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',     icon: LayoutDashboard },
  { id: 'contacts',   label: 'Contacts',     icon: Users },
  { id: 'research',   label: 'Research',     icon: FileText },
  { id: 'calls',      label: 'Call Scripts', icon: Phone },
  { id: 'emails',     label: 'Email Drafts', icon: Mail },
  { id: 'enrichment', label: 'Enrichment',   icon: Microscope },
]

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompanyDetail() {
  const { id }       = useParams()
  const location     = useLocation()
  const toast        = useToast()

  const [company,          setCompany]          = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const [activeTab,        setActiveTab]        = useState('overview')
  const [researching,      setResearching]      = useState(false)
  const [generatingPlan,   setGeneratingPlan]   = useState(false)
  const [callPlan,         setCallPlan]         = useState(null)
  const [dryRunning,       setDryRunning]       = useState(false)
  const [dryRunResult,     setDryRunResult]     = useState(null)
  const [emailDrafts,      setEmailDrafts]      = useState([])
  const [generatingDrafts, setGeneratingDrafts] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const [compRes, draftsRes] = await Promise.all([
        api.get(`/companies/${id}`),
        api.get('/email/drafts'),
      ])
      setCompany(compRes.data)
      const allDrafts = draftsRes.data || draftsRes.drafts || []
      setEmailDrafts(allDrafts.filter(d => d.company_id === id || d.companyId === id))
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace('#','')
      if (TABS.find(t => t.id === hash)) setActiveTab(hash)
    }
  }, [location.hash])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') window.history.back() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function triggerResearch() {
    try {
      setResearching(true)
      await api.post(`/companies/${id}/research`, {})
      toast('Research triggered successfully', 'success')
      await load()
    } catch (e) { toast(`Research failed: ${e.message}`, 'error') }
    finally     { setResearching(false) }
  }

  async function generateCallPlan() {
    try {
      setGeneratingPlan(true)
      const res = await api.post(`/voice/call-plan/${id}`, {})
      setCallPlan(res)
      toast('Call plan generated', 'success')
      setActiveTab('calls')
    } catch (e) { toast(`Call plan failed: ${e.message}`, 'error') }
    finally     { setGeneratingPlan(false) }
  }

  async function simulateCall() {
    try {
      setDryRunning(true)
      const res = await api.post(`/voice/dry-run/${id}`, {})
      setDryRunResult(res)
      toast('Dry run simulation complete', 'info')
      setActiveTab('calls')
    } catch (e) { toast(`Simulation failed: ${e.message}`, 'error') }
    finally     { setDryRunning(false) }
  }

  async function generateEmailDrafts() {
    if (!company?.contacts?.length) { toast('No contacts to generate drafts for', 'error'); return }
    const withEmail = company.contacts.filter(c => c.email)
    if (!withEmail.length) { toast('No contacts with email addresses', 'error'); return }
    try {
      setGeneratingDrafts(true)
      await api.post('/email/compose-batch', { contactIds: withEmail.map(c => c.id), templateSlug: 'cold_intro_operator' })
      toast(`Email drafts generated for ${withEmail.length} contact(s)`, 'success')
      await load()
      setActiveTab('emails')
    } catch (e) { toast(`Draft generation failed: ${e.message}`, 'error') }
    finally     { setGeneratingDrafts(false) }
  }

  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl">
        <div className="skeleton h-5 w-40" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-96" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="card h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/companies" className="flex items-center gap-2 text-charcoal-light hover:text-slate-200 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Companies
        </Link>
        <div className="card p-6 border-red-800/50">
          <p className="text-red-400">Failed to load company: {error}</p>
          <button onClick={load} className="btn-secondary mt-3">Retry</button>
        </div>
      </div>
    )
  }

  const c = company

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <Link to="/companies" className="flex items-center gap-2 text-charcoal-light hover:text-teal text-sm transition-colors w-fit group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Companies
      </Link>

      {/* Company header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{c.name}</h1>
              <span className={`badge border font-bold ${priorityColor(c.priority)}`}>Priority {c.priority}</span>
              <span className={`badge border ${typeBadge(c.type)}`}>{c.type}</span>
            </div>
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-teal hover:text-teal-300 text-sm mt-1 transition-colors w-fit">
                <Globe size={13} />{c.website.replace(/^https?:\/\//,'')}<ExternalLink size={11} />
              </a>
            )}
            {c.description && (
              <p className="text-charcoal-light text-sm mt-3 leading-relaxed max-w-2xl">{c.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={`text-4xl font-bold tabular-nums stat-number ${scoreColor(c.qualification_score)}`}>
              {c.qualification_score}
            </div>
            <div className="text-charcoal-light text-xs">qualification score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-charcoal/20">
          {[
            { label: 'GPU Scale',  value: c.estimated_gpu_scale || '—' },
            { label: 'Financing',  value: c.financing_status || '—' },
            { label: 'Segment',    value: c.industry_segment || '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider">{item.label}</p>
              <p className="text-sm text-slate-200 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-2">
        <button onClick={triggerResearch} disabled={researching} className="btn-secondary flex items-center gap-2">
          {researching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Trigger Research
        </button>
        <button onClick={generateEmailDrafts} disabled={generatingDrafts} className="btn-secondary flex items-center gap-2">
          {generatingDrafts ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Generate Email Drafts
        </button>
        <button onClick={generateCallPlan} disabled={generatingPlan} className="btn-primary flex items-center gap-2">
          {generatingPlan ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
          Generate Call Plan
        </button>
        <button onClick={simulateCall} disabled={dryRunning} className="btn-secondary flex items-center gap-2">
          {dryRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Simulate Call
        </button>
      </div>

      {/* Tabbed Content */}
      <div className="card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-charcoal/20 bg-prussian-700/20 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            let count = null
            if (tab.id === 'contacts')   count = c.contacts?.length ?? 0
            if (tab.id === 'research')   count = c.research_notes?.length ?? 0
            if (tab.id === 'calls')      count = c.call_scripts?.length ?? 0
            if (tab.id === 'emails')     count = emailDrafts.length

            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 nav-indicator ${
                  isActive
                    ? 'text-teal border-teal bg-teal/5'
                    : 'text-charcoal-light border-transparent hover:text-thistle hover:bg-prussian-700/30'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {count !== null && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${
                    isActive
                      ? 'bg-teal/20 text-teal'
                      : count > 0 ? 'bg-charcoal/50 text-slate-300' : 'bg-charcoal/20 text-charcoal-light'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab panels */}
        <div className="p-5">

          {/* ── Overview ─────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-4 tab-content">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
                {[
                  { label: 'Contacts',         value: c.contacts?.length ?? 0,    icon: '👥', tab: 'contacts' },
                  { label: 'Research Notes',   value: c.research_notes?.length ?? 0, icon: '🔍', tab: 'research' },
                  { label: 'Call Scripts',     value: c.call_scripts?.length ?? 0, icon: '📞', tab: 'calls' },
                  { label: 'Email Drafts',     value: emailDrafts.length,           icon: '📧', tab: 'emails' },
                  { label: 'Qual. Score',      value: `${c.qualification_score}/100`, icon: '⭐', tab: null },
                  { label: 'Priority',         value: `Priority ${c.priority}`,     icon: '🎯', tab: null },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={item.tab ? () => setActiveTab(item.tab) : undefined}
                    className={`bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30 ${item.tab ? 'cursor-pointer hover:border-teal/30 hover:bg-prussian-700/60 transition-all' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{item.icon}</span>
                      <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                    {item.tab && <p className="text-xs text-charcoal-light/60 mt-1">Click to view →</p>}
                  </div>
                ))}
              </div>

              {c.description && (
                <div className="bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30">
                  <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{c.description}</p>
                </div>
              )}

              <div className="bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30">
                <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-3">Outreach Readiness</p>
                <div className="space-y-2">
                  {[
                    { label: 'Has contacts',      done: (c.contacts?.length ?? 0) > 0 },
                    { label: 'Has research notes', done: (c.research_notes?.length ?? 0) > 0 },
                    { label: 'Has call scripts',  done: (c.call_scripts?.length ?? 0) > 0 },
                    { label: 'Has email drafts',  done: emailDrafts.length > 0 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.done
                        ? <CheckCircle size={14} className="text-tea-dark flex-shrink-0" />
                        : <XCircle    size={14} className="text-charcoal/50 flex-shrink-0" />}
                      <span className={`text-sm ${item.done ? 'text-slate-300' : 'text-charcoal-light'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Contacts ─────────────────────────────────────────── */}
          {activeTab === 'contacts' && (
            <div className="tab-content">
              {!c.contacts?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-charcoal-light">
                  <Users size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No contacts found for this company</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-in">
                  {c.contacts.map(contact => <ContactCard key={contact.id} contact={contact} />)}
                </div>
              )}
            </div>
          )}

          {/* ── Research ─────────────────────────────────────────── */}
          {activeTab === 'research' && (
            <div className="tab-content">
              {!c.research_notes?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-charcoal-light">
                  <FileText size={32} className="mb-2 opacity-30" />
                  <p className="text-sm mb-3">No research notes yet</p>
                  <button onClick={triggerResearch} disabled={researching} className="btn-secondary flex items-center gap-2 text-sm">
                    {researching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Trigger Research
                  </button>
                </div>
              ) : (
                <div className="space-y-3 stagger-in">
                  {c.research_notes.map((note, i) => (
                    <div key={i} className="bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30">
                      <p className="text-sm text-slate-300 leading-relaxed">{note.content || note.notes || JSON.stringify(note)}</p>
                      {note.created_at && <p className="text-xs text-charcoal-light/60 mt-2">{new Date(note.created_at).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Call Scripts ─────────────────────────────────────── */}
          {activeTab === 'calls' && (
            <div className="space-y-4 tab-content">
              {callPlan && !callPlan.error && (
                <div className="card p-4 border-teal/20">
                  <p className="text-xs font-semibold text-teal uppercase tracking-wider mb-2">✓ Call Plan Generated</p>
                  <pre className="text-xs text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap">{JSON.stringify(callPlan, null, 2)}</pre>
                </div>
              )}
              {dryRunResult && !dryRunResult.error && (
                <div className="card p-4 border-amber-800/30">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">✓ Dry Run Simulation</p>
                  <pre className="text-xs text-slate-300 overflow-auto max-h-48 whitespace-pre-wrap">{JSON.stringify(dryRunResult, null, 2)}</pre>
                </div>
              )}
              {!c.call_scripts?.length && !callPlan ? (
                <div className="flex flex-col items-center justify-center py-12 text-charcoal-light">
                  <Phone size={32} className="mb-2 opacity-30" />
                  <p className="text-sm mb-3">No call scripts yet</p>
                  <button onClick={generateCallPlan} disabled={generatingPlan} className="btn-primary flex items-center gap-2 text-sm">
                    {generatingPlan ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
                    Generate Call Plan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {c.call_scripts?.map(script => <ScriptCard key={script.id} script={script} />)}
                </div>
              )}
            </div>
          )}

          {/* ── Email Drafts ─────────────────────────────────────── */}
          {activeTab === 'emails' && (
            <div className="tab-content">
              {!emailDrafts.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-charcoal-light">
                  <Mail size={32} className="mb-2 opacity-30" />
                  <p className="text-sm mb-3">No email drafts for this company's contacts</p>
                  <button onClick={generateEmailDrafts} disabled={generatingDrafts || !c.contacts?.length} className="btn-primary flex items-center gap-2 text-sm">
                    {generatingDrafts ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Generate Email Drafts
                  </button>
                  {!c.contacts?.length && <p className="text-xs text-charcoal-light/60 mt-2">Add contacts first to generate drafts</p>}
                </div>
              ) : (
                <div className="space-y-3 stagger-in">
                  {emailDrafts.map((d, i) => (
                    <div key={i} className="bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30 hover:border-teal/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-200">{d.subject || 'Untitled Draft'}</p>
                        <span className={`badge border text-xs ${
                          d.status === 'approved' ? 'text-teal bg-teal/10 border-teal/30' :
                          d.status === 'sent'     ? 'text-tea-dark bg-tea/10 border-tea/30' :
                          'text-charcoal-light bg-charcoal/10 border-charcoal/30'
                        }`}>{d.status || 'draft'}</span>
                      </div>
                      {d.to_email && <p className="text-xs text-charcoal-light mb-2">To: {d.to_email}</p>}
                      {d.body_text && (
                        <p className="text-xs text-charcoal-light/80 line-clamp-3 leading-relaxed">
                          {d.body_text.slice(0, 280)}{d.body_text.length > 280 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Enrichment ───────────────────────────────────────── */}
          {activeTab === 'enrichment' && (
            <div className="tab-content">
              <EnrichmentTab company={c} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
