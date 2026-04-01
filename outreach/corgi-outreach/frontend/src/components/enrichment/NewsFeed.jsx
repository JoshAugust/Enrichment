import { useState } from 'react'
import { ExternalLink, Newspaper } from 'lucide-react'

const MOCK_NEWS = [
  { title: 'Company Raises $120M Series C to Expand GPU Infrastructure', source: 'TechCrunch',          date: '2024-01-15', url: '#', category: 'Funding',     summary: 'The company announced a major funding round led by Andreessen Horowitz to accelerate data center expansion across three new regions.' },
  { title: 'New Partnership with NVIDIA for Next-Gen AI Compute',        source: 'VentureBeat',         date: '2024-02-03', url: '#', category: 'Partnership', summary: 'A strategic partnership to deploy the latest H100 clusters at scale, offering customers access to cutting-edge compute.' },
  { title: 'Appoints Former AWS VP as Chief Revenue Officer',            source: 'Business Wire',        date: '2024-02-20', url: '#', category: 'Executive',   summary: 'The new CRO brings 15 years of enterprise cloud sales experience to drive the next phase of growth.' },
  { title: 'Expands European Operations with Frankfurt Data Center',     source: 'Data Center Dynamics', date: '2024-03-08', url: '#', category: 'Expansion',   summary: 'A new 50MW facility in Frankfurt positions the company to serve EU-based AI workloads with GDPR-compliant infrastructure.' },
]

const CATEGORY_COLORS = {
  Funding:     'text-tea-dark bg-tea/10 border-tea/30',
  Partnership: 'text-teal bg-teal/10 border-teal/30',
  Executive:   'text-thistle bg-thistle/10 border-thistle/30',
  Expansion:   'text-teal-300 bg-teal/10 border-teal/20',
  Product:     'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Other:       'text-charcoal-light bg-charcoal/10 border-charcoal/30',
}

function NewsItem({ article }) {
  const [expanded, setExpanded] = useState(false)
  const catColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.Other

  return (
    <div className="bg-prussian-700/30 rounded-xl border border-charcoal/20 hover:border-charcoal/40 transition-all overflow-hidden">
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge border text-xs ${catColor}`}>{article.category}</span>
              <span className="text-xs text-charcoal-light/60">{article.source}</span>
              <span className="text-xs text-charcoal-light/60">
                {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200 line-clamp-2 text-left">{article.title}</p>
          </div>
          {article.url && article.url !== '#' && (
            <a href={article.url} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 text-charcoal-light hover:text-teal transition-colors mt-0.5"
              onClick={e => e.stopPropagation()}>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </button>
      {expanded && article.summary && (
        <div className="px-4 pb-3 border-t border-charcoal/15 tab-content">
          <p className="text-xs text-charcoal-light leading-relaxed mt-2">{article.summary}</p>
        </div>
      )}
    </div>
  )
}

export default function NewsFeed({ articles, maxItems = 10 }) {
  const items  = articles?.length ? articles : MOCK_NEWS
  const isDemo = !articles?.length
  const shown  = items.slice(0, maxItems)

  return (
    <div className="space-y-3">
      {isDemo && <p className="text-xs text-charcoal-light/60 italic">Demo data — enrich to load real news</p>}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-charcoal-light">
          <Newspaper size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No recent news found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 stagger-rows">
          {shown.map((article, i) => <NewsItem key={i} article={article} />)}
        </div>
      )}
      {items.length > maxItems && (
        <p className="text-xs text-charcoal-light/60 text-center">{items.length - maxItems} more articles not shown</p>
      )}
    </div>
  )
}
