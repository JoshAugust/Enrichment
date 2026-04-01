import { useState, useEffect, useRef } from 'react'
import {
  Phone, Mail, BarChart2, ChevronDown, ChevronUp,
  Play, Send, CheckCircle, User, Building2, ExternalLink, AlertTriangle, Mic, FlaskConical, X,
  ShieldCheck
} from 'lucide-react'
import { api } from '../lib/api'
import { scoreColor, typeBadge } from '../lib/utils'
import { useToast } from '../components/Toast'
import VerificationBadge from '../components/VerificationBadge'

// ── Strategy & template data ──────────────────────────────────────────────────
const STRATEGIES = {
  operator: {
    script: 'gpu-operator',
    angle: 'Lead with cost-of-capital reduction on GPU fleet debt',
    points: [
      'Residual value insurance reduces lender haircuts on GPU-backed ABL/DDTL',
      'Enables cheaper debt structures and higher LTV ratios for operators',
      'Protects equity value against GPU price depreciation cycles',
    ],
  },
  lender: {
    script: 'gpu-lender',
    angle: 'Lead with collateral quality and residual value protection',
    points: [
      'Insurance wrapper lifts effective LTV on GPU-secured loan books',
      'Structured residual guarantees reduce reserve requirements',
      'Portfolio-level coverage available for GPU-heavy credit facilities',
    ],
  },
  reinsurer: {
    script: 'gpu-reinsurer',
    angle: 'Lead with underwriting capacity for novel GPU residual risk',
    points: [
      'Emerging asset class with strong institutional demand signal',
      'Defined loss scenarios with hard floor pricing dynamics',
      'Partnership model — risk sharing, not pure risk transfer',
    ],
  },
}

const EMAIL_TEMPLATES = {
  operator: (name) => ({
    subject: `GPU Residual Value Insurance — ${name}`,
    body: `Hi [Name],\n\nI wanted to reach out about GPU residual value insurance for ${name}'s fleet.\n\nAs GPU operators increasingly rely on debt-financed infrastructure, Corgi offers structured coverage that reduces lender haircuts and enables more competitive financing terms.\n\nWould you have 20 minutes to explore how this could reduce your cost of capital?\n\nBest,\n[Sender]`,
  }),
  lender: (name) => ({
    subject: `GPU Portfolio Protection — ${name}`,
    body: `Hi [Name],\n\nI'm reaching out regarding residual value coverage for GPU-backed loan portfolios at ${name}.\n\nCorgi provides insurance wrappers that improve effective LTV ratios and reduce reserve requirements on GPU-secured credit facilities.\n\nHappy to walk through our underwriting approach at your convenience.\n\nBest,\n[Sender]`,
  }),
  reinsurer: (name) => ({
    subject: `GPU Reinsurance Partnership — ${name}`,
    body: `Hi [Name],\n\nI'm connecting with leading reinsurers about capacity partnerships for GPU residual value risk.\n\nThis is a novel, high-demand asset class with defined loss scenarios and strong floor pricing dynamics. We're looking for reinsurance partners to help us scale.\n\nWould you be open to a brief introductory call?\n\nBest,\n[Sender]`,
  }),
}

const getStrategy = (type) => STRATEGIES[type] || STRATEGIES.operator
const getTemplate = (type, name) => (EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES.operator)(name)

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreDot({ score }) {
  const color = score >= 80 ? '#C5EBC3' : score >= 60 ? '#BEB2C8' : '#465362'
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0 mt-1"
      style={{ backgroundColor: color, boxShadow: score >= 80 ? `0 0 6px ${color}90` : 'none' }}
    />
  )
}

function DryBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400 text-xs font-bold bg-amber-400/10 border border-amber-400/30 rounded px-1.5 py-0.5">
      <AlertTriangle size={9} className="flex-shrink-0" />
      DRY RUN
    </span>
  )
}

function TileSkeleton() {
  return (
    <div className="card mb-3 p-4 space-y-2">
      <div className="flex justify-between"><div className="skeleton h-4 w-32" /><div className="skeleton h-4 w-8" /></div>
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-3 w-48" />
    </div>
  )
}

// ── Company tile (CALLS + EMAIL) ──────────────────────────────────────────────
function CompanyTile({ company, mode, onAction, testPhone }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(() => localStorage.getItem(`notes:${company.id}`) || '')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [callState, setCallState] = useState('idle')      // 'idle' | 'calling' | 'initiated' | 'error'
  const [testCallState, setTestCallState] = useState('idle') // 'idle' | 'calling' | 'initiated' | 'error'
  const toast = useToast()

  const strat = getStrategy(company.type)
  const tmplInit = getTemplate(company.type, company.name)
  const [subject, setSubject] = useState(tmplInit.subject)
  const [body, setBody] = useState(tmplInit.body)
  const contact = company.contacts?.[0]
  const hasPhone = !!contact?.phone

  const saveNotes = (val) => {
    setNotes(val)
    localStorage.setItem(`notes:${company.id}`, val)
  }

  const handleCall = async () => {
    if (!hasPhone) {
      toast(`No phone number on record for ${contact?.name || company.name}`, 'error')
      return
    }
    setCallState('calling')
    setLoading(true)
    try {
      const result = await api.post('/vapi/call', {
        companyId: company.id,
        contactId: contact?.id || null,
      })
      setCallState('initiated')
      setDone(true)
      const isDryRun = result?.data?.isDryRun || result?.isDryRun
      toast(
        isDryRun
          ? `DRY RUN — call plan logged for ${company.name}`
          : `Call initiated for ${company.name} ✓`,
        'success'
      )
      onAction?.(company.id, 'call', result?.data || result)
    } catch (e) {
      setCallState('error')
      const msg = e.message || 'Call failed'
      toast(msg, 'error')
      // Reset after a moment so they can retry
      setTimeout(() => setCallState('idle'), 3000)
    } finally { setLoading(false) }
  }

  const handleEmail = async () => {
    setLoading(true)
    try {
      const contactId = contact?.id || company.id
      const draft = await api.post(`/email/compose/${contactId}`, { subject, body })
      if (draft?.id) await api.post(`/email/send/${draft.id}`, {})
      setDone(true)
      toast('Email queued — check Email Campaigns tab', 'success')
      onAction?.(company.id, 'email')
    } catch (e) {
      toast(e.message, 'error')
    } finally { setLoading(false) }
  }

  const handleTestCall = async () => {
    if (!testPhone) {
      toast('Set a test phone number first — click 🧪 Test Call in the header', 'error')
      return
    }
    setTestCallState('calling')
    try {
      const result = await api.post('/vapi/test-call', {
        companyId: company.id,
        contactId: contact?.id || null,
        testPhoneNumber: testPhone,
      })
      setTestCallState('initiated')
      const isDryRun = result?.data?.isDryRun || result?.isDryRun
      toast(
        isDryRun
          ? `DRY RUN — test call plan logged for ${company.name}`
          : `Test call initiated to ${testPhone} (${company.name} context) ✓`,
        'success'
      )
      onAction?.(company.id, 'test_call', result?.data || result)
      setTimeout(() => setTestCallState('idle'), 4000)
    } catch (e) {
      setTestCallState('error')
      toast(e.message || 'Test call failed', 'error')
      setTimeout(() => setTestCallState('idle'), 3000)
    }
  }

  const headline = company.description
    ? (company.description.length > 70 ? company.description.slice(0, 70) + '…' : company.description)
    : [company.financing_status, company.estimated_gpu_scale].filter(Boolean).join(' · ') || '—'

  return (
    <div className={`card border border-charcoal/30 mb-3 overflow-hidden transition-opacity ${done ? 'opacity-50' : ''}`}
      style={{ boxShadow: expanded ? '0 4px 20px rgba(86,163,166,0.08)' : 'none', transition: 'box-shadow 0.2s ease, opacity 0.3s ease' }}>
      {/* Header row */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-white/[0.03] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <ScoreDot score={company.qualification_score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white truncate">{company.name}</span>
            <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${scoreColor(company.qualification_score)}`}>
              {company.qualification_score}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`badge border text-xs ${typeBadge(company.type)}`}>{company.type}</span>
            {company.financing_status && <span className="text-xs text-charcoal-light">{company.financing_status}</span>}
          </div>
          <p className="text-xs text-charcoal-light mt-1 leading-relaxed line-clamp-1">{headline}</p>
        </div>
        <span className="text-charcoal-light flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Expanded body */}
      <div style={{ maxHeight: expanded ? '900px' : '0', overflow: 'hidden', transition: 'max-height 0.28s ease' }}>
        <div className="px-4 pb-4 pt-2 space-y-4 border-t border-charcoal/20">

          {/* Mode-specific section */}
          {mode === 'call' ? (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">── Strategy</p>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">{strat.angle}</p>
              <div className="space-y-1 mb-2">
                {strat.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-charcoal-light">
                    <span className="text-teal mt-0.5 flex-shrink-0">›</span><span>{pt}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-charcoal-light">Script:</span>
                <span className="badge border text-xs text-teal bg-teal/10 border-teal/30">{strat.script}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">── Email Draft</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-charcoal-light block mb-1">Subject</label>
                  <input className="input text-xs w-full" value={subject}
                    onChange={e => setSubject(e.target.value)} onClick={e => e.stopPropagation()} />
                </div>
                <div>
                  <label className="text-xs text-charcoal-light block mb-1">Body</label>
                  <textarea className="input text-xs w-full resize-none" rows={5} value={body}
                    onChange={e => setBody(e.target.value)} onClick={e => e.stopPropagation()} />
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          {contact && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">── Contact</p>
              <div className="flex items-start gap-2">
                <User size={12} className="text-charcoal-light mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-200 font-medium">
                    {contact.name}{contact.title ? `, ${contact.title}` : ''}
                  </p>
                  {contact.email && <p className="text-xs text-teal mt-0.5">{contact.email}</p>}
                  {contact.phone && <p className="text-xs text-charcoal-light mt-0.5">{contact.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">── Notes</p>
            <textarea
              className="input text-xs w-full resize-none"
              rows={3}
              placeholder="Add notes, strategy updates, follow-up reminders…"
              value={notes}
              onChange={e => saveNotes(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {mode === 'call' ? (
              <>
                <div className="relative group">
                  <button
                    onClick={handleCall}
                    disabled={loading || done || !hasPhone}
                    title={!hasPhone ? 'No phone number on record for this contact' : undefined}
                    className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Phone size={12} />
                    {callState === 'calling'  ? 'Calling…'         :
                     callState === 'initiated' ? 'Call initiated ✓' :
                     callState === 'error'     ? 'Failed — retry'   :
                     !hasPhone                 ? 'No phone number'  : 'Start Call'}
                  </button>
                  {!hasPhone && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-charcoal text-charcoal-light rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      No phone number on record
                    </span>
                  )}
                </div>

                {/* Test Call button — calls saved test phone with this company's context */}
                <button
                  onClick={handleTestCall}
                  disabled={testCallState === 'calling' || testCallState === 'initiated'}
                  title={testPhone ? `Test with ${testPhone}` : 'Set a test number in the header first'}
                  className={`flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    testPhone
                      ? 'border-amber-400/40 text-amber-400 bg-amber-400/5 hover:bg-amber-400/10'
                      : 'border-charcoal/40 text-charcoal-light bg-transparent cursor-not-allowed opacity-40'
                  }`}
                >
                  <FlaskConical size={11} />
                  {testCallState === 'calling'   ? 'Dialing…'  :
                   testCallState === 'initiated'  ? 'Test sent ✓' :
                   testCallState === 'error'      ? 'Error'       : 'Test'}
                </button>
              </>
            ) : (
              <button onClick={handleEmail} disabled={loading || done}
                className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 disabled:opacity-50">
                <Send size={12} />{loading ? 'Sending…' : done ? 'Sent ✓' : 'Send Email'}
              </button>
            )}
            <DryBadge />
            {done && <CheckCircle size={14} className="text-tea-dark" />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Outcome badge config ──────────────────────────────────────────────────────
const OUTCOME_BADGE = {
  meeting_booked:     { cls: 'text-tea-dark bg-tea/10 border-tea/30',           label: 'Meeting Booked' },
  interested:         { cls: 'text-teal bg-teal/10 border-teal/30',             label: 'Interested' },
  callback_requested: { cls: 'text-thistle bg-thistle/10 border-thistle/30',    label: 'Callback' },
  not_interested:     { cls: 'text-charcoal-light bg-charcoal/10 border-charcoal/30', label: 'Not Interested' },
  voicemail_left:     { cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30',   label: 'Voicemail' },
  no_answer:          { cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30',   label: 'No Answer' },
  failed:             { cls: 'text-red-400 bg-red-400/10 border-red-400/30',         label: 'Failed' },
  wrong_person:       { cls: 'text-charcoal-light bg-charcoal/10 border-charcoal/30', label: 'Wrong Person' },
}

function OutcomeBadge({ outcome }) {
  const cfg = OUTCOME_BADGE[outcome] || { cls: 'text-charcoal-light bg-charcoal/10 border-charcoal/30', label: outcome || 'Unknown' }
  return <span className={`badge border text-xs flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
}

function formatDuration(seconds) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Result tile (call results from /api/calls/results) ────────────────────────
function ResultTile({ record }) {
  const [expanded, setExpanded] = useState(false)
  const duration = formatDuration(record.duration_seconds)

  return (
    <div className="card border border-charcoal/30 mb-3 overflow-hidden">
      <button className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-white/[0.03] transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <CheckCircle size={14} className="text-tea-dark flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white truncate">
              {record.company_name || `Company ${record.company_id}`}
            </span>
            {record.outcome
              ? <OutcomeBadge outcome={record.outcome} />
              : <span className="badge border text-xs text-charcoal-light bg-charcoal/10 border-charcoal/30">{record.status}</span>
            }
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {duration && <span className="text-xs text-charcoal-light">{duration}</span>}
            <span className="text-xs text-charcoal-light">
              {record.created_at ? new Date(record.created_at).toLocaleString() : 'Recently'}
            </span>
          </div>
        </div>
        <span className="text-charcoal-light flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Expanded detail */}
      <div style={{ maxHeight: expanded ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.28s ease' }}>
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-charcoal/20">

          {/* Recording player */}
          {record.recording_url && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mic size={10} /> Recording
              </p>
              <audio
                controls
                src={record.recording_url}
                className="w-full h-8 rounded"
                style={{ accentColor: '#56A3A6' }}
              />
            </div>
          )}

          {/* Summary */}
          {record.summary && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-1">── Summary</p>
              <p className="text-xs text-slate-300 leading-relaxed">{record.summary}</p>
            </div>
          )}

          {/* Transcript */}
          {record.transcript && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-1">── Transcript</p>
              <div className="bg-charcoal/20 rounded p-2 max-h-40 overflow-y-auto">
                <p className="text-xs text-charcoal-light leading-relaxed whitespace-pre-wrap font-mono">
                  {record.transcript}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-1">── Notes</p>
              <p className="text-xs text-slate-300 leading-relaxed">{record.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-charcoal-light pt-1">
            {record.call_provider && (
              <span>Provider: <span className="text-slate-300">{record.call_provider}</span></span>
            )}
            {record.call_cost != null && (
              <span>Cost: <span className="text-slate-300">${Number(record.call_cost).toFixed(4)}</span></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────────────────
function KanbanColumn({ title, icon: Icon, count, children, emptyMsg, accentColor = 'teal', columnHeight }) {
  const a = {
    teal:    { border: 'border-teal/25',    header: 'text-teal',     badge: 'bg-teal/10 text-teal border-teal/30' },
    thistle: { border: 'border-thistle/25', header: 'text-thistle',  badge: 'bg-thistle/10 text-thistle border-thistle/30' },
    tea:     { border: 'border-tea/25',     header: 'text-tea-dark', badge: 'bg-tea/10 text-tea-dark border-tea/30' },
  }[accentColor] || {}

  const isEmpty = count === 0

  return (
    <div className={`flex flex-col rounded-xl border ${a.border} overflow-hidden`}
      style={{ background: 'linear-gradient(180deg, rgba(1,25,54,0.85) 0%, rgba(4,20,45,0.97) 100%)', height: columnHeight }}>
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-charcoal/20 flex-shrink-0">
        <Icon size={15} className={a.header} />
        <h2 className={`text-sm font-bold ${a.header} tracking-wide`}>{title}</h2>
        {count !== undefined && (
          <span className={`badge border text-xs ml-auto ${a.badge}`}>{count}</span>
        )}
      </div>
      {/* Scrollable tiles */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {isEmpty && emptyMsg ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-charcoal/20 flex items-center justify-center mb-3">
              <Icon size={18} className="text-charcoal-light/50" />
            </div>
            <p className="text-charcoal-light text-sm max-w-[180px] leading-relaxed">{emptyMsg}</p>
          </div>
        ) : children}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
// ── Test Phone Modal ──────────────────────────────────────────────────────────
function TestPhoneModal({ current, onSave, onClose }) {
  const [value, setValue] = useState(current || '')

  const handleSave = () => {
    const trimmed = value.trim()
    if (trimmed) {
      localStorage.setItem('testPhoneNumber', trimmed)
      onSave(trimmed)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card border border-amber-400/30 w-80 p-5 space-y-4"
        onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(180deg, rgba(1,25,54,0.97) 0%, rgba(4,20,45,1) 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical size={15} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Test Call Setup</h3>
          </div>
          <button onClick={onClose} className="text-charcoal-light hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-charcoal-light leading-relaxed">
          Enter your phone number. Each company tile will get a <span className="text-amber-400">🧪 Test</span> button
          that calls <em>your</em> number using that company's AI context.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs text-charcoal-light block">Your phone number</label>
          <input
            className="input text-sm w-full"
            type="tel"
            placeholder="+1 555 000 0000"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!value.trim()}
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
          >
            Save &amp; Enable Test Mode
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [companies, setCompanies] = useState([])
  const [outreach, setOutreach] = useState([])
  const [callResults, setCallResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(true)
  const [testPhone, setTestPhone] = useState(() => localStorage.getItem('testPhoneNumber') || '')
  const [showTestModal, setShowTestModal] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState('A') // 'A' | 'B' | 'all'
  const [verifSummary, setVerifSummary] = useState(null)
  const toast = useToast()

  async function loadCompanies(priority) {
    setLoading(true)
    const query = priority === 'all'
      ? '/companies?limit=200'
      : `/companies?priority=${priority}&limit=200`
    const [compRes, outRes] = await Promise.allSettled([
      api.get(query),
      api.get('/outreach'),
    ])
    if (compRes.status === 'fulfilled') {
      const d = compRes.value?.data || compRes.value || []
      setCompanies(Array.isArray(d) ? d : [])
    } else {
      toast('Could not load companies: ' + compRes.reason?.message, 'error')
    }
    if (outRes.status === 'fulfilled') {
      const d = outRes.value?.data || outRes.value || []
      setOutreach(Array.isArray(d) ? d : [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCompanies(priorityFilter)
  }, [priorityFilter])

  // Fetch verification summary
  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/verification/summary')
        if (res && typeof res === 'object' && 'total' in res) setVerifSummary(res)
      } catch (_) {
        // Non-fatal
      }
    })()
  }, [])

  // Fetch call results independently so the column can refresh separately
  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/calls/results?limit=100')
        const d = res?.data || res || []
        setCallResults(Array.isArray(d) ? d : [])
      } catch (err) {
        // Non-fatal — column will show empty state
        console.warn('[Dashboard] Could not load call results:', err.message)
      } finally {
        setResultsLoading(false)
      }
    })()
  }, [])

  const handleAction = (companyId, type, resultData = {}) => {
    // Optimistically add to outreach list for UX feedback
    setOutreach(prev => [
      ...prev,
      {
        company_id:   companyId,
        company_name: companies.find(c => c.id === companyId)?.name,
        type,
        status:       resultData?.status || 'initiated',
        outcome:      resultData?.outcome || null,
        recording_url: resultData?.recording_url || null,
        created_at:   new Date().toISOString(),
      },
    ])
  }

  const sorted = [...companies].sort((a, b) => (b.qualification_score || 0) - (a.qualification_score || 0))
  const colH = 'calc(100vh - 168px)'

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Test Phone Modal */}
      {showTestModal && (
        <TestPhoneModal
          current={testPhone}
          onSave={setTestPhone}
          onClose={() => setShowTestModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-charcoal-light text-sm mt-0.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            {loading
              ? 'Loading targets…'
              : `${companies.length} ${priorityFilter === 'all' ? '' : `Priority ${priorityFilter} `}target${companies.length !== 1 ? 's' : ''} · ${callResults.length} call result${callResults.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-prussian-700/40 border border-charcoal/30 rounded-lg p-1">
            {['A', 'B', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  priorityFilter === p
                    ? p === 'A'
                      ? 'bg-teal/20 border border-teal/50 text-teal'
                      : p === 'B'
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                      : 'bg-charcoal/40 border border-charcoal/60 text-slate-200'
                    : 'text-charcoal-light hover:text-slate-200'
                }`}
              >
                {p === 'all' ? 'All' : `Priority ${p}`}
              </button>
            ))}
          </div>
          {/* Test Call button */}
          <button
            onClick={() => setShowTestModal(true)}
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded border transition-colors ${
              testPhone
                ? 'border-amber-400/50 text-amber-400 bg-amber-400/8 hover:bg-amber-400/15'
                : 'border-charcoal/40 text-charcoal-light hover:border-amber-400/40 hover:text-amber-400'
            }`}
            title={testPhone ? `Test number: ${testPhone} — click to change` : 'Set up test call number'}
          >
            <FlaskConical size={12} />
            {testPhone ? `Test: ${testPhone}` : '🧪 Test Call'}
          </button>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-charcoal-light" />
            <span className="text-charcoal-light text-xs">GPU Residual Value Coverage</span>
          </div>
        </div>
      </div>

      {/* Verification Health Card */}
      {verifSummary && (
        <div className="card border border-charcoal/30 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Verification Health</span>
            <span className="text-xs text-charcoal-light ml-auto">avg score: {verifSummary.avgScore}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <VerificationBadge score={null} status="verified"   size="sm" />
            <span className="text-sm font-bold text-emerald-400">{verifSummary.verified}</span>
            <span className="text-charcoal-light text-xs">·</span>
            <VerificationBadge score={null} status="partial"    size="sm" />
            <span className="text-sm font-bold text-yellow-400">{verifSummary.partial}</span>
            <span className="text-charcoal-light text-xs">·</span>
            <VerificationBadge score={null} status="unverified" size="sm" />
            <span className="text-sm font-bold text-slate-400">{verifSummary.unverified}</span>
            <span className="text-charcoal-light text-xs">·</span>
            <VerificationBadge score={null} status="flagged"    size="sm" />
            <span className="text-sm font-bold text-red-400">{verifSummary.flagged}</span>
            <span className="text-charcoal-light text-xs ml-auto">{verifSummary.total} total</span>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        <KanbanColumn title="CALLS" icon={Phone} count={loading ? undefined : sorted.length}
          accentColor="teal"
          emptyMsg={`No Priority ${priorityFilter === 'all' ? '' : priorityFilter + ' '}targets found`}
          columnHeight={colH}>
          {loading
            ? [...Array(5)].map((_, i) => <TileSkeleton key={i} />)
            : sorted.map(c => <CompanyTile key={`call-${c.id}`} company={c} mode="call" onAction={handleAction} testPhone={testPhone} />)}
        </KanbanColumn>

        <KanbanColumn title="EMAIL" icon={Mail} count={loading ? undefined : sorted.length}
          accentColor="thistle"
          emptyMsg={`No Priority ${priorityFilter === 'all' ? '' : priorityFilter + ' '}targets found`}
          columnHeight={colH}>
          {loading
            ? [...Array(5)].map((_, i) => <TileSkeleton key={i} />)
            : sorted.map(c => <CompanyTile key={`email-${c.id}`} company={c} mode="email" onAction={handleAction} testPhone={testPhone} />)}
        </KanbanColumn>

        <KanbanColumn title="RESULTS" icon={BarChart2} count={resultsLoading ? undefined : callResults.length}
          accentColor="tea" emptyMsg="No calls yet — results appear here after calls complete" columnHeight={colH}>
          {resultsLoading
            ? [...Array(2)].map((_, i) => <TileSkeleton key={i} />)
            : callResults.map((r, i) => <ResultTile key={r.id || i} record={r} />)}
        </KanbanColumn>
      </div>
    </div>
  )
}
