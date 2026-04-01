/**
 * scorer.js — Qualification scoring for Corgi target companies
 *
 * Scores 0–100 based on how well a company fits Corgi's ideal customer profile:
 *   - Owns or finances GPUs directly
 *   - Live or upcoming debt process in 6–12 months
 *   - Would benefit from cheaper capital / longer tenor / better leverage
 *   - Clear lender, credit fund, or treasury contact available
 *   - Plausibly holds/finances $50M–$150M of GPU hardware over time
 *
 * Scoring breakdown:
 *   GPU ownership signal     → up to 25 pts
 *   Financing relevance      → up to 25 pts
 *   Scale fit                → up to 20 pts
 *   Contact quality          → up to 15 pts
 *   Priority tier            → up to 15 pts
 */

'use strict';

// ── Scoring sub-components ────────────────────────────────────────────────────

/**
 * GPU Ownership Signal (0–25)
 * Does this company actually own or finance GPUs at meaningful scale?
 */
function scoreGpuOwnership(company, enriched) {
  let score = 0;

  // Type: operators and lenders are most relevant
  if (company.type === 'operator') score += 20;
  else if (company.type === 'lender') score += 18;
  else if (company.type === 'arranger') score += 10;

  // GPU scale mention
  const scale = (company.estimated_gpu_scale || '').toLowerCase();
  if (scale !== 'unknown' && scale !== '') {
    score += 5;
    // Bonus if large scale
    if (/\d{4,}|billion|bn|\$\d+[mb]/i.test(scale)) score += 0; // already maxed
  }

  return Math.min(score, 25);
}

/**
 * Financing Relevance (0–25)
 * Is there an active or upcoming debt process?
 */
function scoreFinancingRelevance(company) {
  let score = 0;

  switch ((company.financing_status || '').toLowerCase()) {
    case 'active':
      score = 25;
      break;
    case 'upcoming':
      score = 18;
      break;
    case 'unknown':
    default:
      score = 8; // still worth talking to
  }

  return score;
}

/**
 * Scale Fit (0–20)
 * Does the company plausibly sit in the $50M–$150M GPU financing sweet spot?
 */
function scoreScaleFit(company) {
  const scaleText = (company.estimated_gpu_scale || '').toLowerCase();
  const description = (company.description || '').toLowerCase();
  const combined = `${scaleText} ${description}`;

  // Extract dollar values
  const billionMatch = combined.match(/\$(\d+(?:\.\d+)?)\s*(?:billion|bn)/i);
  const millionMatch = combined.match(/\$(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i);

  if (billionMatch) {
    const val = parseFloat(billionMatch[1]);
    // Anything > $500M is probably too large or already well-financed
    if (val >= 0.05 && val <= 2) return 20; // $50M–$2B range: sweet spot
    if (val > 2) return 10; // big players — worth reaching but harder deal
    return 12;
  }

  if (millionMatch) {
    const val = parseFloat(millionMatch[1]);
    if (val >= 50 && val <= 150) return 20;  // perfect range
    if (val >= 20 && val < 50) return 14;    // slightly small
    if (val > 150) return 16;                // larger, still relevant
    return 8;
  }

  // No dollar amount found — give partial credit based on type
  if (company.type === 'operator') return 12;
  if (company.type === 'lender') return 14;
  return 8;
}

/**
 * Contact Quality (0–15)
 * Do we have or can we find a clear financial decision-maker?
 */
function scoreContactQuality(contacts, contactSignals) {
  let score = 0;

  const verifiedContacts = (contacts || []).filter((c) => c.verified);
  const allContacts = contacts || [];
  const signals = contactSignals || [];

  if (verifiedContacts.length >= 2) score = 15;
  else if (verifiedContacts.length === 1) score = 10;
  else if (allContacts.length >= 1) score = 7;
  else if (signals.length > 0) score = 4;
  else score = 0;

  // Bonus for CFO/treasury-type titles
  const financeTitles = [...allContacts.map((c) => c.title || ''), ...signals];
  const hasFinanceTitle = financeTitles.some((t) =>
    /cfo|treasurer|finance|credit|capital|investment/i.test(t)
  );
  if (hasFinanceTitle) score = Math.min(score + 3, 15);

  return score;
}

/**
 * Priority Tier (0–15)
 * A = 15, B = 10, C = 5
 */
function scorePriority(company) {
  switch ((company.priority || '').toUpperCase()) {
    case 'A': return 15;
    case 'B': return 10;
    case 'C': return 5;
    default: return 5;
  }
}

// ── Main scoring function ─────────────────────────────────────────────────────

/**
 * Score a company 0–100.
 *
 * @param {object} company   - Company DB record
 * @param {Array}  contacts  - Array of contact records for this company
 * @param {object} enriched  - Optional enrichment result (may include contact_signals)
 * @returns {{ score: number, breakdown: object }}
 */
function scoreCompany(company, contacts = [], enriched = {}) {
  const contactSignals = enriched.contact_signals || [];

  const breakdown = {
    gpu_ownership:       scoreGpuOwnership(company, enriched),
    financing_relevance: scoreFinancingRelevance(company),
    scale_fit:           scoreScaleFit(company),
    contact_quality:     scoreContactQuality(contacts, contactSignals),
    priority_tier:       scorePriority(company),
  };

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return {
    score: Math.min(Math.max(Math.round(score), 0), 100),
    breakdown,
  };
}

module.exports = { scoreCompany };
