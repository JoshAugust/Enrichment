/**
 * AgentQABadge.jsx — Badge showing Agent QA score (independent AI verification)
 *
 * Props:
 *   score  {number|null}  0-100 agent QA score
 *   notes  {string|null}  QA notes from agent
 *   size   {'sm'|'md'}    Badge size (default 'sm')
 */

export default function AgentQABadge({ score, notes, size = 'sm' }) {
  if (score == null) {
    // Not yet QA'd
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium
          bg-slate-800/40 border-slate-600/30 text-slate-500"
        title="Agent QA: Not yet scored"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <circle cx="12" cy="12" r="9" stroke="#64748b" strokeWidth="2"/>
          <path d="M12 8v5M12 16h.01" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>QA —</span>
      </span>
    );
  }

  const level = score >= 80 ? 'high' : score >= 55 ? 'mid' : 'low';

  const cfg = {
    high: {
      bg:     'bg-cyan-900/30',
      border: 'border-cyan-600/40',
      text:   'text-cyan-400',
      dot:    '#22d3ee',
      label:  'QA ✓',
    },
    mid: {
      bg:     'bg-amber-900/25',
      border: 'border-amber-600/35',
      text:   'text-amber-400',
      dot:    '#fbbf24',
      label:  'QA ~',
    },
    low: {
      bg:     'bg-rose-900/25',
      border: 'border-rose-600/35',
      text:   'text-rose-400',
      dot:    '#fb7185',
      label:  'QA ✗',
    },
  }[level];

  const tooltip = [
    `Agent QA Score: ${score}/100`,
    notes ? `\n${notes.slice(0, 120)}${notes.length > 120 ? '…' : ''}` : '',
  ].join('');

  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium
        ${cfg.bg} ${cfg.border} ${cfg.text}`}
      title={tooltip}
    >
      <svg width={isSm ? 8 : 10} height={isSm ? 8 : 10} viewBox="0 0 10 10" className="flex-shrink-0">
        <circle cx="5" cy="5" r="4" fill={cfg.dot} fillOpacity="0.8"/>
      </svg>
      <span>{cfg.label} {score}</span>
    </span>
  );
}
