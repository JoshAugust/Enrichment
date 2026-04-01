import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, ChevronUp, ChevronDown, RefreshCw, Building2,
  Download, Loader2, Globe, Mail, Phone, ExternalLink,
  CheckCircle, XCircle, ChevronRight, Check, Square,
  CheckSquare, Twitter, Linkedin, Github, Users, FileText,
  MapPin, Calendar, DollarSign, Cpu, Award, Briefcase,
  BarChart2, Hash, TrendingUp, AlertCircle, MessageCircle, Send,
  PhoneCall, PhoneOff, Copy, PhoneForwarded, StickyNote, Save, Filter
} from 'lucide-react'
import { api } from '../lib/api'
import { priorityColor, typeBadge, scoreColor } from '../lib/utils'
import { useToast } from '../components/Toast'
import { useBrowserCall } from '../hooks/useBrowserCall'
import VerificationBadge from '../components/VerificationBadge'
import AgentQABadge from '../components/AgentQABadge'

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(companies) {
  const headers = ['Name','Type','Priority','Score','Contacts','Financing Status','Segment','Website','GPU Scale']
  const rows = companies.map(c => [
    `"${(c.name || '').replace(/"/g,'""')}"`,
    c.type || '', c.priority || '', c.qualification_score ?? '',
    c.contact_count ?? 0, c.financing_status || '',
    `"${(c.industry_segment || '').replace(/"/g,'""')}"`,
    c.website || '',
    `"${(c.estimated_gpu_scale || '').replace(/"/g,'""')}"`,
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `corgi-outreach-companies-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Card Skeleton ────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-48" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-10 rounded-full" />
              <div className="skeleton h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="skeleton h-8 w-12 rounded" />
        </div>
      ))}
    </>
  )
}

// ─── Status Dots ──────────────────────────────────────────────────────────────
function StatusDots({ company, draftCompanyIds, scriptCompanyIds }) {
  const hasContacts = (company.contact_count ?? 0) > 0
  const hasDrafts   = draftCompanyIds.has(company.id)
  const hasScripts  = scriptCompanyIds.has(company.id)

  return (
    <div className="flex items-center gap-1.5">
      <span title={hasContacts ? `${company.contact_count} contact(s)` : 'No contacts yet'}
        className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${hasContacts ? 'text-teal bg-teal/10 border-teal/30' : 'text-charcoal bg-charcoal/10 border-charcoal/20'}`}>
        👥
      </span>
      <span title={hasDrafts ? 'Email drafts generated' : 'No email drafts yet'}
        className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${hasDrafts ? 'text-thistle bg-thistle/10 border-thistle/30' : 'text-charcoal bg-charcoal/10 border-charcoal/20'}`}>
        📧
      </span>
      <span title={hasScripts ? 'Call scripts generated' : 'No call scripts yet'}
        className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${hasScripts ? 'text-tea-dark bg-tea/10 border-tea/30' : 'text-charcoal bg-charcoal/10 border-charcoal/20'}`}>
        📞
      </span>
    </div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ company, onAction, loading }) {
  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      {[
        { action: 'research', emoji: '🔍', title: 'Trigger research' },
        { action: 'email',    emoji: '📧', title: 'Generate email drafts' },
        { action: 'call',     emoji: '📞', title: 'Generate call plan' },
      ].map(({ action, emoji, title }) => (
        <button
          key={action}
          onClick={() => onAction(company.id, action)}
          disabled={loading === `${company.id}-${action}`}
          title={title}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-prussian-700 hover:bg-prussian-600 border border-charcoal/40 hover:border-teal/30 transition-all disabled:opacity-40 text-xs"
        >
          {loading === `${company.id}-${action}`
            ? <Loader2 size={11} className="animate-spin text-teal" />
            : emoji}
        </button>
      ))}
    </div>
  )
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  if (score == null) return <span className="text-charcoal-light">—</span>
  if (score >= 80) return <span className="font-bold tabular-nums text-sm text-tea-dark">{score}<span className="text-charcoal-light/60 text-xs font-normal">/100</span></span>
  if (score >= 60) return <span className="font-bold tabular-nums text-sm text-thistle">{score}<span className="text-charcoal-light/60 text-xs font-normal">/100</span></span>
  return <span className="font-bold tabular-nums text-sm text-charcoal-light">{score}<span className="text-charcoal/60 text-xs font-normal">/100</span></span>
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const cfg = {
    A: 'text-tea-darker bg-tea/15 border-tea/40',
    B: 'text-thistle-dark bg-thistle/15 border-thistle/40',
    C: 'text-charcoal-light bg-charcoal/20 border-charcoal/40',
  }[priority] || 'text-charcoal-light bg-charcoal/15 border-charcoal/30'
  return <span className={`badge border font-bold ${cfg}`}>{priority}</span>
}

// ─── Info Tile ────────────────────────────────────────────────────────────────
function InfoTile({ icon: Icon, label, value, link, className = '' }) {
  if (value == null || value === '' || value === '—') return null
  return (
    <div className={`bg-prussian-700/40 rounded-xl p-3 border border-charcoal/30 hover:border-charcoal/50 transition-colors ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={11} className="text-charcoal-light flex-shrink-0" />}
        <p className="text-xs text-charcoal-light font-medium uppercase tracking-wider truncate">{label}</p>
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-teal hover:text-teal-300 text-sm transition-colors break-all"
          onClick={e => e.stopPropagation()}>
          {value}<ExternalLink size={10} className="flex-shrink-0" />
        </a>
      ) : (
        <p className="text-sm text-slate-200 leading-snug">{value}</p>
      )}
    </div>
  )
}

// ─── Section Header (kept for backward compat, unused in ExpandedDetail now) ──
function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className="text-teal flex-shrink-0" />
      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">{title}</h3>
      {count != null && (
        <span className="text-xs bg-teal/15 text-teal border border-teal/30 rounded-full px-1.5 py-0.5 font-medium">{count}</span>
      )}
    </div>
  )
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleSection({ icon: Icon, title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-charcoal/20 pt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left py-2 group"
      >
        <Icon size={14} className="text-teal" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
        {count != null && (
          <span className="text-[10px] bg-teal/10 text-teal rounded-full px-1.5 py-0.5">{count}</span>
        )}
        <ChevronRight
          size={12}
          className={`text-charcoal-light ml-auto transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

// ─── Contact Card (compact row) ───────────────────────────────────────────────
function ContactCard({ contact, onCall, callState, isCallAvailable }) {
  const [copied, setCopied] = useState(false)

  function copyPhone(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(contact.phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const isActive = callState === 'connecting' || callState === 'ringing' || callState === 'in-progress'

  return (
    <div className="py-2.5 border-b border-charcoal/20 last:border-0">
      {/* Name + verified dot */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <p className="text-sm font-medium text-slate-100 truncate">{contact.name}</p>
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${contact.verified ? 'bg-tea-dark' : 'bg-charcoal-light/40'}`}
          title={contact.verified ? 'Verified' : 'Unverified'}
        />
      </div>
      {/* Title */}
      {contact.title && (
        <p className="text-xs text-charcoal-light mb-1.5 truncate">{contact.title}</p>
      )}
      {/* Action row */}
      <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
        {contact.phone && (
          <>
            <span className="text-xs text-slate-300 font-mono">{contact.phone}</span>
            <button onClick={copyPhone} title="Copy phone" className="p-0.5 rounded hover:bg-charcoal/30 transition-colors">
              {copied ? <Check size={10} className="text-tea-dark" /> : <Copy size={10} className="text-charcoal-light" />}
            </button>
            {isCallAvailable !== false && (
              <button
                onClick={(e) => { e.stopPropagation(); onCall?.(contact.phone) }}
                disabled={isActive}
                title={`Call ${contact.name}`}
                className="flex items-center gap-1 bg-teal/10 border border-teal/30 hover:bg-teal/20 hover:border-teal/50 text-teal rounded-md px-1.5 py-0.5 text-xs transition-all disabled:opacity-40"
              >
                <PhoneCall size={9} />Call
              </button>
            )}
          </>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`}
            className="flex items-center gap-1 text-thistle hover:text-teal text-xs transition-colors"
            onClick={e => e.stopPropagation()}>
            <Mail size={9} /><span className="truncate max-w-[160px]">{contact.email}</span>
          </a>
        )}
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="text-charcoal-light hover:text-thistle transition-colors"
            title="LinkedIn" onClick={e => e.stopPropagation()}>
            <Linkedin size={12} />
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Script Card (expanded) ───────────────────────────────────────────────────
function ScriptCard({ script }) {
  const [open, setOpen] = useState(false)
  let parsed = null
  try { parsed = JSON.parse(script.customized_script) } catch {}

  return (
    <div className="bg-prussian-700/40 rounded-xl border border-charcoal/30 overflow-hidden transition-all">
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-prussian-700/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-teal bg-teal/10 border border-teal/30 rounded px-2 py-0.5 flex-shrink-0">
            v{script.script_version}
          </span>
          <span className="text-sm font-medium text-slate-200 truncate">{parsed?.name || `Script ${script.script_version}`}</span>
          {script.buyer_type && <span className="text-xs text-charcoal-light flex-shrink-0">({script.buyer_type})</span>}
        </div>
        {open
          ? <ChevronUp   size={14} className="text-charcoal-light flex-shrink-0" />
          : <ChevronDown size={14} className="text-charcoal-light flex-shrink-0" />}
      </button>
      {open && parsed && (
        <div className="px-4 pb-4 space-y-3 border-t border-charcoal/20">
          {parsed.opening && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-1">Opening</p>
              <p className="text-sm text-slate-300 italic bg-prussian/60 rounded-lg p-3 border border-charcoal/20">"{parsed.opening}"</p>
            </div>
          )}
          {parsed.lines?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-1">Key Lines</p>
              <ul className="space-y-1">
                {parsed.lines.map((l, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-charcoal-light/60 flex-shrink-0 tabular-nums">{i+1}.</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {script.created_at && (
            <p className="text-xs text-charcoal-light/50">
              {new Date(script.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Manual Call Toggle (slim checkbox row) ───────────────────────────────────
function ManualCallToggle({ companyId, value, onChange }) {
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  async function toggle(e) {
    e.stopPropagation()
    const newVal = value ? 0 : 1
    setSaving(true)
    try {
      await api.patch(`/companies/${companyId}`, { manual_call_made: newVal })
      // Create journal entry when marking as called
      if (newVal) {
        try {
          await api.post('/journal', { company_id: companyId })
        } catch (_) { /* journal creation is best-effort */ }
      }
      onChange(newVal)
      toast(newVal ? 'Manual call marked ✅ — added to Journal' : 'Manual call unmarked', 'success')
    } catch (err) {
      toast(`Failed to update: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 w-full text-left py-2 text-xs transition-colors select-none ${
        value ? 'text-tea-dark' : 'text-charcoal-light hover:text-slate-300'
      }`}
    >
      {saving ? (
        <Loader2 size={13} className="animate-spin flex-shrink-0" />
      ) : value ? (
        <CheckSquare size={13} className="text-tea-dark flex-shrink-0" />
      ) : (
        <Square size={13} className="flex-shrink-0" />
      )}
      <span>{value ? 'Manual call made ✅' : 'Mark manual call made'}</span>
    </button>
  )
}

// ─── Company Chat ─────────────────────────────────────────────────────────────
function CompanyChat({ companyId, companyName }) {
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [isStreaming,  setIsStreaming]  = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMsg    = { role: 'user',      content: trimmed }
    const assistantMsg = { role: 'assistant', content: '' }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsStreaming(true)

    try {
      const response = await fetch(`/api/companies/${companyId}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          message: trimmed,
          history: messages,   // history before this turn
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev]
                const last    = updated[updated.length - 1]
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.text }
                }
                return updated
              })
            }
          } catch { /* ignore malformed chunks */ }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        const last    = updated[updated.length - 1]
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: `⚠️ Error: ${err.message}` }
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="bg-prussian-700/30 rounded-xl border border-charcoal/20 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={15} className="text-teal flex-shrink-0" />
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Ask AI about {companyName}
        </h3>
      </div>

      {/* Messages area */}
      <div className="max-h-64 overflow-y-auto space-y-2 mb-3 scroll-smooth">
        {messages.length === 0 && (
          <p className="text-xs text-charcoal-light/60 text-center py-4">
            No messages yet. Ask anything about this company!
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={
              msg.role === 'user'
                ? 'bg-teal/15 border border-teal/30 rounded-xl px-3 py-2 text-sm text-slate-200 ml-auto max-w-[80%]'
                : 'bg-prussian-700/50 border border-charcoal/30 rounded-xl px-3 py-2 text-sm text-slate-300 mr-auto max-w-[80%]'
            }>
              {msg.content || (
                msg.role === 'assistant' && isStreaming && i === messages.length - 1
                  ? <span className="inline-flex items-center gap-1 text-charcoal-light/60">
                      <Loader2 size={11} className="animate-spin" />
                      <span className="text-xs">Thinking…</span>
                    </span>
                  : null
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Ask about pitch angles, company fit, talking points…"
          className="input flex-1 text-sm disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming || !input.trim()}
          className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-40"
        >
          {isStreaming
            ? <Loader2 size={13} className="animate-spin" />
            : <Send size={13} />}
        </button>
      </div>
    </div>
  )
}

// ─── Expanded Company Detail ──────────────────────────────────────────────────
function ExpandedDetail({ companyId, summaryData, draftCompanyIds, scriptCompanyIds, onManualCallUpdate, onCall, callState, isCallAvailable, onNotesChange }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [manualCall, setManualCall] = useState(summaryData.manual_call_made ?? 0)

  useEffect(() => {
    let cancelled = false
    async function fetchDetail() {
      setLoading(true)
      try {
        const res = await api.get(`/companies/${companyId}`)
        if (!cancelled) {
          setDetail(res.data)
          setManualCall(res.data.manual_call_made ?? 0)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDetail()
    return () => { cancelled = true }
  }, [companyId])

  if (loading) return (
    <div className="p-6 flex items-center gap-3 text-charcoal-light">
      <Loader2 size={16} className="animate-spin text-teal" />
      <span className="text-sm">Loading company details…</span>
    </div>
  )

  if (error) return (
    <div className="p-4 flex items-center gap-2 text-red-400">
      <AlertCircle size={14} />
      <span className="text-sm">Failed to load details: {error}</span>
    </div>
  )

  const d = detail
  if (!d) return null

  // Outreach status color
  const outreachColor = {
    uncontacted:  'text-charcoal-light bg-charcoal/15 border-charcoal/30',
    contacted:    'text-thistle bg-thistle/15 border-thistle/40',
    meeting_set:  'text-teal bg-teal/10 border-teal/30',
    closed:       'text-tea-dark bg-tea/15 border-tea/40',
  }[d.outreach_status] || 'text-charcoal-light bg-charcoal/15 border-charcoal/30'

  // Key metrics — only those with values
  const metrics = [
    { emoji: '👥', label: 'employees',  value: d.employee_count },
    { emoji: '🖥️', label: 'GPUs',       value: d.estimated_gpu_scale },
    { emoji: '💰', label: 'raised',     value: d.total_raised },
    { emoji: '📈', label: 'GPU assets', value: d.gpu_asset_value },
    { emoji: '📊', label: 'score',      value: d.qualification_score != null ? `${d.qualification_score}/100` : null },
  ].filter(m => m.value !== null && m.value !== undefined && m.value !== '')

  // Detail rows — only those with values
  const detailRows = [
    { label: 'HQ',         value: d.headquarters },
    { label: 'Financing',  value: d.financing_status },
    { label: 'Founded',    value: d.founded_year },
    { label: 'Segment',    value: d.industry_segment },
    { label: 'Investors',  value: d.investors },
    { label: 'NVIDIA',     value: d.nvidia_partnership },
    { label: 'Last Round', value: d.last_funding_round },
    {
      label: 'SEC',
      value: d.sec_ticker
        ? `${d.sec_ticker}${d.sec_cik ? ` (CIK: ${d.sec_cik})` : ''}`
        : d.sec_cik ? `CIK: ${d.sec_cik}` : null,
    },
  ].filter(r => r.value !== null && r.value !== undefined && r.value !== '')

  return (
    <div className="border-t border-charcoal/20 bg-prussian-700/20">

      {/* ── HERO BAR ──────────────────────────────────────────────────── */}
      <div className="px-5 py-3 bg-prussian-800/60 border-b border-charcoal/20 flex items-center gap-3 flex-wrap">
        {/* Type badge */}
        {d.type && (
          <span className={`badge border text-xs font-semibold ${typeBadge(d.type)}`}>
            {d.type}
          </span>
        )}
        {/* Priority */}
        {d.priority && (
          <span className={`badge border text-xs font-bold ${priorityColor(d.priority)}`}>
            {d.priority}
          </span>
        )}
        {/* Score */}
        {d.qualification_score != null && (
          <span className={`text-xs font-bold tabular-nums ${scoreColor(d.qualification_score)}`}>
            {d.qualification_score}<span className="text-charcoal-light/60 text-[10px] font-normal">/100</span>
          </span>
        )}
        {/* Agent QA Score */}
        <AgentQABadge score={d.agent_qa_score} notes={d.agent_qa_notes} size="sm" />
        {/* Outreach status */}
        <span className={`badge border text-xs ${outreachColor}`}>
          {d.outreach_status || 'uncontacted'}
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Full profile link */}
        <Link
          to={`/companies/${companyId}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-teal-300 bg-teal/10 hover:bg-teal/15 border border-teal/30 hover:border-teal/50 rounded-lg px-3 py-1.5 transition-all"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={11} />
          Full Profile
        </Link>

        {/* Website */}
        {d.website && (
          <a href={d.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-teal hover:text-teal-300 transition-colors"
            onClick={e => e.stopPropagation()}>
            <Globe size={11} />
            <span className="truncate max-w-[120px]">{d.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
          </a>
        )}
        {/* Social icons */}
        {d.linkedin_url && (
          <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="text-charcoal-light hover:text-thistle transition-colors"
            title="LinkedIn" onClick={e => e.stopPropagation()}>
            <Linkedin size={14} />
          </a>
        )}
        {d.twitter_url && (
          <a href={d.twitter_url} target="_blank" rel="noopener noreferrer"
            className="text-charcoal-light hover:text-teal transition-colors"
            title="Twitter" onClick={e => e.stopPropagation()}>
            <Twitter size={14} />
          </a>
        )}
        {d.github_url && (
          <a href={d.github_url} target="_blank" rel="noopener noreferrer"
            className="text-charcoal-light hover:text-slate-200 transition-colors"
            title="GitHub" onClick={e => e.stopPropagation()}>
            <Github size={14} />
          </a>
        )}
        {/* Full page link */}
        <Link
          to={`/companies/${companyId}`}
          className="text-charcoal-light hover:text-teal transition-colors"
          title="Open full company page"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* ── TWO-COLUMN BODY ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-charcoal/20">

        {/* ── LEFT COLUMN — Company Summary (compact) ───────────────── */}
        <div className="lg:w-[320px] lg:shrink-0 p-5 space-y-4 min-w-0">

          {/* Key Metrics — stacked compact */}
          {metrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {metrics.map(({ emoji, label, value }) => (
                <div key={label}
                  className="flex items-center gap-1 bg-prussian-600/40 border border-charcoal/20 rounded-full px-2.5 py-1">
                  <span className="text-xs leading-none">{emoji}</span>
                  <span className="text-[11px] font-semibold text-slate-200">{value}</span>
                  <span className="text-[9px] text-charcoal-light">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* About */}
          {d.description && (
            <div>
              <p className="text-[10px] font-semibold text-charcoal-light uppercase tracking-wider mb-1">About</p>
              <p className="text-xs text-slate-300 leading-relaxed">{d.description}</p>
            </div>
          )}

          {/* Details — single column, tight */}
          {detailRows.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-charcoal-light uppercase tracking-wider mb-1.5">Details</p>
              <div className="space-y-1.5">
                {detailRows.map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-2 min-w-0">
                    <span className="text-[10px] text-charcoal-light uppercase tracking-wider shrink-0 w-16">{label}</span>
                    <span className="text-xs text-slate-200 truncate" title={String(value)}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call Notes — fits naturally under summary */}
          <CallNotesTile
            companyId={companyId}
            initialNotes={summaryData.call_notes}
            onNotesChange={onNotesChange}
          />

          {/* Research Notes — collapsible */}
          {d.research_notes?.length > 0 && (
            <CollapsibleSection icon={FileText} title="Research" count={d.research_notes.length}>
              <div className="space-y-2">
                {d.research_notes.map((note, i) => (
                  <div key={note.id || i} className="bg-prussian-700/40 rounded-lg p-2.5 border border-charcoal/20">
                    {note.summary && (
                      <p className="text-xs text-slate-300 leading-relaxed mb-1">{note.summary}</p>
                    )}
                    {note.source_url && (
                      <a href={note.source_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-teal hover:text-teal-300 transition-colors mb-1"
                        onClick={e => e.stopPropagation()}>
                        <Globe size={9} /><span className="truncate max-w-[200px]">{note.source_url}</span>
                        <ExternalLink size={8} />
                      </a>
                    )}
                    {!note.summary && note.raw_data && (
                      <p className="text-[10px] text-charcoal-light/80 leading-relaxed line-clamp-3">
                        {typeof note.raw_data === 'string' ? note.raw_data.slice(0, 200) : JSON.stringify(note.raw_data).slice(0, 200)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* ── RIGHT COLUMN — Action content (flex-1) ────────────────── */}
        <div className="flex-1 p-5 space-y-4 min-w-0 border-t border-charcoal/20 lg:border-t-0">

          {/* Talking Points */}
          {summaryData.talking_points && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={14} className="text-thistle" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Talking Points</span>
              </div>
              <div className="bg-prussian-700/30 rounded-xl p-3 border border-charcoal/20">
                <TalkingPointsPanel talkingPoints={summaryData.talking_points} />
              </div>
            </div>
          )}

          {/* People & Calling */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-teal" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">People</span>
              {(d.contacts?.length ?? 0) > 0 && (
                <span className="text-[10px] bg-teal/10 text-teal rounded-full px-1.5 py-0.5">{d.contacts.length}</span>
              )}
            </div>

            {!d.contacts?.length ? (
              <p className="text-xs text-charcoal-light py-2">No contacts found</p>
            ) : (
              <div>
                {d.contacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onCall={onCall}
                    callState={callState}
                    isCallAvailable={isCallAvailable}
                  />
                ))}
              </div>
            )}

            {/* Manual call toggle — slim */}
            <ManualCallToggle
              companyId={companyId}
              value={manualCall}
              onChange={val => {
                setManualCall(val)
                onManualCallUpdate?.(companyId, val)
              }}
            />
          </div>

          {/* Scripts — collapsible */}
          {d.call_scripts?.length > 0 && (
            <CollapsibleSection icon={Phone} title="Scripts" count={d.call_scripts.length}>
              <div className="space-y-2">
                {d.call_scripts.map(script => (
                  <ScriptCard key={script.id} script={script} />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Email Drafts — collapsible */}
          {d.email_drafts?.length > 0 && (
            <CollapsibleSection icon={Mail} title="Drafts" count={d.email_drafts.length}>
              <div className="space-y-2">
                {d.email_drafts.map((draft, i) => {
                  const statusColor = {
                    approved: 'text-teal bg-teal/10 border-teal/30',
                    sent:     'text-tea-dark bg-tea/10 border-tea/30',
                    draft:    'text-charcoal-light bg-charcoal/10 border-charcoal/30',
                  }[draft.status] || 'text-charcoal-light bg-charcoal/10 border-charcoal/30'
                  return (
                    <div key={draft.id || i} className="bg-prussian-700/40 rounded-lg p-3 border border-charcoal/20 hover:border-teal/20 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-slate-200 truncate flex-1">{draft.subject || 'Untitled Draft'}</p>
                        <span className={`badge border text-[10px] flex-shrink-0 ${statusColor}`}>{draft.status || 'draft'}</span>
                      </div>
                      {draft.body && (
                        <p className="text-xs text-charcoal-light/80 line-clamp-2 leading-relaxed">
                          {typeof draft.body === 'string' ? draft.body.slice(0, 200) : ''}
                          {typeof draft.body === 'string' && draft.body.length > 200 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* ── COMPANY CHAT (full width) ──────────────────────────────── */}
      <div className="px-5 pb-5 border-t border-charcoal/20 pt-4">
        <CompanyChat companyId={companyId} companyName={d.name || summaryData.name} />
      </div>
    </div>
  )
}

// ─── Phone Chip (collapsed card) ──────────────────────────────────────────────
function PhoneChip({ phone, contactName, onCall, callState, isCallAvailable }) {
  const [copied, setCopied] = useState(false)

  function copyPhone(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleCall(e) {
    e.stopPropagation()
    onCall(phone)
  }

  const isActive = callState === 'connecting' || callState === 'ringing' || callState === 'in-progress'

  return (
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-1 bg-prussian-700/60 rounded-lg px-2 py-1 border border-charcoal/30">
        <Phone size={10} className="text-charcoal-light flex-shrink-0" />
        <span className="text-xs text-slate-300 font-mono tabular-nums whitespace-nowrap">{phone}</span>
        {contactName && (
          <span className="text-xs text-charcoal-light/60 truncate max-w-[80px]" title={contactName}>
            ({contactName.split(' ')[0]})
          </span>
        )}
        <button
          onClick={copyPhone}
          title="Copy phone number"
          className="ml-0.5 p-0.5 rounded hover:bg-charcoal/30 transition-colors"
        >
          {copied
            ? <Check size={10} className="text-tea-dark" />
            : <Copy size={10} className="text-charcoal-light hover:text-slate-200" />}
        </button>
      </div>
      {isCallAvailable !== false && (
        <button
          onClick={handleCall}
          disabled={isActive}
          title={isActive ? 'Call in progress…' : `Call ${phone}`}
          className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
            isActive
              ? 'bg-tea/20 border-tea/40 text-tea-dark animate-pulse'
              : 'bg-teal/10 border-teal/30 hover:bg-teal/20 hover:border-teal/50 text-teal'
          }`}
        >
          {isActive
            ? <PhoneForwarded size={12} />
            : <PhoneCall size={12} />}
        </button>
      )}
    </div>
  )
}

// ─── Call Overlay ─────────────────────────────────────────────────────────────
function CallOverlay({ callState, duration, error, onHangUp, onReset, callingNumber }) {
  if (callState === 'idle') return null

  function formatDuration(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isLive = callState === 'in-progress'
  const isConnecting = callState === 'connecting' || callState === 'ringing'
  const isEnded = callState === 'disconnected'
  const isError = callState === 'error'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl border-2 transition-all ${
        isLive ? 'border-tea/50 shadow-tea/20' :
        isConnecting ? 'border-thistle/40 shadow-thistle/20' :
        isError ? 'border-red-500/40 shadow-red-500/10' :
        'border-charcoal/40'
      }`} style={{ background: 'linear-gradient(180deg, #0a2a4a 0%, #011936 100%)' }}>

        {/* Status bar */}
        <div className={`px-6 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest ${
          isLive ? 'bg-tea/15 text-tea-dark' :
          isConnecting ? 'bg-thistle/15 text-thistle' :
          isError ? 'bg-red-500/15 text-red-400' :
          'bg-charcoal/15 text-charcoal-light'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isLive ? 'bg-tea-dark animate-pulse' :
            isConnecting ? 'bg-thistle animate-pulse' :
            isError ? 'bg-red-400' :
            'bg-charcoal-light'
          }`} />
          {isLive ? 'Live Call' : isConnecting ? (callState === 'ringing' ? 'Ringing…' : 'Connecting…') : isError ? 'Call Failed' : 'Call Ended'}
        </div>

        {/* Main content */}
        <div className="px-8 py-10 flex flex-col items-center text-center">
          {/* Call icon */}
          <div className={`flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            isLive ? 'bg-tea/15 border-2 border-tea/30' :
            isConnecting ? 'bg-thistle/15 border-2 border-thistle/30' :
            isError ? 'bg-red-500/15 border-2 border-red-500/30' :
            'bg-charcoal/15 border-2 border-charcoal/30'
          }`}>
            {isLive ? (
              <PhoneCall size={32} className="text-tea-dark" />
            ) : isConnecting ? (
              <PhoneForwarded size={32} className="text-thistle animate-pulse" />
            ) : isError ? (
              <PhoneOff size={32} className="text-red-400" />
            ) : (
              <Phone size={32} className="text-charcoal-light" />
            )}
          </div>

          {/* Phone number */}
          <p className="text-2xl font-mono font-bold text-slate-100 tabular-nums tracking-wide">
            {callingNumber || 'Unknown'}
          </p>

          {/* Status / duration */}
          <p className={`text-sm mt-2 ${
            isLive ? 'text-tea-dark' :
            isConnecting ? 'text-thistle' :
            isError ? 'text-red-400' :
            'text-charcoal-light'
          }`}>
            {isLive && `Connected`}
            {callState === 'connecting' && 'Setting up call…'}
            {callState === 'ringing' && 'Ringing…'}
            {isError && (error || 'Call failed')}
            {isEnded && 'Call ended'}
          </p>

          {/* Duration display */}
          {(isLive || isEnded) && (
            <p className={`text-4xl font-mono font-bold tabular-nums mt-4 ${
              isLive ? 'text-tea-dark' : 'text-charcoal-light'
            }`}>
              {formatDuration(duration)}
            </p>
          )}

          {/* Connecting animation */}
          {isConnecting && (
            <div className="flex items-center gap-1.5 mt-6">
              {[0, 1, 2].map(i => (
                <div key={i}
                  className="w-2.5 h-2.5 rounded-full bg-thistle/60"
                  style={{
                    animation: 'pulse 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Audio level indicator for live calls */}
          {isLive && (
            <div className="flex items-end gap-1 mt-6 h-8">
              {[0,1,2,3,4,3,2,1,0].map((h, i) => (
                <div key={i}
                  className="w-1.5 bg-tea-dark/50 rounded-full"
                  style={{
                    height: `${12 + h * 4}px`,
                    animation: 'pulse 1s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-8 pb-8 flex justify-center gap-4">
          {isError ? (
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-charcoal/30 hover:bg-charcoal/40 border border-charcoal/50 text-slate-300 rounded-2xl px-8 py-4 text-base font-semibold transition-all"
            >
              Dismiss
            </button>
          ) : isEnded ? (
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-charcoal/30 hover:bg-charcoal/40 border border-charcoal/50 text-slate-300 rounded-2xl px-8 py-4 text-base font-semibold transition-all"
            >
              Close
            </button>
          ) : (
            <button
              onClick={onHangUp}
              className="flex items-center gap-3 bg-red-500/25 hover:bg-red-500/35 border-2 border-red-500/50 hover:border-red-500/70 text-red-400 rounded-2xl px-10 py-4 text-base font-bold transition-all"
            >
              <PhoneOff size={20} />
              End Call
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Call Notes Tile ──────────────────────────────────────────────────────────
function CallNotesTile({ companyId, initialNotes, onNotesChange }) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState(initialNotes || '')
  const toast = useToast()
  const dirty = notes !== lastSaved

  async function handleSave() {
    setSaving(true)
    try {
      await api.patch(`/companies/${companyId}`, { call_notes: notes })
      setLastSaved(notes)
      onNotesChange?.(companyId, notes)
      setSaved(true)
      toast('Notes saved ✅', 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast(`Save failed: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && dirty) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-2 mb-2">
        <StickyNote size={14} className="text-thistle" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Notes</span>
        {dirty && <span className="w-1.5 h-1.5 rounded-full bg-thistle flex-shrink-0" />}
        {saved && <CheckCircle size={12} className="text-tea-dark" />}
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add call notes, follow-ups, key takeaways…"
        rows={4}
        className="w-full bg-prussian-700/40 border border-charcoal/30 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-charcoal-light/40 focus:outline-none focus:border-thistle/40 focus:ring-1 focus:ring-thistle/20 resize-y transition-all"
      />
      <div className="flex items-center justify-between mt-1.5">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            dirty
              ? 'bg-thistle/15 border border-thistle/40 hover:bg-thistle/25 text-thistle'
              : 'bg-charcoal/10 border border-charcoal/20 text-charcoal-light/30 cursor-not-allowed'
          }`}
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </button>
        <span className="text-[10px] text-charcoal-light/30">⌘+Enter</span>
      </div>
    </div>
  )
}

// ─── Talking Points ───────────────────────────────────────────────────────────
function TalkingPointsPanel({ talkingPoints, compact = false }) {
  const [showFollowups, setShowFollowups] = useState(false)

  if (!talkingPoints) return null

  let parsed
  try {
    parsed = typeof talkingPoints === 'string' ? JSON.parse(talkingPoints) : talkingPoints
  } catch (_) { return null }

  if (!parsed?.points?.length) return null

  if (compact) {
    // Compact: show inline in collapsed card, first 2-3 points
    return (
      <div className="px-4 pb-3 pt-1 border-t border-charcoal/15" onClick={e => e.stopPropagation()}>
        <div className="space-y-1.5">
          {parsed.points.slice(0, 3).map((point, i) => (
            <p key={i} className="text-xs text-slate-300/80 leading-relaxed pl-3 border-l-2 border-teal/30">
              {point}
            </p>
          ))}
          {parsed.points.length > 3 && (
            <p className="text-xs text-charcoal-light/50 pl-3">+{parsed.points.length - 3} more…</p>
          )}
        </div>
      </div>
    )
  }

  // Full: expanded detail view
  return (
    <div className="space-y-3" onClick={e => e.stopPropagation()}>
      <div className="space-y-2.5">
        {parsed.points.map((point, i) => (
          <div key={i} className="flex gap-3 group">
            <span className="text-xs text-teal/50 font-mono mt-0.5 flex-shrink-0 w-4 text-right">{i + 1}</span>
            <p className="text-sm text-slate-200 leading-relaxed border-l-2 border-teal/20 pl-3 group-hover:border-teal/50 transition-colors cursor-text select-text">
              {point}
            </p>
          </div>
        ))}
      </div>

      {parsed.followups?.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowFollowups(!showFollowups)}
            className="flex items-center gap-1.5 text-xs text-charcoal-light hover:text-thistle transition-colors"
          >
            {showFollowups ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Follow-up questions ({parsed.followups.length})
          </button>
          {showFollowups && (
            <div className="mt-2 space-y-2 pl-1">
              {parsed.followups.map((q, i) => (
                <p key={i} className="text-sm text-thistle/80 leading-relaxed pl-3 border-l-2 border-thistle/20 select-text">
                  {q}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Company Card ─────────────────────────────────────────────────────────────
function CompanyCard({ company, draftCompanyIds, scriptCompanyIds, onAction, actionLoading, detailCache, onCacheUpdate, onCall, callState, isCallAvailable, onNotesChange }) {
  const [expanded, setExpanded] = useState(false)
  const [manualCall, setManualCall] = useState(company.manual_call_made ?? 0)

  function handleManualCallUpdate(id, val) {
    setManualCall(val)
  }

  const showExpanded = expanded

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${expanded ? 'border-teal/30 shadow-lg shadow-teal/5' : 'hover:border-charcoal/50'}`}>
      {/* ── Collapsed Header ───────────────────────────────────── */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand chevron */}
        <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-charcoal-light transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
          <ChevronRight size={15} />
        </div>

        {/* Company name + website */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 group-hover:text-teal truncate">{company.name}</span>
            {manualCall ? (
              <span className="text-xs text-tea-dark" title="Manual call made">📞✅</span>
            ) : null}
            {company.call_notes && company.call_notes.trim() && (
              <span className="text-xs text-thistle/70" title="Has notes">📝</span>
            )}
          </div>
          {company.website && (
            <span className="text-charcoal-light/60 text-xs truncate block">{company.website.replace(/^https?:\/\//,'')}</span>
          )}
          {/* Phone on mobile (hidden on desktop where it shows inline) */}
          {company.primary_phone && (
            <div className="mt-1 md:hidden">
              <PhoneChip
                phone={company.primary_phone}
                contactName={company.primary_phone_contact}
                onCall={onCall}
                callState={callState}
                isCallAvailable={isCallAvailable}
              />
            </div>
          )}
        </div>

        {/* Phone chip */}
        {company.primary_phone && (
          <div className="flex-shrink-0 hidden md:block">
            <PhoneChip
              phone={company.primary_phone}
              contactName={company.primary_phone_contact}
              onCall={onCall}
              callState={callState}
              isCallAvailable={isCallAvailable}
            />
          </div>
        )}

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <span className={`badge border text-xs ${typeBadge(company.type)}`}>{company.type}</span>
          <PriorityBadge priority={company.priority} />
          <ScoreBadge score={company.qualification_score} />
          {(company.verification_score != null || company.verification_status) && (
            <VerificationBadge score={company.verification_score} status={company.verification_status} size="sm" />
          )}
          <AgentQABadge score={company.agent_qa_score} notes={company.agent_qa_notes} size="sm" />

          <div className="hidden sm:block">
            <StatusDots company={company} draftCompanyIds={draftCompanyIds} scriptCompanyIds={scriptCompanyIds} />
          </div>

          <QuickActions company={company} onAction={onAction} loading={actionLoading} />
        </div>
      </div>

      {/* ── Talking Points (collapsed preview) ────────────────────── */}
      {!showExpanded && company.talking_points && (
        <TalkingPointsPanel talkingPoints={company.talking_points} compact />
      )}

      {/* ── Expanded Content ────────────────────────────────────── */}
      {showExpanded && (
        <ExpandedDetail
          companyId={company.id}
          summaryData={company}
          draftCompanyIds={draftCompanyIds}
          scriptCompanyIds={scriptCompanyIds}
          onManualCallUpdate={handleManualCallUpdate}
          onCall={onCall}
          callState={callState}
          isCallAvailable={isCallAvailable}
          onNotesChange={onNotesChange}
        />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Companies() {
  const [companies,        setCompanies]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const [search,           setSearch]           = useState('')
  const [filterPriority,   setFilterPriority]   = useState('all')
  const [filterType,       setFilterType]       = useState('all')
  const [sort,             setSort]             = useState({ key: 'qualification_score', dir: 'desc' })
  const [actionLoading,    setActionLoading]    = useState(null)
  const [draftCompanyIds,  setDraftCompanyIds]  = useState(new Set())
  const [scriptCompanyIds, setScriptCompanyIds] = useState(new Set())
  const [callingNumber,    setCallingNumber]    = useState(null)
  const [filterHasNotes,   setFilterHasNotes]   = useState(false)
  const [filterHasPhone,   setFilterHasPhone]   = useState(false)
  const [filterCalled,     setFilterCalled]     = useState(false)
  const detailCache = useRef({})

  const searchRef      = useRef(null)
  const toast          = useToast()
  const [searchParams] = useSearchParams()

  // Browser calling
  const browserCall = useBrowserCall()

  const handleBrowserCall = useCallback((phoneNumber) => {
    if (browserCall.isActive) {
      toast('A call is already in progress', 'error')
      return
    }
    setCallingNumber(phoneNumber)
    browserCall.call(phoneNumber)
    toast(`Calling ${phoneNumber}…`, 'info')
  }, [browserCall, toast])

  const handleNotesChange = useCallback((companyId, notes) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, call_notes: notes } : c))
  }, [])

  async function load() {
    try {
      setLoading(true)
      const [companiesRes, draftsRes, scriptsRes] = await Promise.all([
        api.get('/companies?limit=100'),
        api.get('/email/drafts').catch(() => ({ data: [] })),
        api.get('/call-scripts').catch(() => ({ data: [] })),
      ])
      setCompanies(companiesRes.data || [])
      const drafts = draftsRes.data || []
      setDraftCompanyIds(new Set(drafts.map(d => d.company_id || d.companyId).filter(Boolean)))
      const scripts = scriptsRes.data || []
      setScriptCompanyIds(new Set(scripts.map(s => s.company_id).filter(Boolean)))
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (searchParams.get('focus') === 'search') searchRef.current?.focus()
    function onFocusSearch() { searchRef.current?.focus() }
    window.addEventListener('focus-search', onFocusSearch)
    return () => window.removeEventListener('focus-search', onFocusSearch)
  }, [searchParams])

  const handleQuickAction = useCallback(async (companyId, action) => {
    const key = `${companyId}-${action}`
    setActionLoading(key)
    try {
      if (action === 'research') {
        await api.post(`/companies/${companyId}/research`, {})
        toast('Research triggered successfully', 'success')
      } else if (action === 'call') {
        await api.post(`/voice/call-plan/${companyId}`, {})
        toast('Call plan generated', 'success')
        const scriptsRes = await api.get('/call-scripts').catch(() => ({ data: [] }))
        setScriptCompanyIds(new Set((scriptsRes.data || []).map(s => s.company_id).filter(Boolean)))
      } else if (action === 'email') {
        toast('Opening company detail to generate email drafts…', 'info')
        setTimeout(() => { window.location.href = `/companies/${companyId}#emails` }, 600)
        return
      }
    } catch (e) {
      toast(`Failed: ${e.message}`, 'error')
    } finally {
      setActionLoading(null)
    }
  }, [toast])

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  const filtered = useMemo(() => {
    let arr = [...companies]
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.description||'').toLowerCase().includes(q) ||
        (c.industry_segment||'').toLowerCase().includes(q)
      )
    }
    if (filterPriority !== 'all') arr = arr.filter(c => c.priority === filterPriority)
    if (filterType     !== 'all') arr = arr.filter(c => c.type === filterType)
    if (filterHasNotes) arr = arr.filter(c => c.call_notes && c.call_notes.trim() !== '')
    if (filterHasPhone) arr = arr.filter(c => c.primary_phone)
    if (filterCalled) arr = arr.filter(c => c.manual_call_made)
    arr.sort((a, b) => {
      const va = a[sort.key] ?? '', vb = b[sort.key] ?? ''
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [companies, search, filterPriority, filterType, filterHasNotes, filterHasPhone, filterCalled, sort])

  function SortBtn({ col, children }) {
    const active = sort.key === col
    return (
      <button
        onClick={() => toggleSort(col)}
        className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${active ? 'text-teal' : 'text-charcoal-light hover:text-slate-300'}`}
      >
        {children}
        {active
          ? sort.dir === 'asc'
            ? <ChevronUp size={11} className="text-teal" />
            : <ChevronDown size={11} className="text-teal" />
          : <ChevronUp size={11} className="opacity-30" />
        }
      </button>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-charcoal-light text-sm mt-0.5">{companies.length} companies loaded</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(filtered)} disabled={filtered.length === 0} className="btn-secondary flex items-center gap-2" title="Export current view as CSV">
            <Download size={14} />
            Export CSV
          </button>
          <button onClick={load} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search companies… (press / to focus)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && (setSearch(''), e.target.blur())}
            className="input w-full pl-8"
          />
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="select">
          <option value="all">All Priorities</option>
          <option value="A">Priority A</option>
          <option value="B">Priority B</option>
          <option value="C">Priority C</option>
        </select>
        <button
          onClick={() => setFilterHasPhone(!filterHasPhone)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
            filterHasPhone
              ? 'bg-teal/15 border-teal/40 text-teal'
              : 'bg-transparent border-charcoal/30 text-charcoal-light hover:border-charcoal/50 hover:text-slate-300'
          }`}
        >
          <Phone size={12} />
          Has Phone
        </button>
        <button
          onClick={() => setFilterCalled(!filterCalled)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
            filterCalled
              ? 'bg-tea/15 border-tea/40 text-tea-dark'
              : 'bg-transparent border-charcoal/30 text-charcoal-light hover:border-charcoal/50 hover:text-slate-300'
          }`}
        >
          <PhoneCall size={12} />
          Called
        </button>
        <button
          onClick={() => setFilterHasNotes(!filterHasNotes)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
            filterHasNotes
              ? 'bg-thistle/15 border-thistle/40 text-thistle'
              : 'bg-transparent border-charcoal/30 text-charcoal-light hover:border-charcoal/50 hover:text-slate-300'
          }`}
        >
          <StickyNote size={12} />
          Has Notes
        </button>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="select">
          <option value="all">All Types</option>
          <option value="operator">Operator</option>
          <option value="lender">Lender</option>
        </select>
        {(search || filterPriority !== 'all' || filterType !== 'all' || filterHasNotes || filterHasPhone || filterCalled) && (
          <button
            onClick={() => { setSearch(''); setFilterPriority('all'); setFilterType('all'); setFilterHasNotes(false); setFilterHasPhone(false); setFilterCalled(false) }}
            className="text-charcoal-light hover:text-slate-200 text-xs transition-colors"
          >
            Clear filters
          </button>
        )}
        {/* Sort Controls */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-charcoal-light hidden sm:block">Sort:</span>
          <SortBtn col="qualification_score">Score</SortBtn>
          <SortBtn col="priority">Priority</SortBtn>
          <SortBtn col="name">Name</SortBtn>
        </div>
      </div>

      {/* Call Overlay */}
      <CallOverlay
        callState={browserCall.callState}
        duration={browserCall.duration}
        error={browserCall.error}
        onHangUp={browserCall.hangUp}
        onReset={browserCall.reset}
        callingNumber={browserCall.callingNumber || callingNumber}
      />

      {/* Company Cards */}
      {error ? (
        <div className="card p-6">
          <p className="text-red-400">{error}</p>
          <button onClick={load} className="btn-secondary mt-3">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-charcoal-light">
          <Building2 size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No companies match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              draftCompanyIds={draftCompanyIds}
              scriptCompanyIds={scriptCompanyIds}
              onAction={handleQuickAction}
              actionLoading={actionLoading}
              detailCache={detailCache}
              onCall={handleBrowserCall}
              callState={browserCall.callState}
              isCallAvailable={browserCall.isAvailable}
              onNotesChange={handleNotesChange}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && !loading && (
        <p className="text-charcoal-light/60 text-xs text-right">
          Showing {filtered.length} of {companies.length} companies
        </p>
      )}
    </div>
  )
}
