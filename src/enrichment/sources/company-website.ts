/**
 * Company website scraper — fetches homepage + up to 4 sub-pages.
 */

import * as cheerio from "cheerio";
import { rateLimiter } from "./rate-limiter";
import { EnrichmentResult } from "./web-search";

const TIMEOUT_MS = 15000;
const USER_AGENT = "Mozilla/5.0 (compatible; CorgiResearchBot/1.0)";

const PAGE_PATTERNS: Record<string, RegExp[]> = {
  about: [/\/about/i, /\/company/i, /\/who-we-are/i, /\/our-story/i],
  team: [/\/team/i, /\/leadership/i, /\/people/i, /\/founders/i, /\/executives/i, /\/management/i],
  news: [/\/news/i, /\/press/i, /\/blog/i, /\/announcements/i, /\/insights/i, /\/updates/i],
  careers: [/\/careers/i, /\/jobs/i, /\/hiring/i, /\/work-with-us/i, /\/join/i],
  contact: [/\/contact/i, /\/reach-us/i, /\/get-in-touch/i],
};

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  return rateLimiter.run(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  });
}

// ── Link discovery ────────────────────────────────────────────────────────────

function discoverSubpageLinks(
  $: cheerio.CheerioAPI,
  baseUrl: string
): Record<string, string[]> {
  const discovered: Record<string, string[]> = {};

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    let absolute: string;
    try {
      absolute = href.startsWith("http") ? href : new URL(href, baseUrl).href;
    } catch {
      return;
    }

    try {
      const base = new URL(baseUrl);
      const link = new URL(absolute);
      if (link.hostname !== base.hostname) return;
    } catch {
      return;
    }

    for (const [type, patterns] of Object.entries(PAGE_PATTERNS)) {
      if (patterns.some((re) => re.test(absolute))) {
        if (!discovered[type]) discovered[type] = [];
        if (!discovered[type].includes(absolute)) {
          discovered[type].push(absolute);
        }
      }
    }
  });

  const result: Record<string, string[]> = {};
  for (const [type, urls] of Object.entries(discovered)) {
    result[type] = urls.slice(0, 2);
  }
  return result;
}

// ── Extractors ────────────────────────────────────────────────────────────────

function extractSocialLinks($: cheerio.CheerioAPI, baseUrl: string) {
  const social: Record<string, string> = {};
  const patterns: Record<string, RegExp> = {
    linkedin: /linkedin\.com\/company\//i,
    twitter: /(?:twitter\.com|x\.com)\//i,
    github: /github\.com\//i,
    facebook: /facebook\.com\//i,
    youtube: /youtube\.com\//i,
  };

  const scope =
    $("footer, [class*='footer'], [id*='footer']").length
      ? $("footer, [class*='footer'], [id*='footer']")
      : $("body");

  scope.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const [platform, re] of Object.entries(patterns)) {
      if (!social[platform] && re.test(href)) {
        try {
          social[platform] = href.startsWith("http") ? href : new URL(href, baseUrl).href;
        } catch {
          social[platform] = href;
        }
      }
    }
  });

  return social;
}

function extractEmailsFromPage($: cheerio.CheerioAPI): string[] {
  const emails = new Set<string>();
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

  $("a[href^='mailto:']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const email = href.replace("mailto:", "").split("?")[0].trim();
    if (email && !email.includes("example") && !email.includes("your@")) {
      emails.add(email.toLowerCase());
    }
  });

  const bodyText = $("body").text();
  let m;
  while ((m = emailRe.exec(bodyText)) !== null) {
    const e = m[0].toLowerCase();
    if (!e.includes("example") && !e.includes("your@") && !e.endsWith(".png") && !e.endsWith(".jpg")) {
      emails.add(e);
    }
  }

  return [...emails].slice(0, 10);
}

function extractPhonesFromPage($: cheerio.CheerioAPI): string[] {
  const text = $("body").text();
  const phoneRe = /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;
  const phones = new Set<string>();
  let m;
  while ((m = phoneRe.exec(text)) !== null) phones.add(m[0].trim());
  return [...phones].slice(0, 5);
}

function extractTeamMembers($: cheerio.CheerioAPI) {
  const members: { name: string; title: string; source: string }[] = [];
  const cardSelectors = [
    "[class*='team'] [class*='member']",
    "[class*='team'] [class*='card']",
    "[class*='leader'] [class*='card']",
    "[class*='people'] [class*='card']",
    "[class*='person']",
    "[class*='bio']",
    "[class*='staff']",
    "article",
  ];
  const titleKeywords =
    /CEO|CTO|CFO|COO|President|Founder|Partner|Director|VP|SVP|EVP|Head|Principal|Manager|Officer/i;

  for (const sel of cardSelectors) {
    const cards = $(sel);
    if (cards.length === 0) continue;
    cards.each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length < 5 || text.length > 500) return;
      const lines = text
        .split(/\n|·|•|\|/)
        .map((l) => l.trim())
        .filter(Boolean);
      const name = lines.find((l) => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l) && l.length < 60);
      const title = lines.find((l) => titleKeywords.test(l) && l.length < 100);
      if (name && title && name !== title) {
        members.push({ name: name.slice(0, 80), title: title.slice(0, 100), source: "company-website" });
      }
    });
    if (members.length > 0) break;
  }

  const seen = new Set<string>();
  return members
    .filter((m) => {
      if (seen.has(m.name)) return false;
      seen.add(m.name);
      return true;
    })
    .slice(0, 20);
}

function extractFoundingYear(text: string): number | null {
  const re = /(?:founded|established|incorporated|started|launched)\s+(?:in\s+)?(\d{4})/i;
  const m = re.exec(text);
  if (m) {
    const year = parseInt(m[1], 10);
    if (year >= 1900 && year <= new Date().getFullYear()) return year;
  }
  return null;
}

function extractEmployeeCount(text: string): string | null {
  const patterns = [
    /(\d+(?:,\d+)?)\+?\s+employees/i,
    /team of (\d+(?:,\d+)?)/i,
    /over (\d+(?:,\d+)?)\s+(?:people|employees|staff|professionals)/i,
    /(\d+(?:,\d+)?)\s+(?:people|professionals|experts)\s+(?:strong|across|worldwide)/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) return m[1].replace(/,/g, "");
  }
  return null;
}

function extractLocation($: cheerio.CheerioAPI): string | null {
  const addrSelectors = [
    "address",
    "[class*='address']",
    "[class*='location']",
    "[class*='office']",
  ];
  for (const sel of addrSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 5 && text.length < 200) return text.slice(0, 150);
    }
  }
  return null;
}

function extractHiringSignals($: cheerio.CheerioAPI) {
  const text = $("body").text();
  const openRolesRe = /(\d+)\s+(?:open|available)?\s*(?:positions?|roles?|jobs?|openings?)/i;
  const rolesMatch = openRolesRe.exec(text);
  const openCount = rolesMatch ? parseInt(rolesMatch[1], 10) : null;

  const deptKeywords = [
    "Engineering","Sales","Marketing","Finance","Operations",
    "Product","Design","Infrastructure","Data","Research","Legal","HR",
  ];
  const departments = deptKeywords.filter((d) => new RegExp(d, "i").test(text));
  const isHiring =
    /we(?:'re| are) hiring|join (?:our|the) team|open position|current opening/i.test(text);

  return {
    isHiring,
    openRoles: openCount,
    departments: departments.slice(0, 8),
    signal: isHiring
      ? openCount
        ? `${openCount} open roles`
        : "actively hiring"
      : "not clearly hiring",
  };
}

function extractNewsItems($: cheerio.CheerioAPI): string[] {
  const items: string[] = [];
  const titleSelectors = [
    "h1","h2","h3","article h2","article h3",
    "[class*='post'] h2","[class*='blog'] h2",
  ];
  for (const sel of titleSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 200) items.push(text);
    });
    if (items.length >= 5) break;
  }
  return [...new Set(items)].slice(0, 8);
}

// ── Main enrich function ──────────────────────────────────────────────────────

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "company-website",
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

  const website = existingData.website as string | undefined;
  if (!website) {
    result.success = false;
    result.error = "No website URL available";
    return result;
  }

  const baseUrl = website.startsWith("http") ? website : `https://${website}`;

  try {
    console.log(`[company-website] Scraping ${baseUrl}`);

    let homepageHtml: string;
    try {
      homepageHtml = await fetchHtml(baseUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Homepage failed: ${msg}`);
    }

    const $home = cheerio.load(homepageHtml);
    const socialLinks = extractSocialLinks($home, baseUrl);
    const subpageLinks = discoverSubpageLinks($home, baseUrl);

    console.log(`[company-website] Discovered subpages: ${Object.keys(subpageLinks).join(", ")}`);

    const homepageText = $home("body").text().replace(/\s+/g, " ").trim();
    const foundingYear = extractFoundingYear(homepageText);
    const employeeCount = extractEmployeeCount(homepageText);
    const homepageEmails = extractEmailsFromPage($home);
    const homepagePhones = extractPhonesFromPage($home);

    const pagesToScrape: { type: string; url: string }[] = [];
    for (const type of ["about", "team", "news", "careers", "contact"]) {
      if (subpageLinks[type]?.length > 0) {
        pagesToScrape.push({ type, url: subpageLinks[type][0] });
      }
    }

    const subPageResults: Record<string, cheerio.CheerioAPI> = {};
    for (const { type, url } of pagesToScrape.slice(0, 4)) {
      console.log(`[company-website] Scraping ${type} page: ${url}`);
      try {
        const html = await fetchHtml(url);
        subPageResults[type] = cheerio.load(html);
      } catch {
        // sub-page fail is non-fatal
      }
    }

    const data: Record<string, unknown> = {
      socialLinks,
      emails: homepageEmails,
      phones: homepagePhones,
    };

    if (foundingYear) data.founded_year = foundingYear;
    if (employeeCount) data.employee_count = employeeCount;

    if (subPageResults.about) {
      const $about = subPageResults.about;
      const aboutText = $about("body").text().replace(/\s+/g, " ").trim();
      if (!foundingYear) {
        const yr = extractFoundingYear(aboutText);
        if (yr) data.founded_year = yr;
      }
      if (!employeeCount) {
        const ec = extractEmployeeCount(aboutText);
        if (ec) data.employee_count = ec;
      }
    }

    if (subPageResults.team) {
      const members = extractTeamMembers(subPageResults.team);
      data.teamMembers = members;
      console.log(`[company-website] Found ${members.length} team members`);
    }

    if (subPageResults.news) {
      data.newsItems = extractNewsItems(subPageResults.news);
      const newsEmails = extractEmailsFromPage(subPageResults.news);
      data.emails = [...new Set([...(data.emails as string[]), ...newsEmails])];
    }

    if (subPageResults.careers) {
      data.hiringSignals = extractHiringSignals(subPageResults.careers);
    }

    if (subPageResults.contact) {
      const $contact = subPageResults.contact;
      const contactEmails = extractEmailsFromPage($contact);
      const contactPhones = extractPhonesFromPage($contact);
      const location = extractLocation($contact);
      data.emails = [...new Set([...(data.emails as string[]), ...contactEmails])];
      data.phones = [...new Set([...(data.phones as string[]), ...contactPhones])];
      if (location) data.headquarters = location;
      const contactSocial = extractSocialLinks($contact, baseUrl);
      data.socialLinks = { ...contactSocial, ...(data.socialLinks as Record<string, string>) };
    }

    const sl = data.socialLinks as Record<string, string>;
    if (sl.linkedin && !existingData.linkedin_url) data.linkedin_url = sl.linkedin;
    if (sl.twitter && !existingData.twitter_url) data.twitter_url = sl.twitter;
    if (sl.github && !existingData.github_url) data.github_url = sl.github;

    if ((data.newsItems as string[] | undefined)?.length) {
      data.recent_news = (data.newsItems as string[]).map((title) => ({ title }));
    }
    if (data.hiringSignals) {
      data.hiring_signals = (data.hiringSignals as { signal: string }).signal;
    }

    result.data = data;
    result.success = true;

    console.log(
      `[company-website] Done for ${baseUrl}: ${(data.teamMembers as unknown[] | undefined)?.length || 0} team, ${(data.emails as string[]).length} emails, founded ${data.founded_year || "unknown"}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[company-website] Failed for ${baseUrl}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
