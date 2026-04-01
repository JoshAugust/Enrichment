import { useState } from 'react'
import {
  RefreshCw, CheckCircle, AlertCircle, XCircle, Loader2,
  Database, Clock, Zap
} from 'lucide-react'
import { api } from '../../lib/api'

function mockEnrichmentStatus(entity) {
  const sources = [
    { name: 'LinkedIn',    status: 'ok',   last_checked: new Date(Date.now() - 2*3600000).toISOString() },
    { name: 'Crunchbase',  status: 'ok',   last_checked: new Date(Date.now() - 5*3600000).toISOString() },
    { name: 'GitHub',      status: 'warn', last_checked: new Date(Date.now() - 24*3600000).toISOString() },
    { name: 'News API',    status: 'ok',   last_checked: new Date(Date.now() - 1*3600000).toISOString() },
    { name: 'Web Scraper', status: 'err',  last_checked: null },
  ]
  const totalFields  = 20
  const filledFields = entity ? Math.floor(Math.random() * 8) + 10 : 12
  return {
    last_enriched:    new Date(Date.now() - 3*24*3600000).toISOString(),
    completeness_pct: Math.round((filledFields / totalFields) * 100),
    filled_fields:    filledFields,
    total_fields:     totalFields,
    sources,
  }
}

function SourceRow({ source }) {
  const cfg = {
    ok:   { icon: CheckCircle,  color: 'text-tea-dark',      bg: 'bg-tea/10 border-tea/20',       label: 'OK' },
    warn: { icon: AlertCircle,  color: 'text-amber-400',     bg: 'bg-amber-400/10 border-amber-400/20', label: 'Stale' },
    err:  { icon: XCircle,      color: 'text-red-400',       bg: 'bg-red-400/10 border-red-400/20',     label: 'Error' },
  }[source.status] || { icon: XCircle, color: 'text-charcoal-light', bg: 'bg-prussian-700 border-charcoal/30', label: '?' }
  const Icon = cfg.icon

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon size={13} className={cfg.color} />
        <span className="text-sm text-slate-300">{source.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {source.last_checked && (
          <span className="text-xs text-charcoal-light/60">{timeAgo(source.last_checked)}</span>
        )}
        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${cfg.color} ${cfg.bg}`}>
          {cfg.label}
        </span>
      </div>
    </div>
  )
}

function CompletenessMeter({ pct }) {
  const color     = pct >= 75 ? 'bg-tea-dark'  : pct >= 50 ? 'bg-thistle' : 'bg-amber-500'
  const textColor = pct >= 75 ? 'text-tea-dark' : pct >= 50 ? 'text-thistle' : 'text-amber-400'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-charcoal-light font-medium uppercase tracking-wider">Data Completeness</span>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-prussian rounded-full overflow-hidden">
        <div className={`h-full rounded-full progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ResultsPreview({ results }) {
  if (!results) return null
  const items = results.new_fields || results.found || []
  if (!items.length) {
    return (
      <div className="bg-prussian-700/40 rounded-lg p-3 border border-charcoal/30">
        <p className="text-xs text-charcoal-light">No new data found in this enrichment run.</p>
      </div>
    )
  }
  return (
    <div className="bg-tea/5 rounded-lg p-3 border border-tea/20">
      <p className="text-xs font-semibold text-tea-dark uppercase tracking-wider mb-2">
        ✓ {items.length} new data point{items.length !== 1 ? 's' : ''} found
      </p>
      <ul className="space-y-1">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="text-xs text-charcoal-light flex items-start gap-1.5">
            <Zap size={10} className="text-tea-dark flex-shrink-0 mt-0.5" />
            {typeof item === 'string' ? item : item.label || JSON.stringify(item)}
          </li>
        ))}
        {items.length > 5 && <li className="text-xs text-charcoal-light/60">+ {items.length-5} more…</li>}
      </ul>
    </div>
  )
}

function timeAgo(iso) {
  const d = Date.now() - new Date(iso).getTime()
  const h = Math.floor(d / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function EnrichmentPanel({ entityType = 'company', entityId, compact = false }) {
  const [status,        setStatus]        = useState(null)
  const [enriching,     setEnriching]     = useState(false)
  const [results,       setResults]       = useState(null)
  const [apiUnavailable,setApiUnavailable]= useState(false)
  const [expanded,      setExpanded]      = useState(!compact)

  async function enrich() {
    setEnriching(true)
    setResults(null)
    try {
      const endpoint = entityType === 'company'
        ? `/enrichment/company/${entityId}`
        : `/enrichment/contact/${entityId}`
      const res = await api.post(endpoint, {})
      setStatus(res.status || mockEnrichmentStatus())
      setResults(res)
      setApiUnavailable(false)
    } catch {
      setApiUnavailable(true)
      setStatus(mockEnrichmentStatus({ id: entityId }))
      setResults({ new_fields: ['LinkedIn profile updated', 'Funding round data synced', 'Leadership contacts found'] })
    } finally {
      setEnriching(false)
    }
  }

  const displayStatus = status || (entityId ? mockEnrichmentStatus({ id: entityId }) : null)

  if (!displayStatus) {
    return (
      <div className="bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-charcoal-light" />
            <span className="text-sm font-medium text-slate-300">Enrichment Data</span>
          </div>
          <button onClick={enrich} disabled={enriching} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
            {enriching ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Enrich Now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-prussian rounded-xl border border-charcoal/30 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-prussian-700/30 border-b border-charcoal/20 cursor-pointer hover:bg-prussian-700/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <Database size={15} className="text-teal" />
          <span className="text-sm font-semibold text-slate-200">Enrichment Status</span>
          {apiUnavailable && (
            <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded px-1.5 py-0.5">Demo</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-charcoal-light">
            <Clock size={11} />Last enriched {timeAgo(displayStatus.last_enriched)}
          </div>
          <button
            onClick={e => { e.stopPropagation(); enrich() }}
            disabled={enriching}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            {enriching
              ? <><Loader2 size={11} className="animate-spin" /> Enriching…</>
              : <><RefreshCw size={11} /> Enrich Now</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4 tab-content">
          {enriching && (
            <div className="bg-teal/5 border border-teal/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 size={13} className="animate-spin text-teal" />
                <span className="text-sm text-teal">Querying data sources…</span>
              </div>
              <div className="h-1.5 bg-prussian rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {apiUnavailable && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-400">
                ⚠️ Enrichment API not yet available — showing demo data.
              </p>
            </div>
          )}

          <CompletenessMeter pct={displayStatus.completeness_pct} />
          <div className="text-xs text-charcoal-light/60 -mt-2">
            {displayStatus.filled_fields} of {displayStatus.total_fields} fields populated
          </div>

          <div>
            <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Data Sources</p>
            <div className="divide-y divide-charcoal/10">
              {displayStatus.sources.map(s => <SourceRow key={s.name} source={s} />)}
            </div>
          </div>

          {results && <ResultsPreview results={results} />}
        </div>
      )}
    </div>
  )
}
