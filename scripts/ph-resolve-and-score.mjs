#!/usr/bin/env node
/**
 * ph-resolve-and-score.mjs — Take the 1,224 PH posts we already pulled,
 * resolve domains via DDG in polite batches, vibe score them, and qualify.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai';
const INPUT_PATH = resolve(WORKSPACE, 'pipeline/ph-qualification-results.json');
const CHECKPOINT_PATH = resolve(WORKSPACE, 'pipeline/ph-resolve-checkpoint.json');
const OUTPUT_PATH = resolve(WORKSPACE, 'pipeline/ph-qualified-final.json');

const DDG_DELAY_MS = 800;      // 800ms between DDG searches — polite
const VIBE_CONCURRENCY = 5;    // 5 concurrent vibe fetches
const VIBE_TIMEOUT_MS = 8000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── Load existing results ──────────────────────────────────────────────────

const raw = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));
const posts = raw.results; // Array of { name, upvotes, domain, grade, signals, topics, ... }
console.log(`📦 Loaded ${posts.length} PH posts from previous run\n`);

// ── Load checkpoint ────────────────────────────────────────────────────────

let resolved = {};
if (existsSync(CHECKPOINT_PATH)) {
  try {
    resolved = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf8'));
    console.log(`📌 Resuming from checkpoint: ${Object.keys(resolved).length} already resolved\n`);
  } catch { }
}

// ── DDG Domain Resolution ──────────────────────────────────────────────────

async function resolveDomainDDG(name) {
  try {
    const q = encodeURIComponent(`${name} official website -producthunt.com -linkedin.com -crunchbase.com`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)', 'Accept': 'text/html' },
    });
    clearTimeout(timer);
    
    if (res.status === 429 || res.status === 403) return { domain: null, error: 'rate_limited' };
    if (!res.ok) return { domain: null, error: `http_${res.status}` };
    
    const html = await res.text();
    const matches = [...html.matchAll(/uddg=(https?%3A%2F%2F[^&"']+)/gi)];
    
    for (const m of matches) {
      const decoded = decodeURIComponent(m[1]);
      try {
        const url = new URL(decoded);
        const domain = url.hostname.replace(/^www\./, '');
        if (!/producthunt|google|bing|duckduckgo|facebook|twitter|x\.com|linkedin|youtube|reddit|wikipedia|github\.com$|crunchbase|pitchbook|techcrunch|medium\.com$/.test(domain)) {
          return { domain, error: null };
        }
      } catch { }
    }
    return { domain: null, error: 'no_match' };
  } catch (err) {
    return { domain: null, error: err.name === 'AbortError' ? 'timeout' : err.message };
  }
}

// ── Vibe Scorer (heuristic) ────────────────────────────────────────────────

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
  } catch { return { score: 0, signals: [], fetched: false }; }

  if (!html) return { score: 0, signals: [], fetched: false };

  let score = 0;
  const signals = [];

  // Builder (+25)
  const builders = [
    [/data-wf-site|\.webflow\.com/i, 'Webflow'], [/framer\.com\/m\/|__framer__|data-framer-/i, 'Framer'],
    [/sqsp\.com|squarespace\.com/i, 'Squarespace'], [/wix\.com\/|wixsite\.com|wixstatic\.com/i, 'Wix'],
    [/carrd\.co/i, 'Carrd'],
  ];
  for (const [pat, name] of builders) {
    if (pat.test(html)) { score += 25; signals.push(`builder:${name}`); break; }
  }

  // .io/.ai (+10)
  if (/\.(io|ai)$/.test(domain)) { score += 10; signals.push('io_ai'); }

  // No pricing (+10)
  if (!/href=["'][^"']*\/(pricing|plans)[/"']/i.test(html)) { score += 10; signals.push('no_pricing'); }

  // Vague hero (+15)
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) {
    const text = h1[1].replace(/<[^>]+>/g, ' ').trim();
    if (/revolutioni[sz]e|reimagine|supercharge|the\s+future\s+of|transform|empower|ai[\s-]powered|next[\s-]gen/i.test(text)) {
      score += 15; signals.push('vague_hero');
    }
  }

  // No careers (+10)
  if (!/href=["'][^"']*\/(careers|jobs|hiring)[/"']/i.test(html)) { score += 10; signals.push('no_careers'); }

  // Few logos (+10)
  const trusted = html.match(/(?:trusted\s+by|our\s+customers|used\s+by)[^<]*[\s\S]{0,2000}/i);
  const logos = trusted ? (trusted[0].match(/<img[^>]+>/gi) || []).length : 0;
  if (logos < 5) { score += 10; signals.push('few_logos'); }

  // Few blogs (+10)
  const blogs = new Set(html.match(/href=["'][^"']*\/(blog|post|articles?)\/[^"']+["']/gi) || []);
  if (blogs.size < 5) { score += 10; signals.push('few_blogs'); }

  return { score: Math.min(100, score), signals, fetched: true };
}

// ── ICP Topics ─────────────────────────────────────────────────────────────

const ICP_TOPICS = new Set([
  'artificial intelligence', 'saas', 'developer tools', 'productivity',
  'design tools', 'marketing', 'sales', 'analytics', 'fintech',
  'no-code', 'devops', 'api', 'chrome extensions', 'automation',
  'email', 'crm', 'project management', 'collaboration', 'open source',
  'machine learning', 'data science', 'cybersecurity', 'seo',
  'e-commerce', 'payments', 'web app', 'mobile', 'tech',
]);

function matchesIcp(topics) {
  return (topics || []).some(t => {
    const tl = t.toLowerCase();
    return ICP_TOPICS.has(tl) || [...ICP_TOPICS].some(icp => tl.includes(icp));
  });
}

// ── Qualification ──────────────────────────────────────────────────────────

function qualify(post, domain, vibe) {
  let score = 0;
  const signals = [];

  if (/saas|software|platform|api|app|cloud|devtools?|dev\s+tool/i.test(post.name + ' ' + (post.topics || []).join(' '))) {
    score += 20; signals.push('software_product');
  }
  if (domain && /\.(io|ai)$/.test(domain)) { score += 5; signals.push('io_ai_domain'); }
  if (vibe.score > 60) { score += 20; signals.push(`high_vibe:${vibe.score}`); }
  else if (vibe.score >= 30) { score += 10; signals.push(`mid_vibe:${vibe.score}`); }
  if (matchesIcp(post.topics)) { score += 10; signals.push('icp_topic'); }
  score += 5; signals.push('small_team'); // PH launchers are always small

  let grade = score >= 40 ? 'A' : score >= 20 ? 'B' : 'C';
  return { score, grade, signals };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  
  // Phase 1: Resolve domains via DDG (serial, with delay)
  console.log('🌐 Phase 1: Resolving domains via DuckDuckGo...\n');
  
  let ddgDone = 0;
  let ddgResolved = 0;
  let ddgErrors = 0;
  let rateLimitHits = 0;
  let rateLimitBackoff = DDG_DELAY_MS;
  
  for (const post of posts) {
    const key = post.name;
    if (resolved[key]?.domain) { ddgDone++; ddgResolved++; continue; }
    if (resolved[key]?.error && resolved[key].error !== 'rate_limited') { ddgDone++; continue; }
    
    const result = await resolveDomainDDG(post.name);
    resolved[key] = result;
    ddgDone++;
    
    if (result.domain) {
      ddgResolved++;
      rateLimitBackoff = DDG_DELAY_MS; // reset on success
    }
    if (result.error === 'rate_limited') {
      rateLimitHits++;
      rateLimitBackoff = Math.min(rateLimitBackoff * 2, 30000); // exponential backoff, max 30s
      console.log(`  ⚠️ DDG rate limited (${rateLimitHits}x) — backing off ${(rateLimitBackoff/1000).toFixed(1)}s`);
      await new Promise(r => setTimeout(r, rateLimitBackoff));
      // Retry this one
      const retry = await resolveDomainDDG(post.name);
      if (retry.domain) { resolved[key] = retry; ddgResolved++; rateLimitBackoff = DDG_DELAY_MS; }
    } else {
      if (result.error) ddgErrors++;
    }
    
    if (ddgDone % 50 === 0) {
      const pct = ((ddgDone / posts.length) * 100).toFixed(1);
      console.log(`  [${pct}%] ${ddgDone}/${posts.length} | resolved: ${ddgResolved} | errors: ${ddgErrors} | rate limits: ${rateLimitHits}`);
      // Save checkpoint
      writeFileSync(CHECKPOINT_PATH, JSON.stringify(resolved));
    }
    
    await new Promise(r => setTimeout(r, rateLimitBackoff));
  }
  
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(resolved));
  console.log(`\n✅ Domain resolution: ${ddgResolved}/${posts.length} resolved (${(ddgResolved/posts.length*100).toFixed(1)}%)\n`);

  // Phase 2: Vibe score all resolved domains (concurrent)
  console.log('🎯 Phase 2: Vibe scoring resolved domains...\n');
  
  const vibeResults = {};
  const toVibe = posts.filter(p => resolved[p.name]?.domain);
  let vibeIdx = 0;
  let vibeDone = 0;
  
  async function vibeWorker() {
    while (vibeIdx < toVibe.length) {
      const i = vibeIdx++;
      const post = toVibe[i];
      const domain = resolved[post.name].domain;
      vibeResults[domain] = await vibeScore(domain);
      vibeDone++;
      if (vibeDone % 50 === 0) {
        console.log(`  [${vibeDone}/${toVibe.length}] vibe scored`);
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  const workers = [];
  for (let i = 0; i < VIBE_CONCURRENCY; i++) workers.push(vibeWorker());
  await Promise.all(workers);
  
  const vibeFetched = Object.values(vibeResults).filter(v => v.fetched).length;
  console.log(`\n✅ Vibe scoring: ${vibeFetched}/${toVibe.length} websites fetched\n`);

  // Phase 3: Qualify everything
  console.log('📊 Phase 3: Qualification...\n');
  
  const finalResults = [];
  for (const post of posts) {
    const domain = resolved[post.name]?.domain || null;
    const vibe = domain ? (vibeResults[domain] || { score: 0, signals: [], fetched: false }) : { score: 0, signals: [], fetched: false };
    const qual = qualify(post, domain, vibe);
    
    finalResults.push({
      name: post.name,
      upvotes: post.upvotes,
      domain,
      domain_resolved: !!domain,
      vibe_score: vibe.score,
      vibe_fetched: vibe.fetched,
      vibe_signals: vibe.signals,
      qualification_score: qual.score,
      grade: qual.grade,
      signals: qual.signals,
      topics: post.topics,
    });
  }

  // ── Analysis ─────────────────────────────────────────────────────────────
  
  const gradeA = finalResults.filter(r => r.grade === 'A');
  const gradeB = finalResults.filter(r => r.grade === 'B');
  const gradeC = finalResults.filter(r => r.grade === 'C');
  
  console.log('═'.repeat(60));
  console.log('📈 FINAL QUALIFICATION RESULTS (with vibe scoring)');
  console.log('═'.repeat(60));
  console.log(`\nTotal: ${finalResults.length}`);
  console.log(`Domain resolved: ${finalResults.filter(r => r.domain_resolved).length} (${(finalResults.filter(r => r.domain_resolved).length / finalResults.length * 100).toFixed(1)}%)`);
  console.log(`Vibe scored: ${finalResults.filter(r => r.vibe_fetched).length}`);
  console.log(`\nGrade A (≥40): ${gradeA.length} (${(gradeA.length / finalResults.length * 100).toFixed(1)}%)`);
  console.log(`Grade B (≥20): ${gradeB.length} (${(gradeB.length / finalResults.length * 100).toFixed(1)}%)`);
  console.log(`Grade C (<20): ${gradeC.length} (${(gradeC.length / finalResults.length * 100).toFixed(1)}%)`);

  // By upvote tier
  console.log('\n📊 Grade A rate by upvote tier:');
  const tiers = [
    { label: '0 upvotes', min: 0, max: 0 },
    { label: '1-4', min: 1, max: 4 },
    { label: '5-19', min: 5, max: 19 },
    { label: '20-49', min: 20, max: 49 },
    { label: '50+', min: 50, max: 99999 },
  ];
  for (const t of tiers) {
    const inTier = finalResults.filter(r => r.upvotes >= t.min && r.upvotes <= t.max);
    const aInTier = inTier.filter(r => r.grade === 'A');
    console.log(`  ${t.label.padEnd(12)}: ${aInTier.length}/${inTier.length} Grade A (${inTier.length ? (aInTier.length/inTier.length*100).toFixed(1) : 0}%)`);
  }

  // Vibe score distribution for resolved domains
  const vibeScores = finalResults.filter(r => r.vibe_fetched).map(r => r.vibe_score);
  if (vibeScores.length > 0) {
    console.log('\n📊 Vibe score distribution (fetched websites):');
    console.log(`  High (60-100): ${vibeScores.filter(v => v >= 60).length}`);
    console.log(`  Mid (30-59):   ${vibeScores.filter(v => v >= 30 && v < 60).length}`);
    console.log(`  Low (0-29):    ${vibeScores.filter(v => v < 30).length}`);
    console.log(`  Average:       ${(vibeScores.reduce((a,b)=>a+b,0)/vibeScores.length).toFixed(1)}`);
  }

  // Extrapolation
  const weeklyA = gradeA.length;
  const weeklyAB = gradeA.length + gradeB.length;
  console.log('\n' + '═'.repeat(60));
  console.log('📅 MONTHLY EXTRAPOLATION (×4.3 weeks)');
  console.log('═'.repeat(60));
  console.log(`Weekly raw: ${finalResults.length}`);
  console.log(`Weekly Grade A: ${weeklyA} (${(weeklyA/finalResults.length*100).toFixed(1)}%)`);
  console.log(`Weekly A+B: ${weeklyAB} (${(weeklyAB/finalResults.length*100).toFixed(1)}%)`);
  console.log(`\nMonthly Grade A: ~${Math.round(weeklyA * 4.3)}`);
  console.log(`Monthly A+B: ~${Math.round(weeklyAB * 4.3)}`);
  console.log(`Monthly raw: ~${Math.round(finalResults.length * 4.3)}`);

  // Sample Grade A
  console.log('\n🏆 Top Grade A leads:');
  for (const r of gradeA.sort((a,b) => b.qualification_score - a.qualification_score).slice(0, 20)) {
    console.log(`  ${r.name.slice(0,28).padEnd(30)} | ${(r.domain||'?').slice(0,25).padEnd(27)} | vibe:${String(r.vibe_score).padEnd(3)} qual:${r.qualification_score} | ⬆️${r.upvotes}`);
  }

  // 0-4 upvote Grade A
  const lowA = gradeA.filter(r => r.upvotes <= 4);
  console.log(`\n🔍 Grade A with ≤4 upvotes: ${lowA.length}`);
  for (const r of lowA.slice(0, 10)) {
    console.log(`  ${r.name.slice(0,28).padEnd(30)} | ${(r.domain||'?').padEnd(27)} | vibe:${r.vibe_score} | ⬆️${r.upvotes}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n⏱️ Total time: ${elapsed} minutes`);

  // Save
  writeFileSync(OUTPUT_PATH, JSON.stringify({
    run_date: new Date().toISOString(),
    total: finalResults.length,
    domain_resolved: finalResults.filter(r => r.domain_resolved).length,
    vibe_scored: finalResults.filter(r => r.vibe_fetched).length,
    grade_a: gradeA.length,
    grade_b: gradeB.length,
    grade_c: gradeC.length,
    monthly_a: Math.round(weeklyA * 4.3),
    monthly_ab: Math.round(weeklyAB * 4.3),
    results: finalResults,
  }, null, 2));
  console.log(`\nSaved to: ${OUTPUT_PATH}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
