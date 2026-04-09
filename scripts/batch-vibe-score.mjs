#!/usr/bin/env node
/**
 * batch-vibe-score.mjs — Batch website vibe scoring for 8K+ domains
 * 
 * Reads the US_Software_Decision_Makers CSV, extracts unique domains 
 * (after employee/revenue cuts), and runs the vibe scorer on each.
 * 
 * Features:
 * - Concurrency: 20 parallel fetches
 * - Checkpoint/resume: saves progress every 50 domains
 * - Heuristic-only mode (no Claude API calls) — free and fast
 * - Rate limiting: 50ms delay between launches
 * - Timeout: 10s per domain
 * - Output: JSON results file + summary stats
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai';
const CSV_PATH = '/Users/corgi12/.eragon-joshua_augustine/media/inbound/US_Software_Decision_Makers---c5335c78-e9cf-4a47-9ca4-ddf5eb071bf2.csv';
const CHECKPOINT_PATH = resolve(WORKSPACE, 'pipeline/vibe-score-checkpoint.json');
const RESULTS_PATH = resolve(WORKSPACE, 'pipeline/vibe-score-results.json');
const SUMMARY_PATH = resolve(WORKSPACE, 'pipeline/vibe-score-summary.json');

const CONCURRENCY = 20;
const DELAY_MS = 50;
const TIMEOUT_MS = 10000;
const CHECKPOINT_EVERY = 50;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── CSV Parsing ────────────────────────────────────────────────────────────

function parseCSV() {
  const csv = readFileSync(CSV_PATH, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim());
  
  const domainMap = new Map(); // domain -> { name, employees, revenue, description, website }
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/(?:"[^"]*"|[^,]*)(?:,|$)/g)
      ?.map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').trim()) || [];
    
    const employees = parseInt(cols[5]) || 0;
    const revenue = parseInt(cols[6]) || 0;
    const website = cols[10]?.trim();
    const name = cols[1]?.trim();
    const description = cols[11]?.trim();
    
    if (employees > 200 || revenue > 12000000 || !website) continue;
    
    const domain = website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase();
    if (!domain || domain.length < 3) continue;
    
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { name, employees, revenue, description, website, domain });
    }
  }
  
  return domainMap;
}

// ── Vibe Scorer (heuristic-only, inlined) ──────────────────────────────────

async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml,*/*' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function detectWebsiteBuilder(html) {
  const checks = [
    { pattern: /data-wf-site|data-wf-page|\.webflow\.com/i, name: 'Webflow' },
    { pattern: /framer\.com\/m\/|__framer__|data-framer-|framer\.website/i, name: 'Framer' },
    { pattern: /sqsp\.com|sqsp-|squarespace\.com|static1\.squarespace/i, name: 'Squarespace' },
    { pattern: /wix\.com\/|wixsite\.com|wixstatic\.com|_wixCIDX/i, name: 'Wix' },
    { pattern: /carrd\.co|data-page-id.*carrd/i, name: 'Carrd' },
    { pattern: /wordpress\.org|wp-content|wp-includes/i, name: 'WordPress' },
    { pattern: /shopify\.com|cdn\.shopify/i, name: 'Shopify' },
    { pattern: /ghost\.io|ghost-content/i, name: 'Ghost' },
  ];
  for (const { pattern, name } of checks) {
    if (pattern.test(html)) return { fired: true, detail: name };
  }
  return { fired: false, detail: null };
}

function isVagueHero(text) {
  if (!text) return false;
  const vagueKeywords = [
    /revolutioni[sz]e/i, /reimagine/i, /supercharge/i, /the\s+future\s+of/i,
    /made\s+easy/i, /simplified/i, /effortless/i, /transform\b/i, /empower/i,
    /unlock\s+the/i, /next[\s-]gen/i, /cutting[\s-]edge/i, /game[\s-]changer/i,
    /disrupt/i, /leverage\s+ai/i, /harness\s+the\s+power/i,
    /seamlessly/i, /world[\s-]class/i, /best[\s-]in[\s-]class/i,
    /10x\s+your/i, /scale\s+your/i, /powered\s+by\s+ai/i, /ai[\s-]powered/i,
    /built\s+for\s+the\s+future/i, /modern\s+way\s+to/i, /rethink/i,
  ];
  return vagueKeywords.filter(kw => kw.test(text)).length >= 1;
}

function extractHeroText(html) {
  const patterns = [
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<section[^>]*(?:hero|banner)[^>]*>[\s\S]*?<h[12][^>]*>([\s\S]*?)<\/h[12]>/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  }
  return null;
}

async function scoreDomain(domain, website) {
  const signals = [];
  let score = 0;
  const baseUrl = website.startsWith('http') ? website : `https://${website}`;
  let html = '';
  let sitemapXml = null;
  let error = null;

  // Fetch homepage
  try {
    const res = await fetchWithTimeout(baseUrl);
    if (res.ok) {
      html = (await res.text()).slice(0, 200000); // cap at 200KB
    } else {
      error = `HTTP ${res.status}`;
    }
  } catch (err) {
    error = err.name === 'AbortError' ? 'timeout' : err.message;
  }

  if (!html) {
    return { domain, score: 0, signals: [], error, fetched: false };
  }

  // Fetch sitemap (quick, don't block on failure)
  try {
    const sitemapRes = await fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/sitemap.xml`, 5000);
    if (sitemapRes.ok && (sitemapRes.headers.get('content-type') || '').includes('xml')) {
      sitemapXml = (await sitemapRes.text()).slice(0, 500000);
    }
  } catch { /* ignore */ }

  // Signal 1: Website builder (+25)
  const builder = detectWebsiteBuilder(html);
  if (builder.fired) {
    score += 25;
    signals.push(`builder:${builder.detail}`);
  }

  // Signal 2: .io or .ai domain (+10)
  if (/\.(io|ai)$/.test(domain)) {
    score += 10;
    signals.push('io_ai_domain');
  }

  // Signal 3: Small/no sitemap (+10)
  if (!sitemapXml) {
    score += 10;
    signals.push('no_sitemap');
  } else {
    const urlCount = (sitemapXml.match(/<loc>/gi) || []).length;
    if (urlCount < 10) {
      score += 10;
      signals.push(`small_sitemap:${urlCount}`);
    }
  }

  // Signal 4: No pricing page / demo-only CTA (+10)
  const hasPricing = /href=["'][^"']*\/(pricing|plans)[/"']/i.test(html);
  const demoOnly = /book\s+a\s+demo|schedule\s+a\s+demo|request\s+a\s+demo|contact\s+us|join\s+waitlist/i.test(html);
  if (!hasPricing || demoOnly) {
    score += 10;
    signals.push(hasPricing ? 'demo_only_cta' : 'no_pricing');
  }

  // Signal 5: Vague hero text (+15)
  const heroText = extractHeroText(html);
  if (isVagueHero(heroText)) {
    score += 15;
    signals.push('vague_hero');
  }

  // Signal 6: Few blog posts (+10)
  let blogCount = 0;
  if (sitemapXml) {
    blogCount = (sitemapXml.match(/<loc>[^<]*\/(blog|post|articles?)\/[^<]+<\/loc>/gi) || []).length;
  }
  if (blogCount === 0) {
    blogCount = new Set(html.match(/href=["'][^"']*\/(blog|post|articles?)\/[^"']+["']/gi) || []).size;
  }
  if (blogCount < 5) {
    score += 10;
    signals.push(`few_blogs:${blogCount}`);
  }

  // Signal 7: No careers page / few jobs (+10)
  const hasCareers = /href=["'][^"']*\/(careers|jobs|hiring|join-us)[/"']/i.test(html);
  if (!hasCareers) {
    score += 10;
    signals.push('no_careers');
  }

  // Signal 8: Few customer logos (+10)
  const trustedSection = html.match(/(?:trusted\s+by|our\s+customers|customers|used\s+by)[^<]*[\s\S]{0,2000}/i);
  const logoCount = trustedSection ? (trustedSection[0].match(/<img[^>]+>/gi) || []).length : 0;
  if (logoCount < 5) {
    score += 10;
    signals.push(`few_logos:${logoCount}`);
  }

  return { domain, score: Math.min(100, score), signals, error: null, fetched: true };
}

// ── Batch Runner with Concurrency ──────────────────────────────────────────

async function runBatch(domains, existingResults) {
  const todo = domains.filter(d => !existingResults[d.domain]);
  const total = todo.length;
  const alreadyDone = domains.length - total;
  
  console.log(`\n🎯 Vibe Score Batch: ${total} domains to process (${alreadyDone} already done)`);
  console.log(`   Concurrency: ${CONCURRENCY}, Delay: ${DELAY_MS}ms\n`);
  
  let completed = 0;
  let fetched = 0;
  let errors = 0;
  let idx = 0;
  
  const results = { ...existingResults };
  
  async function processOne() {
    while (idx < todo.length) {
      const current = idx++;
      const entry = todo[current];
      
      try {
        const result = await scoreDomain(entry.domain, entry.website);
        results[entry.domain] = result;
        
        completed++;
        if (result.fetched) fetched++;
        if (result.error) errors++;
        
        if (completed % 100 === 0 || completed === total) {
          const pct = ((completed / total) * 100).toFixed(1);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const rate = (completed / (elapsed || 1)).toFixed(1);
          console.log(`[${pct}%] ${completed}/${total} done | ${fetched} fetched | ${errors} errors | ${rate}/s | ${elapsed}s elapsed`);
        }
        
        // Checkpoint
        if (completed % CHECKPOINT_EVERY === 0) {
          writeFileSync(CHECKPOINT_PATH, JSON.stringify({ results, completed, total, timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        results[entry.domain] = { domain: entry.domain, score: 0, signals: [], error: err.message, fetched: false };
        completed++;
        errors++;
      }
      
      // Small delay to be nice
      if (DELAY_MS > 0) await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  const startTime = Date.now();
  
  // Launch concurrent workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(processOne());
  }
  
  await Promise.all(workers);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Complete! ${completed} domains in ${elapsed}s`);
  console.log(`   Fetched: ${fetched}, Errors: ${errors}`);
  
  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('📊 Parsing CSV and extracting unique domains...');
  const domainMap = parseCSV();
  const domains = Array.from(domainMap.values());
  console.log(`   Found ${domains.length} unique domains after filters`);
  
  // Load checkpoint if exists
  let existingResults = {};
  if (existsSync(CHECKPOINT_PATH)) {
    try {
      const cp = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf8'));
      existingResults = cp.results || {};
      console.log(`   Resuming from checkpoint: ${Object.keys(existingResults).length} already scored`);
    } catch { /* fresh start */ }
  }
  
  // Run the batch
  const results = await runBatch(domains, existingResults);
  
  // Save final results
  writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  
  // Generate summary
  const scored = Object.values(results);
  const fetchedOk = scored.filter(r => r.fetched);
  const scoreBuckets = { high: 0, mid: 0, low: 0, zero: 0 };
  const signalCounts = {};
  
  for (const r of scored) {
    if (r.score >= 60) scoreBuckets.high++;
    else if (r.score >= 30) scoreBuckets.mid++;
    else if (r.score > 0) scoreBuckets.low++;
    else scoreBuckets.zero++;
    
    for (const s of (r.signals || [])) {
      const key = s.split(':')[0];
      signalCounts[key] = (signalCounts[key] || 0) + 1;
    }
  }
  
  const summary = {
    total_domains: scored.length,
    fetched_ok: fetchedOk.length,
    fetch_errors: scored.length - fetchedOk.length,
    score_distribution: {
      'high (60-100)': scoreBuckets.high,
      'mid (30-59)': scoreBuckets.mid,
      'low (1-29)': scoreBuckets.low,
      'zero (0)': scoreBuckets.zero,
    },
    avg_score: (fetchedOk.reduce((s, r) => s + r.score, 0) / (fetchedOk.length || 1)).toFixed(1),
    signal_frequency: Object.fromEntries(
      Object.entries(signalCounts).sort((a, b) => b[1] - a[1])
    ),
    timestamp: new Date().toISOString(),
  };
  
  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  
  console.log('\n📈 SUMMARY:');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nResults saved to: ${RESULTS_PATH}`);
  console.log(`Summary saved to: ${SUMMARY_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
