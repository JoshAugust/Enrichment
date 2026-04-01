/**
 * sources/news-monitor.js — Real-time news monitoring
 *
 * Searches for recent news about a company (last 30/60/90 days):
 *   - Funding, partnerships, executive changes, product launches, regulatory
 *   - Sentiment scoring (positive/negative/neutral)
 *   - Relevance scoring for Corgi's outreach strategy
 *   - Flags material changes that affect outreach timing
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const { ddgSearch } = require('./web-search');

// ── News categorization ───────────────────────────────────────────────────────

const CATEGORIES = {
  funding: {
    keywords: /fund(?:ing|ed|raise)|series [a-f]|raised \$|capital raise|investment round|secured \$|closed \$|debt facilit|credit facilit/i,
    outreachRelevance: 'HIGH',    // Active capital = active finance needs
    description: 'Funding activity',
  },
  executive_change: {
    keywords: /appoint(?:ed|s)|hir(?:ed|es)|join(?:ed|s) as|named (?:ceo|cto|cfo)|promot(?:ed|ion)|resign|depart|left the company|new (?:ceo|cto|cfo)/i,
    outreachRelevance: 'HIGH',    // New execs often reevaluate vendors and relationships
    description: 'Executive hire/departure',
  },
  partnership: {
    keywords: /partner(?:ship|ed|ing)|collaboration|alliance|joint venture|strategic deal|agreement with|memorandum of understanding/i,
    outreachRelevance: 'MEDIUM',  // Growth signal but may be occupied
    description: 'Partnership or deal',
  },
  product_launch: {
    keywords: /launch(?:ed|es|ing)|announc(?:ed|es|ing)|introduc(?:ed|es)|releas(?:ed|es|ing)|new product|new platform|new service|general availability/i,
    outreachRelevance: 'MEDIUM',
    description: 'Product or service launch',
  },
  regulatory: {
    keywords: /regulat(?:ory|ion|ed)|compliance|sec filing|approved by|sanction|enforcement|investigat|lawsuit|legal action/i,
    outreachRelevance: 'LOW',     // Compliance focus = distracted from new initiatives
    description: 'Regulatory or legal',
  },
  growth: {
    keywords: /expan(?:d|ding|sion)|scal(?:e|ing)|grow(?:th|ing)|open(?:ing|ed) (?:new|office)|hiring (?:spree|surge)|headcount/i,
    outreachRelevance: 'HIGH',    // Active growth = infrastructure needs
    description: 'Growth or expansion',
  },
  financial_distress: {
    keywords: /bankrupt|restructur(?:ing|ed)|layoff|reduc(?:ing|ed) headcount|cutting jobs|financial difficult|cash flow problem|missed payment/i,
    outreachRelevance: 'PAUSE',   // Flag to avoid outreach during distress
    description: 'Financial distress signal',
  },
};

// ── Sentiment scoring ─────────────────────────────────────────────────────────

const POSITIVE_WORDS = [
  'growth', 'success', 'record', 'exceed', 'surpass', 'milestone', 'breakthrough',
  'innovate', 'leading', 'award', 'recognition', 'strong', 'profitable', 'revenue',
  'expansion', 'partnership', 'launch', 'funding', 'raises', 'secured',
];

const NEGATIVE_WORDS = [
  'fail', 'loss', 'decline', 'downgrade', 'miss', 'concern', 'risk', 'lawsuit',
  'investigation', 'bankrupt', 'layoff', 'cut', 'resign', 'fraud', 'probe', 'trouble',
];

/**
 * Simple sentiment score: -1.0 to +1.0
 */
function scoreSentiment(text) {
  const lower = text.toLowerCase();
  const posCount = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const negCount = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  const total = posCount + negCount;
  if (total === 0) return 0;
  return Math.round(((posCount - negCount) / total) * 100) / 100;
}

/**
 * Score how relevant a news item is for outreach (0–100).
 */
function scoreOutreachRelevance(categories, sentiment) {
  let score = 50; // base

  for (const cat of categories) {
    const catDef = CATEGORIES[cat];
    if (!catDef) continue;
    if (catDef.outreachRelevance === 'HIGH') score += 20;
    else if (catDef.outreachRelevance === 'MEDIUM') score += 10;
    else if (catDef.outreachRelevance === 'LOW') score -= 10;
    else if (catDef.outreachRelevance === 'PAUSE') score -= 30;
  }

  // Sentiment modifier
  score += Math.round(sentiment * 15);

  return Math.max(0, Math.min(100, score));
}

/**
 * Detect material changes that should affect outreach strategy.
 */
function detectMaterialChanges(newsItems) {
  const flags = [];

  const allText = newsItems.map(n => `${n.title} ${n.snippet}`).join('\n').toLowerCase();

  if (CATEGORIES.financial_distress.keywords.test(allText)) {
    flags.push({ flag: 'FINANCIAL_DISTRESS', action: 'PAUSE_OUTREACH', reason: 'Signs of financial distress detected' });
  }
  if (CATEGORIES.funding.keywords.test(allText)) {
    flags.push({ flag: 'RECENT_FUNDING', action: 'PRIORITIZE', reason: 'Recent funding suggests active capital deployment' });
  }
  if (CATEGORIES.executive_change.keywords.test(allText)) {
    flags.push({ flag: 'EXECUTIVE_CHANGE', action: 'REASSESS_CONTACTS', reason: 'Leadership change may mean new decision makers' });
  }
  if (CATEGORIES.growth.keywords.test(allText)) {
    flags.push({ flag: 'ACTIVE_GROWTH', action: 'PRIORITIZE', reason: 'Active growth suggests infrastructure needs' });
  }

  return flags;
}

// ── Date range helpers ────────────────────────────────────────────────────────

/**
 * Build DDG date-range query suffix for recent news.
 * DDG doesn't support date ranges natively, so we include year/period keywords.
 */
function buildDateRangeQuery(companyName, days) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString('en-US', { month: 'long' });

  if (days <= 30) {
    return `"${companyName}" news ${month} ${year}`;
  } else if (days <= 60) {
    return `"${companyName}" news ${year}`;
  } else {
    return `"${companyName}" news ${year - 1} OR ${year}`;
  }
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData
 * @param {object} [options]
 * @param {number} [options.days=60] - Days of news to look back
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData, options = {}) {
  const result = {
    source: 'news-monitor',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  // Most useful for companies; for contacts we can still check news
  const { days = 60 } = options;

  try {
    const { name } = existingData;
    if (!name) throw new Error('Name required for news monitoring');

    console.log(`[news-monitor] Monitoring news for ${entityType}: ${name} (${days} days)`);

    // Run 3 focused news searches
    const queries = [
      buildDateRangeQuery(name, days),
      `"${name}" announcement press release ${new Date().getFullYear()}`,
      `"${name}" CEO OR funding OR partnership OR acquisition ${new Date().getFullYear()}`,
    ];

    const allResults = [];
    for (const query of queries) {
      const res = await ddgSearch(query);
      allResults.push(...res);
    }

    // Deduplicate by URL
    const seen = new Set();
    const deduped = allResults.filter(r => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Categorize and score each news item
    const categorized = deduped
      .filter(r => r.snippet && r.snippet.length > 20)
      .map(r => {
        const text = `${r.title} ${r.snippet}`;
        const cats = Object.entries(CATEGORIES)
          .filter(([, def]) => def.keywords.test(text))
          .map(([key]) => key);

        const sentiment = scoreSentiment(text);
        const relevanceScore = scoreOutreachRelevance(
          cats.length > 0 ? cats : ['general'],
          sentiment,
        );

        return {
          title: r.title.slice(0, 120),
          snippet: r.snippet.slice(0, 250),
          url: r.url,
          categories: cats.length > 0 ? cats : ['general'],
          sentiment,
          relevanceScore,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15);

    const materialChanges = detectMaterialChanges(categorized);

    // Aggregate category summary
    const categorySummary = {};
    for (const item of categorized) {
      for (const cat of item.categories) {
        categorySummary[cat] = (categorySummary[cat] || 0) + 1;
      }
    }

    // Top relevance signal
    const topItem = categorized[0];
    const overallSentiment = categorized.length > 0
      ? Math.round((categorized.reduce((s, i) => s + i.sentiment, 0) / categorized.length) * 100) / 100
      : 0;

    result.data = {
      newsItems: categorized,
      totalFound: deduped.length,
      categorySummary,
      overallSentiment,
      materialChanges,
      topRelevanceScore: topItem?.relevanceScore || 0,
      outreachRecommendation: materialChanges.find(f => f.action === 'PAUSE_OUTREACH')
        ? 'HOLD — financial distress signals detected'
        : materialChanges.find(f => f.action === 'PRIORITIZE')
        ? 'PRIORITIZE — active growth/funding signals'
        : 'NORMAL — no material changes detected',
    };

    // Update recent_news DB field
    if (categorized.length > 0) {
      result.data.recent_news = JSON.stringify(
        categorized.slice(0, 5).map(n => ({
          title: n.title,
          categories: n.categories,
          relevanceScore: n.relevanceScore,
          url: n.url,
        }))
      );
    }

    result.success = true;
    console.log(`[news-monitor] ${name}: ${categorized.length} news items, sentiment=${overallSentiment}, ${materialChanges.length} material changes`);

  } catch (err) {
    console.error(`[news-monitor] Failed for ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich, CATEGORIES, scoreSentiment, scoreOutreachRelevance };
