import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Building2 } from 'lucide-react'
import { api } from '../lib/api'
import { priorityColor, typeBadge, scoreColor } from '../lib/utils'

const STAGES = [
  { id: 'new',            label: 'New',             color: 'border-charcoal',   dot: 'bg-charcoal-light' },
  { id: 'researched',     label: 'Researched',      color: 'border-teal',       dot: 'bg-teal' },
  { id: 'contacted',      label: 'Contacted',       color: 'border-thistle',    dot: 'bg-thistle' },
  { id: 'interested',     label: 'Interested',      color: 'border-amber-500',  dot: 'bg-amber-500' },
  { id: 'meeting_booked', label: 'Meeting Booked',  color: 'border-tea-dark',   dot: 'bg-tea-dark' },
  { id: 'deal',           label: 'Deal',            color: 'border-tea-darker', dot: 'bg-tea-darker' },
]

function CompanyCard({ company, onStageChange }) {
  return (
    <div className="bg-prussian border border-charcoal/40 rounded-xl p-3 hover:border-teal/30 transition-all group card-lift">
      <Link to={`/companies/${company.id}`} className="block">
        <div className="flex items-start justify-between mb-2">
          <span className={`badge border font-bold text-xs ${priorityColor(company.priority)}`}>{company.priority}</span>
          <span className={`text-sm font-bold tabular-nums ${scoreColor(company.qualification_score)}`}>{company.qualification_score}</span>
        </div>
        <p className="text-sm font-medium text-slate-100 group-hover:text-teal transition-colors leading-tight">{company.name}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`badge border text-xs ${typeBadge(company.type)}`}>{company.type}</span>
          {company.contact_count > 0 && (
            <span className="text-xs text-charcoal-light">{company.contact_count} contact{company.contact_count !== 1 ? 's' : ''}</span>
          )}
        </div>
        {company.estimated_gpu_scale && (
          <p className="text-xs text-charcoal-light/60 mt-1.5 truncate">{company.estimated_gpu_scale}</p>
        )}
      </Link>

      {/* Stage mover */}
      <div className="mt-2 pt-2 border-t border-charcoal/20">
        <select
          value={company._stage || 'new'}
          onChange={e => onStageChange(company.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          className="w-full text-xs bg-prussian-700 border border-charcoal/40 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal/50 transition-colors"
        >
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
    </div>
  )
}

function Column({ stage, companies, onStageChange }) {
  return (
    <div className="flex-1 min-w-52 max-w-72">
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl bg-prussian border-t-2 ${stage.color} border-x border-charcoal/30`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">{stage.label}</span>
        </div>
        <span className="text-xs text-charcoal-light bg-prussian-700/60 rounded-full px-2 py-0.5 font-medium">{companies.length}</span>
      </div>
      <div className="bg-prussian-700/20 border border-t-0 border-charcoal/20 rounded-b-xl p-2 space-y-2 min-h-32">
        {companies.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-charcoal/50 text-xs border border-dashed border-charcoal/20 rounded-lg">
            Drop here
          </div>
        ) : (
          <div className="stagger-in">
            {companies.map(c => (
              <CompanyCard key={c.id} company={c} onStageChange={onStageChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const [companies,      setCompanies]      = useState([])
  const [stages,         setStages]         = useState({})
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [filterPriority, setFilterPriority] = useState('all')

  async function load() {
    try {
      setLoading(true)
      const res  = await api.get('/companies?limit=100')
      const data = res.data || []
      setCompanies(data)
      const initialStages = {}
      data.forEach(c => {
        // Use outreach_status if available and valid, otherwise derive from data
        const validStages = STAGES.map(s => s.id)
        const fromStatus = c.outreach_status && validStages.includes(c.outreach_status)
          ? c.outreach_status
          : (c.contact_count > 0 && c.qualification_score >= 70 ? 'researched' : 'new')
        initialStages[c.id] = fromStatus
      })
      setStages(prev => ({ ...initialStages, ...prev }))
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleStageChange(companyId, newStage) {
    setStages(prev => ({ ...prev, [companyId]: newStage }))
  }

  const filtered = filterPriority === 'all' ? companies : companies.filter(c => c.priority === filterPriority)

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.id] = filtered
      .filter(c => (stages[c.id] || 'new') === s.id)
      .map(c => ({ ...c, _stage: stages[c.id] || 'new' }))
    return acc
  }, {})

  const totalInPipeline = filtered.length
  const priorityCounts  = { A: 0, B: 0, C: 0 }
  filtered.forEach(c => { priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1 })

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-8 w-32" />
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-1 min-w-52 max-w-72">
              <div className="skeleton h-10 rounded-t-xl" />
              <div className="skeleton h-64 rounded-b-xl mt-0" style={{ borderRadius: '0 0 12px 12px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-charcoal-light text-sm mt-0.5">{totalInPipeline} companies in pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="select">
            <option value="all">All Priorities</option>
            <option value="A">Priority A</option>
            <option value="B">Priority B</option>
            <option value="C">Priority C</option>
          </select>
          <button onClick={load} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Priority legend */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        {Object.entries(priorityCounts).map(([p, count]) => (
          <div key={p} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${p === 'A' ? 'bg-tea-dark' : p === 'B' ? 'bg-thistle' : 'bg-charcoal-light'}`} />
            <span className="text-charcoal-light">Priority {p}: <span className="text-slate-200 font-medium">{count}</span></span>
          </div>
        ))}
        <span className="text-charcoal-light/60 text-xs ml-auto">Use the dropdown to move stages</span>
      </div>

      {error && (
        <div className="card p-4 border-red-800/40">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STAGES.map(stage => (
            <Column key={stage.id} stage={stage} companies={byStage[stage.id] || []} onStageChange={handleStageChange} />
          ))}
        </div>
      </div>

      {/* Stage legend */}
      <div className="flex flex-wrap gap-4 text-xs text-charcoal-light pt-2 border-t border-charcoal/20">
        <span className="font-medium text-slate-400">Stages:</span>
        {STAGES.map(s => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label}
          </span>
        ))}
      </div>

      <p className="text-xs text-charcoal-light/50">
        ℹ Initial stages are derived from <code className="font-mono">outreach_status</code> where available. Stage changes here are local to this session.
      </p>
    </div>
  )
}
