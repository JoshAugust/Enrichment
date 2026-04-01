import { useState, useEffect } from 'react'
import {
  Mail, RefreshCw, FileText, Eye, X, Send,
  Users, ChevronDown, Loader2, Plus, CheckCircle, AlertTriangle
} from 'lucide-react'
import { api } from '../lib/api'
import { statusBadge, typeBadge } from '../lib/utils'
import { useToast } from '../components/Toast'

// ── Template Card ─────────────────────────────────────────────────────────────
function TemplateCard({ template, onPreview }) {
  return (
    <div className="bg-prussian-700/40 rounded-xl border border-charcoal/30 p-4 hover:border-teal/30 card-lift transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-slate-100 text-sm">{template.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {template.audienceTypes?.map(t => (
              <span key={t} className={`badge border text-xs ${typeBadge(t)}`}>{t}</span>
            ))}
            {template.isInitial ? (
              <span className="badge border text-xs text-tea-dark bg-tea/10 border-tea/30">Initial</span>
            ) : (
              <span className="badge border text-xs text-charcoal-light bg-charcoal/10 border-charcoal/30">Day {template.sequenceDay}</span>
            )}
          </div>
        </div>
        <button onClick={() => onPreview(template)} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1 flex-shrink-0 ml-3">
          <Eye size={12} /> Preview
        </button>
      </div>
      <div className="mt-3 space-y-1">
        {Object.entries(template.subjects || {}).map(([v, subj]) => (
          <div key={v} className="flex gap-2 text-xs">
            <span className="text-teal font-mono font-bold w-4 flex-shrink-0">{v.toUpperCase()}</span>
            <span className="text-charcoal-light truncate">{subj}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Template Preview Modal ────────────────────────────────────────────────────
function PreviewModal({ template, onClose }) {
  return (
    <div className="fixed inset-0 bg-prussian-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-prussian border border-charcoal/50 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-modal shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/20">
          <h3 className="font-semibold text-slate-100">{template.name}</h3>
          <button onClick={onClose} className="text-charcoal-light hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Subject Lines</p>
            {Object.entries(template.subjects || {}).map(([v, subj]) => (
              <div key={v} className="flex gap-3 items-center py-1.5 border-b border-charcoal/10 last:border-0">
                <span className="text-teal font-mono font-bold text-xs w-6">V{v.toUpperCase()}</span>
                <span className="text-slate-200 text-sm">{subj}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Audience</p>
            <div className="flex gap-2 flex-wrap">
              {template.audienceTypes?.map(t => (
                <span key={t} className={`badge border ${typeBadge(t)}`}>{t}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Details</p>
            <div className="bg-prussian-700/50 rounded-lg p-4 border border-charcoal/30 text-sm text-charcoal-light space-y-1">
              <p>Sequence day: <span className="text-slate-200">{template.sequenceDay}</span></p>
              <p>Initial email: <span className="text-slate-200">{template.isInitial ? 'Yes' : 'No'}</span></p>
              <p>Slug: <span className="text-teal font-mono">{template.slug}</span></p>
            </div>
          </div>
          <div className="bg-prussian-700/40 border border-charcoal/30 rounded-lg p-4">
            <p className="text-xs text-charcoal-light">
              Full email body is rendered server-side with contact variables. Use Generate Drafts or create a campaign to produce personalized emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Draft Row ─────────────────────────────────────────────────────────────────
function DraftRow({ draft }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border-b border-charcoal/15 last:border-0">
      <div
        className="flex items-center gap-3 px-5 py-3 hover:bg-prussian-700/30 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{draft.subject || 'No subject'}</p>
          <p className="text-xs text-charcoal-light mt-0.5 truncate">
            To: {draft.to_email || draft.contact_email || draft.contact_name || '—'}
            {draft.company_name && ` · ${draft.company_name}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge border text-xs ${statusBadge(draft.status || 'draft')}`}>
            {draft.status || 'draft'}
          </span>
          {draft.template_slug && (
            <span className="text-xs text-charcoal-light/60 font-mono hidden sm:block">{draft.template_slug}</span>
          )}
          <ChevronDown size={14} className={`text-charcoal-light transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-4 tab-content">
          <div className="bg-prussian-700/40 rounded-xl border border-charcoal/30 p-4">
            {draft.body_text ? (
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {draft.body_text}
              </pre>
            ) : draft.body_html ? (
              <div
                className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: draft.body_html }}
              />
            ) : (
              <p className="text-charcoal-light text-xs italic">No preview available</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Emails() {
  const [templates, setTemplates] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [generatingDrafts, setGeneratingDrafts] = useState(false)
  const [draftResult, setDraftResult] = useState(null)
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [campaign, setCampaign] = useState({
    name: '',
    audienceType: 'all',
    priorityFilter: '',
    abVariant: 'a',
  })
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [campaignResult, setCampaignResult] = useState(null)
  const toast = useToast()

  async function load() {
    try {
      setLoading(true)
      const [tmplRes, draftsRes] = await Promise.all([
        api.get('/email/templates').catch(() => ({ data: [] })),
        api.get('/email/drafts').catch(() => ({ data: [] })),
      ])
      setTemplates(tmplRes.data || [])
      setDrafts(draftsRes.data || [])
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function generateDrafts() {
    try {
      setGeneratingDrafts(true)
      setDraftResult(null)
      const res = await api.post('/email/compose-batch', {
        companyType: 'operator',
        priority: 'A',
        skipExisting: true,
      })
      setDraftResult({ ok: true, count: res.data?.length || res.count || '?' })
      toast('Drafts generated', 'success')
      await load()
    } catch (e) {
      setDraftResult({ ok: false, error: e.message })
      toast(`Failed: ${e.message}`, 'error')
    } finally {
      setGeneratingDrafts(false)
    }
  }

  async function createCampaign() {
    try {
      setCreatingCampaign(true)
      await api.post('/email/campaigns', {
        name: campaign.name,
        audienceType: campaign.audienceType || 'all',
        priorityFilter: campaign.priorityFilter || undefined,
        abVariant: campaign.abVariant,
      })
      setCampaignResult({ ok: true })
      setShowCampaignForm(false)
      setCampaign({ name: '', audienceType: 'all', priorityFilter: '', abVariant: 'a' })
      toast('Campaign created', 'success')
    } catch (e) {
      setCampaignResult({ ok: false, error: e.message })
      toast(`Campaign failed: ${e.message}`, 'error')
    } finally {
      setCreatingCampaign(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="card p-6 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {previewTemplate && <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Campaigns</h1>
          <p className="text-charcoal-light text-sm mt-0.5">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
            {drafts.length > 0 && ` · ${drafts.length} draft${drafts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {error && (
        <div className="card p-4 border-red-800/40">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </p>
        </div>
      )}

      {/* Templates */}
      <div className="card">
        <div className="px-5 py-4 border-b border-charcoal/20">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileText size={16} className="text-teal" />
            Email Templates ({templates.length})
          </h2>
        </div>
        {templates.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-charcoal-light text-sm">No templates found</div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-in">
            {templates.map(t => (
              <TemplateCard key={t.slug} template={t} onPreview={setPreviewTemplate} />
            ))}
          </div>
        )}
      </div>

      {/* Drafts */}
      <div className="card">
        <div className="px-5 py-4 border-b border-charcoal/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Mail size={16} className="text-teal" />
            Drafts ({drafts.length})
          </h2>
          <button onClick={generateDrafts} disabled={generatingDrafts} className="btn-primary flex items-center gap-2 text-xs">
            {generatingDrafts ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Generate Drafts
          </button>
        </div>

        {draftResult && (
          <div className={`mx-5 mt-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
            draftResult.ok ? 'border-tea/30 text-tea-dark' : 'border-red-800/40 text-red-400'
          }`}>
            {draftResult.ok
              ? <><CheckCircle size={13} /> {draftResult.count} draft{draftResult.count !== 1 ? 's' : ''} generated</>
              : <><AlertTriangle size={13} /> {draftResult.error}</>
            }
          </div>
        )}

        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-charcoal-light">
            <Mail size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No drafts yet. Click "Generate Drafts" to create personalized emails.</p>
          </div>
        ) : (
          <div>{drafts.map((d, i) => <DraftRow key={d.id || i} draft={d} />)}</div>
        )}
      </div>

      {/* Campaign creator */}
      <div className="card">
        <div className="px-5 py-4 border-b border-charcoal/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Users size={16} className="text-teal" />
            Campaigns
          </h2>
          <button
            onClick={() => { setShowCampaignForm(!showCampaignForm); setCampaignResult(null) }}
            className="btn-secondary flex items-center gap-2 text-xs"
          >
            <Plus size={12} />New Campaign
          </button>
        </div>

        {campaignResult && (
          <div className={`mx-5 mt-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
            campaignResult.ok ? 'border-tea/30 text-tea-dark' : 'border-red-800/40 text-red-400'
          }`}>
            {campaignResult.ok
              ? <><CheckCircle size={13} /> Campaign created</>
              : <><AlertTriangle size={13} /> {campaignResult.error}</>
            }
          </div>
        )}

        {showCampaignForm ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-charcoal-light block mb-1.5">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g. Wave 1 — Priority A Operators"
                value={campaign.name}
                onChange={e => setCampaign({ ...campaign, name: e.target.value })}
                className="input w-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5">Audience Type</label>
                <select
                  value={campaign.audienceType}
                  onChange={e => setCampaign({ ...campaign, audienceType: e.target.value })}
                  className="select w-full"
                >
                  <option value="all">All</option>
                  <option value="operator">Operators</option>
                  <option value="lender">Lenders</option>
                  <option value="arranger">Arrangers</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5">Priority Filter</label>
                <select
                  value={campaign.priorityFilter}
                  onChange={e => setCampaign({ ...campaign, priorityFilter: e.target.value })}
                  className="select w-full"
                >
                  <option value="">All Priorities</option>
                  <option value="A">Priority A</option>
                  <option value="B">Priority B</option>
                  <option value="C">Priority C</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal-light block mb-1.5">A/B Variant</label>
                <div className="flex gap-2">
                  {['a', 'b'].map(v => (
                    <button
                      key={v}
                      onClick={() => setCampaign({ ...campaign, abVariant: v })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                        campaign.abVariant === v
                          ? 'bg-teal/20 border-teal/50 text-teal'
                          : 'bg-prussian-700/40 border-charcoal/40 text-charcoal-light hover:border-teal/30'
                      }`}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={createCampaign}
                disabled={creatingCampaign || !campaign.name}
                className="btn-primary flex items-center gap-2"
              >
                {creatingCampaign ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Create Campaign
              </button>
              <button onClick={() => setShowCampaignForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          !campaignResult && (
            <div className="px-5 py-8 text-center text-charcoal-light text-sm">
              Create targeted email campaigns by audience type and priority
            </div>
          )
        )}
      </div>
    </div>
  )
}
