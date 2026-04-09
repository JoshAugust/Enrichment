import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const DB_PATH = `${WORKSPACE}/jordan.ai/pipeline/master.db`;
const CHECKPOINT = `${WORKSPACE}/jordan.ai/pipeline/overnight_scrape_checkpoint.json`;
const OUTPUT = `${WORKSPACE}/jordan.ai/pipeline/overnight_scrape_results.json`;
const CONCURRENCY = 5;
const DELAY_MS = 500;
const TIMEOUT_MS = 8000;

// Load checkpoint
let checkpoint = { processed: 0, results: {} };
if (existsSync(CHECKPOINT)) {
  checkpoint = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
  console.log(`Resuming from checkpoint: ${checkpoint.processed} processed, ${Object.keys(checkpoint.results).length} results`);
}

// Get domains to scrape — qualified companies without enrichment signals
const db = new Database(DB_PATH, { readonly: true });
const rows = db.prepare(`
  SELECT domain, company_name, vibe_score, blueprint_score, grade
  FROM companies 
  WHERE domain IS NOT NULL AND domain != ''
  AND (dq_reason IS NULL OR dq_reason = '')
  AND vibe_score IS NOT NULL AND vibe_score > 0
  AND blueprint_score IS NOT NULL AND blueprint_score >= 50
  AND (hiring_signal IS NULL OR hiring_signal = '' OR hiring_signal = '0')
  AND (recent_news IS NULL OR recent_news = '')
  ORDER BY blueprint_score DESC
`).all();
db.close();

console.log(`Companies to scrape: ${rows.length}`);

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot)' },
      redirect: 'follow'
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const text = await r.text();
    return text.substring(0, 50000); // cap at 50KB
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function extractSignals(html, domain) {
  if (!html) return {};
  const lower = html.toLowerCase();
  const signals = {};
  
  // Hiring signals
  const jobKeywords = ['careers', 'we\'re hiring', 'join our team', 'open positions', 'job openings', 'work with us', 'apply now'];
  const hiringMatches = jobKeywords.filter(k => lower.includes(k));
  if (hiringMatches.length > 0) {
    signals.hiring = true;
    signals.hiring_keywords = hiringMatches;
  }
  
  // GitHub link
  const ghMatch = html.match(/github\.com\/([a-zA-Z0-9_-]+)/);
  if (ghMatch && !['topics', 'features', 'pricing', 'about', 'login', 'signup', 'join'].includes(ghMatch[1].toLowerCase())) {
    signals.github = `https://github.com/${ghMatch[1]}`;
  }
  
  // Twitter/X
  const twMatch = html.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
  if (twMatch && !['share', 'intent', 'home', 'login', 'signup'].includes(twMatch[1].toLowerCase())) {
    signals.twitter = twMatch[1];
  }
  
  // Tech stack signals from meta/scripts
  const techSignals = [];
  if (lower.includes('react') || lower.includes('next.js') || lower.includes('nextjs')) techSignals.push('React');
  if (lower.includes('vue') || lower.includes('nuxt')) techSignals.push('Vue');
  if (lower.includes('angular')) techSignals.push('Angular');
  if (lower.includes('stripe')) techSignals.push('Stripe');
  if (lower.includes('intercom')) techSignals.push('Intercom');
  if (lower.includes('hubspot')) techSignals.push('HubSpot');
  if (lower.includes('segment')) techSignals.push('Segment');
  if (lower.includes('mixpanel')) techSignals.push('Mixpanel');
  if (lower.includes('amplitude')) techSignals.push('Amplitude');
  if (lower.includes('sentry')) techSignals.push('Sentry');
  if (lower.includes('datadog')) techSignals.push('Datadog');
  if (lower.includes('aws') || lower.includes('amazon web services')) techSignals.push('AWS');
  if (lower.includes('google cloud') || lower.includes('gcp')) techSignals.push('GCP');
  if (lower.includes('azure')) techSignals.push('Azure');
  if (lower.includes('kubernetes') || lower.includes('k8s')) techSignals.push('K8s');
  if (lower.includes('docker')) techSignals.push('Docker');
  if (lower.includes('tensorflow') || lower.includes('pytorch') || lower.includes('openai')) techSignals.push('AI/ML');
  if (techSignals.length > 0) signals.tech_stack = techSignals;
  
  // Team size hints
  const teamMatch = lower.match(/(\d+)\+?\s*(?:team members|employees|people|engineers)/);
  if (teamMatch) {
    signals.team_size_hint = parseInt(teamMatch[1]);
  }
  
  // Funding mentions
  const fundingPatterns = [/raised\s*\$[\d.]+[mkb]/i, /series\s*[a-f]/i, /seed\s*(?:round|funding)/i, /\$[\d.]+[mkb]\s*(?:funding|round|raise)/i];
  const fundingHits = fundingPatterns.filter(p => p.test(html));
  if (fundingHits.length > 0) {
    signals.has_funding_mention = true;
  }
  
  // Blog/content signals
  if (lower.includes('/blog') || lower.includes('blog.')) signals.has_blog = true;
  
  // Pricing page = real product
  if (lower.includes('/pricing') || lower.includes('pricing')) signals.has_pricing = true;
  
  return signals;
}

async function scrapeBatch(batch) {
  const results = [];
  for (const row of batch) {
    if (checkpoint.results[row.domain]) continue;
    
    const url = `https://${row.domain}`;
    const html = await fetchWithTimeout(url, TIMEOUT_MS);
    const signals = extractSignals(html, row.domain);
    signals.scraped = true;
    signals.has_content = !!html;
    
    checkpoint.results[row.domain] = signals;
    results.push({ domain: row.domain, ...signals });
    
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  return results;
}

async function run() {
  const startIdx = checkpoint.processed;
  const remaining = rows.slice(startIdx);
  console.log(`Starting from index ${startIdx}, ${remaining.length} remaining`);
  
  for (let i = 0; i < remaining.length; i++) {
    const row = remaining[i];
    if (checkpoint.results[row.domain]) {
      checkpoint.processed = startIdx + i + 1;
      continue;
    }
    
    const url = `https://${row.domain}`;
    const html = await fetchWithTimeout(url, TIMEOUT_MS);
    const signals = extractSignals(html, row.domain);
    signals.scraped = true;
    signals.has_content = !!html;
    checkpoint.results[row.domain] = signals;
    checkpoint.processed = startIdx + i + 1;
    
    if ((startIdx + i + 1) % 500 === 0) {
      writeFileSync(CHECKPOINT, JSON.stringify({ processed: checkpoint.processed, results: checkpoint.results }));
      
      const total = Object.keys(checkpoint.results).length;
      const hiring = Object.values(checkpoint.results).filter(r => r.hiring).length;
      const github = Object.values(checkpoint.results).filter(r => r.github).length;
      const funding = Object.values(checkpoint.results).filter(r => r.has_funding_mention).length;
      const tech = Object.values(checkpoint.results).filter(r => r.tech_stack?.length > 0).length;
      console.log(`${checkpoint.processed}/${rows.length} | hiring:${hiring} github:${github} funding:${funding} tech:${tech}`);
    }
    
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  // Final save
  writeFileSync(CHECKPOINT, JSON.stringify({ processed: checkpoint.processed, results: checkpoint.results }));
  writeFileSync(OUTPUT, JSON.stringify(checkpoint.results, null, 2));
  
  const total = Object.keys(checkpoint.results).length;
  const hiring = Object.values(checkpoint.results).filter(r => r.hiring).length;
  const github = Object.values(checkpoint.results).filter(r => r.github).length;
  const funding = Object.values(checkpoint.results).filter(r => r.has_funding_mention).length;
  const tech = Object.values(checkpoint.results).filter(r => r.tech_stack?.length > 0).length;
  const pricing = Object.values(checkpoint.results).filter(r => r.has_pricing).length;
  const blog = Object.values(checkpoint.results).filter(r => r.has_blog).length;
  
  console.log(`\n=== DONE ===`);
  console.log(`Scraped: ${total}`);
  console.log(`Hiring signals: ${hiring}`);
  console.log(`GitHub links: ${github}`);
  console.log(`Funding mentions: ${funding}`);
  console.log(`Tech stack detected: ${tech}`);
  console.log(`Has pricing page: ${pricing}`);
  console.log(`Has blog: ${blog}`);
}

run().catch(e => console.error('Fatal:', e));
