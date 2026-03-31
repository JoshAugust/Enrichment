/**
 * sources/nvidia-partners.js — NVIDIA partner ecosystem enrichment
 *
 * Cross-references companies against NVIDIA's partner programs:
 *   - NCP  (NVIDIA Cloud Partner)
 *   - DGX-Ready Storage / DGX-Ready Server
 *   - NVIDIA Inception (AI startup accelerator)
 *   - NVIDIA Partner Network (general)
 *
 * Uses DuckDuckGo Lite searches against site:nvidia.com and general web.
 * No API key required.
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const { rateLimiter } = require('./rate-limiter');
const { ddgSearch } = require('./web-search');

// ── Partnership level scoring ─────────────────────────────────────────────────

/**
 * Partnership tiers in descending trust/value order.
 * First match wins.
 */
const PARTNERSHIP_TIERS = [
  {
    level: 'NCP',
    label: 'NVIDIA Cloud Partner',
    patterns: [
      /nvidia\s+cloud\s+partner/i,
      /\bncp\b.*nvidia/i,
      /nvidia.*\bncp\b/i,
    ],
    queries: [
      (name) => `site:nvidia.com "cloud partner" "${name}"`,
      (name) => `site:nvidia.com/en-us/data-center/partners "${name}"`,
    ],
  },
  {
    level: 'DGX-Ready',
    label: 'NVIDIA DGX-Ready',
    patterns: [
      /dgx.?ready/i,
      /nvidia\s+dgx\s+certified/i,
    ],
    queries: [
      (name) => `site:nvidia.com "DGX Ready" "${name}"`,
      (name) => `site:nvidia.com "DGX-Ready" "${name}"`,
    ],
  },
  {
    level: 'Inception',
    label: 'NVIDIA Inception Program',
    patterns: [
      /nvidia\s+inception/i,
      /inception\s+program.*nvidia/i,
      /nvidia.*inception\s+program/i,
    ],
    queries: [
      (name) => `site:nvidia.com "inception" "${name}"`,
      (name) => `"nvidia inception" "${name}"`,
    ],
  },
  {
    level: 'Preferred',
    label: 'NVIDIA Partner Network',
    patterns: [
      /nvidia\s+partner(?:\s+network)?/i,
      /authorized\s+nvidia\s+reseller/i,
      /nvidia\s+preferred\s+partner/i,
      /nvpn\b/i,
    ],
    queries: [
      (name) => `"nvidia partner" "${name}"`,
      (name) => `site:nvidia.com "${name}"`,
    ],
  },
];

// ── General GPU vendor verification ──────────────────────────────────────────

const GPU_VENDOR_RE = /\b(nvidia|amd\s+instinct|intel\s+gaudi|graphcore|cerebras|sambanova)\b/i;

function checkGpuVendorMention(text) {
  const m = text.match(GPU_VENDOR_RE);
  return m ? m[1].toLowerCase() : null;
}

// ── Search + classify ─────────────────────────────────────────────────────────

/**
 * Run DDG searches for a given tier and return matching snippets.
 */
async function searchTier(tier, companyName) {
  const allResults = [];

  for (const queryFn of tier.queries) {
    const query = queryFn(companyName);
    const results = await ddgSearch(query);
    allResults.push(...results);
    await new Promise(r => setTimeout(r, 400));
  }

  // Deduplicate by URL
  const seen = new Set();
  const deduped = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Check if any result matches the tier's patterns
  const matchingResults = deduped.filter(r => {
    const text = `${r.title} ${r.snippet} ${r.url}`;
    return tier.patterns.some(re => re.test(text));
  });

  return { deduped, matchingResults };
}

/**
 * Extract partnership detail snippets from search results.
 */
function extractDetails(results, companyName) {
  return results
    .filter(r => r.snippet && r.snippet.length > 20)
    .map(r => ({
      title: r.title.slice(0, 120),
      snippet: r.snippet.slice(0, 250),
      url: r.url,
    }))
    .slice(0, 3);
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData  - Must include at minimum: { name }
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'nvidia-partners',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  if (entityType !== 'company') {
    result.success = true;
    result.skipped = true;
    return result;
  }

  const name = existingData.name;
  if (!name) {
    result.success = false;
    result.error = 'Company name required';
    return result;
  }

  console.log(`[nvidia-partners] Enriching company: ${name}`);

  try {
    let partnershipLevel = 'None';
    let partnershipDetails = [];
    let verifiedGpuVendor = null;

    // Search each tier in priority order; stop at first confirmed match
    for (const tier of PARTNERSHIP_TIERS) {
      const { deduped, matchingResults } = await searchTier(tier, name);

      if (matchingResults.length > 0) {
        partnershipLevel = tier.level;
        partnershipDetails = extractDetails(matchingResults, name);
        console.log(`[nvidia-partners] ${name}: matched tier ${tier.level} (${matchingResults.length} results)`);
        break;
      }

      // Even if no tier match, check for general GPU vendor mentions
      if (!verifiedGpuVendor) {
        const allText = deduped.map(r => `${r.title} ${r.snippet}`).join(' ');
        const vendor = checkGpuVendorMention(allText);
        if (vendor) verifiedGpuVendor = vendor;
      }

      // Polite pause between tiers
      await new Promise(r => setTimeout(r, 600));
    }

    // If we found a partnership, NVIDIA is obviously a GPU vendor
    if (partnershipLevel !== 'None') {
      verifiedGpuVendor = 'nvidia';
    }

    result.data = {
      nvidia_partnership_level:  partnershipLevel,
      nvidia_partnership:        partnershipLevel,
      partnership_details:       partnershipDetails,
      verified_gpu_vendor:       verifiedGpuVendor,
      is_nvidia_partner:         partnershipLevel !== 'None',
    };

    // Map to top-level DB field
    if (partnershipLevel !== 'None') {
      result.data.estimated_gpu_scale = result.data.estimated_gpu_scale ||
        (partnershipLevel === 'NCP' ? 'enterprise' : null);
    }

    result.success = true;
    console.log(
      `[nvidia-partners] ${name}: level=${partnershipLevel}, ` +
      `gpu_vendor=${verifiedGpuVendor || 'unknown'}`
    );

  } catch (err) {
    console.error(`[nvidia-partners] Failed for ${name}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich, PARTNERSHIP_TIERS };
