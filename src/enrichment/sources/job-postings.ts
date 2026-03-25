/**
 * Job postings — hiring signal enrichment.
 */

import * as cheerio from "cheerio";
import { rateLimiter } from "./rate-limiter";
import { ddgSearch, EnrichmentResult } from "./web-search";

const TIMEOUT_MS = 12000;
const USER_AGENT = "Mozilla/5.0 (compatible; CorgiResearchBot/1.0)";

async function fetchPage(url: string): Promise<string | null> {
  return rateLimiter.run(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      clearTimeout(timer);
      return null;
    }
  });
}

function generateSlugs(name: string): string[] {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\b(inc|corp|llc|ltd|co|the|group|holdings|capital|finance|technology|technologies)\b/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const noHyphens = base.replace(/-/g, "");
  return [...new Set([base, noHyphens, base.slice(0, 20)])].filter((s) => s.length > 2);
}

async function fetchGreenhouseJobs(
  slug: string
): Promise<{ title: string; source: string }[] | null> {
  const html = await fetchPage(`https://boards.greenhouse.io/${slug}`);
  if (!html) return null;
  const $ = cheerio.load(html);
  const jobs: { title: string; source: string }[] = [];
  $(".opening").each((_, el) => {
    const title = $(el).find("a").first().text().trim();
    if (title) jobs.push({ title, source: "greenhouse" });
  });
  return jobs.length > 0 ? jobs : null;
}

async function fetchLeverJobs(
  slug: string
): Promise<{ title: string; source: string }[] | null> {
  const html = await fetchPage(`https://jobs.lever.co/${slug}`);
  if (!html) return null;
  const $ = cheerio.load(html);
  const jobs: { title: string; source: string }[] = [];
  $(".posting-title h5").each((_, el) => {
    const title = $(el).text().trim();
    if (title) jobs.push({ title, source: "lever" });
  });
  return jobs.length > 0 ? jobs : null;
}

function extractRolesFromSnippets(results: { title: string; snippet: string }[]) {
  const roles: string[] = [];
  const roleRe =
    /\b((?:(?:Senior|Staff|Principal|Lead|Head of|VP|SVP|Director of|Chief)\s+)?[A-Z][a-zA-Z\s]+(?:Engineer|Manager|Director|Officer|Analyst|Developer|Architect|Scientist|Designer|Lead|Specialist|Associate|Executive|Partner))\b/g;

  for (const { title, snippet } of results) {
    const text = `${title} ${snippet}`;
    let m;
    const re = new RegExp(roleRe.source, roleRe.flags);
    while ((m = re.exec(text)) !== null) {
      const role = m[1].trim();
      if (role.length > 5 && role.length < 80) roles.push(role);
    }
  }

  const seen = new Set<string>();
  return roles
    .filter((r) => {
      if (seen.has(r)) return false;
      seen.add(r);
      return true;
    })
    .slice(0, 20);
}

function estimateJobCount(results: { url: string }[]) {
  return results.filter((r) =>
    /greenhouse\.io|lever\.co|ashbyhq\.com|workday|bamboohr|indeed|linkedin\.com\/jobs/i.test(r.url)
  ).length;
}

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "job-postings",
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

  console.log(`[job-postings] Enriching: ${companyName}`);

  try {
    const searchResults = await ddgSearch(
      `"${companyName}" careers jobs greenhouse lever ashby`
    );

    const slugs = generateSlugs(companyName);
    let directJobs: { title: string; source: string }[] = [];

    for (const slug of slugs.slice(0, 2)) {
      if (directJobs.length > 0) break;
      const ghJobs = await fetchGreenhouseJobs(slug);
      if (ghJobs?.length) { directJobs = ghJobs; break; }
      const lvJobs = await fetchLeverJobs(slug);
      if (lvJobs?.length) { directJobs = lvJobs; break; }
    }

    const rolesFromSearch = extractRolesFromSnippets(searchResults);
    const allRoles = [...directJobs.map((j) => j.title), ...rolesFromSearch];
    const uniqueRoles = [...new Set(allRoles)].slice(0, 30);

    const directCount = directJobs.length;
    const searchCount = estimateJobCount(searchResults);
    const totalOpenRoles = directCount > 0 ? directCount : searchCount;

    let growthSignal = "unknown";
    if (totalOpenRoles >= 20) growthSignal = "rapid_growth";
    else if (totalOpenRoles >= 8) growthSignal = "growing";
    else if (totalOpenRoles >= 3) growthSignal = "stable";
    else if (totalOpenRoles > 0) growthSignal = "limited_hiring";
    else growthSignal = "no_postings_found";

    result.data = {
      open_roles_count: totalOpenRoles,
      key_hires: uniqueRoles.slice(0, 15).join(", "),
      growth_signal: growthSignal,
      hiring_signals:
        growthSignal !== "no_postings_found" && growthSignal !== "unknown"
          ? `${growthSignal} (${totalOpenRoles} open roles)`
          : null,
      search_result_count: searchResults.length,
    };

    result.success = true;
    console.log(`[job-postings] ${companyName}: ~${totalOpenRoles} open roles, growth=${growthSignal}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[job-postings] Failed for ${companyName}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
