import { Server, Cpu, MapPin, Zap } from 'lucide-react'

const MOCK_INFRA = {
  gpu_count: '5,000+',
  gpu_types: ['NVIDIA H100', 'NVIDIA A100', 'AMD MI300X'],
  models_served: ['Llama 3.1 70B', 'Mistral 7B', 'Custom fine-tunes'],
  data_centers: [
    { location: 'Ashburn, VA',    region: 'us-east-1',      status: 'active',   capacity: '85%' },
    { location: 'San Jose, CA',   region: 'us-west-1',      status: 'active',   capacity: '72%' },
    { location: 'Frankfurt, DE',  region: 'eu-central-1',   status: 'active',   capacity: '61%' },
    { location: 'Tokyo, JP',      region: 'ap-northeast-1', status: 'building', capacity: '—' },
  ],
  power_mw: 320,
  cooling: 'Liquid cooled',
}

function CapacityBar({ pct }) {
  const n     = parseInt(pct) || 0
  const color = n >= 90 ? 'bg-red-500' : n >= 75 ? 'bg-amber-500' : 'bg-tea-dark'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-prussian rounded-full overflow-hidden">
        <div className={`h-full rounded-full progress-fill ${color}`} style={{ width: `${n}%` }} />
      </div>
      <span className="text-xs text-charcoal-light tabular-nums w-8">{pct}</span>
    </div>
  )
}

export default function InfrastructureOverview({ infra }) {
  const data   = infra || MOCK_INFRA
  const isDemo = !infra

  return (
    <div className="space-y-4">
      {isDemo && <p className="text-xs text-charcoal-light/60 italic">Demo data — enrich to load real infrastructure details</p>}

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-in">
        <div className="bg-prussian-700/40 rounded-lg p-3 border border-charcoal/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Cpu size={13} className="text-teal" />
            <span className="text-xs text-charcoal-light">GPU Count</span>
          </div>
          <p className="text-xl font-bold text-teal stat-number">{data.gpu_count || '—'}</p>
        </div>
        <div className="bg-prussian-700/40 rounded-lg p-3 border border-charcoal/30">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin size={13} className="text-thistle" />
            <span className="text-xs text-charcoal-light">Data Centers</span>
          </div>
          <p className="text-xl font-bold text-thistle stat-number">{data.data_centers?.length || '—'}</p>
        </div>
        <div className="bg-prussian-700/40 rounded-lg p-3 border border-charcoal/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={13} className="text-amber-400" />
            <span className="text-xs text-charcoal-light">Power</span>
          </div>
          <p className="text-xl font-bold text-amber-400 stat-number">{data.power_mw ? `${data.power_mw}MW` : '—'}</p>
        </div>
        <div className="bg-prussian-700/40 rounded-lg p-3 border border-charcoal/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Server size={13} className="text-tea-dark" />
            <span className="text-xs text-charcoal-light">Models</span>
          </div>
          <p className="text-xl font-bold text-tea-dark stat-number">{data.models_served?.length || '—'}</p>
        </div>
      </div>

      {/* GPU Types */}
      {data.gpu_types?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">GPU Hardware</p>
          <div className="flex flex-wrap gap-2">
            {data.gpu_types.map((gpu, i) => (
              <span key={i} className="text-xs bg-teal/10 border border-teal/20 text-teal rounded-lg px-3 py-1.5 font-medium">
                {gpu}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Models served */}
      {data.models_served?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Models Served</p>
          <div className="flex flex-wrap gap-2">
            {data.models_served.map((model, i) => (
              <span key={i} className="text-xs bg-thistle/10 border border-thistle/20 text-thistle rounded-lg px-3 py-1.5">
                {model}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Data centers */}
      {data.data_centers?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-charcoal-light uppercase tracking-wider mb-2">Data Centers</p>
          <div className="space-y-2 stagger-rows">
            {data.data_centers.map((dc, i) => (
              <div key={i} className="flex items-center gap-3 bg-prussian-700/30 rounded-lg px-3 py-2.5 border border-charcoal/20">
                <MapPin size={13} className={dc.status === 'active' ? 'text-tea-dark' : 'text-amber-400'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-200 font-medium">{dc.location}</span>
                    <span className="text-xs text-charcoal-light/60 font-mono">{dc.region}</span>
                    <span className={`text-xs badge border ${dc.status === 'active' ? 'text-tea-dark bg-tea/10 border-tea/30' : 'text-amber-400 bg-amber-400/10 border-amber-400/30'}`}>
                      {dc.status}
                    </span>
                  </div>
                  {dc.capacity !== '—' && <CapacityBar pct={dc.capacity} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
