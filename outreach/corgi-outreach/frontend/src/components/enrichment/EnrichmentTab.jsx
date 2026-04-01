import { useState } from 'react'
import { Globe, Twitter, Github, Linkedin, ExternalLink } from 'lucide-react'
import EnrichmentPanel from './EnrichmentPanel'
import FundingTimeline from './FundingTimeline'
import LeadershipGrid from './LeadershipGrid'
import NewsFeed from './NewsFeed'
import InfrastructureOverview from './InfrastructureOverview'
import EnrichmentHistory from './EnrichmentHistory'

const SECTIONS = [
  { id: 'enrichment', label: 'Status' },
  { id: 'funding',    label: 'Funding' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'news',       label: 'News' },
  { id: 'infra',      label: 'Infrastructure' },
  { id: 'social',     label: 'Social' },
  { id: 'history',    label: 'History' },
]

function SocialLinks({ company }) {
  const links = [
    { label: 'Website',    url: company.website,                                    icon: Globe,    color: 'text-slate-300 hover:text-teal' },
    { label: 'LinkedIn',   url: company.linkedin_url || company.enrichment?.linkedin_url, icon: Linkedin, color: 'text-teal hover:text-teal-300' },
    { label: 'Twitter / X',url: company.twitter_url  || company.enrichment?.twitter_url,  icon: Twitter,  color: 'text-thistle hover:text-thistle-light' },
    { label: 'GitHub',     url: company.github_url   || company.enrichment?.github_url,   icon: Github,   color: 'text-slate-300 hover:text-teal' },
  ].filter(l => l.url)

  if (!links.length) {
    return (
      <div className="text-center py-6 text-charcoal-light">
        <p className="text-sm">No social links found yet.</p>
        <p className="text-xs mt-1">Run enrichment to discover profiles.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-in">
      {links.map(({ label, url, icon: Icon, color }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 bg-prussian-700/40 rounded-xl p-4 border border-charcoal/30 hover:border-teal/30 card-lift transition-all group"
        >
          <Icon size={22} className={`transition-colors ${color}`} />
          <span className="text-xs text-charcoal-light group-hover:text-slate-200 transition-colors">{label}</span>
          <ExternalLink size={10} className="text-charcoal/40 group-hover:text-charcoal-light transition-colors" />
        </a>
      ))}
    </div>
  )
}

function Section({ id, title, children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div id={id} className="border border-charcoal/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 bg-prussian-700/30 hover:bg-prussian-700/50 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span className={`text-charcoal-light text-xs transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`}>▶</span>
      </button>
      {!collapsed && (
        <div className="p-4 tab-content">
          {children}
        </div>
      )}
    </div>
  )
}

export default function EnrichmentTab({ company }) {
  const enrichData = company.enrichment || {}

  return (
    <div className="space-y-4">
      {/* Quick-jump nav */}
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs px-2.5 py-1 rounded-lg bg-prussian-700/40 border border-charcoal/30 text-charcoal-light hover:text-teal hover:border-teal/30 transition-all"
          >
            {s.label}
          </a>
        ))}
      </div>

      <div id="enrichment">
        <EnrichmentPanel entityType="company" entityId={company.id} />
      </div>

      <Section id="funding"   title="💰 Funding Timeline">
        <FundingTimeline rounds={enrichData.funding_rounds} />
      </Section>

      <Section id="leadership" title="👥 Leadership Team">
        <LeadershipGrid contacts={enrichData.leadership} />
      </Section>

      <Section id="news" title="📰 Recent News">
        <NewsFeed articles={enrichData.news} />
      </Section>

      <Section id="infra" title="🖥️ Infrastructure Overview">
        <InfrastructureOverview infra={enrichData.infrastructure} />
      </Section>

      <Section id="social" title="🔗 Social & Web Profiles">
        <SocialLinks company={company} />
      </Section>

      <Section id="history" title="📋 Enrichment History">
        <EnrichmentHistory entries={enrichData.history} />
      </Section>
    </div>
  )
}
