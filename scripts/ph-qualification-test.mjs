#!/usr/bin/env node
/**
 * ph-qualification-test.mjs — Pull ALL PH launches (no upvote gate),
 * run them through qualification + vibe scoring, and calculate
 * the ICP conversion rate for monthly yield extrapolation.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai';
const PH_GRAPHQL = 'https://api.producthunt.com/v2/api/graphql';
const TIMEOUT_MS = 15000;
const CONCURRENCY = 10;
const VIBE_TIMEOUT_MS = 8000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── PH Token ───────────────────────────────────────────────────────────────

function loadToken() {
  const paths = [
    resolve(WORKSPACE, '.config/producthunt/config.json'),
  ];
  for (const p of paths) {
    try {
      if (existsSync(p)) {
        const cfg = JSON.parse(readFileSync(p, 'utf8'));
        return cfg.developer_token || cfg.token;
      }
    } catch { }
  }
  return process.env.PRODUCTHUNT_TOKEN;
}

// ── GraphQL ────────────────────────────────────────────────────────────────

async function gql(query, variables = {}) {
  const token = loadToken();
  if (!token) throw new Error('No PH token');

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
      if (res.status === 429) return { _rateLimited: true };
      throw new Error(`PH API ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    if (data.errors?.length) throw new Error(`PH GraphQL: ${data.errors[0].message}`);
    return data.data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Paginated fetch — get ALL posts for a time range ───────────────────────

async function fetchAllPosts(daysBack = 7) {
  const afterDate = new Date(Date.now() - daysBack * 86400000).toISOString();
  const allPosts = [];
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      posts(first: 20, order: NEWEST, postedAfter: "${afterDate}"${afterClause}) {
        edges {
          cursor
          node {
            id name tagline slug website description
            votesCount commentsCount
            topics { edges { node { name } } }
            makers { name headline }
            createdAt
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`;

    let data;
    try {
      data = await gql(query);
    } catch (err) {
      console.log(`  Page ${page}: error — ${err.message}`);
      break;
    }

    if (data?._rateLimited) {
      console.log(`  Page ${page}: rate limited — stopping pagination with ${allPosts.length} posts`);
      break;
    }

    const edges = data?.posts?.edges || [];
    if (edges.length === 0) break;

    for (const e of edges) {
      allPosts.push(e.node);
    }

    console.log(`  Page ${page}: got ${edges.length} posts (total: ${allPosts.length})`);

    const pageInfo = data.posts?.pageInfo;
    if (!pageInfo?.hasNextPage) break;
    cursor = pageInfo.endCursor;

    // Be polite
    await new Promise(r => setTimeout(r, 300));
  }

  return allPosts;
}

// ── Domain resolution (simplified) ────────────────────────────────────────

async function resolveDomain(name, phWebsiteUrl, slug) {
  // Strategy 1: Follow PH redirect
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(phWebsiteUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timer);
    const finalUrl = res.url;
    if (finalUrl && !finalUrl.includes('producthunt.com')) {
      try {
        const url = new URL(finalUrl);
        return url.hostname.replace(/^www\./, '');
      } catch { }
    }
  } catch { }

  // Strategy 2: DDG search
  try {
    const q = encodeURIComponent(`${name} official site -producthunt.com`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)' },
    });
    clearTimeout(timer);
    if (res.ok) {
      const html = await res.text();
      const matches = [...html.matchAll(/uddg=(https?%3A%2F%2F[^&"']+)/gi)];
      for (const m of matches) {
        const decoded = decodeURIComponent(m[1]);
        try {
          const url = new URL(decoded);
          const domain = url.hostname.replace(/^www\./, '');
          if (!/producthunt|google|bing|duckduckgo|facebook|twitter|x\.com|linkedin|youtube|reddit|wikipedia|github\.com$|crunchbase/.test(domain)) {
            return domain;
          }
        } catch { }
      }
    }
  } catch { }

  return null;
}

// ── Vibe scorer (inlined, heuristic-only) ──────────────────────────────────

async function vibeScore(domain) {
  if (!domain) return { score: 0, signals: [], fetched: false };

  const baseUrl = `https://${domain}`;
  let html = '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VIBE_TIMEOUT_MS);
    const res = await fetch(baseUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,*/*' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (res.ok) html = (await res.text()).slice(0, 150000);
  } catch {
    return { score: 0, signals: [], fetched: false };
  }

  if (!html) return { score: 0, signals: [], fetched: false };

  let score = 0;
  const signals = [];

  // Builder detection (+25)
  const builders = [
    [/data-wf-site|\.webflow\.com/i, 'Webflow'],
    [/framer\.com\/m\/|__framer__|data-framer-/i, 'Framer'],
    [/sqsp\.com|squarespace\.com/i, 'Squarespace'],
    [/wix\.com\/|wixsite\.com|wixstatic\.com/i, 'Wix'],
    [/carrd\.co/i, 'Carrd'],
  ];
  for (const [pat, name] of builders) {
    if (pat.test(html)) { score += 25; signals.push(`builder:${name}`); break; }
  }

  // .io/.ai domain (+10)
  if (/\.(io|ai)$/.test(domain)) { score += 10; signals.push('io_ai'); }

  // No pricing (+10)
  if (!/href=["'][^"']*\/(pricing|plans)[/"']/i.test(html)) { score += 10; signals.push('no_pricing'); }

  // Vague hero (+15)
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const heroText = h1Match[1].replace(/<[^>]+>/g, ' ').trim();
    if (/revolutioni[sz]e|reimagine|supercharge|the\s+future\s+of|transform|empower|ai[\s-]powered|next[\s-]gen/i.test(heroText)) {
      score += 15; signals.push('vague_hero');
    }
  }

  // No careers (+10)
  if (!/href=["'][^"']*\/(careers|jobs|hiring)[/"']/i.test(html)) { score += 10; signals.push('no_careers'); }

  // Few logos (+10)
  const trustedSection = html.match(/(?:trusted\s+by|our\s+customers|used\s+by)[^<]*[\s\S]{0,2000}/i);
  const logoCount = trustedSection ? (trustedSection[0].match(/<img[^>]+>/gi) || []).length : 0;
  if (logoCount < 5) { score += 10; signals.push('few_logos'); }

  // Few blogs (+10)
  const blogLinks = new Set(html.match(/href=["'][^"']*\/(blog|post|articles?)\/[^"']+["']/gi) || []);
  if (blogLinks.size < 5) { score += 10; signals.push('few_blogs'); }

  return { score: Math.min(100, score), signals, fetched: true };
}

// ── ICP Topic Filter ───────────────────────────────────────────────────────

const ICP_TOPICS = new Set([
  'artificial intelligence', 'saas', 'developer tools', 'productivity',
  'design tools', 'marketing', 'sales', 'analytics', 'fintech',
  'no-code', 'devops', 'api', 'chrome extensions', 'github',
  'automation', 'email', 'crm', 'project management', 'collaboration',
  'open source', 'machine learning', 'data science', 'cybersecurity',
  'seo', 'social media', 'e-commerce', 'payments', 'customer support',
  'hiring', 'hr tech', 'legal tech', 'health tech', 'edtech',
  'web app', 'mobile', 'ios', 'android', 'tech',
]);

function matchesIcpTopics(post) {
  const topics = (post.topics?.edges || []).map(e => e.node.name.toLowerCase());
  return topics.some(t => ICP_TOPICS.has(t) || [...ICP_TOPICS].some(icp => t.includes(icp)));
}

// ── Qualification (simplified inline) ──────────────────────────────────────

function qualify(post, domain, vibe) {
  let score = 0;
  const signals = [];

  // Software product from description (+20)
  const desc = (post.description || post.tagline || '').toLowerCase();
  if (/saas|software|platform|api|app|cloud|devtools?|dev\s+tool/i.test(desc)) {
    score += 20; signals.push('software_product');
  }

  // .io/.ai domain (+5)
  if (domain && /\.(io|ai)$/.test(domain)) {
    score += 5; signals.push('io_ai_domain');
  }

  // Vibe score
  if (vibe.score > 60) { score += 20; signals.push(`high_vibe:${vibe.score}`); }
  else if (vibe.score >= 30) { score += 10; signals.push(`mid_vibe:${vibe.score}`); }

  // ICP topic match (+10)
  if (matchesIcpTopics(post)) { score += 10; signals.push('icp_topic'); }

  // Small maker team signal (+5)
  if ((post.makers || []).length <= 3) { score += 5; signals.push('small_team'); }

  let grade;
  if (score >= 40) grade = 'A';
  else if (score >= 20) grade = 'B';
  else grade = 'C';

  return { score, grade, signals };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Product Hunt Qualification Test — NO upvote gate\n');
  console.log('Pulling ALL launches from the last 7 days...\n');

  const posts = await fetchAllPosts(7);
  console.log(`\n📦 Total posts pulled: ${posts.length}\n`);

  if (posts.length === 0) {
    console.log('No posts retrieved — check rate limits or token.');
    return;
  }

  // Upvote distribution
  const upvoteBuckets = { '0': 0, '1-4': 0, '5-9': 0, '10-19': 0, '20-49': 0, '50-99': 0, '100+': 0 };
  for (const p of posts) {
    const v = p.votesCount;
    if (v === 0) upvoteBuckets['0']++;
    else if (v <= 4) upvoteBuckets['1-4']++;
    else if (v <= 9) upvoteBuckets['5-9']++;
    else if (v <= 19) upvoteBuckets['10-19']++;
    else if (v <= 49) upvoteBuckets['20-49']++;
    else if (v <= 99) upvoteBuckets['50-99']++;
    else upvoteBuckets['100+']++;
  }
  console.log('📊 Upvote distribution:');
  for (const [bucket, count] of Object.entries(upvoteBuckets)) {
    console.log(`  ${bucket.padEnd(8)}: ${count}`);
  }

  // Filter out big corps (simple name check)
  const bigCorps = /\b(google|microsoft|meta|amazon|apple|salesforce|adobe|oracle|ibm|netflix|uber|airbnb|stripe|shopify|notion|figma|canva|slack|zoom|dropbox)\b/i;
  const nonBigCorp = posts.filter(p => !bigCorps.test(p.name) && !bigCorps.test(p.tagline || ''));
  console.log(`\n🏢 After big corp filter: ${nonBigCorp.length} (removed ${posts.length - nonBigCorp.length})`);

  // Now resolve domains and score — do in batches for concurrency
  console.log(`\n🌐 Resolving domains and vibe scoring ${nonBigCorp.length} posts (${CONCURRENCY} concurrent)...\n`);

  const results = [];
  let resolved = 0;
  let idx = 0;

  async function worker() {
    while (idx < nonBigCorp.length) {
      const i = idx++;
      const post = nonBigCorp[i];

      let domain = null;
      try {
        domain = await resolveDomain(post.name, post.website, post.slug);
      } catch { }

      let vibe = { score: 0, signals: [], fetched: false };
      if (domain) {
        try {
          vibe = await vibeScore(domain);
        } catch { }
      }

      const qual = qualify(post, domain, vibe);

      results.push({
        name: post.name,
        upvotes: post.votesCount,
        domain,
        domain_resolved: !!domain,
        vibe_score: vibe.score,
        vibe_fetched: vibe.fetched,
        qualification_score: qual.score,
        grade: qual.grade,
        signals: qual.signals,
        topics: (post.topics?.edges || []).map(e => e.node.name),
      });

      resolved++;
      if (resolved % 20 === 0) {
        console.log(`  [${resolved}/${nonBigCorp.length}] resolved`);
      }

      await new Promise(r => setTimeout(r, 100));
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);

  // ── Analysis ─────────────────────────────────────────────────────────────

  console.log('\n' + '═'.repeat(60));
  console.log('📈 QUALIFICATION RESULTS');
  console.log('═'.repeat(60));

  const gradeA = results.filter(r => r.grade === 'A');
  const gradeB = results.filter(r => r.grade === 'B');
  const gradeC = results.filter(r => r.grade === 'C');

  console.log(`\nTotal processed: ${results.length}`);
  console.log(`Domain resolved: ${results.filter(r => r.domain_resolved).length} (${(results.filter(r => r.domain_resolved).length / results.length * 100).toFixed(1)}%)`);
  console.log(`Website fetched: ${results.filter(r => r.vibe_fetched).length}`);
  console.log(`\nGrade A (≥40): ${gradeA.length} (${(gradeA.length / results.length * 100).toFixed(1)}%)`);
  console.log(`Grade B (≥20): ${gradeB.length} (${(gradeB.length / results.length * 100).toFixed(1)}%)`);
  console.log(`Grade C (<20): ${gradeC.length} (${(gradeC.length / results.length * 100).toFixed(1)}%)`);

  // Grade by upvote bucket
  console.log('\n📊 Grade A rate by upvote tier:');
  const tiers = [
    { label: '0 upvotes', min: 0, max: 0 },
    { label: '1-4 upvotes', min: 1, max: 4 },
    { label: '5-19 upvotes', min: 5, max: 19 },
    { label: '20-49 upvotes', min: 20, max: 49 },
    { label: '50+ upvotes', min: 50, max: 99999 },
  ];
  for (const tier of tiers) {
    const inTier = results.filter(r => r.upvotes >= tier.min && r.upvotes <= tier.max);
    const aInTier = inTier.filter(r => r.grade === 'A');
    const pct = inTier.length > 0 ? (aInTier.length / inTier.length * 100).toFixed(1) : '0.0';
    console.log(`  ${tier.label.padEnd(16)}: ${aInTier.length}/${inTier.length} Grade A (${pct}%)`);
  }

  // Extrapolation
  const weeklyAll = results.length;
  const weeklyA = gradeA.length;
  const weeklyAB = gradeA.length + gradeB.length;
  const conversionRate = weeklyA / (results.length || 1);
  const conversionRateAB = weeklyAB / (results.length || 1);

  console.log('\n' + '═'.repeat(60));
  console.log('📅 MONTHLY EXTRAPOLATION (×4.3 weeks)');
  console.log('═'.repeat(60));
  console.log(`Weekly raw launches: ~${weeklyAll}`);
  console.log(`Weekly Grade A: ${weeklyA} (${(conversionRate * 100).toFixed(1)}% conversion)`);
  console.log(`Weekly Grade A+B: ${weeklyAB} (${(conversionRateAB * 100).toFixed(1)}% conversion)`);
  console.log(`\nMonthly Grade A: ~${Math.round(weeklyA * 4.3)}`);
  console.log(`Monthly Grade A+B: ~${Math.round(weeklyAB * 4.3)}`);
  console.log(`Monthly raw (all launches): ~${Math.round(weeklyAll * 4.3)}`);

  // Top Grade A examples
  console.log('\n🏆 Sample Grade A leads:');
  const topA = gradeA.sort((a, b) => b.qualification_score - a.qualification_score).slice(0, 15);
  for (const r of topA) {
    console.log(`  ${r.name.padEnd(30)} | ${r.domain || 'no domain'.padEnd(25)} | vibe:${r.vibe_score} qual:${r.qualification_score} | ⬆️${r.upvotes} | ${r.signals.join(', ')}`);
  }

  // 0-4 upvote Grade A examples specifically
  console.log('\n🔍 Grade A with 0-4 upvotes (the ones old filter would have killed):');
  const lowUpvoteA = gradeA.filter(r => r.upvotes <= 4).slice(0, 10);
  for (const r of lowUpvoteA) {
    console.log(`  ${r.name.padEnd(30)} | ${r.domain || 'no domain'} | vibe:${r.vibe_score} qual:${r.qualification_score} | ⬆️${r.upvotes}`);
  }
  console.log(`  Total: ${gradeA.filter(r => r.upvotes <= 4).length} Grade A leads with ≤4 upvotes`);

  // Save results
  const outputPath = resolve(WORKSPACE, 'pipeline/ph-qualification-results.json');
  const { writeFileSync: wf } = await import('fs');
  wf(outputPath, JSON.stringify({
    run_date: new Date().toISOString(),
    days_back: 7,
    total_posts: posts.length,
    processed: results.length,
    grade_a: gradeA.length,
    grade_b: gradeB.length,
    grade_c: gradeC.length,
    conversion_rate_a: conversionRate,
    conversion_rate_ab: conversionRateAB,
    monthly_estimate_a: Math.round(weeklyA * 4.3),
    monthly_estimate_ab: Math.round(weeklyAB * 4.3),
    results,
  }, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
