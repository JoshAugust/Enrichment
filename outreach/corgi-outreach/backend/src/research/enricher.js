/**
 * enricher.js — Structured data extraction from scraped company text
 *
 * Backward-compatible enricher that:
 *   1. Runs heuristic NLP on scraped HTML text (original behaviour)
 *   2. Optionally triggers the full multi-source enrichment pipeline
 *
 * Original exports preserved: enrichCompany, extractGpuScale, detectFinancingStatus, detectType
 * New exports: enrichCompanyFull, enrichContactFull (pipeline-backed)
 */

'use strict';

// ── Keyword lists ─────────────────────────────────────────────────────────────

const OPERATOR_SIGNALS = [
  'gpu cloud', 'ai cloud', 'compute cloud', 'data center', 'gpu infrastructure',
  'hpc', 'high performance compute', 'gpu cluster', 'ai infrastructure',
  'cloud computing', 'bare metal', 'colocation', 'liquid cooling', 'h100', 'a100',
  'nvidia', 'amd instinct', 'gpu capacity', 'inference', 'training cluster',
];

const LENDER_SIGNALS = [
  'private credit', 'asset-backed', 'equipment finance', 'credit fund',
  'lending', 'debt facility', 'credit facility', 'structured credit',
  'direct lending', 'asset finance', 'collateral', 'underwriting',
  'credit manager', 'alternative credit', 'term loan',
];

const ARRANGER_SIGNALS = [
  'debt arranger', 'capital markets', 'structured finance', 'debt advisory',
  'financial sponsor', 'placement agent', 'syndication', 'deal structuring',
  'investment bank', 'advisory',
];

const GPU_SCALE_PATTERNS = [
  { re: /(\d[\d,]+)\s*gpus?/gi, unit: 'GPUs' },
  { re: /(\d+[kK])\+?\s*gpus?/gi, unit: 'GPUs' },
  { re: /\$(\d+(?:\.\d+)?)\s*(?:billion|bn)\b/gi, unit: 'USD_B' },
  { re: /\$(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/gi, unit: 'USD_M' },
  { re: /(\d+(?:\.\d+)?)\s*(?:exaflop|petaflop)/gi, unit: 'FLOPS' },
];

const FINANCING_SIGNALS = {
  active: [
    'raising debt', 'debt financing', 'credit facility', 'term loan', 'recently closed',
    'financing round', 'raised', 'secured financing', 'credit agreement',
  ],
  upcoming: [
    'expanding', 'plans to', 'will deploy', 'future investment', 'scaling',
    'growing fleet', 'building out',
  ],
};

const CONTACT_TITLE_PATTERNS = [
  /\b(cfo|chief financial officer)\b/gi,
  /\b(cto|chief technology officer)\b/gi,
  /\b(ceo|chief executive)\b/gi,
  /\b(treasurer|head of finance|head of capital)\b/gi,
  /\b(vp of finance|director of finance|svp finance)\b/gi,
  /\b(managing director|managing partner)\b/gi,
  /\b(portfolio manager|credit officer|underwriter)\b/gi,
  /\b(infrastructure lead|head of infrastructure)\b/gi,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function countMatches(text, patterns) {
  const lower = text.toLowerCase();
  return patterns.reduce((n, p) => n + (lower.includes(p) ? 1 : 0), 0);
}

function extractGpuScale(text) {
  const hits = [];
  for (const { re, unit } of GPU_SCALE_PATTERNS) {
    const regex = new RegExp(re.source, re.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      hits.push(`${match[1]} ${unit}`);
    }
  }
  return hits.length > 0 ? hits.slice(0, 3).join(', ') : 'unknown';
}

function detectFinancingStatus(text) {
  const lower = text.toLowerCase();
  for (const signal of FINANCING_SIGNALS.active) {
    if (lower.includes(signal)) return 'active';
  }
  for (const signal of FINANCING_SIGNALS.upcoming) {
    if (lower.includes(signal)) return 'upcoming';
  }
  return 'unknown';
}

function detectType(text, existingType) {
  if (existingType && existingType !== 'operator') return existingType;

  const operatorScore = countMatches(text, OPERATOR_SIGNALS);
  const lenderScore = countMatches(text, LENDER_SIGNALS);
  const arrangerScore = countMatches(text, ARRANGER_SIGNALS);

  if (arrangerScore > lenderScore && arrangerScore > operatorScore) return 'arranger';
  if (lenderScore > operatorScore) return 'lender';
  return 'operator';
}

function extractContactSignals(text) {
  const found = [];
  for (const pattern of CONTACT_TITLE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = re.exec(text)) !== null) {
      found.push(match[0]);
    }
  }
  return [...new Set(found)].slice(0, 5);
}

function detectIndustrySegment(text) {
  const lower = text.toLowerCase();
  if (lower.includes('sovereign') || lower.includes('national')) return 'Sovereign AI / HPC';
  if (lower.includes('equipment finance')) return 'Equipment Finance';
  if (lower.includes('private credit') || lower.includes('direct lending')) return 'Private Credit';
  if (lower.includes('hedge fund') || lower.includes('asset management')) return 'Asset Management';
  if (lower.includes('colocation') || lower.includes('colo')) return 'Colocation / Data Center';
  if (lower.includes('cloud')) return 'AI Cloud';
  return 'AI Infrastructure';
}

// ── Main enrich function (original, backward-compatible) ──────────────────────

/**
 * Enrich a company record with structured signals derived from scraped text.
 * Original function — still used by discovery.js and research API.
 *
 * @param {object} company     - Existing company record
 * @param {string} scrapedText - Collapsed text from scraper.collapseScrapedText()
 * @returns {object} Enriched fields to merge into the company record
 */
function enrichCompany(company, scrapedText) {
  if (!scrapedText || scrapedText.length < 20) {
    return {
      financing_status: company.financing_status || 'unknown',
      industry_segment: company.industry_segment || 'AI Infrastructure',
      estimated_gpu_scale: company.estimated_gpu_scale || 'unknown',
      enriched: false,
    };
  }

  const detectedType = detectType(scrapedText, company.type);
  const gpuScale = extractGpuScale(scrapedText);
  const financingStatus = detectFinancingStatus(scrapedText);
  const contactSignals = extractContactSignals(scrapedText);
  const industrySegment = detectIndustrySegment(scrapedText);

  return {
    type: detectedType,
    industry_segment: company.industry_segment || industrySegment,
    estimated_gpu_scale: company.estimated_gpu_scale !== 'unknown' ? company.estimated_gpu_scale : gpuScale,
    financing_status: company.financing_status !== 'unknown' ? company.financing_status : financingStatus,
    contact_signals: contactSignals,
    enriched: true,
    enriched_at: new Date().toISOString(),
  };
}

// ── Pipeline-backed enrichment (new) ─────────────────────────────────────────

/**
 * Run the full multi-source enrichment pipeline for a company by DB ID.
 * Lazy-loads the pipeline to avoid circular deps at startup.
 *
 * @param {string} companyId
 * @param {object} [opts] - Passed to enrichment-pipeline.enrichCompany
 * @returns {Promise<pipelineResult>}
 */
async function enrichCompanyFull(companyId, opts = {}) {
  const pipeline = require('./enrichment-pipeline');
  return pipeline.enrichCompany(companyId, opts);
}

/**
 * Run the full multi-source enrichment pipeline for a contact by DB ID.
 *
 * @param {string} contactId
 * @param {object} [opts]
 * @returns {Promise<pipelineResult>}
 */
async function enrichContactFull(contactId, opts = {}) {
  const pipeline = require('./enrichment-pipeline');
  return pipeline.enrichContact(contactId, opts);
}

module.exports = {
  // Original exports (backward-compatible)
  enrichCompany,
  extractGpuScale,
  detectFinancingStatus,
  detectType,
  // New pipeline-backed exports
  enrichCompanyFull,
  enrichContactFull,
};
