import { readFileSync, writeFileSync, appendFileSync } from 'fs';

// Load existing domains for dedup
const existingPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existing = new Set(readFileSync(existingPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));
console.log(`Loaded ${existing.size} existing domains for dedup`);

// Domains to skip (big/infra/framework sites)
const skipDomains = new Set([
  'github.com','gitlab.com','vercel.com','netlify.com','heroku.com','railway.app',
  'youtube.com','twitter.com','x.com','reddit.com','medium.com','substack.com',
  'google.com','amazon.com','microsoft.com','apple.com','facebook.com','instagram.com',
  'linkedin.com','wikipedia.org','wordpress.com','blogspot.com','notion.so',
  'producthunt.com','news.ycombinator.com','ycombinator.com','techcrunch.com',
  'stripe.com','aws.amazon.com','npmjs.com','pypi.org','stackoverflow.com',
  'docs.google.com','drive.google.com','firebase.google.com','figma.com',
  'dropbox.com','slack.com','discord.com','zoom.us','twitch.tv',
  'docker.com','hub.docker.com','k8s.io','kubernetes.io',
]);

function cleanDomain(url) {
  if (!url) return null;
  try {
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    const parsed = new URL(u);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch { return null; }
}

function isSkip(domain) {
  if (!domain) return true;
  if (skipDomains.has(domain)) return true;
  // Skip subdomains of skip domains
  for (const s of skipDomains) {
    if (domain.endsWith('.' + s)) return true;
  }
  // Skip generic TLDs only domains, or too short
  if (domain.length < 4) return true;
  if (!domain.includes('.')) return true;
  return false;
}

// HN Algolia queries to run
const queries = [
  'launched+saas', 'my+startup', 'saas+product', 'built+this',
  'micro+saas', 'side+project+launched', 'bootstrapped', 'just+shipped',
  'open+source+saas', 'ai+tool', 'developer+tool', 'workflow+automation',
  'no+code+tool', 'api+service', 'analytics+platform', 'monitoring+tool',
  'email+tool', 'crm+built', 'project+management', 'invoice+tool',
  'scheduling+tool', 'feedback+tool', 'survey+tool', 'form+builder',
  'landing+page+builder', 'seo+tool', 'social+media+tool', 'content+tool',
  'ai+writing', 'code+review+tool', 'database+tool', 'search+engine',
  'chat+tool', 'video+tool', 'screenshot+tool', 'pdf+tool',
  'auth+service', 'payment+tool', 'subscription+management',
  'hiring+tool', 'resume+tool', 'productivity+app', 'note+taking',
  'time+tracking', 'accounting+software', 'inventory+management',
  'ecommerce+tool', 'marketplace+built', 'saas+boilerplate',
  'startup+toolkit', 'browser+extension', 'cli+tool+built',
  'devops+tool', 'testing+tool', 'deployment+tool', 'hosting+service',
];

const seen = new Set();
const results = [];

async function fetchHN(query, page = 0) {
  const tags = query.includes('show_hn') ? '' : '&tags=show_hn';
  const url = `https://hn.algolia.com/api/v1/search?query=${query}${tags}&hitsPerPage=50&page=${page}`;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`HTTP ${res.status} for ${query} page ${page}`); return []; }
    const data = await res.json();
    return data.hits || [];
  } catch (e) { console.error(`Error fetching ${query}: ${e.message}`); return []; }
}

// Also fetch search_by_date for recency
async function fetchHNRecent(query) {
  const url = `https://hn.algolia.com/api/v1/search_by_date?query=${query}&tags=show_hn&hitsPerPage=50`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.hits || [];
  } catch { return []; }
}

function processHits(hits, source) {
  for (const hit of hits) {
    const domain = cleanDomain(hit.url);
    if (!domain || isSkip(domain) || existing.has(domain) || seen.has(domain)) continue;
    seen.add(domain);
    
    // Try to extract a name from domain or title
    let name = domain.split('.')[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    results.push({
      domain,
      name,
      source: 'hackernews_show',
      category: 'saas',
      metadata: {
        post_title: hit.title || '',
        hn_points: hit.points || 0,
        hn_id: hit.objectID || '',
        created: hit.created_at || '',
        query_source: source,
      }
    });
  }
}

// Run all queries with rate limiting
let queryCount = 0;
for (const q of queries) {
  // Fetch page 0 and 1 for relevance, plus recent
  const [hits0, hits1, recent] = await Promise.all([
    fetchHN(q, 0),
    fetchHN(q, 1),
    fetchHNRecent(q),
  ]);
  processHits(hits0, q);
  processHits(hits1, q);
  processHits(recent, q + '_recent');
  queryCount++;
  
  // Small delay every 5 queries to be nice
  if (queryCount % 5 === 0) {
    await new Promise(r => setTimeout(r, 500));
    process.stderr.write(`Progress: ${queryCount}/${queries.length} queries, ${results.length} unique domains\n`);
  }
}

// Also fetch broader "story" tagged posts (not just show_hn)
const broadQueries = ['launched+my+saas', 'built+a+saas', 'shipping+my+product', 'indie+hacker+launched'];
for (const q of broadQueries) {
  const url = `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=50`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      processHits(data.hits || [], q + '_story');
    }
  } catch {}
}

// Write output
const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/social_domains.jsonl';
const lines = results.map(r => JSON.stringify(r)).join('\n');
writeFileSync(outPath, lines + '\n');

console.log(`\nDONE: ${results.length} unique new domains written to social_domains.jsonl`);
console.log(`Queries run: ${queryCount + broadQueries.length}`);
