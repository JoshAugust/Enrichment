import { Clock, Database, CheckCircle, AlertCircle } from 'lucide-react'

const MOCK_HISTORY = [
  { id: 1, timestamp: new Date(Date.now() - 2*3600000).toISOString(),  source: 'LinkedIn',    status: 'success', fields_updated: 4, notes: 'Updated leadership contacts and company size' },
  { id: 2, timestamp: new Date(Date.now() - 6*3600000).toISOString(),  source: 'Crunchbase',  status: 'success', fields_updated: 2, notes: 'Synced funding rounds and investor data' },
  { id: 3, timestamp: new Date(Date.now() - 24*3600000).toISOString(), source: 'News API',    status: 'success', fields_updated: 1, notes: '3 new articles indexed' },
  { id: 4, timestamp: new Date(Date.now() - 48*3600000).toISOString(), source: 'Web Scraper', status: 'warn',    fields_updated: 0, notes: 'Rate limited by target site — retry scheduled' },
  { id: 5, timestamp: new Date(Date.now() - 72*3600000).toISOString(), source: 'GitHub',      status: 'success', fields_updated: 3, notes: 'Found 2 public repos, team size updated' },
]

function timeAgo(iso) {
  const d = Date.now() - new Date(iso).getTime()
  const h = Math.floor(d / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function EnrichmentHistory({ entries }) {
  const items  = entries?.length ? entries : MOCK_HISTORY
  const isDemo = !entries?.length

  return (
    <div className="space-y-3">
      {isDemo && <p className="text-xs text-charcoal-light/60 italic">Demo data — enrich to log real history</p>}
      <div className="space-y-2 stagger-rows">
        {items.map((entry, i) => (
          <div key={entry.id || i} className="flex items-start gap-3 bg-prussian-700/30 rounded-xl px-3 py-3 border border-charcoal/20">
            {entry.status === 'success'
              ? <CheckCircle size={14} className="text-tea-dark flex-shrink-0 mt-0.5" />
              : <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-200">{entry.source}</span>
                {entry.fields_updated > 0 && (
                  <span className="text-xs text-teal bg-teal/10 border border-teal/20 rounded px-1.5 py-0.5">
                    +{entry.fields_updated} fields
                  </span>
                )}
              </div>
              {entry.notes && <p className="text-xs text-charcoal-light mt-0.5">{entry.notes}</p>}
            </div>
            <div className="flex items-center gap-1 text-xs text-charcoal-light/60 flex-shrink-0">
              <Clock size={10} />{timeAgo(entry.timestamp)}
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-charcoal-light">
          <Database size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No enrichment history yet</p>
        </div>
      )}
    </div>
  )
}
