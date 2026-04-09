/**
 * sources/producthunt.js — Product Hunt lead generation source
 *
 * Pulls recent product launches from Product Hunt's GraphQL API and
 * converts them into lead candidates for the enrichment pipeline.
 *
 * This is a LEAD GENERATION source, not an enrichment source.
 * It discovers new companies, not enriches existing ones.
 *
 * What we get from PH:
 *   - Company/product name
 *   - Tagline + description
 *   - Topic tags (AI, SaaS, Developer Tools, etc.)
 *   - Maker names + headlines
 *   - Upvote count + comment count
 *   - Daily/weekly/monthly rank
 *   - Launch date
 *   - Website URL (PH redirect — resolved via web search downstream)
 *
 * The website URLs from PH are tracking redirects behind Cloudflare.
 * We resolve actual domains via DuckDuckGo search: "{name} {tagline} site"
 * Then feed into the normal enrichment pipeline.
 *
 * Config: .config/producthunt/config.json → { "developer_token": "..." }
 * Rate limits: Fair use (no published limit, keep it polite)
 * Auth: Developer token (never expires)
 *
 * Usage:
 *   import { fetchRecentLaunches, fetchTopLaunches, discoverLeads } from './producthunt.js';
 *   const leads = await discoverLeads({ daysBack: 7, minUpvotes: 20 });
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PH_GRAPHQL = 'https://api.producthunt.com/v2/api/graphql';
const TIMEOUT_MS = 15000;

// ── Config ─────────────────────────────────────────────────────────────────

const CONFIG_PATHS = [
  resolve(__dirname, '..', '.config', 'producthunt', 'config.json'),
  resolve(__dirname, '..', '..', '.config', 'producthunt', 'config.json'),
];

let _token = null;

function loadToken() {
  if (_token) return _token;

  if (process.env.PRODUCTHUNT_TOKEN) {
    _token = process.env.PRODUCTHUNT_TOKEN;
    return _token;
  }

  for (const cfgPath of CONFIG_PATHS) {
    try {
      if (existsSync(cfgPath)) {
        const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
        _token = cfg.developer_token || cfg.token || cfg.access_token;
        if (_token) return _token;
      }
    } catch { /* try next */ }
  }

  return null;
}

// ── GraphQL client ─────────────────────────────────────────────────────────

async function gql(query, variables = {}) {
  const token = loadToken();
  if (!token) throw new Error('No Product Hunt token configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PH_GRAPHQL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`PH API ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.errors?.length) {
      throw new Error(`PH GraphQL error: ${data.errors[0].message}`);
    }

    return data.data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('PH API request timed out');
    throw err;
  }
}

// ── Domain resolution ──────────────────────────────────────────────────────

/**
 * Try to extract the actual website domain from a PH product page slug.
 * Falls back to Google search cache or just returns the slug for manual resolution.
 *
 * Strategy:
 *   1. Fetch the PH product page HTML and parse the website link out of it
 *   2. If that fails (Cloudflare), try Google's cache
 *   3. If all else fails, try a heuristic: slugify the product name into a domain guess
 *
 * The pipeline's downstream sources (google-maps, apollo, web-search) can also
 * resolve domains from company names, so unresolved is not fatal.
 */
async function resolveDomain(name, phWebsiteUrl, slug) {
  // Strategy 1: Try to follow the PH redirect URL
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(phWebsiteUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);

    const finalUrl = res.url;
    if (finalUrl && !finalUrl.includes('producthunt.com')) {
      try {
        const url = new URL(finalUrl);
        return { domain: url.hostname.replace(/^www\./, ''), website: `${url.protocol}//${url.hostname}` };
      } catch { /* fall through */ }
    }

    // If we got the page, check for meta refresh or redirect in HTML
    if (res.ok) {
      const html = await res.text();
      // Look for actual external URL in the redirect page
      const metaRefresh = html.match(/url=(https?:\/\/(?!.*producthunt\.com)[^\s"'>;]+)/i);
      if (metaRefresh) {
        try {
          const url = new URL(metaRefresh[1]);
          return { domain: url.hostname.replace(/^www\./, ''), website: `${url.protocol}//${url.hostname}` };
        } catch { /* fall through */ }
      }
    }
  } catch { /* fall through */ }

  // Strategy 2: Try Google "I'm Feeling Lucky" style search
  try {
    const searchQuery = encodeURIComponent(`${name} official site -producthunt.com -linkedin.com`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${searchQuery}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      // DDG HTML results contain uddg= parameter with the actual URLs
      const uddgMatches = [...html.matchAll(/uddg=(https?%3A%2F%2F[^&"']+)/gi)];
      for (const match of uddgMatches) {
        const decoded = decodeURIComponent(match[1]);
        try {
          const url = new URL(decoded);
          const domain = url.hostname.replace(/^www\./, '');
          if (!/producthunt|google|bing|duckduckgo|facebook|twitter|x\.com|linkedin|youtube|reddit|wikipedia|github\.com$|crunchbase|pitchbook/.test(domain)) {
            return { domain, website: `${url.protocol}//${url.hostname}` };
          }
        } catch { continue; }
      }
    }
  } catch { /* fall through */ }

  // Strategy 3: Heuristic — try common domain patterns from the slug
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const guesses = [
    `${cleanName}.com`,
    `${cleanName}.io`,
    `${cleanName}.ai`,
    `${slug}.com`,
  ];
  for (const guess of guesses) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://${guess}`, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (res.ok || res.status === 403) {
        return { domain: guess, website: `https://${guess}` };
      }
    } catch { continue; }
  }

  return { domain: null, website: null };
}

// ── Core queries ───────────────────────────────────────────────────────────

const POST_FIELDS = `
  id
  name
  tagline
  slug
  website
  description
  votesCount
  commentsCount
  dailyRank
  weeklyRank
  featuredAt
  createdAt
  topics { edges { node { name } } }
  makers { name headline username twitterUsername websiteUrl }
`;

/**
 * Fetch recent launches, optionally filtered by date.
 *
 * @param {object} opts
 * @param {number} [opts.count=20] — number of posts to fetch (max 20 per page)
 * @param {string} [opts.after] — ISO date string, only posts after this date
 * @param {string} [opts.order='NEWEST'] — NEWEST, VOTES, or RANKING
 * @returns {Promise<Array>} — array of post objects
 */
export async function fetchRecentLaunches(opts = {}) {
  const { count = 20, after, order = 'NEWEST' } = opts;

  let dateFilter = '';
  if (after) {
    dateFilter = `, postedAfter: "${after}"`;
  }

  const query = `{
    posts(first: ${Math.min(count, 20)}, order: ${order}${dateFilter}) {
      edges {
        node { ${POST_FIELDS} }
      }
    }
  }`;

  const data = await gql(query);
  return (data.posts?.edges || []).map(e => e.node);
}

/**
 * Fetch top launches for a specific time period.
 *
 * @param {object} opts
 * @param {string} [opts.topic] — filter by topic name (e.g. "Artificial Intelligence")
 * @param {number} [opts.count=20]
 * @returns {Promise<Array>}
 */
export async function fetchTopLaunches(opts = {}) {
  const { count = 20, topic } = opts;

  let topicFilter = '';
  if (topic) {
    topicFilter = `, topic: "${topic}"`;
  }

  const query = `{
    posts(first: ${Math.min(count, 20)}, order: VOTES${topicFilter}) {
      edges {
        node { ${POST_FIELDS} }
      }
    }
  }`;

  const data = await gql(query);
  return (data.posts?.edges || []).map(e => e.node);
}

/**
 * Search for products by name or keyword.
 *
 * @param {string} searchTerm
 * @param {number} [count=10]
 * @returns {Promise<Array>}
 */
export async function searchProducts(searchTerm, count = 10) {
  // PH doesn't have a direct search query — use topics or just filter client-side
  // For now, pull recent and filter
  const query = `{
    posts(first: ${Math.min(count, 20)}, order: RANKING) {
      edges {
        node { ${POST_FIELDS} }
      }
    }
  }`;

  const data = await gql(query);
  const posts = (data.posts?.edges || []).map(e => e.node);

  // Client-side filter by search term
  const term = searchTerm.toLowerCase();
  return posts.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.tagline.toLowerCase().includes(term) ||
    (p.description || '').toLowerCase().includes(term)
  );
}

// ── Lead discovery (main entry point) ──────────────────────────────────────

/**
 * Discover new leads from Product Hunt launches.
 *
 * Pulls recent/top launches, resolves their actual websites,
 * and returns structured lead objects ready for the enrichment pipeline.
 *
 * @param {object} opts
 * @param {number} [opts.daysBack=7] — how many days back to look
 * @param {number} [opts.minUpvotes=0] — minimum upvotes to consider
 * @param {string} [opts.order='RANKING'] — NEWEST, VOTES, or RANKING
 * @param {number} [opts.count=20] — max leads to return
 * @param {boolean} [opts.resolveDomains=true] — resolve actual website domains
 * @param {string[]} [opts.topicFilter] — only include posts with these topics
 * @returns {Promise<Array<Lead>>}
 */
export async function discoverLeads(opts = {}) {
  const {
    daysBack = 7,
    minUpvotes = 0,
    order = 'RANKING',
    count = 20,
    resolveDomains: shouldResolve = true,
    topicFilter,
  } = opts;

  const afterDate = new Date(Date.now() - daysBack * 86400000).toISOString();

  console.log(`[producthunt] 🔍 Discovering leads (${daysBack}d back, min ${minUpvotes} upvotes, order: ${order})`);

  const posts = await fetchRecentLaunches({ count, after: afterDate, order });

  // Filter by upvotes
  let filtered = posts.filter(p => p.votesCount >= minUpvotes);

  // Filter by topics if specified
  if (topicFilter?.length) {
    const topicSet = new Set(topicFilter.map(t => t.toLowerCase()));
    filtered = filtered.filter(p => {
      const postTopics = (p.topics?.edges || []).map(e => e.node.name.toLowerCase());
      return postTopics.some(t => topicSet.has(t));
    });
  }

  console.log(`[producthunt] 📋 ${filtered.length} posts passed filters (from ${posts.length} fetched)`);

  // Convert to leads
  const leads = [];
  for (const post of filtered) {
    const topics = (post.topics?.edges || []).map(e => e.node.name);
    const makers = (post.makers || []).map(m => ({
      name: m.name,
      headline: m.headline,
      twitter: m.twitterUsername,
      website: m.websiteUrl,
    }));

    let domain = null;
    let website = null;

    if (shouldResolve) {
      const resolved = await resolveDomain(post.name, post.website, post.slug);
      domain = resolved.domain;
      website = resolved.website;
      // Be polite between resolution requests
      await new Promise(r => setTimeout(r, 500));
    }

    leads.push({
      source: 'producthunt',
      ph_id: post.id,
      ph_slug: post.slug,
      ph_url: `https://www.producthunt.com/posts/${post.slug}`,
      name: post.name,
      tagline: post.tagline,
      description: post.description,
      domain,
      website,
      topics,
      makers,
      upvotes: post.votesCount,
      comments: post.commentsCount,
      daily_rank: post.dailyRank,
      weekly_rank: post.weeklyRank,
      featured_at: post.featuredAt,
      launched_at: post.createdAt,
    });
  }

  console.log(`[producthunt] ✅ ${leads.length} leads discovered (${leads.filter(l => l.domain).length} with resolved domains)`);

  return leads;
}

// ── Enrichment interface (for pipeline compatibility) ──────────────────────

/**
 * Standard enrichment interface — checks if a company was launched on PH.
 * This is a lightweight check, not the main use case.
 */
export async function enrich(entityType, entityId, existingData) {
  if (entityType !== 'company') {
    return { success: true, skipped: true, data: {}, reason: 'producthunt only checks companies' };
  }

  const token = loadToken();
  if (!token) {
    return { success: false, skipped: true, data: {}, error: 'No Product Hunt token configured' };
  }

  // Search for the company by name in recent posts
  const name = existingData.name;
  if (!name) {
    return { success: false, data: {}, error: 'No company name' };
  }

  try {
    // Pull recent posts and check for name match
    const posts = await fetchRecentLaunches({ count: 20, order: 'NEWEST' });
    const match = posts.find(p =>
      p.name.toLowerCase() === name.toLowerCase() ||
      p.name.toLowerCase().includes(name.toLowerCase())
    );

    if (match) {
      const topics = (match.topics?.edges || []).map(e => e.node.name);
      return {
        success: true,
        data: {
          ph_launched: true,
          ph_url: `https://www.producthunt.com/posts/${match.slug}`,
          ph_upvotes: match.votesCount,
          ph_tagline: match.tagline,
          ph_topics: topics,
          ph_daily_rank: match.dailyRank,
        },
        source: 'producthunt',
      };
    }

    return {
      success: true,
      data: { ph_launched: false },
      source: 'producthunt',
    };
  } catch (err) {
    return { success: false, data: {}, error: err.message, source: 'producthunt' };
  }
}

export default { enrich, discoverLeads, fetchRecentLaunches, fetchTopLaunches, searchProducts };
