import { useState, useEffect } from 'react'
import {
  Phone, RefreshCw, Loader2, Play, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Mic, Volume2,
  PhoneCall, PhoneOff, Clock, TrendingUp
} from 'lucide-react'
import { api } from '../lib/api'
import { priorityColor, typeBadge } from '../lib/utils'
import { useToast } from '../components/Toast'
import CallLog from '../components/CallLog'

// ── Voices ────────────────────────────────────────────────────────────────────
const VOICES = [
  { voiceId: 'tnSpp4vdxKPjI9w0GnoV', name: 'Hope',      description: 'Warm, natural, conversational', default: true },
  { voiceId: 'bIQlQ61Q7WgbyZAL7IWj', name: 'Faith',     description: 'Clear, professional, confident' },
  { voiceId: 'kdmDKE6EkgrWrrykO9Qt', name: 'Alexandra', description: 'Polished, authoritative' },
]

const SCRIPT_VERSIONS = ['A', 'B', 'C', 'D', 'E']

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(secs) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Script flow renderer ──────────────────────────────────────────────────────
function FlowNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children?.length > 0 || node.branches?.length > 0
  const nodeTypeColors = {
    greeting: 'border-teal/40 bg-teal/8',
    pitch:    'border-thistle/40 bg-thistle/8',
    question: 'border-amber-500/40 bg-amber-500/8',
    objection:'border-red-500/40 bg-red-500/8',
    close:    'border-tea-dark/40 bg-tea/8',
    followup: 'border-charcoal/40 bg-charcoal/8',
  }
  const color = nodeTypeColors[node.type] || 'border-charcoal/40 bg-prussian-700/30'
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        className={`rounded-xl border p-3 mb-2 ${color} ${hasChildren ? 'cursor-pointer' : ''} transition-all`}
        onClick={() => hasChildren && setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {node.type && <span className="text-xs font-mono text-charcoal-light">[{node.type}]</span>}
            <span className="text-sm text-slate-200">{node.text || node.label || node.content || JSON.stringify(node).slice(0, 60)}</span>
          </div>
          {hasChildren && (open ? <ChevronUp size={13} className="text-charcoal-light flex-shrink-0" /> : <ChevronDown size={13} className="text-charcoal-light flex-shrink-0" />)}
        </div>
      </div>
      {open && (node.children || node.branches || []).map((child, i) => (
        <FlowNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

// ── Tab: Scripts ──────────────────────────────────────────────────────────────
function ScriptsTab({ scripts, companies, loading }) {
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('A')
  const [selectedVoiceId, setSelectedVoiceId] = useState(VOICES.find(v => v.default)?.voiceId || VOICES[0].voiceId)

  const selectedScript = scripts.find(s => s.company_id === selectedCompany && s.script_version === selectedVersion)
  let parsedScript = null
  if (selectedScript?.customized_script) {
    try {
      parsedScript = typeof selectedScript.customized_script === 'string'
        ? JSON.parse(selectedScript.customized_script)
        : selectedScript.customized_script
    } catch {}
  }

  const companyScripts = scripts.filter(s => s.company_id === selectedCompany)

  return (
    <div className="space-y-5">
      {/* Voice selector */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Mic size={16} className="text-teal" />
          Voice & Script Selector
        </h2>

        {/* Voice picker */}
        <div>
          <label className="text-xs font-medium text-charcoal-light block mb-2">Voice</label>
          <div className="flex flex-wrap gap-2">
            {VOICES.map(v => (
              <button
                key={v.voiceId}
                onClick={() => setSelectedVoiceId(v.voiceId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                  selectedVoiceId === v.voiceId
                    ? 'bg-teal/15 border-teal/50 text-slate-200'
                    : 'bg-prussian-700/40 border-charcoal/40 text-charcoal-light hover:border-teal/30 hover:text-slate-200'
                }`}
              >
                <span className={`text-xs font-semibold ${selectedVoiceId === v.voiceId ? 'text-teal' : ''}`}>{v.name}</span>
                <span className="text-xs text-charcoal-light hidden sm:inline">— {v.description}</span>
                {v.default && (
                  <span className="text-xs bg-teal/10 border border-teal/30 text-teal rounded px-1 py-0.5 leading-none">default</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Company + version */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Company</label>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="select w-full"
            >
              <option value="">Choose a company…</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>[{c.priority}] {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-charcoal-light block mb-1.5">Script Version</label>
            <div className="flex gap-2">
              {SCRIPT_VERSIONS.map(v => (
                <button
                  key={v}
                  onClick={() => setSelectedVersion(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                    selectedVersion === v
                      ? 'bg-teal/20 border-teal/50 text-teal'
                      : 'bg-prussian-700/40 border-charcoal/40 text-charcoal-light hover:border-teal/30 hover:text-slate-200'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Script preview */}
      {selectedCompany && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Volume2 size={16} className="text-teal" />
            Script Preview — Version {selectedVersion}
          </h2>
          {parsedScript ? (
            <div className="space-y-4">
              <div className="bg-prussian-700/40 rounded-xl border border-teal/20 p-4">
                <p className="text-xs font-semibold text-teal uppercase tracking-wider mb-2">{parsedScript.name}</p>
                <p className="text-sm text-slate-200 italic leading-relaxed">"{parsedScript.opening}"</p>
              </div>
              {parsedScript.lines?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Key Lines</p>
                  <div className="space-y-2">
                    {parsedScript.lines.map((line, i) => (
                      <div key={i} className="flex gap-3 bg-prussian-700/30 rounded-xl p-3 border border-charcoal/20">
                        <span className="text-teal font-mono text-xs w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-sm text-slate-300">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-charcoal-light text-sm">
              {companyScripts.length === 0
                ? 'No call scripts found for this company'
                : `No script for version ${selectedVersion} — try another version`}
            </p>
          )}
        </div>
      )}

      {/* All scripts table */}
      {scripts.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-charcoal/20">
            <h2 className="text-sm font-semibold text-slate-200">All Scripts ({scripts.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-prussian-700/30 border-b border-charcoal/20">
                <tr>
                  <th className="th">Company</th>
                  <th className="th">Version</th>
                  <th className="th">Type</th>
                  <th className="th">Script Name</th>
                  <th className="th">Created</th>
                </tr>
              </thead>
              <tbody>
                {scripts.map(s => {
                  const company = companies.find(c => c.id === s.company_id)
                  let parsed = null
                  try { parsed = typeof s.customized_script === 'string' ? JSON.parse(s.customized_script) : s.customized_script } catch {}
                  return (
                    <tr key={s.id} className="border-b border-charcoal/15 last:border-0 hover:bg-prussian-700/30 transition-colors">
                      <td className="td text-slate-200 font-medium">
                        {company?.name || s.company_id?.slice(0, 8)}
                        {company && <span className={`ml-2 badge border text-xs ${priorityColor(company.priority)}`}>{company.priority}</span>}
                      </td>
                      <td className="td">
                        <span className="font-mono font-bold text-teal bg-teal/10 border border-teal/30 rounded px-2 py-0.5 text-xs">{s.script_version}</span>
                      </td>
                      <td className="td">
                        <span className={`badge border text-xs ${typeBadge(s.buyer_type)}`}>{s.buyer_type}</span>
                      </td>
                      <td className="td text-slate-300 text-xs">{parsed?.name || '—'}</td>
                      <td className="td text-charcoal-light text-xs">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scripts.length === 0 && !loading && (
        <div className="card flex items-center justify-center h-24 text-charcoal-light text-sm">
          No call scripts found
        </div>
      )}
    </div>
  )
}

// ── Tab: Test Call ────────────────────────────────────────────────────────────
function TestCallTab({ companies }) {
  const [selectedCompany, setSelectedCompany] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState(VOICES.find(v => v.default)?.voiceId || VOICES[0].voiceId)
  const [calling, setCalling] = useState(false)
  const [result, setResult] = useState(null)
  const toast = useToast()

  async function initiateTestCall() {
    if (!selectedCompany || !phoneNumber) return
    try {
      setCalling(true)
      setResult(null)
      const res = await api.post('/vapi/test-call', {
        companyId: selectedCompany,
        testPhoneNumber: phoneNumber,
        voiceId: selectedVoiceId,
      })
      setResult({ ok: true, data: res })
      toast('Test call initiated', 'success')
    } catch (e) {
      setResult({ ok: false, error: e.message })
      toast(`Call failed: ${e.message}`, 'error')
    } finally {
      setCalling(false)
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div className="card p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-1">
            <PhoneCall size={16} className="text-teal" />
            Initiate Test Call
          </h2>
          <p className="text-xs text-charcoal-light">
            Call your own phone using the AI agent script for a selected company.
            Uses Vapi — you'll hear the AI agent as if you were the prospect.
          </p>
        </div>

        {/* Company */}
        <div>
          <label className="text-xs font-medium text-charcoal-light block mb-1.5">Company Context</label>
          <select
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            className="select w-full"
          >
            <option value="">Choose a company…</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>[{c.priority}] {c.name}</option>
            ))}
          </select>
        </div>

        {/* Phone number */}
        <div>
          <label className="text-xs font-medium text-charcoal-light block mb-1.5">Your Phone Number</label>
          <input
            type="tel"
            placeholder="+14155551234"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="input w-full"
          />
          <p className="text-xs text-charcoal-light/60 mt-1">E.164 format recommended (e.g. +44 7911 123456)</p>
        </div>

        {/* Voice */}
        <div>
          <label className="text-xs font-medium text-charcoal-light block mb-2">Voice</label>
          <div className="flex flex-wrap gap-2">
            {VOICES.map(v => (
              <button
                key={v.voiceId}
                onClick={() => setSelectedVoiceId(v.voiceId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                  selectedVoiceId === v.voiceId
                    ? 'bg-teal/15 border-teal/50 text-slate-200'
                    : 'bg-prussian-700/40 border-charcoal/40 text-charcoal-light hover:border-teal/30'
                }`}
              >
                <span className={`text-xs font-semibold ${selectedVoiceId === v.voiceId ? 'text-teal' : ''}`}>{v.name}</span>
                {v.default && <span className="text-xs bg-teal/10 border border-teal/30 text-teal rounded px-1 leading-none">default</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Call button */}
        <button
          onClick={initiateTestCall}
          disabled={!selectedCompany || !phoneNumber || calling}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {calling
            ? <><Loader2 size={16} className="animate-spin" /> Calling…</>
            : <><PhoneCall size={16} /> Initiate Test Call</>
          }
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`card p-5 ${result.ok ? 'border-teal/20' : 'border-red-800/40'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.ok
              ? <CheckCircle size={16} className="text-teal" />
              : <AlertTriangle size={16} className="text-red-400" />
            }
            <h3 className={`text-sm font-semibold ${result.ok ? 'text-teal' : 'text-red-400'}`}>
              {result.ok ? 'Call Initiated' : 'Call Failed'}
            </h3>
          </div>
          {result.ok ? (
            <div className="space-y-2 text-xs text-charcoal-light">
              {result.data?.data?.callId && <p>Call ID: <span className="text-slate-200 font-mono">{result.data.data.callId}</span></p>}
              <p className="text-xs text-charcoal-light/60 mt-2">Your phone should ring shortly. The AI agent will introduce itself with the selected company context.</p>
            </div>
          ) : (
            <p className="text-red-300 text-sm">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Calls Page ───────────────────────────────────────────────────────────
export default function Calls() {
  const [activeTab, setActiveTab] = useState('log')
  const [scripts, setScripts] = useState([])
  const [companies, setCompanies] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    try {
      setLoading(true)
      const [scriptsRes, companiesRes, statsRes] = await Promise.all([
        api.get('/call-scripts').catch(() => ({ data: [] })),
        api.get('/companies?limit=100').catch(() => ({ data: [] })),
        api.get('/calls/stats').catch(() => null),
      ])
      setScripts(scriptsRes.data || [])
      setCompanies(companiesRes.data || [])
      if (statsRes?.data) setStats(statsRes.data)
      else if (statsRes) setStats(statsRes)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const tabs = [
    { id: 'log',    label: 'Call Log',   icon: Phone },
    { id: 'scripts',label: 'Scripts',    icon: Volume2 },
    { id: 'test',   label: 'Test Call',  icon: PhoneCall },
  ]

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Voice & Calls</h1>
          <p className="text-charcoal-light text-sm mt-0.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            AI-powered outbound calling
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-prussian border border-charcoal/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone size={14} className="text-teal" />
              <p className="text-xs text-charcoal-light uppercase tracking-wider font-medium">Total Calls</p>
            </div>
            <p className="text-2xl font-bold text-slate-200">{stats.total_calls ?? 0}</p>
          </div>
          <div className="bg-prussian border border-charcoal/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-green-400" />
              <p className="text-xs text-charcoal-light uppercase tracking-wider font-medium">Meetings</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.meetings_booked ?? 0}</p>
          </div>
          <div className="bg-prussian border border-charcoal/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-thistle" />
              <p className="text-xs text-charcoal-light uppercase tracking-wider font-medium">Avg Duration</p>
            </div>
            <p className="text-2xl font-bold text-thistle">{formatDuration(Math.round(stats.avg_duration_seconds ?? 0))}</p>
          </div>
          <div className="bg-prussian border border-charcoal/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-teal" />
              <p className="text-xs text-charcoal-light uppercase tracking-wider font-medium">Conversion</p>
            </div>
            <p className="text-2xl font-bold text-teal">{stats.conversion_rate_pct ?? 0}%</p>
          </div>
        </div>
      )}

      {error && (
        <div className="card p-4 border-red-800/40">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-charcoal/30">
        <div className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === id
                  ? 'border-teal text-teal'
                  : 'border-transparent text-charcoal-light hover:text-slate-200 hover:border-charcoal/50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'log' && <CallLog />}
        {activeTab === 'scripts' && (
          <ScriptsTab scripts={scripts} companies={companies} loading={loading} />
        )}
        {activeTab === 'test' && (
          <TestCallTab companies={companies} />
        )}
      </div>
    </div>
  )
}
