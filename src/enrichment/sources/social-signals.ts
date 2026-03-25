/**
 * Social signals — Twitter/X and GitHub discovery.
 */

import { ddgSearch, EnrichmentResult } from "./web-search";

const TWITTER_URL_RE =
  /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,50})(?:[^A-Za-z0-9_]|$)/i;
const GITHUB_URL_RE =
  /github\.com\/([A-Za-z0-9\-_]+)(?:\/([A-Za-z0-9\-_.]+))?/i;
const SKIP_TWITTER = new Set(["search", "hashtag", "home", "explore", "notifications", "messages", "i"]);
const SKIP_GITHUB = new Set(["search", "topics", "trending", "explore", "marketplace"]);

function extractTwitterHandle(results: { url: string; snippet: string; title: string }[]) {
  for (const { url, snippet, title } of results) {
    const m = TWITTER_URL_RE.exec(url) || TWITTER_URL_RE.exec(`${title} ${snippet}`);
    if (m && !SKIP_TWITTER.has(m[1].toLowerCase())) {
      return { handle: `@${m[1]}`, url: `https://x.com/${m[1]}` };
    }
  }
  return null;
}

function extractGitHubInfo(results: { url: string }[]) {
  const orgs = new Set<string>();
  const repos: string[] = [];
  for (const { url } of results) {
    const m = GITHUB_URL_RE.exec(url);
    if (m && m[1] && !SKIP_GITHUB.has(m[1].toLowerCase())) {
      orgs.add(m[1]);
      if (m[2] && m[2] !== "tree" && m[2] !== "blob") repos.push(`${m[1]}/${m[2]}`);
    }
  }
  return {
    orgs: [...orgs].slice(0, 3),
    repos: [...new Set(repos)].slice(0, 5),
  };
}

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "social-signals",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === "lead") {
      const { company_name, github_url, twitter_url } = existingData as {
        company_name: string;
        github_url?: string;
        twitter_url?: string;
      };
      if (!company_name) throw new Error("Company name required");

      console.log(`[social-signals] Enriching company: ${company_name}`);

      const [twitterResults, githubResults] = await Promise.all([
        ddgSearch(`site:twitter.com OR site:x.com "${company_name}"`),
        ddgSearch(`site:github.com "${company_name}"`),
      ]);

      const twitterInfo = extractTwitterHandle(twitterResults);
      const githubInfo = extractGitHubInfo(githubResults);

      result.data = { twitterInfo, githubInfo };

      if (twitterInfo && !twitter_url) result.data.twitter_url = twitterInfo.url;
      if (githubInfo.orgs.length > 0 && !github_url) {
        result.data.github_url = `https://github.com/${githubInfo.orgs[0]}`;
      }

      result.success = true;
      console.log(
        `[social-signals] ${company_name}: Twitter=${!!twitterInfo}, GitHub=${githubInfo.orgs.length} orgs`
      );
    } else if (entityType === "contact") {
      const { name, company_name, github_url, twitter_url } = existingData as {
        name: string;
        company_name?: string;
        github_url?: string;
        twitter_url?: string;
      };
      if (!name) throw new Error("Contact name required");

      const query = company_name
        ? `"${name}" "${company_name}" (twitter OR github OR linkedin)`
        : `"${name}" (twitter OR github OR linkedin)`;

      const results = await ddgSearch(query);
      const twitterInfo = extractTwitterHandle(results);
      const githubInfo = extractGitHubInfo(results);

      result.data = { twitterInfo, githubInfo };
      if (twitterInfo && !twitter_url) result.data.twitter_url = twitterInfo.url;
      if (githubInfo.orgs.length > 0 && !github_url) {
        result.data.github_url = `https://github.com/${githubInfo.orgs[0]}`;
      }

      result.success = true;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[social-signals] Failed for ${entityType} ${entityId}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
