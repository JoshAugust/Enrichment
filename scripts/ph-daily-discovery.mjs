#!/usr/bin/env node
/**
 * ph-daily-discovery.mjs — Daily Product Hunt lead discovery
 *
 * Pulls ALL of yesterday's PH launches (no upvote gate), resolves domains
 * via heuristic guessing + HTTP HEAD probes (no DuckDuckGo), vibe scores,
 * qualifies, and saves results to pipeline/ph-daily/YYYY-MM-DD.json.
 *
 * Usage:
 *   node scripts/ph-daily-discovery.mjs
 *   node scripts/ph-daily-discovery.mjs --date 2026-03-31   # specific date
 *   node scripts/ph-daily-discovery.mjs --daysBack 2        # N days ago
 *
 * Cron (daily at 06:00 UTC):
 *   0 6 * * * cd /path/to/jordan.ai && node scripts/ph-daily-discovery.mjs >> logs/ph-daily.log 2>&1
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE = resolve(__dirname, '..');

// ── Config ─────────────────────────────────────────────────────────────────

const CONFIG_PATH = resolve(WORKSPACE, '.config/producthunt/config.json');
const OUTPUT_DIR  = resolve(WORKSPACE, 'pipeline/ph-daily');

const PH_GRAPHQL      = 'https://api.producthunt.com/v2/api/graphql';
const TIMEOUT_MS      = 20000;
const PROBE_TIMEOUT   = 5000;
const VIBE_TIMEOUT    = 8000;
const CONCURRENCY     = 15;
const USER_AGENT      = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── CLI args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let targetDate = null;  // YYYY-MM-DD string; null = yesterday

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && args[i + 1]) {
    targetDate = args[++i];
  } else if (args[i] === '--daysBack' && args[i + 1]) {
    const n = parseInt(args[++i], 10);
    const d = new Date(Date.now() - n * 86400000);
    targetDate = d.toISOString().slice(0, 10);
  }
}

if (!targetDate) {
  const yesterday = new Date(Date.now() - 86400000);
  targetDate = yesterday.toISOString().slice(0, 10);
}

const dayStart = new Date(`${targetDate}T00:00:00.000Z`);
const dayEnd   = new Date(`${targetDate}T23:59:59.999Z`);

console.log(`\n📅 PH Daily Discovery — ${targetDate}`);
console.log(`   Window: ${dayStart.toISOString()} → ${dayEnd.toISOString()}\n`);

// ── Token ──────────────────────────────────────────────────────────────────

function loadToken() {
  if (process.env.PRODUCTHUNT_TOKEN) return process.env.PRODUCTHUNT_TOKEN;
  try {
    const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    return cfg.developer_token || cfg.token || cfg.access_token || null;
  } catch { return null; }
}

const TOKEN = loadToken();
if (!TOKEN) {
  console.error('❌ No Product Hunt token found at', CONFIG_PATH);
  process.exit(1);
}

// ── GraphQL with retry + rate-limit backoff ────────────────────────────────

const POST_FIELDS = `
  id name tagline slug website description
  votesCount commentsCount dailyRank weeklyRank
  featuredAt createdAt
  topics { edges { node { name } } }
  makers { name headline username twitterUsername websiteUrl }
`;

async function gql(query, variables = {}, attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(PH_GRAPHQL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    clearTimeout(timer);

    // Rate limit — back off and retry up to 3 times
    if (res.status === 429) {
      if (attempt > 3) throw new Error('PH API rate limited after 3 retries');
      const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10);
      const delay = Math.max(retryAfter * 1000, attempt * 10000);
      console.warn(`  ⚠️  Rate limited (attempt ${attempt}/3). Backing off ${delay / 1000}s...`);
      await sleep(delay);
      return gql(query, variables, attempt + 1);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`PH API ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    if (data.errors?.length) throw new Error(`PH GraphQL: ${data.errors[0].message}`);
    return data.data;

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('PH API request timed out');
    // Retry on network errors too
    if (attempt <= 3 && err.message !== 'PH API rate limited after 3 retries') {
      const delay = attempt * 5000;
      console.warn(`  ⚠️  Network error (attempt ${attempt}/3): ${err.message}. Retrying in ${delay / 1000}s...`);
      await sleep(delay);
      return gql(query, variables, attempt + 1);
    }
    throw err;
  }
}

// ── Paginated post fetcher ─────────────────────────────────────────────────

/**
 * Fetch ALL posts for a given day window by paginating through all results.
 * PH returns max 20 per page; we keep going until hasNextPage = false
 * or until we're past our date window.
 */
async function fetchDayPosts(postedAfter, postedBefore) {
  const allPosts = [];
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
    const afterArg    = cursor ? `, after: "${cursor}"` : '';
    const afterDate   = `, postedAfter: "${postedAfter}"`;
    const beforeDate  = `, postedBefore: "${postedBefore}"`;

    const query = `{
      posts(first: 20, order: NEWEST${afterDate}${beforeDate}${afterArg}) {
        pageInfo { endCursor hasNextPage }
        edges { node { ${POST_FIELDS} } }
      }
    }`;

    process.stdout.write(`  📡 Page ${page} (${allPosts.length} posts so far)...\r`);

    const data = await gql(query);
    const posts    = (data.posts?.edges || []).map(e => e.node);
    const pageInfo = data.posts?.pageInfo || {};

    // Filter to our exact day window (belt-and-suspenders)
    const inWindow = posts.filter(p => {
      const t = new Date(p.createdAt).getTime();
      return t >= new Date(postedAfter).getTime() && t <= new Date(postedBefore).getTime();
    });

    allPosts.push(...inWindow);

    if (!pageInfo.hasNextPage || posts.length === 0) break;
    cursor = pageInfo.endCursor;

    // Polite pause between pages
    await sleep(500);
  }

  process.stdout.write('\n');
  return allPosts;
}

// ── Domain heuristics ──────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '').trim();
}

function generateGuesses(name) {
  const slug = slugify(name);
  if (!slug || slug.length < 2) return [];

  const hyphen = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();

  const guesses = new Set([
    `${slug}.com`, `${slug}.io`, `${slug}.ai`, `${slug}.co`, `${slug}.app`,
    `${slug}.dev`, `${slug}.so`, `${slug}.xyz`,
    `get${slug}.com`, `try${slug}.com`, `use${slug}.com`,
    `${slug}app.com`, `${slug}hq.com`,
  ]);

  if (hyphen !== slug) {
    guesses.add(`${hyphen}.com`);
    guesses.add(`${hyphen}.io`);
    guesses.add(`${hyphen}.ai`);
  }

  return [...guesses];
}

async function probeDomain(domain) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
    const res = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timer);
    return res.ok || res.status === 403 || res.status === 405;
  } catch { return false; }
}

async function resolveDomain(name) {
  const guesses = generateGuesses(name);
  for (const domain of guesses) {
    if (await probeDomain(domain)) return domain;
  }
  return null;
}

// ── Vibe scorer (heuristic only — no Claude) ───────────────────────────────

async function vibeScore(domain) {
  if (!domain) return { score: 0, signals: [], fetched: false };

  let html = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VIBE_TIMEOUT);
    const res = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,*/*' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (res.ok) html = (await res.text()).slice(0, 150000);
  } catch { return { score: 0, signals: [], fetched: false }; }

  if (!html) return { score: 0, signals: [], fetched: false };

  let score = 0;
  const signals = [];

  // Website builder signals (early-stage tells)
  const builders = [
    [/data-wf-site|\.webflow\.com/i, 'Webflow'],
    [/framer\.com\/m\/|__framer__|data-framer-/i, 'Framer'],
    [/sqsp\.com|squarespace\.com/i, 'Squarespace'],
    [/wix\.com\/|wixsite\.com|wixstatic\.com/i, 'Wix'],
    [/carrd\.co/i, 'Carrd'],
  ];
  for (const [pat, n] of builders) {
    if (pat.test(html)) { score += 25; signals.push(`builder:${n}`); break; }
  }

  // .io / .ai domain premium
  if (/\.(io|ai)$/.test(domain)) { score += 10; signals.push('io_ai'); }

  // No pricing page (pre-revenue / stealth)
  if (!/href=["'][^"']*\/(pricing|plans)[/"']/i.test(html)) { score += 10; signals.push('no_pricing'); }

  // Vague hero copy
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1 && /revolutioni[sz]e|reimagine|supercharge|the\s+future\s+of|transform|empower|ai[\s-]powered|next[\s-]gen/i.test(h1[1].replace(/<[^>]+>/g, ''))) {
    score += 15; signals.push('vague_hero');
  }

  // No careers page (small team)
  if (!/href=["'][^"']*\/(careers|jobs|hiring)[/"']/i.test(html)) { score += 10; signals.push('no_careers'); }

  // Few customer logos
  const trusted = html.match(/(?:trusted\s+by|our\s+customers|used\s+by)[^<]*[\s\S]{0,2000}/i);
  if (!trusted || (trusted[0].match(/<img[^>]+>/gi) || []).length < 5) { score += 10; signals.push('few_logos'); }

  // Few blog posts
  if (new Set(html.match(/href=["'][^"']*\/(blog|post|articles?)\/[^"']+["']/gi) || []).size < 5) {
    score += 10; signals.push('few_blogs');
  }

  return { score: Math.min(100, score), signals, fetched: true };
}

// ── ICP + qualification ────────────────────────────────────────────────────

const ICP_TOPICS = new Set([
  'artificial intelligence', 'saas', 'developer tools', 'productivity', 'design tools',
  'marketing', 'sales', 'analytics', 'fintech', 'no-code', 'devops', 'api',
  'chrome extensions', 'automation', 'email', 'crm', 'project management',
  'collaboration', 'open source', 'machine learning', 'data science', 'cybersecurity',
  'seo', 'e-commerce', 'payments', 'web app', 'mobile', 'tech',
]);

function matchesIcp(topics) {
  return (topics || []).some(t => {
    const tl = t.toLowerCase();
    return ICP_TOPICS.has(tl) || [...ICP_TOPICS].some(i => tl.includes(i));
  });
}

function qualify(post, domain, vibe) {
  let score = 0;
  const signals = [];

  if (/saas|software|platform|api|app|cloud|devtools?|dev\s+tool/i.test(post.name + ' ' + (post.topics || []).join(' '))) {
    score += 20; signals.push('software');
  }
  if (domain && /\.(io|ai)$/.test(domain)) { score += 5; signals.push('io_ai_domain'); }
  if (vibe.score > 60)      { score += 20; signals.push(`high_vibe:${vibe.score}`); }
  else if (vibe.score >= 30){ score += 10; signals.push(`mid_vibe:${vibe.score}`); }
  if (matchesIcp(post.topics)) { score += 10; signals.push('icp_topic'); }
  score += 5; signals.push('small_team');  // always assumed for PH launches

  return { score, grade: score >= 40 ? 'A' : score >= 20 ? 'B' : 'C', signals };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const runStart = Date.now();

  // 1. Fetch all posts for the target day
  console.log(`🔍 Fetching all PH posts for ${targetDate}...`);
  const rawPosts = await fetchDayPosts(dayStart.toISOString(), dayEnd.toISOString());
  console.log(`✅ Fetched ${rawPosts.length} posts\n`);

  if (rawPosts.length === 0) {
    console.log('⚠️  No posts found for this date. Saving empty result.');
    saveResults(targetDate, [], runStart);
    return;
  }

  // Normalise posts
  const posts = rawPosts.map(p => ({
    ph_id:       p.id,
    name:        p.name,
    tagline:     p.tagline,
    slug:        p.slug,
    ph_url:      `https://www.producthunt.com/posts/${p.slug}`,
    description: p.description,
    upvotes:     p.votesCount,
    comments:    p.commentsCount,
    daily_rank:  p.dailyRank,
    weekly_rank: p.weeklyRank,
    featured_at: p.featuredAt,
    launched_at: p.createdAt,
    topics:      (p.topics?.edges || []).map(e => e.node.name),
    makers:      (p.makers || []).map(m => ({
      name: m.name, headline: m.headline,
      twitter: m.twitterUsername, website: m.websiteUrl,
    })),
  }));

  // 2. Resolve + vibe score concurrently
  console.log(`🚀 Resolving domains + vibe scoring (${CONCURRENCY} concurrent)...\n`);

  let idx = 0, done = 0, resolved = 0, vibed = 0;
  const resMap = new Map();

  async function worker() {
    while (idx < posts.length) {
      const i = idx++;
      const post = posts[i];

      const domain = await resolveDomain(post.name);
      let vibe = { score: 0, signals: [], fetched: false };

      if (domain) {
        resolved++;
        vibe = await vibeScore(domain);
        if (vibe.fetched) vibed++;
      }

      resMap.set(post.ph_id, { domain, vibe });
      done++;

      if (done % 20 === 0 || done === posts.length) {
        const pct = ((done / posts.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - runStart) / 1000).toFixed(0);
        process.stdout.write(`  [${pct}%] ${done}/${posts.length} | resolved: ${resolved} | vibed: ${vibed} | ${elapsed}s\n`);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);

  console.log(`\n✅ Resolution: ${resolved}/${posts.length} (${(resolved / posts.length * 100).toFixed(1)}%)`);
  console.log(`✅ Vibe scored: ${vibed}\n`);

  // 3. Qualify
  const results = posts.map(post => {
    const { domain, vibe } = resMap.get(post.ph_id) || { domain: null, vibe: { score: 0, signals: [], fetched: false } };
    const qual = qualify(post, domain, vibe);
    return {
      ...post,
      domain,
      domain_resolved: !!domain,
      vibe_score:      vibe.score,
      vibe_signals:    vibe.signals,
      vibe_fetched:    vibe.fetched,
      qualification_score: qual.score,
      grade:           qual.grade,
      qual_signals:    qual.signals,
    };
  });

  // 4. Print summary + save
  saveResults(targetDate, results, runStart);
}

// ── Save + summary ─────────────────────────────────────────────────────────

function saveResults(date, results, runStart) {
  const gradeA = results.filter(r => r.grade === 'A');
  const gradeB = results.filter(r => r.grade === 'B');
  const gradeC = results.filter(r => r.grade === 'C');

  console.log('═'.repeat(60));
  console.log(`📈 RESULTS — ${date}`);
  console.log('═'.repeat(60));
  console.log(`Total pulled:     ${results.length}`);
  console.log(`Domain resolved:  ${results.filter(r => r.domain_resolved).length} (${results.length ? (results.filter(r => r.domain_resolved).length / results.length * 100).toFixed(1) : 0}%)`);
  console.log(`Vibe scored:      ${results.filter(r => r.vibe_fetched).length}`);
  console.log(`Grade A (≥40):    ${gradeA.length}`);
  console.log(`Grade B (20-39):  ${gradeB.length}`);
  console.log(`Grade C (<20):    ${gradeC.length}`);

  if (gradeA.length) {
    console.log('\n🏆 Grade A leads:');
    for (const r of gradeA.sort((a, b) => b.qualification_score - a.qualification_score)) {
      const dom = (r.domain || '(no domain)').padEnd(28);
      console.log(`  ${r.name.slice(0, 30).padEnd(32)} ${dom} v:${String(r.vibe_score).padEnd(3)} q:${r.qualification_score} ⬆️${r.upvotes}`);
    }
  }

  console.log(`\n⏱️  Completed in ${((Date.now() - runStart) / 1000 / 60).toFixed(1)} min`);

  // Ensure output dir exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const outPath = resolve(OUTPUT_DIR, `${date}.json`);
  const payload = {
    run_date:       new Date().toISOString(),
    target_date:    date,
    method:         'heuristic_domain_guess',
    total:          results.length,
    domain_resolved: results.filter(r => r.domain_resolved).length,
    vibe_scored:    results.filter(r => r.vibe_fetched).length,
    grade_a:        gradeA.length,
    grade_b:        gradeB.length,
    grade_c:        gradeC.length,
    results,
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`\n💾 Saved: ${outPath}`);
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
