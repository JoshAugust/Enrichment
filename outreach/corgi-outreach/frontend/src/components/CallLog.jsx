import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Phone, PhoneCall, PhoneOff, PhoneMissed, Voicemail,
  ChevronDown, ChevronUp, Play, Mail, Clock, DollarSign,
  Calendar, FileText, MessageSquare, Search, Filter, X,
  RefreshCw, TrendingUp, CheckCircle, XCircle, AlertCircle,
  Users, BarChart2, Mic
} from 'lucide-react'
import { api } from '../lib/api'

// ─── Badge helpers ────────────────────────────────────────────────────────────

function statusBadge(status) {
  switch (status) {
    case 'ringing':     return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
    case 'in_progress': return 'bg-teal/20 border-teal/40 text-teal animate-pulse'
    case 'completed':   return 'bg-teal/15 border-teal/30 text-teal'
    case 'failed':      return 'bg-red-500/20 border-red-500/40 text-red-300'
    case 'voicemail':   return 'bg-purple-500/20 border-purple-500/40 text-purple-300'
    case 'no_answer':   return 'bg-charcoal/40 border-charcoal/60 text-charcoal-light'
    default:            return 'bg-charcoal/30 border-charcoal/50 text-charcoal-light'
  }
}

function statusIcon(status) {
  switch (status) {
    case 'ringing':     return <PhoneCall size={11} />
    case 'in_progress': return <Phone size={11} />
    case 'completed':   return <CheckCircle size={11} />
    case 'failed':      return <PhoneOff size={11} />
    case 'voicemail':   return <Voicemail size={11} />
    case 'no_answer':   return <PhoneMissed size={11} />
    default:            return <Phone size={11} />
  }
}

function outcomeBadge(outcome) {
  switch (outcome) {
    case 'meeting_booked':    return 'bg-green-500/20 border-green-500/40 text-green-300'
    case 'interested':        return 'bg-teal/15 border-teal/30 text-teal'
    case 'not_interested':    return 'bg-red-500/20 border-red-500/40 text-red-300'
    case 'callback_requested':return 'bg-amber-500/20 border-amber-500/40 text-amber-300'
    case 'voicemail_left':    return 'bg-purple-500/20 border-purple-500/40 text-purple-300'
    default:                  return 'bg-charcoal/30 border-charcoal/50 text-charcoal-light'
  }
}

function formatDuration(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatCost(cost) {
  if (cost == null) return '—'
  return `$${Number(cost).toFixed(3)}`
}

function formatDate(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
         ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ─── Transcript parser ────────────────────────────────────────────────────────

function parseTranscript(raw) {
  if (!raw) return []
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
  const lines = text.split('\n').filter(l => l.trim())
  const messages = []
  let current = null

  for (const line of lines) {
    const assistantMatch = line.match(/^(?:ASSISTANT|AI|BOT|AGENT):\s*(.*)/i)
    const userMatch      = line.match(/^(?:USER|HUMAN|CONTACT|PROSPECT|CALLER):\s*(.*)/i)

    if (assistantMatch) {
      if (current) messages.push(current)
      current = { role: 'assistant', text: assistantMatch[1] }
    } else if (userMatch) {
      if (current) messages.push(current)
      current = { role: 'user', text: userMatch[1] }
    } else if (current) {
      current.text += ' ' + line.trim()
    } else {
      // Unattributed line — treat as system/info
      messages.push({ role: 'system', text: line.trim() })
    }
  }
  if (current) messages.push(current)
  return messages
}

// ─── Expanded detail panel ────────────────────────────────────────────────────

function ExpandedRow({ call }) {
  const transcript = parseTranscript(call.transcript)
  const preferredTimes = call.preferred_times
    ? (typeof call.preferred_times === 'string' ? call.preferred_times : JSON.stringify(call.preferred_times, null, 2))
    : null

  return (
    <tr>
      <td colSpan={7} className="px-0 pb-0 pt-0">
        <div className="bg-prussian-700/20 border-t border-b border-charcoal/20 p-5 space-y-5 tab-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Left: Transcript */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={13} className="text-teal" />
                Transcript
              </h3>
              {transcript.length === 0 ? (
                <p className="text-charcoal-light text-sm italic">No transcript available</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {transcript.map((msg, i) => {
                    if (msg.role === 'system') {
                      return (
                        <div key={i} className="flex justify-center">
                          <span className="text-xs text-charcoal-light/60 italic bg-prussian-700/40 px-3 py-1 rounded-full">
                            {msg.text}
                          </span>
                        </div>
                      )
                    }
                    const isAssistant = msg.role === 'assistant'
                    return (
                      <div key={i} className={`flex ${isAssistant ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          isAssistant
                            ? 'bg-teal/15 border border-teal/25 text-slate-200 rounded-tr-sm'
                            : 'bg-prussian-600/60 border border-charcoal/30 text-slate-300 rounded-tl-sm'
                        }`}>
                          <p className={`text-xs font-semibold mb-0.5 ${isAssistant ? 'text-teal' : 'text-charcoal-light'}`}>
                            {isAssistant ? 'AI Agent' : call.contact_name || 'Contact'}
                          </p>
                          {msg.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="space-y-4">

              {/* AI Summary */}
              {call.summary && (
                <div className="bg-teal/8 border border-teal/20 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-teal uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BarChart2 size={13} />
                    AI Summary
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{call.summary}</p>
                </div>
              )}

              {/* Prospect Email */}
              {call.prospect_email && (
                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Mail size={13} />
                    Captured Email
                  </h3>
                  <a
                    href={`mailto:${call.prospect_email}`}
                    className="text-sm text-amber-300 hover:text-amber-200 font-mono underline underline-offset-2"
                  >
                    {call.prospect_email}
                  </a>
                </div>
              )}

              {/* Preferred Times */}
              {preferredTimes && (
                <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={13} />
                    Preferred Meeting Times
                  </h3>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{preferredTimes}</p>
                </div>
              )}

              {/* Recording */}
              {call.recording_url && (
                <div className="bg-prussian-700/40 border border-charcoal/30 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Mic size={13} />
                    Recording
                  </h3>
                  <a
                    href={call.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 btn-secondary text-xs px-3 py-1.5"
                  >
                    <Play size={12} fill="currentColor" />
                    Play Recording
                  </a>
                </div>
              )}

              {/* Notes */}
              {call.notes && (
                <div className="bg-prussian-700/30 border border-charcoal/20 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={13} />
                    Notes
                  </h3>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{call.notes}</p>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-prussian-700/30 rounded-xl p-3 border border-charcoal/20">
                  <p className="text-xs text-charcoal-light mb-1">Duration</p>
                  <p className="text-sm font-medium text-slate-200">{formatDuration(call.duration_seconds)}</p>
                </div>
                <div className="bg-prussian-700/30 rounded-xl p-3 border border-charcoal/20">
                  <p className="text-xs text-charcoal-light mb-1">Cost</p>
                  <p className="text-sm font-medium text-slate-200">{formatCost(call.call_cost)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Main CallLog component ───────────────────────────────────────────────────

export default function CallLog() {
  const [calls, setCalls]           = useState([])
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus]   = useState('')
  const [filterOutcome, setFilterOutcome] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const intervalRef = useRef(null)

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [callsRes, statsRes] = await Promise.all([
        api.get('/calls/results'),
        api.get('/calls/stats'),
      ])
      setCalls(callsRes.data || [])
      setStats(statsRes)
      setLastRefresh(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    intervalRef.current = setInterval(() => loadData(true), 15000)
    return () => clearInterval(intervalRef.current)
  }, [loadData])

  // Live call detection
  const liveCalls = calls.filter(c => c.status === 'in_progress' || c.status === 'ringing')
  const hasLive = liveCalls.length > 0

  // Unique companies for filter
  const uniqueCompanies = [...new Set(calls.map(c => c.company_name).filter(Boolean))].sort()

  // Filter + search
  const filtered = calls.filter(c => {
    if (filterStatus  && c.status  !== filterStatus)  return false
    if (filterOutcome && c.outcome !== filterOutcome) return false
    if (filterCompany && c.company_name !== filterCompany) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (c.company_name || '').toLowerCase().includes(q) ||
        (c.contact_name || '').toLowerCase().includes(q) ||
        (c.outcome || '').toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const anyFilter = filterStatus || filterOutcome || filterCompany || search

  function clearFilters() {
    setSearch('')
    setFilterStatus('')
    setFilterOutcome('')
    setFilterCompany('')
  }

  // ── Skeleton loader ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="card">
          <div className="skeleton h-12 rounded-t-xl" />
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 mx-4 my-2 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Live Call Banner */}
      {hasLive && (
        <div className="card p-4 border-teal/40 bg-teal/5 flex items-center gap-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal" />
          </span>
          <div>
            <p className="text-sm font-semibold text-teal">
              {liveCalls.length === 1 ? 'Call in progress' : `${liveCalls.length} calls in progress`}
            </p>
            <p className="text-xs text-charcoal-light">
              {liveCalls.map(c => c.company_name || 'Unknown').join(', ')} · Auto-refreshing every 15s
            </p>
          </div>
          <div className="ml-auto text-xs text-charcoal-light">
            {lastRefresh && `Last updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-in">
          <StatCard
            icon={<Phone size={16} className="text-teal" />}
            label="Total Calls"
            value={stats.total_calls ?? calls.length}
          />
          <StatCard
            icon={<CheckCircle size={16} className="text-green-400" />}
            label="Meetings Booked"
            value={stats.meetings_booked ?? 0}
            accent="text-green-400"
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-teal" />}
            label="Interested"
            value={stats.interested ?? 0}
            accent="text-teal"
          />
          <StatCard
            icon={<XCircle size={16} className="text-red-400" />}
            label="Not Interested"
            value={stats.not_interested ?? 0}
            accent="text-red-400"
          />
          <StatCard
            icon={<Clock size={16} className="text-thistle" />}
            label="Avg Duration"
            value={formatDuration(Math.round(stats.avg_duration_seconds ?? 0))}
            accent="text-thistle"
          />
          <StatCard
            icon={<DollarSign size={16} className="text-amber-400" />}
            label="Total Cost"
            value={formatCost(stats.total_cost ?? 0)}
            accent="text-amber-400"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-800/40">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </p>
        </div>
      )}

      {/* Filters + Table */}
      <div className="card">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-charcoal/20 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <Search size={14} className="text-charcoal-light flex-shrink-0" />
            <input
              type="text"
              placeholder="Search company, contact…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input flex-1 py-1.5 text-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="select text-xs py-1.5"
          >
            <option value="">All statuses</option>
            <option value="ringing">Ringing</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="voicemail">Voicemail</option>
            <option value="no_answer">No Answer</option>
          </select>

          <select
            value={filterOutcome}
            onChange={e => setFilterOutcome(e.target.value)}
            className="select text-xs py-1.5"
          >
            <option value="">All outcomes</option>
            <option value="meeting_booked">Meeting Booked</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not Interested</option>
            <option value="callback_requested">Callback Requested</option>
            <option value="voicemail_left">Voicemail Left</option>
          </select>

          {uniqueCompanies.length > 0 && (
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="select text-xs py-1.5"
            >
              <option value="">All companies</option>
              {uniqueCompanies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {anyFilter && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
              <X size={12} /> Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-charcoal-light">
              {filtered.length} / {calls.length} calls
            </span>
            <button
              onClick={() => loadData(true)}
              className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-charcoal-light text-sm gap-2">
            <Users size={20} className="opacity-40" />
            {calls.length === 0 ? 'No calls recorded yet' : 'No calls match your filters'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-prussian-700/30 border-b border-charcoal/20">
                <tr>
                  <th className="th">Company</th>
                  <th className="th">Contact</th>
                  <th className="th">Status</th>
                  <th className="th">Outcome</th>
                  <th className="th">Duration</th>
                  <th className="th">Cost</th>
                  <th className="th">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((call) => {
                  const isExpanded = expandedId === call.id
                  const isLive     = call.status === 'in_progress' || call.status === 'ringing'
                  return [
                    <tr
                      key={call.id}
                      onClick={() => setExpandedId(isExpanded ? null : call.id)}
                      className={`border-b border-charcoal/15 cursor-pointer transition-colors ${
                        isExpanded
                          ? 'bg-prussian-700/40 border-charcoal/30'
                          : 'hover:bg-prussian-700/30'
                      } ${isLive ? 'bg-teal/5' : ''}`}
                    >
                      <td className="td">
                        <span className="text-slate-200 font-medium text-sm">
                          {call.company_name || <span className="text-charcoal-light text-xs">Unknown</span>}
                        </span>
                        {isLive && (
                          <span className="ml-2 relative inline-flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
                          </span>
                        )}
                      </td>
                      <td className="td text-slate-300 text-sm">
                        {call.contact_name || '—'}
                      </td>
                      <td className="td">
                        <span className={`badge border gap-1 ${statusBadge(call.status)}`}>
                          {statusIcon(call.status)}
                          {call.status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="td">
                        {call.outcome ? (
                          <span className={`badge border ${outcomeBadge(call.outcome)}`}>
                            {call.outcome.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-charcoal-light text-xs">—</span>
                        )}
                      </td>
                      <td className="td text-charcoal-light text-sm font-mono">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="td text-charcoal-light text-sm font-mono">
                        {formatCost(call.call_cost)}
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-charcoal-light text-xs">{formatDate(call.created_at)}</span>
                          {isExpanded
                            ? <ChevronUp size={14} className="text-charcoal-light flex-shrink-0" />
                            : <ChevronDown size={14} className="text-charcoal-light flex-shrink-0" />
                          }
                        </div>
                      </td>
                    </tr>,
                    isExpanded && <ExpandedRow key={`${call.id}-detail`} call={call} />
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent = 'text-slate-200' }) {
  return (
    <div className="bg-prussian border border-charcoal/40 rounded-xl p-4"
         style={{ boxShadow: '0 4px 24px rgba(1,15,34,0.5)' }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-charcoal-light uppercase tracking-wider font-medium truncate">{label}</p>
      </div>
      <p className={`text-xl font-bold stat-number ${accent}`}>{value ?? '—'}</p>
    </div>
  )
}
