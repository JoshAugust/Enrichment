/**
 * Web search source — DuckDuckGo Lite, no API key required.
 */

import * as cheerio from "cheerio";
import { rateLimiter } from "./rate-limiter";

const TIMEOUT_MS = 12000;
const USER_AGENT = "Mozilla/5.0 (compatible; CorgiResearchBot/1.0)";

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface EnrichmentResult {
  source: string;
  entityType: string;
  entityId: string;
  success: boolean;
  skipped?: boolean;
  error?: string;
  data: Record<string, unknown>;
  enrichedAt: string;
}

// ── DuckDuckGo Lite search ────────────────────────────────────────────────────

export async function ddgSearch(query: string): Promise<SearchResult[]> {
  return rateLimiter.run(async () => {
    const encoded = encodeURIComponent(query);
    const url = `https://lite.duckduckgo.com/lite/?q=${encoded}&kl=us-en`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
      const html = await res.text();
      return parseDdgResults(html);
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[web-search] DDG search failed for "${query}": ${msg}`);
      return [];
    }
  });
}

function parseDdgResults(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $("tr").each((_, row) => {
    const titleEl = $(row).find("a.result-link");
    const snippetEl = $(row).next("tr").find(".result-snippet");
    const title = titleEl.text().trim();
    const url = titleEl.attr("href") || "";
    const snippet = snippetEl.text().trim();
    if (title && (snippet || url)) {
      results.push({ title, snippet, url });
    }
  });

  if (results.length === 0) {
    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      if (href.startsWith("http") && text.length > 10 && !href.includes("duckduckgo")) {
        const parentText = $(el).parent().text().trim();
        results.push({
          title: text.slice(0, 120),
          snippet: parentText.slice(0, 300),
          url: href,
        });
      }
    });
  }

  return results.slice(0, 10);
}

// ── Signal extractors ─────────────────────────────────────────────────────────

const NEWS_CATEGORIES: Record<string, RegExp> = {
  funding:
    /fund(?:ing|ed|raise)|series [a-e]|raise[ds]?\s+\$|capital raise|investment round|secured \$|closed \$/i,
  partnership:
    /partner(?:ship|ed|s)|collaboration|alliance|joint venture|deal with|agreement with/i,
  executive:
    /appoint(?:ed|s)|hir(?:ed|es)|join(?:ed|s) as|named (?:ceo|cto|cfo|president)|promot(?:ed|ion)/i,
  product:
    /launch(?:ed|es)|announc(?:ed|es)|introduc(?:ed|es)|releas(?:ed|es)|new product|new platform/i,
  regulatory: /regulat(?:ory|ion|ed)|compliance|sec filing|approved by|licens(?:ed|e)/i,
  growth:
    /expan(?:d|ding|sion)|scal(?:e|ing)|grow(?:th|ing)|open(?:ing|ed) (?:new|office)/i,
};

function categorizeSnippet(text: string): string[] {
  const cats = Object.entries(NEWS_CATEGORIES)
    .filter(([, re]) => re.test(text))
    .map(([k]) => k);
  return cats.length > 0 ? cats : ["general"];
}

function extractExecutiveHints(snippets: SearchResult[]) {
  const execs: { name: string; title: string; source: string }[] = [];
  const titleRe =
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:the\s+)?(?:new\s+)?(CEO|CTO|CFO|COO|President|Founder|Managing Director|Managing Partner|Head of|VP|SVP|Director)/gi;
  for (const { snippet, title } of snippets) {
    const text = `${title} ${snippet}`;
    let match;
    while ((match = titleRe.exec(text)) !== null) {
      execs.push({ name: match[1].trim(), title: match[2].trim(), source: "web-search" });
    }
  }
  const seen = new Set<string>();
  return execs.filter((e) => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

function extractLinkedInUrls(results: SearchResult[]): string[] {
  return [
    ...new Set(
      results
        .map((r) => r.url)
        .filter((u) => u.includes("linkedin.com/company/") || u.includes("linkedin.com/in/"))
    ),
  ];
}

function extractFundingMentions(results: SearchResult[]) {
  const funding: { headline: string; amounts: string[]; snippet: string }[] = [];
  const amountRe = /\$(\d+(?:\.\d+)?)\s*(?:million|billion|mn|bn|M|B)\b/gi;
  for (const { snippet, title } of results) {
    const text = `${title} ${snippet}`;
    if (NEWS_CATEGORIES.funding.test(text)) {
      const amounts: string[] = [];
      let m;
      const re = new RegExp(amountRe.source, amountRe.flags);
      while ((m = re.exec(text)) !== null) amounts.push(m[0]);
      funding.push({ headline: title.slice(0, 120), amounts, snippet: snippet.slice(0, 200) });
    }
  }
  return funding;
}

// ── Main enrich function ──────────────────────────────────────────────────────

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "web-search",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === "lead") {
      const companyName = existingData.company_name as string;
      if (!companyName) throw new Error("Company name required for web search");

      console.log(`[web-search] Enriching lead: ${companyName}`);

      const queries = [
        `"${companyName}" news ${new Date().getFullYear()}`,
        `"${companyName}" CEO leadership team`,
        `"${companyName}" funding investment raised`,
      ];

      const allResults: SearchResult[] = [];
      for (const query of queries) {
        const res = await ddgSearch(query);
        allResults.push(...res);
        await new Promise((r) => setTimeout(r, 800));
      }

      const seen = new Set<string>();
      const deduped = allResults.filter((r) => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });

      const news = deduped
        .filter((r) => r.snippet && r.snippet.length > 20)
        .map((r) => ({
          title: r.title,
          snippet: r.snippet,
          url: r.url,
          categories: categorizeSnippet(`${r.title} ${r.snippet}`),
        }))
        .slice(0, 15);

      const executiveHints = extractExecutiveHints(deduped);
      const linkedinUrls = extractLinkedInUrls(deduped);
      const fundingMentions = extractFundingMentions(deduped);

      const phoneRe = /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;
      const phonesFound = new Set<string>();
      for (const { snippet, title } of deduped) {
        const text = `${title} ${snippet}`;
        let m;
        while ((m = phoneRe.exec(text)) !== null) {
          const cleaned = m[0].replace(/[\s\-.()]/g, "");
          if (cleaned.length >= 10) phonesFound.add(m[0].trim());
        }
      }

      result.data = {
        news,
        executiveHints,
        linkedinUrls,
        fundingMentions,
        phones: [...phonesFound].slice(0, 5),
        searchResultCount: deduped.length,
      };

      const companyLinkedIn = linkedinUrls.find((u) => u.includes("linkedin.com/company/"));
      if (companyLinkedIn && !existingData.linkedin_url) {
        result.data.linkedin_url = companyLinkedIn;
      }

      if (fundingMentions.length > 0) {
        result.data.recent_news = news
          .filter((n) => (n.categories as string[]).includes("funding"))
          .slice(0, 5);
      }
    } else if (entityType === "contact") {
      const { name, company_name } = existingData as { name: string; company_name?: string };
      if (!name) throw new Error("Contact name required");

      const queries = [
        company_name ? `"${name}" "${company_name}" linkedin` : `"${name}" linkedin`,
        company_name ? `"${name}" "${company_name}" profile` : `"${name}" professional profile`,
      ];

      const allResults: SearchResult[] = [];
      for (const query of queries) {
        const res = await ddgSearch(query);
        allResults.push(...res);
        await new Promise((r) => setTimeout(r, 600));
      }

      const linkedinUrls = extractLinkedInUrls(allResults);
      const personalLinkedIn = linkedinUrls.find((u) => u.includes("linkedin.com/in/"));
      const bioSnippets = allResults
        .filter((r) => r.snippet && r.snippet.length > 30)
        .map((r) => r.snippet)
        .slice(0, 3);

      result.data = { linkedinUrls, bioSnippets, searchResultCount: allResults.length };
      if (personalLinkedIn && !existingData.linkedin_url) result.data.linkedin_url = personalLinkedIn;
      if (bioSnippets.length > 0 && !existingData.bio) result.data.bio = bioSnippets[0].slice(0, 500);
    }

    result.success = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[web-search] Failed for ${entityType} ${entityId}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
