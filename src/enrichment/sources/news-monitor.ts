/**
 * News monitoring source — searches for recent company news.
 */

import { ddgSearch, EnrichmentResult } from "./web-search";

const CATEGORIES: Record<string, { keywords: RegExp; description: string }> = {
  funding: {
    keywords: /fund(?:ing|ed|raise)|series [a-f]|raised \$|capital raise|investment round|secured \$|closed \$|debt facilit|credit facilit/i,
    description: "Funding activity",
  },
  executive_change: {
    keywords: /appoint(?:ed|s)|hir(?:ed|es)|join(?:ed|s) as|named (?:ceo|cto|cfo)|promot(?:ed|ion)|resign|depart|new (?:ceo|cto|cfo)/i,
    description: "Executive hire/departure",
  },
  partnership: {
    keywords: /partner(?:ship|ed|ing)|collaboration|alliance|joint venture|strategic deal|agreement with/i,
    description: "Partnership or deal",
  },
  product_launch: {
    keywords: /launch(?:ed|es|ing)|announc(?:ed|es|ing)|introduc(?:ed|es)|releas(?:ed|es|ing)|new product|new platform|new service/i,
    description: "Product or service launch",
  },
  regulatory: {
    keywords: /regulat(?:ory|ion|ed)|compliance|sec filing|approved by|sanction|enforcement|investigat|lawsuit/i,
    description: "Regulatory or legal",
  },
  growth: {
    keywords: /expan(?:d|ding|sion)|scal(?:e|ing)|grow(?:th|ing)|open(?:ing|ed) (?:new|office)|hiring (?:spree|surge)|headcount/i,
    description: "Growth or expansion",
  },
};

const POSITIVE_WORDS = [
  "growth","success","record","exceed","surpass","milestone","breakthrough",
  "innovate","leading","award","recognition","strong","profitable","revenue","expansion","partnership","launch","funding","raises","secured",
];
const NEGATIVE_WORDS = [
  "fail","loss","decline","downgrade","miss","concern","risk","lawsuit",
  "investigation","bankrupt","layoff","cut","resign","fraud","probe","trouble",
];

function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  const posCount = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const negCount = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  const total = posCount + negCount;
  if (total === 0) return 0;
  return Math.round(((posCount - negCount) / total) * 100) / 100;
}

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "news-monitor",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    const name = (existingData.company_name || existingData.name) as string;
    if (!name) throw new Error("Name required for news monitoring");

    console.log(`[news-monitor] Monitoring news for ${entityType}: ${name}`);

    const year = new Date().getFullYear();
    const queries = [
      `"${name}" news ${year}`,
      `"${name}" announcement press release ${year}`,
    ];

    const allResults = [];
    for (const query of queries) {
      const res = await ddgSearch(query);
      allResults.push(...res);
    }

    const seen = new Set<string>();
    const deduped = allResults.filter((r) => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    const categorized = deduped
      .filter((r) => r.snippet && r.snippet.length > 20)
      .map((r) => {
        const text = `${r.title} ${r.snippet}`;
        const cats = Object.entries(CATEGORIES)
          .filter(([, def]) => def.keywords.test(text))
          .map(([k]) => k);
        const sentiment = scoreSentiment(text);
        return {
          title: r.title.slice(0, 120),
          snippet: r.snippet.slice(0, 250),
          url: r.url,
          categories: cats.length > 0 ? cats : ["general"],
          sentiment,
        };
      })
      .slice(0, 15);

    const categorySummary: Record<string, number> = {};
    for (const item of categorized) {
      for (const cat of item.categories) {
        categorySummary[cat] = (categorySummary[cat] || 0) + 1;
      }
    }

    const overallSentiment =
      categorized.length > 0
        ? Math.round(
            (categorized.reduce((s, i) => s + i.sentiment, 0) / categorized.length) * 100
          ) / 100
        : 0;

    result.data = {
      newsItems: categorized,
      totalFound: deduped.length,
      categorySummary,
      overallSentiment,
    };

    if (categorized.length > 0) {
      result.data.recent_news = categorized
        .slice(0, 5)
        .map((n) => ({ title: n.title, categories: n.categories, url: n.url }));
    }

    result.success = true;
    console.log(`[news-monitor] ${name}: ${categorized.length} news items, sentiment=${overallSentiment}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[news-monitor] Failed for ${entityType} ${entityId}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
