/**
 * Funding research source.
 */

import { ddgSearch, EnrichmentResult } from "./web-search";

const AMOUNT_RE = /\$\s*(\d+(?:\.\d+)?)\s*(billion|million|bn|mn|[BMK])\b/gi;
const ROUND_RE = /\b(pre-seed|seed|series [a-f]|growth equity|growth round|debt round|credit facility|venture round|bridge round|ipo|spac)\b/gi;

function parseAmounts(text: string) {
  const amounts: { raw: string; usd: number }[] = [];
  let m;
  const re = new RegExp(AMOUNT_RE.source, AMOUNT_RE.flags);
  while ((m = re.exec(text)) !== null) {
    const num = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    let usd = num;
    if (unit === "billion" || unit === "bn" || unit === "b") usd = num * 1e9;
    else if (unit === "million" || unit === "mn" || unit === "m") usd = num * 1e6;
    else if (unit === "k") usd = num * 1e3;
    amounts.push({ raw: m[0].trim(), usd });
  }
  return amounts;
}

function detectRounds(text: string): string[] {
  const rounds: string[] = [];
  let m;
  const re = new RegExp(ROUND_RE.source, ROUND_RE.flags);
  while ((m = re.exec(text)) !== null) rounds.push(m[1]);
  return [...new Set(rounds)];
}

function extractInvestors(text: string): string[] {
  const investors: string[] = [];
  const ledByRe =
    /(?:led by|backed by|invested by)\s+([A-Z][A-Za-z\s&]+(?:Capital|Ventures|Partners|Equity|Investments|Fund|Growth|Asset|Management)?)/g;
  let m;
  while ((m = ledByRe.exec(text)) !== null) {
    investors.push(m[1].trim().replace(/\s+/g, " "));
  }
  const includesRe = /investors? (?:include|included|participating)\s*:?\s*([^.]+)/gi;
  while ((m = includesRe.exec(text)) !== null) {
    const names = m[1]
      .split(/,\s*|\s+and\s+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 2 && n.length < 60 && /^[A-Z]/.test(n));
    investors.push(...names);
  }
  const seen = new Set<string>();
  return investors
    .map((i) => i.replace(/\s+/g, " ").trim())
    .filter((i) => {
      if (seen.has(i) || i.length < 3) return false;
      seen.add(i);
      return true;
    })
    .slice(0, 10);
}

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "funding",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  if (entityType !== "lead") {
    result.success = true;
    result.skipped = true;
    return result;
  }

  const companyName = existingData.company_name as string;
  if (!companyName) {
    result.success = false;
    result.error = "Company name required";
    return result;
  }

  console.log(`[funding] Enriching: ${companyName}`);

  try {
    const queries = [
      `"${companyName}" funding round raised`,
      `"${companyName}" investors series`,
    ];

    const allResults = [];
    for (const query of queries) {
      const res = await ddgSearch(query);
      allResults.push(...res);
    }

    const allText = allResults.map((r) => `${r.title} ${r.snippet}`).join("\n");
    const amounts = parseAmounts(allText);
    const rounds = detectRounds(allText);
    const investors = extractInvestors(allText);
    const largest = amounts.reduce(
      (max: { raw: string; usd: number } | null, a) => (max === null || a.usd > max.usd ? a : max),
      null
    );

    result.data = {
      amounts,
      rounds,
      investors,
      searchResultCount: allResults.length,
    };

    if (largest && !existingData.total_raised) result.data.total_raised = largest.raw;
    if (rounds.length > 0) result.data.last_funding_round = rounds[rounds.length - 1];
    if (investors.length > 0) result.data.investors = investors.slice(0, 5).join(", ");

    result.success = true;
    console.log(`[funding] ${companyName}: ${amounts.length} amounts, ${rounds.length} rounds, ${investors.length} investors`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[funding] Failed for ${companyName}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
