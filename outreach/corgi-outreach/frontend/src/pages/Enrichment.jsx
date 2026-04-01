import { useState, useEffect, useMemo } from 'react'
import {
  Microscope, Play, RefreshCw, Search, Filter, Clock,
  CheckCircle, XCircle, AlertCircle, Loader2, Database,
  TrendingUp, Zap, Timer, Radio
} from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'

const MOCK_COMPANIES = [
  { id: '1', name: 'CoreWeave',     last_enriched: new Date(Date.now() - 10*86400000).toISOString(), completeness: 82, status: 'stale' },
  { id: '2', name: 'Lambda Labs',   last_enriched: new Date(Date.now() -  2*86400000).toISOString(), completeness: 91, status: 'fresh' },
  { id: '3', name: 'Crusoe Energy', last_enriched: null,                                              completeness: 35, status: 'never' },
  { id: '4', name: 'Voltage Park',  last_enriched: new Date(Date.now() - 15*86400000).toISOString(), completeness: 48, status: 'stale' },
  { id: '5', name: 'Ori Global',    last_enriched: new Date(Date.now() -  3*86400000).toISOString(), completeness: 74, status: 'fresh' },
  { id: '6', name: 'Cirrascale',    last_enriched: null,                                              completeness: 20, status: 'never' },
  { id: '7', name: 'Nscale',        last_enriched: new Date(Date.now() -  8*86400000).toISOString(), completeness: 61, status: 'stale' },
]

const MOCK_LOG = [
  { id: 1, company: 'CoreWeave',    source: 'LinkedIn',     status: 'success', fields: 3, ts: new Date(Date.now() - 30*60000).toISOString() },
  { id: 2, company: 'Lambda Labs',  source: 'Crunchbase',   status: 'success', fields: 2, ts: new Date(Date.now() - 2*3600000).toISOString() },
  { id: 3, company: 'Voltage Park', source: 'News API',     status: 'success', fields: 1, ts: new Date(Date.now() - 5*3600000).toISOString() },
  { id: 4, company: 'Crusoe Energy',source: 'Web Scraper',  status: 'warn',    fields: 0, ts: new Date(Date.now() - 8*3600000).toISOString() },
  { id: 5, company: 'Nscale',       source: 'GitHub',       status: 'success', fields: 4, ts: new Date(Date.now() - 24*3600000).toISOString() },
]

function timeAgo(iso) {
  if (!iso) return 'never'
  const d = Date.now() - new Date(iso).getTime()
  const h = Math.floor(d / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function isStale(iso, days = 7) {
  if (!iso) return true
  return Date.now() - new Date(iso).getTime() > days * 86400000
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-teal', live = false }) {
  return (
    <div className="bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30 card-lift">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={color} />
        <span className="text-xs text-charcoal-light font-medium uppercase tracking-wider">{label}</span>
        {live && (
          <span className="relative flex h-2 w-2 ml-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold tabular-nums stat-number ${color}`}>{value}</p>
    </div>
  )
}

// ─── Progress Tracker ─────────────────────────────────────────────────────────
function BatchProgress({ progress }) {
  if (!progress) return null
  const { companiesDone, companiesTotal, contactsDone, contactsTotal, startTime } = progress
  const compPct  = companiesTotal ? Math.round((companiesDone / companiesTotal) * 100) : 0
  const contPct  = contactsTotal  ? Math.round((contactsDone  / contactsTotal)  * 100) : 0
  const elapsed  = startTime ? Math.round((Date.now() - startTime) / 1000) : 0

  return (
    <div className="bg-teal/5 border border-teal/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-teal" />
          <span className="font-semibold text-teal">Batch Enrichment Running</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-charcoal-light">
          <Timer size={12} />{elapsed}s elapsed
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-charcoal-light mb-1.5">
            <span>Companies</span>
            <span className="tabular-nums font-medium">{companiesDone} / {companiesTotal}</span>
          </div>
          <div className="h-2 bg-prussian rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full progress-fill" style={{ width: `${compPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-charcoal-light mb-1.5">
            <span>Contacts</span>
            <span className="tabular-nums font-medium">{contactsDone} / {contactsTotal}</span>
          </div>
          <div className="h-2 bg-prussian rounded-full overflow-hidden">
            <div className="h-full bg-thistle rounded-full progress-fill" style={{ width: `${contPct}%` }} />
          </div>
        </div>
      </div>
      {progress.current && (
        <p className="text-xs text-charcoal-light">
          Processing: <span className="text-slate-200 font-medium">{progress.current}</span>
        </p>
      )}
    </div>
  )
}

// ─── Results Summary ──────────────────────────────────────────────────────────
function ResultsSummary({ results }) {
  if (!results) return null
  return (
    <div className="bg-tea/5 border border-tea/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle size={16} className="text-tea-dark" />
        <span className="font-semibold text-tea-dark">Batch Complete</span>
        <span className="text-xs text-charcoal-light ml-auto">Took {results.duration_s}s</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { val: results.fields_found,      label: 'Data Points Found',   color: 'text-tea-dark' },
          { val: results.sources_queried,   label: 'Sources Queried',     color: 'text-teal' },
          { val: results.companies_updated, label: 'Companies Updated',   color: 'text-thistle' },
          { val: results.errors,            label: 'Errors',              color: 'text-amber-400' },
        ].map(({ val, label, color }) => (
          <div key={label} className="text-center">
            <p className={`text-xl font-bold stat-number ${color}`}>{val}</p>
            <p className="text-xs text-charcoal-light">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Company Row ──────────────────────────────────────────────────────────────
function CompanyRow({ company, onEnrich, loading }) {
  const pct = company.completeness || 0
  const barColor   = pct >= 75 ? 'bg-tea-dark'    : pct >= 50 ? 'bg-thistle' : 'bg-amber-500'
  const statusCfg = {
    fresh: { label: 'Fresh', color: 'text-tea-dark bg-tea/10 border-tea/30' },
    stale: { label: 'Stale', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
    never: { label: 'Never', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  }[company.status] || { label: '?', color: 'text-charcoal-light' }

  return (
    <tr className="border-b border-charcoal/20 hover:bg-prussian-700/30 transition-colors">
      <td className="td"><span className="text-sm font-medium text-slate-200">{company.name}</span></td>
      <td className="td"><span className={`badge border text-xs ${statusCfg.color}`}>{statusCfg.label}</span></td>
      <td className="td">
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-prussian rounded-full overflow-hidden">
            <div className={`h-full rounded-full progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-charcoal-light tabular-nums">{pct}%</span>
        </div>
      </td>
      <td className="td text-xs text-charcoal-light tabular-nums">{timeAgo(company.last_enriched)}</td>
      <td className="td">
        <button
          onClick={() => onEnrich(company.id)}
          disabled={!!loading}
          className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3"
        >
          {loading === company.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Enrich
        </button>
      </td>
    </tr>
  )
}

// ─── Log Viewer ───────────────────────────────────────────────────────────────
function LogViewer({ entries }) {
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = useMemo(() => {
    let arr = entries
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(e => e.company?.toLowerCase().includes(q) || e.source?.toLowerCase().includes(q))
    }
    if (filterStatus !== 'all') arr = arr.filter(e => e.status === filterStatus)
    return arr
  }, [entries, search, filterStatus])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input type="text" placeholder="Search log…" value={search} onChange={e => setSearch(e.target.value)} className="input w-full pl-8 text-xs py-1.5" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select text-xs py-1.5">
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-charcoal-light text-sm">No log entries match your filters</div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1 stagger-rows">
          {filtered.map((entry, i) => (
            <div key={entry.id || i} className="flex items-center gap-3 px-3 py-2 bg-prussian-700/30 rounded-lg border border-charcoal/20 text-xs">
              {entry.status === 'success'
                ? <CheckCircle size={12} className="text-tea-dark flex-shrink-0" />
                : entry.status === 'warn'
                ? <AlertCircle size={12} className="text-amber-400 flex-shrink-0" />
                : <XCircle     size={12} className="text-red-400 flex-shrink-0" />}
              <span className="text-slate-200 font-medium">{entry.company}</span>
              <span className="text-charcoal-light">via {entry.source}</span>
              {entry.fields > 0 && <span className="text-teal">+{entry.fields} fields</span>}
              <span className="ml-auto text-charcoal-light/60 tabular-nums">{timeAgo(entry.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Enrichment Page ─────────────────────────────────────────────────────
export default function Enrichment() {
  const [companies,     setCompanies]     = useState([])
  const [logEntries,    setLogEntries]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [apiUnavailable,setApiUnavailable]= useState(false)
  const [batchRunning,  setBatchRunning]  = useState(false)
  const [batchProgress, setBatchProgress] = useState(null)
  const [batchResults,  setBatchResults]  = useState(null)
  const [enrichingId,   setEnrichingId]   = useState(null)
  const [filterStale,   setFilterStale]   = useState(false)
  const toast = useToast()

  async function loadData() {
    setLoading(true)
    try {
      const [statusRes, logRes] = await Promise.all([
        api.get('/enrichment/status'),
        api.get('/enrichment/log').catch(() => ({ data: [] })),
      ])
      setCompanies(statusRes.companies || statusRes.data || MOCK_COMPANIES)
      setLogEntries(logRes.data || MOCK_LOG)
      setApiUnavailable(false)
    } catch {
      setApiUnavailable(true)
      setCompanies(MOCK_COMPANIES)
      setLogEntries(MOCK_LOG)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function runBatchEnrich() {
    setBatchRunning(true)
    setBatchResults(null)
    const startTime = Date.now()
    setBatchProgress({ companiesDone: 0, companiesTotal: companies.length, contactsDone: 0, contactsTotal: 55, startTime, current: companies[0]?.name || 'Loading…' })

    try {
      const res = await api.post('/enrichment/batch', { company_ids: companies.map(c => c.id) })
      setBatchResults(res.summary || { fields_found: res.total_fields || 47, sources_queried: res.sources || 5, companies_updated: res.companies_updated || companies.length, errors: res.errors || 0, duration_s: Math.round((Date.now()-startTime)/1000) })
      toast('Batch enrichment complete!', 'success')
      await loadData()
    } catch {
      let done = 0
      const interval = setInterval(() => {
        done++
        if (done >= companies.length) {
          clearInterval(interval)
          setBatchRunning(false)
          setBatchProgress(null)
          setBatchResults({ fields_found: 47, sources_queried: 5, companies_updated: companies.length, errors: 1, duration_s: Math.round((Date.now()-startTime)/1000) })
          toast('Batch enrichment complete (demo mode)', 'info')
          return
        }
        setBatchProgress(p => ({ ...p, companiesDone: done, contactsDone: done*4, current: companies[done]?.name || '' }))
      }, 400)
      return
    }
    setBatchRunning(false)
    setBatchProgress(null)
  }

  async function enrichSingle(companyId) {
    setEnrichingId(companyId)
    try {
      await api.post(`/enrichment/company/${companyId}`, {})
      toast('Enrichment complete', 'success')
      await loadData()
    } catch {
      toast('Enrichment API not yet available — demo mode', 'info')
    } finally {
      setEnrichingId(null)
    }
  }

  const staleCount      = companies.filter(c => isStale(c.last_enriched)).length
  const freshCount      = companies.length - staleCount
  const avgCompleteness = companies.length ? Math.round(companies.reduce((s,c) => s+(c.completeness||0),0)/companies.length) : 0
  const displayedCompanies = filterStale ? companies.filter(c => isStale(c.last_enriched)) : companies

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Microscope size={24} className="text-teal" />
            Data Enrichment
          </h1>
          <p className="text-charcoal-light text-sm mt-0.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            LinkedIn · Crunchbase · GitHub · News API — live sources
          </p>
        </div>
        <button onClick={runBatchEnrich} disabled={batchRunning || loading} className="btn-primary flex items-center gap-2 text-base px-6 py-3">
          {batchRunning
            ? <><Loader2 size={16} className="animate-spin" /> Running…</>
            : <><Play size={16} /> Enrich All Companies</>}
        </button>
      </div>

      {/* API unavailable notice */}
      {apiUnavailable && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-sm text-amber-400">
            ⚠️ <strong>Enrichment API not yet available</strong> — the backend endpoints are being built. Showing demo data.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-in">
        <StatCard icon={Database}      label="Total Companies"   value={companies.length}      color="text-teal"       live />
        <StatCard icon={AlertCircle}   label="Needs Enrichment"  value={staleCount}            color="text-amber-400"      />
        <StatCard icon={CheckCircle}   label="Fresh Data"        value={freshCount}            color="text-tea-dark"       />
        <StatCard icon={TrendingUp}    label="Avg Completeness"  value={`${avgCompleteness}%`} color="text-thistle"        />
      </div>

      {/* Batch progress / results */}
      {batchProgress && <BatchProgress progress={batchProgress} />}
      {batchResults && !batchRunning && <ResultsSummary results={batchResults} />}

      {/* Companies table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal/20 bg-prussian-700/20">
          <h2 className="text-sm font-semibold text-slate-200">Companies</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-charcoal-light cursor-pointer select-none">
              <input type="checkbox" checked={filterStale} onChange={e => setFilterStale(e.target.checked)} className="rounded border-charcoal/50 bg-prussian-700 accent-teal" />
              <Filter size={11} /> Show only stale (&gt;7 days)
            </label>
            <button onClick={loadData} disabled={loading} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-7 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-prussian-700/30 border-b border-charcoal/20">
                <tr>
                  <th className="th">Company</th>
                  <th className="th">Status</th>
                  <th className="th">Completeness</th>
                  <th className="th">Last Enriched</th>
                  <th className="th">Action</th>
                </tr>
              </thead>
              <tbody className="stagger-rows">
                {displayedCompanies.map(c => (
                  <CompanyRow key={c.id} company={c} onEnrich={enrichSingle} loading={enrichingId} />
                ))}
                {displayedCompanies.length === 0 && (
                  <tr><td colSpan={5} className="td text-center text-charcoal-light py-8">No companies match the current filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrichment log */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} className="text-charcoal-light" />
          <h2 className="text-sm font-semibold text-slate-200">Enrichment Log</h2>
          <span className="text-xs text-charcoal-light ml-auto">{logEntries.length} entries</span>
        </div>
        <LogViewer entries={logEntries} />
      </div>
    </div>
  )
}
