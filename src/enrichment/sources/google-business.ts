/**
 * Google Business Profile enrichment source.
 *
 * Extracts phone, address, ratings, hours, and Maps URL via:
 *   1. DuckDuckGo search (primary — avoids bot blocks)
 *   2. Direct Google search fetch (knowledge panel scraping)
 *   3. BBB / Yelp directory fallback
 */

import * as cheerio from "cheerio";
import { rateLimiter } from "./rate-limiter";
import { ddgSearch, EnrichmentResult } from "./web-search";

const TIMEOUT_MS = 15000;
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ── Phone regex ───────────────────────────────────────────────────────────────

const PHONE_RE = /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;

function extractPhones(text: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(PHONE_RE.source, PHONE_RE.flags);
  while ((m = re.exec(text)) !== null) {
    const raw = m[0].trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 10) found.add(raw);
  }
  return [...found];
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function fetchHtml(url: string, extraDelayMs = 0): Promise<string> {
  return rateLimiter.run(async () => {
    if (extraDelayMs > 0) {
      await new Promise((r) => setTimeout(r, extraDelayMs));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": CHROME_UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (res.status === 429) throw new Error("Rate limited (429)");
      if (res.status === 403) throw new Error("Blocked (403)");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  });
}

// ── JSON-LD structured data extraction ───────────────────────────────────────

interface LocalBusinessSchema {
  "@type"?: string | string[];
  name?: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  aggregateRating?: {
    ratingValue?: string | number;
    reviewCount?: string | number;
  };
  openingHoursSpecification?: unknown[];
  openingHours?: string | string[];
  url?: string;
  "@id"?: string;
}

function extractJsonLd(html: string): LocalBusinessSchema | null {
  const $ = cheerio.load(html);
  const schemas: LocalBusinessSchema[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || "";
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const type = item["@type"];
        const isLocal =
          type === "LocalBusiness" ||
          type === "ProfessionalService" ||
          type === "Organization" ||
          (Array.isArray(type) &&
            type.some((t: string) =>
              ["LocalBusiness", "ProfessionalService", "Organization"].includes(t)
            ));
        if (isLocal) schemas.push(item);
      }
    } catch {
      // malformed JSON — skip
    }
  });

  return schemas[0] ?? null;
}

// ── Google search knowledge-panel scraping ────────────────────────────────────

interface GoogleBusinessData {
  phone?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  hours?: string;
  googleMapsUrl?: string;
  category?: string;
}

function scrapeGoogleKnowledgePanel(html: string): GoogleBusinessData {
  const $ = cheerio.load(html);
  const data: GoogleBusinessData = {};

  // JSON-LD first (most reliable)
  const schema = extractJsonLd(html);
  if (schema) {
    if (schema.telephone) data.phone = schema.telephone;
    if (schema.address) {
      const a = schema.address;
      const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean);
      if (parts.length) data.address = parts.join(", ");
    }
    if (schema.aggregateRating) {
      const r = schema.aggregateRating;
      if (r.ratingValue) data.rating = parseFloat(String(r.ratingValue));
      if (r.reviewCount) data.reviewCount = parseInt(String(r.reviewCount), 10);
    }
  }

  // data-phone-number attribute (Google uses this in the local panel)
  if (!data.phone) {
    const phoneAttr = $("[data-phone-number]").attr("data-phone-number");
    if (phoneAttr) data.phone = phoneAttr;
  }

  // aria-label containing "Call" (e.g., aria-label="Call (555) 123-4567")
  if (!data.phone) {
    $("[aria-label]").each((_, el) => {
      const label = $(el).attr("aria-label") || "";
      if (/^Call /i.test(label)) {
        const phones = extractPhones(label);
        if (phones.length) {
          data.phone = phones[0];
          return false; // break
        }
      }
    });
  }

  // tel: links
  if (!data.phone) {
    $("a[href^='tel:']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const num = href.replace("tel:", "").trim();
      if (num.length >= 10) {
        data.phone = num;
        return false;
      }
    });
  }

  // Full-text phone scan (last resort on the Google page)
  if (!data.phone) {
    const fullText = $("body").text();
    const phones = extractPhones(fullText);
    if (phones.length) data.phone = phones[0];
  }

  // Google Maps URL
  if (!data.googleMapsUrl) {
    $("a[href*='maps.google.com'], a[href*='google.com/maps']").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("maps")) {
        data.googleMapsUrl = href;
        return false;
      }
    });
  }

  // Category: look for the business type near the name
  if (!data.category) {
    const categoryRe = /Insurance Agency|Trucking|Transportation|Freight|Logistics|Brokerage|Real Estate|Law Firm|Accounting|Staffing|Consulting|Construction|Healthcare|Medical|Dental|Legal|Financial/i;
    const text = $("body").text();
    const m = categoryRe.exec(text);
    if (m) data.category = m[0];
  }

  return data;
}

// ── BBB page scraping ─────────────────────────────────────────────────────────

function scrapeBbbPage(html: string): { phone?: string; address?: string; rating?: string } {
  const $ = cheerio.load(html);
  const result: { phone?: string; address?: string; rating?: string } = {};

  // BBB phone: usually in a span with class containing "phone" or inside a dt/dd pair
  $("[class*='phone'], [data-track='phone']").each((_, el) => {
    const text = $(el).text().trim();
    const phones = extractPhones(text);
    if (phones.length && !result.phone) result.phone = phones[0];
  });

  if (!result.phone) {
    const allText = $("body").text();
    const phones = extractPhones(allText);
    if (phones.length) result.phone = phones[0];
  }

  // Address
  $("address, [class*='address'], [itemprop='address']").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 5 && text.length < 200 && !result.address) {
      result.address = text;
    }
  });

  // Rating
  $("[class*='rating'], [aria-label*='rating'], [itemprop='ratingValue']").each((_, el) => {
    const text = $(el).text().trim() || $(el).attr("aria-label") || $(el).attr("content") || "";
    const m = /(\d+(?:\.\d+)?)/.exec(text);
    if (m && !result.rating) result.rating = m[1];
  });

  return result;
}

// ── DDG-based search ──────────────────────────────────────────────────────────

interface SearchExtracted {
  phones: string[];
  googleMapsUrls: string[];
  snippets: string[];
}

async function searchWithDDG(
  companyName: string,
  city: string,
  state: string
): Promise<SearchExtracted> {
  const queries = [
    `"${companyName}" "${state}" phone number contact`,
    `"${companyName}" "${city}" "${state}" phone`,
    `site:google.com/maps "${companyName}" "${state}"`,
  ];

  const phones = new Set<string>();
  const googleMapsUrls = new Set<string>();
  const snippets: string[] = [];

  for (const query of queries) {
    console.log(`[google-business] DDG: ${query}`);
    try {
      const results = await ddgSearch(query);
      for (const r of results) {
        const text = `${r.title} ${r.snippet}`;
        snippets.push(text);

        const found = extractPhones(text);
        found.forEach((p) => phones.add(p));

        if (r.url.includes("google.com/maps") || r.url.includes("maps.google")) {
          googleMapsUrls.add(r.url);
        }
      }
    } catch (err) {
      console.warn(`[google-business] DDG query failed: ${err}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  return {
    phones: [...phones].slice(0, 5),
    googleMapsUrls: [...googleMapsUrls].slice(0, 3),
    snippets: snippets.slice(0, 20),
  };
}

// ── Directory searches (BBB / Yelp) ──────────────────────────────────────────

async function searchDirectories(
  companyName: string,
  state: string
): Promise<{ phone?: string; address?: string; bbbUrl?: string; yelpUrl?: string }> {
  const result: { phone?: string; address?: string; bbbUrl?: string; yelpUrl?: string } = {};

  // BBB via DDG
  try {
    console.log(`[google-business] Searching BBB via DDG for "${companyName}"`);
    const bbbResults = await ddgSearch(`"${companyName}" site:bbb.org "${state}"`);
    for (const r of bbbResults) {
      if (r.url.includes("bbb.org")) {
        result.bbbUrl = r.url;
        // Try to get phone from BBB snippet
        const phones = extractPhones(`${r.title} ${r.snippet}`);
        if (phones.length) result.phone = phones[0];
        break;
      }
    }
  } catch (err) {
    console.warn(`[google-business] BBB DDG search failed: ${err}`);
  }

  // If we found a BBB URL but no phone, try fetching the BBB page
  if (result.bbbUrl && !result.phone) {
    try {
      console.log(`[google-business] Fetching BBB page: ${result.bbbUrl}`);
      const html = await fetchHtml(result.bbbUrl, 1000);
      const bbbData = scrapeBbbPage(html);
      if (bbbData.phone) result.phone = bbbData.phone;
      if (bbbData.address && !result.address) result.address = bbbData.address;
    } catch (err) {
      console.warn(`[google-business] BBB fetch failed: ${err}`);
    }
  }

  // Yelp via DDG (only if still no phone)
  if (!result.phone) {
    try {
      console.log(`[google-business] Searching Yelp via DDG for "${companyName}"`);
      const yelpResults = await ddgSearch(`"${companyName}" site:yelp.com "${state}"`);
      for (const r of yelpResults) {
        if (r.url.includes("yelp.com")) {
          result.yelpUrl = r.url;
          const phones = extractPhones(`${r.title} ${r.snippet}`);
          if (phones.length) {
            result.phone = phones[0];
            break;
          }
        }
      }
    } catch (err) {
      console.warn(`[google-business] Yelp DDG search failed: ${err}`);
    }
  }

  return result;
}

// ── Direct Google search ──────────────────────────────────────────────────────

async function tryGoogleSearch(
  companyName: string,
  city: string,
  state: string
): Promise<GoogleBusinessData> {
  const query = `${companyName} ${city} ${state} phone number`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us`;

  console.log(`[google-business] Trying direct Google search (may be blocked)...`);
  try {
    // Extra 2-second delay before Google requests
    const html = await fetchHtml(url, 2000);

    // Check for captcha / block
    if (
      html.includes("Our systems have detected unusual traffic") ||
      html.includes("recaptcha") ||
      html.includes("sorry/index")
    ) {
      console.warn("[google-business] Google returned CAPTCHA/block page — skipping");
      return {};
    }

    return scrapeGoogleKnowledgePanel(html);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[google-business] Direct Google search failed: ${msg}`);
    return {};
  }
}

// ── Main enrich function ──────────────────────────────────────────────────────

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "google-business",
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

  const companyName = existingData.company_name as string | undefined;
  if (!companyName) {
    result.success = false;
    result.error = "Company name required for Google Business enrichment";
    return result;
  }

  // Parse city/state from existing data
  const state = (existingData.state as string | undefined) ?? "";
  const city = (existingData.city as string | undefined) ?? "";

  console.log(`[google-business] Enriching: ${companyName} (${city}, ${state})`);

  try {
    const collected: {
      phones: string[];
      address?: string;
      rating?: number;
      reviewCount?: number;
      hours?: string;
      googleMapsUrl?: string;
      category?: string;
      bbbUrl?: string;
      yelpUrl?: string;
    } = { phones: [] };

    // ── Step 1: DDG search (primary, bot-friendly) ────────────────────────────
    const ddgData = await searchWithDDG(companyName, city, state);
    collected.phones.push(...ddgData.phones);
    if (ddgData.googleMapsUrls.length) collected.googleMapsUrl = ddgData.googleMapsUrls[0];

    // ── Step 2: Directory fallback (BBB / Yelp) ───────────────────────────────
    const dirData = await searchDirectories(companyName, state);
    if (dirData.phone && !collected.phones.includes(dirData.phone)) {
      collected.phones.unshift(dirData.phone); // directory phone is high-confidence
    }
    if (dirData.address) collected.address = dirData.address;
    if (dirData.bbbUrl) collected.bbbUrl = dirData.bbbUrl;
    if (dirData.yelpUrl) collected.yelpUrl = dirData.yelpUrl;

    // ── Step 3: Direct Google search (only if nothing found yet) ─────────────
    if (collected.phones.length === 0) {
      const gData = await tryGoogleSearch(companyName, city, state);
      if (gData.phone) collected.phones.push(gData.phone);
      if (gData.address && !collected.address) collected.address = gData.address;
      if (gData.rating) collected.rating = gData.rating;
      if (gData.reviewCount) collected.reviewCount = gData.reviewCount;
      if (gData.hours) collected.hours = gData.hours;
      if (gData.googleMapsUrl && !collected.googleMapsUrl) {
        collected.googleMapsUrl = gData.googleMapsUrl;
      }
      if (gData.category) collected.category = gData.category;
    }

    // Deduplicate and normalise phones
    const uniquePhones = [...new Set(collected.phones)].slice(0, 5);

    result.data = {
      phones: uniquePhones,
      ...(uniquePhones.length > 0 ? { phone_hq: uniquePhones[0] } : {}),
      ...(collected.address ? { address: collected.address, headquarters: collected.address } : {}),
      ...(collected.rating !== undefined ? { google_rating: collected.rating } : {}),
      ...(collected.reviewCount !== undefined ? { google_review_count: collected.reviewCount } : {}),
      ...(collected.hours ? { business_hours: collected.hours } : {}),
      ...(collected.googleMapsUrl ? { google_maps_url: collected.googleMapsUrl } : {}),
      ...(collected.category ? { business_category: collected.category } : {}),
      ...(collected.bbbUrl ? { bbb_url: collected.bbbUrl } : {}),
      ...(collected.yelpUrl ? { yelp_url: collected.yelpUrl } : {}),
    };

    result.success = true;

    const phoneStr = uniquePhones.length > 0 ? uniquePhones[0] : "none";
    console.log(
      `[google-business] Done for ${companyName}: phone=${phoneStr}, address=${collected.address ?? "none"}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[google-business] Failed for ${companyName}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
