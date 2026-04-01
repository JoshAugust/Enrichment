export function priorityColor(priority) {
  switch (priority) {
    case 'A': return 'text-tea-darker bg-tea/15 border-tea/40'
    case 'B': return 'text-thistle-dark bg-thistle/15 border-thistle/40'
    case 'C': return 'text-charcoal-light bg-charcoal/20 border-charcoal/40'
    default:  return 'text-charcoal-light bg-charcoal/15 border-charcoal/30'
  }
}

export function priorityDot(priority) {
  switch (priority) {
    case 'A': return 'bg-tea-dark'
    case 'B': return 'bg-thistle'
    case 'C': return 'bg-charcoal-light'
    default:  return 'bg-charcoal'
  }
}

export function scoreColor(score) {
  if (score >= 80) return 'text-tea-dark'
  if (score >= 60) return 'text-thistle'
  return 'text-charcoal-light'
}

export function typeLabel(type) {
  return type === 'operator' ? 'Operator' : 'Lender'
}

export function typeBadge(type) {
  return type === 'operator'
    ? 'text-teal bg-teal/10 border-teal/30'
    : 'text-thistle bg-thistle/10 border-thistle/30'
}

export function statusBadge(status) {
  const map = {
    draft: 'text-charcoal-light bg-charcoal/10 border-charcoal/30',
    approved: 'text-teal bg-teal/10 border-teal/30',
    scheduled: 'text-thistle bg-thistle/10 border-thistle/30',
    sent: 'text-tea-dark bg-tea/10 border-tea/30',
  }
  return map[status] || 'text-charcoal-light bg-charcoal/10 border-charcoal/30'
}

export function truncate(str, n = 80) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}
