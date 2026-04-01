/**
 * sources/qualification-engine.js — ICP qualification gate
 *
 * Runs BEFORE paid enrichment sources to hard-DQ or score each company.
 *
 * Hard DQs (any triggers immediate reject):
 *   1. HQ outside United States
 *   2. YC-backed
 *   3. Already acquired
 *   4. 200+ employees
 *   5. Possible HubSpot duplicate (sets flag, actual check in hubspot-dedup)
 *
 * Scoring (if not DQ'd):
 *   +15  Employees 1–20
 *   0    Employees 21–50 (neutral)
 *   -10  Employees 51–200
 *   +20  Has software product (SaaS/platform/API/app keywords)
 *   +5   .io or .ai domain
 *   +20  Vibe score > 60
 *   +10  Vibe score 30–60
 *   +10  Recent funding round
 *
 * Grade: A ≥ 40, B ≥ 20, C ≥ 0, DQ if hard DQ triggered
 *
 * No external dependencies.
 */

// ── US State abbreviations for HQ check ───────────────────────────────────

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','PR','GU','VI', // territories
]);

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse an employee count string/number into a number.
 * Handles: "50", "50-100", "~50", "50 employees", "1-10", etc.
 */
function parseEmployeeCount(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[,_]/g, '');
  // Range like "50-100" → take midpoint
  const rangeMatch = s.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
  }
  // Single number with noise
  const numMatch = s.match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) : null;
}

/**
 * Check if HQ address indicates a US company.
 */
function isUsHeadquarters(headquarters) {
  if (!headquarters) return null; // unknown — don't DQ on unknown

  const hq = String(headquarters).trim();

  // Explicit US indicators
  if (/\bUnited States\b|\bUSA\b|\bU\.S\.A\b|\bU\.S\.\b/i.test(hq)) return true;

  // Check for US state abbreviation at end of address (typical format)
  // e.g. "San Francisco, CA 94105" or "New York, NY"
  const stateMatch = hq.match(/,\s*([A-Z]{2})(?:\s+\d{5})?(?:\s*,?\s*(?:United States|USA|US))?$/);
  if (stateMatch && US_STATES.has(stateMatch[1])) return true;

  // Also catch "San Francisco, CA" anywhere
  const inlineState = hq.match(/\b([A-Z]{2})\b\s*\d{5}/);
  if (inlineState && US_STATES.has(inlineState[1])) return true;

  // Known non-US country indicators
  const nonUsCountries = [
    /\bUnited Kingdom\b|\bUK\b|\bEngland\b|\bScotland\b|\bWales\b/i,
    /\bCanada\b|\bOntario\b|\bBritish Columbia\b|\bQuebec\b/i,
    /\bAustralia\b|\bNew South Wales\b|\bVictoria\b|\bQueensland\b/i,
    /\bIndia\b|\bBangalore\b|\bMumbai\b|\bNew Delhi\b/i,
    /\bGermany\b|\bBerlin\b|\bMunich\b|\bFrance\b|\bParis\b/i,
    /\bSingapore\b|\bIsrael\b|\bNetherlands\b|\bAmsterdam\b/i,
    /\bChina\b|\bBeijing\b|\bShanghai\b|\bJapan\b|\bTokyo\b/i,
    /\bBrazil\b|\bSão Paulo\b|\bMexico\b|\bMexico City\b/i,
  ];
  for (const pattern of nonUsCountries) {
    if (pattern.test(hq)) return false;
  }

  // Ambiguous — don't DQ
  return null;
}

/**
 * Check if company is YC-backed.
 */
function isYcBacked(investors) {
  if (!investors) return false;
  const s = typeof investors === 'string' ? investors : JSON.stringify(investors);
  return /\bY\s*Combinator\b|\bYC\b/i.test(s);
}

/**
 * Check if company has been acquired.
 */
function isAcquired(existingData) {
  const fields = [existingData.description, existingData.recent_news, existingData.notes].filter(Boolean);
  const text = fields.join(' ');
  return /acquired\s+by|acquisition\s+by|was\s+acquired|has\s+been\s+acquired/i.test(text);
}

/**
 * Check if description implies a software product.
 */
function hasSoftwareProduct(description) {
  if (!description) return false;
  return /\bSaaS\b|\bsoftware\b|\bplatform\b|\bAPI\b|\bapp\b|\bapplication\b|\bcloud\b|\bdevtools?\b|\bdev\s+tool/i.test(description);
}

/**
 * Check if website is a .io or .ai domain.
 */
function isIoOrAiDomain(existingData) {
  const website = existingData.website || existingData.url || '';
  return /\.(io|ai)(\/|$)/i.test(website);
}

/**
 * Check if company has recent funding data.
 */
function hasRecentFunding(existingData) {
  return !!(existingData.last_funding_round || existingData.total_raised);
}

// ── Main enrich function ───────────────────────────────────────────────────

export async function enrich(entityType, entityId, existingData) {
  if (entityType !== 'company') {
    return { success: true, skipped: true, data: {}, reason: 'qualification-engine only qualifies companies' };
  }

  const signals = [];
  let dq = false;
  let dqReason = null;

  // ── Hard DQ checks ──────────────────────────────────────────────────────

  // DQ 1: HQ outside US
  const usHq = isUsHeadquarters(existingData.headquarters);
  if (usHq === false) {
    dq = true;
    dqReason = `HQ outside United States: ${existingData.headquarters}`;
    signals.push('dq:non_us_hq');
  }

  // DQ 2: YC-backed
  if (!dq && isYcBacked(existingData.investors)) {
    dq = true;
    dqReason = 'YC-backed company';
    signals.push('dq:yc_backed');
  }

  // DQ 3: Already acquired
  if (!dq && isAcquired(existingData)) {
    dq = true;
    dqReason = 'Company has been acquired';
    signals.push('dq:acquired');
  }

  // DQ 4: 200+ employees
  const empCount = parseEmployeeCount(existingData.employee_count);
  if (!dq && empCount !== null && empCount >= 200) {
    dq = true;
    dqReason = `Employee count too high: ${empCount}`;
    signals.push(`dq:too_many_employees:${empCount}`);
  }

  // Flag 5: Needs HubSpot dedup check (always set, actual check done by hubspot-dedup)
  const needsHubspotDedup = true;

  if (dq) {
    console.log(`[qualification-engine] ❌ DQ: ${existingData.name} — ${dqReason}`);
    return {
      success: true,
      data: {
        dq: true,
        dq_reason: dqReason,
        qualification_score: -999,
        qualification_grade: 'DQ',
        qualification_signals: signals,
        needs_hubspot_dedup: needsHubspotDedup,
      },
      source: 'qualification-engine',
    };
  }

  // ── Scoring (no DQ) ─────────────────────────────────────────────────────
  let score = 0;

  // Employee count scoring
  if (empCount !== null) {
    if (empCount >= 1 && empCount <= 20) {
      score += 15;
      signals.push(`employees_1_20:${empCount}`);
    } else if (empCount >= 21 && empCount <= 50) {
      signals.push(`employees_21_50:${empCount}`);
      // neutral — no points
    } else if (empCount >= 51 && empCount <= 199) {
      score -= 10;
      signals.push(`employees_51_200:${empCount}`);
    }
  }

  // Software product
  if (hasSoftwareProduct(existingData.description)) {
    score += 20;
    signals.push('has_software_product');
  }

  // .io or .ai domain
  if (isIoOrAiDomain(existingData)) {
    score += 5;
    signals.push('io_or_ai_domain');
  }

  // Vibe score
  const vibeScore = existingData.vibe_score != null ? Number(existingData.vibe_score) : null;
  if (vibeScore !== null) {
    if (vibeScore > 60) {
      score += 20;
      signals.push(`high_vibe_score:${vibeScore}`);
    } else if (vibeScore >= 30) {
      score += 10;
      signals.push(`mid_vibe_score:${vibeScore}`);
    }
  }

  // Recent funding
  if (hasRecentFunding(existingData)) {
    score += 10;
    signals.push('recent_funding');
  }

  // Grade assignment
  let grade;
  if (score >= 40) grade = 'A';
  else if (score >= 20) grade = 'B';
  else grade = 'C';

  console.log(`[qualification-engine] ✅ ${existingData.name}: grade=${grade}, score=${score}, signals=[${signals.join(', ')}]`);

  return {
    success: true,
    data: {
      dq: false,
      dq_reason: null,
      qualification_score: score,
      qualification_grade: grade,
      qualification_signals: signals,
      needs_hubspot_dedup: needsHubspotDedup,
    },
    source: 'qualification-engine',
    fieldsFound: 4,
  };
}

export default { enrich };
