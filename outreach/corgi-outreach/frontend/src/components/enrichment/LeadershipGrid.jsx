import { ExternalLink, User } from 'lucide-react'

const MOCK_LEADERS = [
  { name: 'Sarah Chen',   title: 'CEO & Co-Founder',      linkedin_url: null, bio: 'Previously VP Eng at Scale AI. Stanford CS.' },
  { name: 'Marcus Webb',  title: 'CTO',                   linkedin_url: null, bio: 'Ex-Google Brain. Published 40+ ML papers.' },
  { name: 'Priya Nair',   title: 'VP Sales',              linkedin_url: null, bio: '10 years enterprise SaaS. Ex-Databricks.' },
  { name: 'Jordan Kim',   title: 'Head of Infrastructure', linkedin_url: null, bio: 'Built GPU clusters at Lambda Labs.' },
]

function Avatar({ name }) {
  const initials  = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  // Palette-aware deterministic colors
  const colors = [
    'bg-teal text-prussian-900',
    'bg-thistle text-prussian-900',
    'bg-tea-dark text-prussian-900',
    'bg-charcoal text-slate-100',
    'bg-teal-500 text-prussian-900',
    'bg-thistle-dark text-prussian-900',
  ]
  const colorIdx = name.charCodeAt(0) % colors.length
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colors[colorIdx]}`}>
      {initials}
    </div>
  )
}

export default function LeadershipGrid({ contacts }) {
  const people = contacts?.length ? contacts : MOCK_LEADERS
  const isDemo = !contacts?.length

  return (
    <div className="space-y-3">
      {isDemo && <p className="text-xs text-charcoal-light/60 italic">Demo data — enrich to load real leadership contacts</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-in">
        {people.map((person, i) => (
          <div key={i} className="flex items-start gap-3 bg-prussian-700/40 rounded-xl p-3 border border-charcoal/30 hover:border-teal/30 card-lift transition-all">
            <Avatar name={person.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-100 truncate">{person.name}</p>
                  <p className="text-xs text-charcoal-light truncate">{person.title}</p>
                </div>
                {person.linkedin_url && (
                  <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 text-teal hover:text-teal-300 transition-colors"
                    title="View on LinkedIn"
                    onClick={e => e.stopPropagation()}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
              {person.bio && (
                <p className="text-xs text-charcoal-light mt-1 line-clamp-2 leading-relaxed">{person.bio}</p>
              )}
              {person.email && (
                <a href={`mailto:${person.email}`} className="text-xs text-teal hover:text-teal-300 mt-1 block truncate transition-colors">
                  {person.email}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      {people.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-charcoal-light">
          <User size={28} className="mb-2 opacity-30" />
          <p className="text-sm">No leadership contacts found</p>
        </div>
      )}
    </div>
  )
}
