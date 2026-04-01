import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MOCK_ROUNDS = [
  { round: 'Seed',     amount: 2.5,  date: '2020-Q2', color: '#56A3A6' },
  { round: 'Series A', amount: 15,   date: '2021-Q3', color: '#6bbbbe' },
  { round: 'Series B', amount: 45,   date: '2022-Q4', color: '#BEB2C8' },
  { round: 'Series C', amount: 120,  date: '2024-Q1', color: '#C5EBC3' },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-prussian border border-charcoal/50 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-slate-100">{d.round}</p>
      <p className="text-charcoal-light">{d.date}</p>
      <p className="text-teal font-semibold mt-1">${d.amount}M raised</p>
      {d.investors && <p className="text-charcoal-light mt-0.5">{d.investors}</p>}
    </div>
  )
}

export default function FundingTimeline({ rounds }) {
  const data      = rounds?.length ? rounds : MOCK_ROUNDS
  const isDemo    = !rounds?.length
  const totalRaised = data.reduce((sum, r) => sum + (r.amount || 0), 0)

  return (
    <div className="space-y-4">
      {isDemo && <p className="text-xs text-charcoal-light/60 italic">Demo data — enrich to load real funding history</p>}

      <div className="grid grid-cols-3 gap-3 stagger-in">
        {[
          { val: data.length,             label: 'Rounds',       color: 'text-teal' },
          { val: `$${totalRaised}M`,      label: 'Total Raised', color: 'text-thistle' },
          { val: data[data.length-1]?.round || '—', label: 'Latest Round', color: 'text-tea-dark' },
        ].map(({ val, label, color }) => (
          <div key={label} className="bg-prussian-700/40 rounded-lg p-3 border border-charcoal/30 text-center">
            <p className={`text-2xl font-bold stat-number ${color}`}>{val}</p>
            <p className="text-xs text-charcoal-light mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="h-48 chart-enter">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <XAxis dataKey="round" tick={{ fill: '#5a6a7a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5a6a7a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(86,163,166,0.06)' }} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} isAnimationActive animationBegin={200} animationDuration={800} animationEasing="ease-out">
              {data.map((entry, i) => <Cell key={i} fill={entry.color || '#56A3A6'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 stagger-rows">
        {data.map((round, i) => (
          <div key={i} className="flex items-center gap-3 bg-prussian-700/30 rounded-lg px-3 py-2.5 border border-charcoal/20">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: round.color || '#56A3A6' }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-200">{round.round}</span>
              {round.investors && <span className="text-xs text-charcoal-light ml-2">{round.investors}</span>}
            </div>
            <span className="text-xs text-charcoal-light tabular-nums">{round.date}</span>
            <span className="text-sm font-bold text-teal tabular-nums">${round.amount}M</span>
          </div>
        ))}
      </div>
    </div>
  )
}
