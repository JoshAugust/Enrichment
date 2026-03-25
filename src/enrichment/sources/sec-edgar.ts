/**
 * SEC EDGAR enrichment — public company filing lookup.
 * Graceful no-op for private companies.
 */

import { rateLimiter } from "./rate-limiter";
import { EnrichmentResult } from "./web-search";

const TIMEOUT_MS = 15000;
const USER_AGENT = "CorgiEnrichment/2.0 (research@corgi.finance)";

async function edgarSearch(companyName: string) {
  return rateLimiter.run(async () => {
    const q = encodeURIComponent(`"${companyName}"`);
    const url = `https://efts.sec.gov/LATEST/search-index?q=${q}&forms=10-K,10-Q,8-K&dateRange=custom&startdt=2023-01-01`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      clearTimeout(timer);
      if (!res.ok) return [];
      const data = (await res.json()) as { hits?: { hits?: unknown[] } };
      return data?.hits?.hits ?? [];
    } catch {
      clearTimeout(timer);
      return [];
    }
  });
}

interface EdgarHit {
  _source?: {
    form_type?: string;
    file_date?: string;
    period_of_report?: string;
    accession_no?: string;
    display_names?: { name?: string; id?: string }[];
  };
}

function parseFilings(hits: unknown[]) {
  return (hits as EdgarHit[]).slice(0, 10).map((h) => ({
    form: h._source?.form_type || "unknown",
    company: (h._source?.display_names || [])[0]?.name || null,
    cik: (h._source?.display_names || [])[0]?.id || null,
    filedAt: h._source?.file_date || null,
    periodOfReport: h._source?.period_of_report || null,
    accessionNo: h._source?.accession_no || null,
  }));
}

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "sec-edgar",
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

  console.log(`[sec-edgar] Searching EDGAR for: ${companyName}`);

  try {
    const hits = await edgarSearch(companyName);

    if (hits.length === 0) {
      console.log(`[sec-edgar] ${companyName}: not found — likely private`);
      result.success = true;
      result.skipped = true;
      result.data = { not_public: true };
      return result;
    }

    const filings = parseFilings(hits);
    const firstHit = (hits as EdgarHit[])[0];
    const cik = (firstHit._source?.display_names || [])[0]?.id || null;
    const ticker = null; // requires separate submissions API call

    result.data = {
      sec_filings: filings,
      sec_ticker: ticker,
      sec_cik: cik,
      filing_count: filings.length,
    };

    result.success = true;
    console.log(`[sec-edgar] ${companyName}: ${filings.length} filings, CIK=${cik}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sec-edgar] Failed for ${companyName}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
