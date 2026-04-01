/**
 * VerificationBadge.jsx — Colored shield badge showing company verification status + score
 *
 * Props:
 *   score  {number|null}  0-100 verification score
 *   status {string|null}  'verified' | 'partial' | 'unverified' | 'flagged'
 *   size   {'sm'|'md'}    Badge size (default 'sm')
 */

export default function VerificationBadge({ score, status, size = 'sm' }) {
  // Derive status from score if not provided
  const derivedStatus = status || (
    score == null ? 'unverified' :
    score >= 80   ? 'verified'   :
    score >= 60   ? 'partial'    :
    score >= 31   ? 'unverified' :
                    'flagged'
  );

  const cfg = {
    verified: {
      bg:        'bg-emerald-900/40',
      border:    'border-emerald-600/50',
      text:      'text-emerald-400',
      iconColor: '#34d399',
      label:     'Verified',
      icon:      'check',
    },
    partial: {
      bg:        'bg-yellow-900/30',
      border:    'border-yellow-600/40',
      text:      'text-yellow-400',
      iconColor: '#facc15',
      label:     'Partial',
      icon:      'half',
    },
    unverified: {
      bg:        'bg-slate-700/30',
      border:    'border-slate-500/30',
      text:      'text-slate-400',
      iconColor: '#94a3b8',
      label:     'Unverified',
      icon:      'shield',
    },
    flagged: {
      bg:        'bg-red-900/30',
      border:    'border-red-600/40',
      text:      'text-red-400',
      iconColor: '#f87171',
      label:     'Flagged',
      icon:      'x',
    },
  }[derivedStatus] || {
    bg:        'bg-slate-700/30',
    border:    'border-slate-500/30',
    text:      'text-slate-400',
    iconColor: '#94a3b8',
    label:     'Unknown',
    icon:      'shield',
  };

  const isSm = size === 'sm';
  const iconSize = isSm ? 10 : 13;
  const shieldW  = isSm ? 12 : 15;
  const shieldH  = isSm ? 14 : 17;

  const ShieldIcon = ({ kind }) => (
    <svg
      width={shieldW}
      height={shieldH}
      viewBox="0 0 24 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      {/* Shield body */}
      <path
        d="M12 2L3 6v8c0 5.25 3.75 10.15 9 11.35C17.25 24.15 21 19.25 21 14V6L12 2z"
        fill={cfg.iconColor}
        fillOpacity="0.2"
        stroke={cfg.iconColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Inner icon overlay */}
      {kind === 'check' && (
        <polyline
          points="8,14 11,17 16,11"
          stroke={cfg.iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      {kind === 'x' && (
        <>
          <line x1="9" y1="11" x2="15" y2="17" stroke={cfg.iconColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="11" x2="9"  y2="17" stroke={cfg.iconColor} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {kind === 'half' && (
        <line x1="9" y1="14" x2="15" y2="14" stroke={cfg.iconColor} strokeWidth="2" strokeLinecap="round" />
      )}
      {/* 'shield' kind: no inner icon — plain shield */}
    </svg>
  );

  const scoreDisplay = score != null ? score : '—';

  if (isSm) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium
          ${cfg.bg} ${cfg.border} ${cfg.text}`}
        title={`Verification: ${cfg.label} (${scoreDisplay}/100)`}
      >
        <ShieldIcon kind={cfg.icon} />
        <span>{cfg.label} {scoreDisplay}</span>
      </span>
    );
  }

  // md size
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-sm font-semibold
        ${cfg.bg} ${cfg.border} ${cfg.text}`}
      title={`Verification: ${cfg.label} (${scoreDisplay}/100)`}
    >
      <ShieldIcon kind={cfg.icon} />
      <span>{cfg.label} {scoreDisplay}</span>
    </span>
  );
}
