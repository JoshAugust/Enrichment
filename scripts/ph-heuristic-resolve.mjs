#!/usr/bin/env node
/**
 * ph-heuristic-resolve.mjs — Resolve PH product names to domains
 * using heuristic domain guessing + HEAD checks.
 * No DDG, no PH API — just direct HTTP probes.
 * 
 * Strategy: For each product name, try common domain patterns:
 *   {name}.com, {name}.io, {name}.ai, {name}.co, {name}.app,
 *   get{name}.com, try{name}.com, use{name}.com, {name}app.com, {name}hq.com
 * 
 * Then vibe score whatever resolves.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai';
const INPUT_PATH = resolve(WORKSPACE, 'pipeline/ph-qualification-results.json');
const CHECKPOINT_PATH = resolve(WORKSPACE, 'pipeline/ph-heuristic-checkpoint.json');
const OUTPUT_PATH = resolve(WORKSPACE, 'pipeline/ph-qualified-final.json');

const CONCURRENCY = 15;
const PROBE_TIMEOUT_MS = 5000;
const VIBE_TIMEOUT_MS = 8000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── Load data ──────────────────────────────────────────────────────────────

const raw = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));
const posts = raw.results;
console.log(`📦 Loaded ${posts.length} PH posts\n`);

let checkpoint = {};
if (existsSync(CHECKPOINT_PATH)) {
  try { checkpoint = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf8')); } catch {}
  console.log(`📌 Checkpoint: ${Object.keys(checkpoint).length} already resolved\n`);
}

// ── Domain guessing ────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function generateGuesses(name) {
  const slug = slugify(name);
  if (!slug || slug.length < 2) return [];
  
  // Also try with hyphens for multi-word names
  const hyphenSlug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
  
  const guesses = new Set([
    `${slug}.com`, `${slug}.io`, `${slug}.ai`, `${slug}.co`, `${slug}.app`,
    `${slug}.dev`, `${slug}.so`, `${slug}.xyz`,
    `get${slug}.com`, `try${slug}.com`, `use${slug}.com`,
    `${slug}app.com`, `${slug}hq.com`,
  ]);
  
  if (hyphenSlug !== slug) {
    guesses.add(`${hyphenSlug}.com`);
    guesses.add(`${hyphenSlug}.io`);
    guesses.add(`${hyphenSlug}.ai`);
  }
  
  return [...guesses];
}

async function probeDomain(domain) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timer);
    // Accept 200, 301, 302, 403 (cloudflare), 405 (method not allowed)
    return res.ok || res.status === 403 || res.status === 405;
  } catch {
    return false;
  }
}

async function resolveDomain(name) {
  const guesses = generateGuesses(name);
  for (const domain of guesses) {
    if (await probeDomain(domain)) return domain;
  }
  return null;
}

// ── Vibe Scorer ────────────────────────────────────────────────────────────

async function vibeScore(domain) {
  if (!domain) return { score: 0, signals: [], fetched: false };
  let html = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VIBE_TIMEOUT_MS);
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

  const builders = [
    [/data-wf-site|\.webflow\.com/i, 'Webflow'], [/framer\.com\/m\/|__framer__|data-framer-/i, 'Framer'],
    [/sqsp\.com|squarespace\.com/i, 'Squarespace'], [/wix\.com\/|wixsite\.com|wixstatic\.com/i, 'Wix'],
    [/carrd\.co/i, 'Carrd'],
  ];
  for (const [pat, n] of builders) { if (pat.test(html)) { score += 25; signals.push(`builder:${n}`); break; } }
  if (/\.(io|ai)$/.test(domain)) { score += 10; signals.push('io_ai'); }
  if (!/href=["'][^"']*\/(pricing|plans)[/"']/i.test(html)) { score += 10; signals.push('no_pricing'); }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1 && /revolutioni[sz]e|reimagine|supercharge|the\s+future\s+of|transform|empower|ai[\s-]powered|next[\s-]gen/i.test(h1[1].replace(/<[^>]+>/g, ''))) {
    score += 15; signals.push('vague_hero');
  }
  if (!/href=["'][^"']*\/(careers|jobs|hiring)[/"']/i.test(html)) { score += 10; signals.push('no_careers'); }
  const trusted = html.match(/(?:trusted\s+by|our\s+customers|used\s+by)[^<]*[\s\S]{0,2000}/i);
  if (!trusted || (trusted[0].match(/<img[^>]+>/gi) || []).length < 5) { score += 10; signals.push('few_logos'); }
  if (new Set(html.match(/href=["'][^"']*\/(blog|post|articles?)\/[^"']+["']/gi) || []).size < 5) { score += 10; signals.push('few_blogs'); }

  return { score: Math.min(100, score), signals, fetched: true };
}

// ── ICP + Qualification ────────────────────────────────────────────────────

const ICP_TOPICS = new Set([
  'artificial intelligence','saas','developer tools','productivity','design tools',
  'marketing','sales','analytics','fintech','no-code','devops','api',
  'chrome extensions','automation','email','crm','project management',
  'collaboration','open source','machine learning','data science','cybersecurity',
  'seo','e-commerce','payments','web app','mobile','tech',
]);

function matchesIcp(topics) {
  return (topics||[]).some(t => {
    const tl = t.toLowerCase();
    return ICP_TOPICS.has(tl) || [...ICP_TOPICS].some(i => tl.includes(i));
  });
}

function qualify(post, domain, vibe) {
  let score = 0; const signals = [];
  if (/saas|software|platform|api|app|cloud|devtools?|dev\s+tool/i.test(post.name + ' ' + (post.topics||[]).join(' ')))
    { score += 20; signals.push('software'); }
  if (domain && /\.(io|ai)$/.test(domain)) { score += 5; signals.push('io_ai_domain'); }
  if (vibe.score > 60) { score += 20; signals.push(`high_vibe:${vibe.score}`); }
  else if (vibe.score >= 30) { score += 10; signals.push(`mid_vibe:${vibe.score}`); }
  if (matchesIcp(post.topics)) { score += 10; signals.push('icp_topic'); }
  score += 5; signals.push('small_team');
  return { score, grade: score >= 40 ? 'A' : score >= 20 ? 'B' : 'C', signals };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  
  // Phase 1: Resolve + vibe score in one pass (concurrent)
  console.log(`🚀 Resolving domains + vibe scoring (${CONCURRENCY} concurrent)...\n`);
  
  let idx = 0, done = 0, resolved = 0, vibed = 0;
  const results = new Map();
  
  async function worker() {
    while (idx < posts.length) {
      const i = idx++;
      const post = posts[i];
      const key = post.name;
      
      // Check checkpoint
      if (checkpoint[key]?.domain) {
        const cached = checkpoint[key];
        results.set(key, cached);
        done++; resolved++;
        if (cached.vibe_fetched) vibed++;
        continue;
      }
      
      // Resolve
      const domain = await resolveDomain(post.name);
      let vibe = { score: 0, signals: [], fetched: false };
      
      if (domain) {
        resolved++;
        vibe = await vibeScore(domain);
        if (vibe.fetched) vibed++;
      }
      
      const entry = { domain, vibe_score: vibe.score, vibe_signals: vibe.signals, vibe_fetched: vibe.fetched };
      results.set(key, entry);
      checkpoint[key] = entry;
      done++;
      
      if (done % 50 === 0) {
        const pct = ((done / posts.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        console.log(`  [${pct}%] ${done}/${posts.length} | resolved: ${resolved} | vibed: ${vibed} | ${elapsed}s`);
        writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
      }
    }
  }
  
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
  
  console.log(`\n✅ Resolution: ${resolved}/${posts.length} (${(resolved/posts.length*100).toFixed(1)}%)`);
  console.log(`✅ Vibe scored: ${vibed}\n`);

  // Phase 2: Qualify
  const finalResults = posts.map(post => {
    const r = results.get(post.name) || {};
    const domain = r.domain || null;
    const vibe = { score: r.vibe_score || 0, signals: r.vibe_signals || [], fetched: r.vibe_fetched || false };
    const qual = qualify(post, domain, vibe);
    return {
      name: post.name, upvotes: post.upvotes, domain,
      domain_resolved: !!domain, vibe_score: vibe.score, vibe_fetched: vibe.fetched,
      qualification_score: qual.score, grade: qual.grade, signals: qual.signals,
      topics: post.topics,
    };
  });

  const gradeA = finalResults.filter(r => r.grade === 'A');
  const gradeB = finalResults.filter(r => r.grade === 'B');
  const gradeC = finalResults.filter(r => r.grade === 'C');

  console.log('═'.repeat(60));
  console.log('📈 FINAL RESULTS (heuristic domain resolution + vibe scoring)');
  console.log('═'.repeat(60));
  console.log(`\nTotal: ${finalResults.length}`);
  console.log(`Domain resolved: ${finalResults.filter(r=>r.domain_resolved).length} (${(finalResults.filter(r=>r.domain_resolved).length/finalResults.length*100).toFixed(1)}%)`);
  console.log(`Vibe scored: ${finalResults.filter(r=>r.vibe_fetched).length}`);
  console.log(`\nGrade A (≥40): ${gradeA.length} (${(gradeA.length/finalResults.length*100).toFixed(1)}%)`);
  console.log(`Grade B (≥20): ${gradeB.length} (${(gradeB.length/finalResults.length*100).toFixed(1)}%)`);
  console.log(`Grade C (<20): ${gradeC.length} (${(gradeC.length/finalResults.length*100).toFixed(1)}%)`);

  console.log('\n📊 Grade A by upvote tier:');
  for (const t of [{l:'0',a:0,b:0},{l:'1-4',a:1,b:4},{l:'5-19',a:5,b:19},{l:'20-49',a:20,b:49},{l:'50+',a:50,b:99999}]) {
    const tier = finalResults.filter(r=>r.upvotes>=t.a&&r.upvotes<=t.b);
    const aT = tier.filter(r=>r.grade==='A');
    console.log(`  ${t.l.padEnd(8)}: ${aT.length}/${tier.length} A (${tier.length?(aT.length/tier.length*100).toFixed(1):0}%)`);
  }

  const vibeScores = finalResults.filter(r=>r.vibe_fetched).map(r=>r.vibe_score);
  if (vibeScores.length) {
    console.log('\n📊 Vibe distribution:');
    console.log(`  High (60+): ${vibeScores.filter(v=>v>=60).length}`);
    console.log(`  Mid (30-59): ${vibeScores.filter(v=>v>=30&&v<60).length}`);
    console.log(`  Low (<30): ${vibeScores.filter(v=>v<30).length}`);
    console.log(`  Avg: ${(vibeScores.reduce((a,b)=>a+b,0)/vibeScores.length).toFixed(1)}`);
  }

  const wA = gradeA.length, wAB = gradeA.length+gradeB.length;
  console.log('\n' + '═'.repeat(60));
  console.log('📅 MONTHLY EXTRAPOLATION (×4.3)');
  console.log('═'.repeat(60));
  console.log(`Weekly A: ${wA} (${(wA/finalResults.length*100).toFixed(1)}%)`);
  console.log(`Weekly A+B: ${wAB}`);
  console.log(`Monthly A: ~${Math.round(wA*4.3)}`);
  console.log(`Monthly A+B: ~${Math.round(wAB*4.3)}`);

  console.log('\n🏆 Top Grade A:');
  for (const r of gradeA.sort((a,b)=>b.qualification_score-a.qualification_score).slice(0,20)) {
    console.log(`  ${r.name.slice(0,28).padEnd(30)} | ${(r.domain||'?').slice(0,25).padEnd(27)} | v:${String(r.vibe_score).padEnd(3)} q:${r.qualification_score} | ⬆️${r.upvotes}`);
  }

  const lowA = gradeA.filter(r=>r.upvotes<=4);
  console.log(`\n🔍 Grade A ≤4 upvotes: ${lowA.length}`);
  for (const r of lowA.slice(0,15)) {
    console.log(`  ${r.name.slice(0,28).padEnd(30)} | ${(r.domain||'?').padEnd(25)} | v:${r.vibe_score} | ⬆️${r.upvotes}`);
  }

  console.log(`\n⏱️ ${((Date.now()-start)/1000/60).toFixed(1)} min`);

  writeFileSync(OUTPUT_PATH, JSON.stringify({
    run_date: new Date().toISOString(), method: 'heuristic_domain_guess',
    total: finalResults.length,
    domain_resolved: finalResults.filter(r=>r.domain_resolved).length,
    vibe_scored: finalResults.filter(r=>r.vibe_fetched).length,
    grade_a: gradeA.length, grade_b: gradeB.length, grade_c: gradeC.length,
    monthly_a: Math.round(wA*4.3), monthly_ab: Math.round(wAB*4.3),
    results: finalResults,
  }, null, 2));
  console.log(`Saved: ${OUTPUT_PATH}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
