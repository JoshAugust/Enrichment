/**
 * script-generator.js — Personalized call script builder for Corgi Outreach
 *
 * Takes a company profile and generates a customized version of the appropriate
 * script (A–E from the Corgi playbook). The opening lines are personalized with
 * company-specific details so each call feels researched, not templated.
 *
 * Script selection logic:
 *   A — Cheaper Capital:   Operators with known financing activity
 *   B — Better Structure:  Operators with general GPU/AI focus
 *   C — Lender Angle:      Lenders / credit funds
 *   D — Operator Pain:     Operators where residual value pain likely
 *   E — Simple CTA:        Unknown type, or fallback for any type
 */

'use strict';

// ── Base Scripts (verbatim from Corgi Playbook) ───────────────────────────────

const BASE_SCRIPTS = {
  A: {
    version: 'A',
    name: 'Cheaper Capital',
    buyer_types: ['operator'],
    lines: [
      'We help GPU owners get cheaper debt by reducing future collateral risk on the GPUs.',
      'Is financing new GPU capacity a priority for you this year?',
      'We work with structures that give lenders more comfort on residual value at maturity.',
      'That can help improve leverage, tenor, or pricing.',
      'Would it be useful to show you how this could fit into an existing or upcoming financing package?',
    ],
    followups: [
      'Are you financing owned GPUs, leased GPUs, or both?',
      'Who usually leads those conversations: treasury, infra, CFO, or a financing partner?',
      'Do lenders push back more on leverage, tenor, or pricing?',
    ],
  },
  B: {
    version: 'B',
    name: 'Better Debt Structure',
    buyer_types: ['operator'],
    lines: [
      'We help AI infrastructure operators get a better debt structure on GPU purchases.',
      'A lot of lenders still get stuck on one question: what are the GPUs worth at maturity?',
      'We solve for that part of the underwriting problem.',
      'If this is relevant, I would like to set up 20 minutes with Isaac and Josh.',
      'Would next week work?',
    ],
    followups: [
      'Do you already have a lender asking about collateral value at maturity?',
      'Would you look at this for the next cluster only, or as a standard financing tool?',
    ],
  },
  C: {
    version: 'C',
    name: 'Lender Angle',
    buyer_types: ['lender'],
    lines: [
      'We help lenders make more GPU-backed loans with better downside protection on the hardware.',
      'Are you currently looking at AI infrastructure or GPU-backed credit opportunities?',
      'We are building a residual value solution that gives lenders a clearer floor on collateral value.',
      'It is meant to make the deal easier to underwrite, not add complexity.',
      'Open to a short call to see if it fits your credit box?',
    ],
    followups: [
      'Who usually leads those conversations: treasury, infra, CFO, or a financing partner?',
      'Do lenders push back more on leverage, tenor, or pricing?',
      'Do you already have a lender asking about collateral value at maturity?',
    ],
  },
  D: {
    version: 'D',
    name: 'Operator Pain',
    buyer_types: ['operator'],
    lines: [
      'We help data centers finance more GPUs without taking as much pricing pain from residual value uncertainty.',
      'Some lenders love the demand story but hesitate on end-of-term hardware value.',
      'We address that issue directly.',
      'If you are raising debt or expect to, this could be relevant.',
      'Can I book a short call with the founders?',
    ],
    followups: [
      'Are you financing owned GPUs, leased GPUs, or both?',
      'Do lenders push back more on leverage, tenor, or pricing?',
      'Would you look at this for the next cluster only, or as a standard financing tool?',
    ],
  },
  E: {
    version: 'E',
    name: 'Simple CTA',
    buyer_types: ['operator', 'lender', 'arranger'],
    lines: [
      'We help reduce the cost of capital for GPU infrastructure.',
      'The reason is simple: lenders get more comfort on future hardware value.',
      'If you are financing clusters, this may help.',
      'I am not trying to sell you a policy on this call.',
      'I just want to see whether a 20-minute discussion is worth it.',
    ],
    followups: [
      'Are you financing owned GPUs, leased GPUs, or both?',
      'Who usually leads those conversations: treasury, infra, CFO, or a financing partner?',
    ],
  },
};

const IF_THEY_ASK = [
  'It is a residual value solution for data-center GPUs.',
  'The simple purpose is to reduce lender downside on future hardware value.',
  'That can help make debt cheaper or easier to raise.',
  'On the next call, Isaac and Josh can walk through how it works in the financing stack.',
];

// ── Script Selection Logic ────────────────────────────────────────────────────

/**
 * Select the best base script version for a company.
 *
 * @param {object} company
 * @returns {string} script version key (A–E)
 */
function selectVersion(company) {
  const type = (company.type || 'operator').toLowerCase();
  const status = (company.financing_status || 'unknown').toLowerCase();
  const priority = (company.priority || 'C').toUpperCase();

  if (type === 'lender') return 'C';
  if (type === 'arranger') return 'E';

  // Operator paths
  if (status === 'active') return 'A'; // Active financing → lead with Cheaper Capital
  if (priority === 'A') return 'B';    // Top priority operators → Better Structure
  if (status === 'upcoming') return 'D'; // Upcoming → Operator Pain
  return 'B'; // Default operator
}

// ── Personalization ───────────────────────────────────────────────────────────

/**
 * Build a personalized opening sentence based on company context.
 *
 * @param {object} company
 * @param {string} version  - Script version
 * @returns {string|null}   - Extra opening line, or null if none
 */
function buildPersonalizedOpening(company, version) {
  const { name, description, estimated_gpu_scale, financing_status } = company;

  const parts = [];

  // Reference their scale if known
  if (estimated_gpu_scale && estimated_gpu_scale !== 'unknown') {
    parts.push(`with your ${estimated_gpu_scale} infrastructure`);
  }

  // Reference known financing activity
  if (financing_status === 'active') {
    parts.push('given your active debt process');
  } else if (financing_status === 'upcoming') {
    parts.push('as you scale your GPU fleet');
  }

  // Build short custom opener
  if (parts.length > 0) {
    return `Hi, this is Josh from Corgi — reaching out to ${name} specifically ${parts.join(', ')}.`;
  }

  // Fallback: minimal personalization
  return `Hi, this is Josh from Corgi — we came across ${name} while researching GPU infrastructure operators.`;
}

/**
 * Personalize script lines with company-specific references.
 * Mainly swaps placeholder phrases for concrete ones.
 */
function personalizeLines(lines, company) {
  const { name, type } = company;
  const typeLabel = type === 'lender' ? 'lending book' : type === 'arranger' ? 'deal flow' : 'GPU fleet';

  return lines.map((line) =>
    line
      .replace('GPU infrastructure', `${name}'s GPU infrastructure`)
      .replace('your clusters', `${name}'s clusters`)
  );
}

// ── Main Generator ────────────────────────────────────────────────────────────

/**
 * Generate a customized call script for a company.
 *
 * @param {object} company  - Company DB record
 * @returns {{ version, name, buyer_type, opening, lines, followups, if_they_ask, raw }}
 */
function generateScript(company) {
  const version = selectVersion(company);
  const base = BASE_SCRIPTS[version];

  const opening = buildPersonalizedOpening(company, version);
  const personalizedLines = personalizeLines([...base.lines], company);

  const result = {
    version,
    name: base.name,
    buyer_type: company.type || 'operator',
    company_name: company.name,
    opening,
    lines: personalizedLines,
    followups: base.followups,
    if_they_ask: IF_THEY_ASK,
    generated_at: new Date().toISOString(),
  };

  return result;
}

/**
 * Generate all applicable script variants for a company (useful for A/B testing).
 * Returns an array of scripts in priority order.
 *
 * @param {object} company
 * @returns {Array}
 */
function generateAllVariants(company) {
  const type = (company.type || 'operator').toLowerCase();

  let versions;
  if (type === 'lender') versions = ['C', 'E'];
  else if (type === 'arranger') versions = ['E', 'C'];
  else versions = ['A', 'B', 'D', 'E']; // operator

  return versions.map((v) => {
    const base = BASE_SCRIPTS[v];
    return {
      version: v,
      name: base.name,
      buyer_type: type,
      company_name: company.name,
      opening: buildPersonalizedOpening(company, v),
      lines: personalizeLines([...base.lines], company),
      followups: base.followups,
      if_they_ask: IF_THEY_ASK,
    };
  });
}

module.exports = { generateScript, generateAllVariants, selectVersion, BASE_SCRIPTS };
