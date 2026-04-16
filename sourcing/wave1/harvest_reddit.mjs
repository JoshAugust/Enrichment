import { readFileSync, appendFileSync } from 'fs';

const existingPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existing = new Set(readFileSync(existingPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));

// Also load already-harvested HN domains
const hnPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/social_domains.jsonl';
const hnDomains = new Set();
for (const line of readFileSync(hnPath, 'utf8').split('\n').filter(Boolean)) {
  try { hnDomains.add(JSON.parse(line).domain); } catch {}
}

const skipDomains = new Set([
  'github.com','gitlab.com','vercel.com','netlify.com','heroku.com','railway.app',
  'youtube.com','twitter.com','x.com','reddit.com','medium.com','substack.com',
  'google.com','amazon.com','microsoft.com','apple.com','facebook.com','instagram.com',
  'linkedin.com','wikipedia.org','wordpress.com','blogspot.com','notion.so',
  'producthunt.com','news.ycombinator.com','ycombinator.com','techcrunch.com',
  'stripe.com','aws.amazon.com','npmjs.com','pypi.org','stackoverflow.com',
  'imgur.com','i.redd.it','v.redd.it','preview.redd.it','old.reddit.com',
  'docs.google.com','drive.google.com','firebase.google.com','figma.com',
  'dropbox.com','slack.com','discord.com','zoom.us','twitch.tv',
  'docker.com','hub.docker.com','fnlondon.com','redd.it',
  'indiehackers.com','buildamicrosaas.com','redditagency.com',
  'itnext.io','saastitute.com','lovable.dev','mclauchlan.substack.com',
  'microsaasidea.com','databutton.com','thehiveindex.com',
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
  for (const s of skipDomains) { if (domain.endsWith('.' + s)) return true; }
  if (domain.length < 4 || !domain.includes('.')) return true;
  return false;
}

const seen = new Set();
const results = [];

function addDomain(domain, name, source, metadata) {
  if (!domain || isSkip(domain) || existing.has(domain) || hnDomains.has(domain) || seen.has(domain)) return;
  seen.add(domain);
  results.push({ domain, name: name || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1), source, category: 'saas', metadata });
}

// Reddit JSON API queries
const redditQueries = [
  { sub: 'SaaS', q: 'launched+my', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'just+shipped', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'built+this', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'feedback+on+my', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'show+my+product', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'check+out+my', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'roast+my', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'need+feedback', sort: 'new', t: 'year' },
  { sub: 'microsaas', q: 'launched', sort: 'new', t: 'year' },
  { sub: 'microsaas', q: 'built+my', sort: 'new', t: 'year' },
  { sub: 'microsaas', q: 'feedback', sort: 'new', t: 'year' },
  { sub: 'microsaas', q: 'check+out', sort: 'new', t: 'year' },
  { sub: 'micro_saas', q: 'launched', sort: 'new', t: 'year' },
  { sub: 'micro_saas', q: 'built', sort: 'new', t: 'year' },
  { sub: 'startups', q: 'launched+my+saas', sort: 'new', t: 'year' },
  { sub: 'startups', q: 'just+launched', sort: 'new', t: 'year' },
  { sub: 'Entrepreneur', q: 'launched+my+saas', sort: 'new', t: 'year' },
  { sub: 'Entrepreneur', q: 'built+a+tool', sort: 'new', t: 'year' },
  { sub: 'SideProject', q: 'launched', sort: 'new', t: 'year' },
  { sub: 'SideProject', q: 'built+this', sort: 'new', t: 'year' },
  { sub: 'webdev', q: 'built+a+saas', sort: 'new', t: 'year' },
  { sub: 'webdev', q: 'launched+my+app', sort: 'new', t: 'year' },
  { sub: 'reactjs', q: 'launched+my', sort: 'new', t: 'year' },
  { sub: 'django', q: 'launched+my', sort: 'new', t: 'year' },
  { sub: 'indiehackers', q: 'launched', sort: 'new', t: 'year' },
  { sub: 'buildinpublic', q: 'launched', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'MRR', sort: 'top', t: 'year' },
  { sub: 'SaaS', q: 'revenue', sort: 'top', t: 'year' },
  { sub: 'microsaas', q: 'MRR', sort: 'top', t: 'year' },
  { sub: 'EntrepreneurRideAlong', q: 'launched', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'roast+my+landing', sort: 'new', t: 'year' },
  { sub: 'SaaS', q: 'trying+to+get+users', sort: 'new', t: 'year' },
];

// URL extraction regex
const urlRegex = /https?:\/\/[^\s\)\],"<>]+/gi;

function extractDomainsFromText(text, source, postTitle) {
  if (!text) return;
  const matches = text.match(urlRegex) || [];
  for (const url of matches) {
    const domain = cleanDomain(url);
    addDomain(domain, null, source, { post_title: postTitle, url_found: url.slice(0, 200) });
  }
}

async function fetchReddit(sub, q, sort, t) {
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${q}&sort=${sort}&limit=100&t=${t}&restrict_sr=on`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' } });
    if (res.status === 429) { await new Promise(r => setTimeout(r, 5000)); return []; }
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.children || [];
  } catch (e) { console.error(`Reddit error ${sub}/${q}: ${e.message}`); return []; }
}

let queryCount = 0;
for (const { sub, q, sort, t } of redditQueries) {
  const posts = await fetchReddit(sub, q, sort, t);
  for (const post of posts) {
    const d = post?.data;
    if (!d) continue;
    const title = d.title || '';
    const selftext = d.selftext || '';
    const source = `reddit_${sub.toLowerCase()}`;
    
    // Extract URLs from selftext
    extractDomainsFromText(selftext, source, title);
    
    // Check if post links to external URL
    if (d.url && !d.is_self && !d.url.includes('reddit.com') && !d.url.includes('redd.it')) {
      const domain = cleanDomain(d.url);
      addDomain(domain, null, source, { post_title: title });
    }
  }
  queryCount++;
  if (queryCount % 4 === 0) {
    await new Promise(r => setTimeout(r, 2000)); // Rate limit
    process.stderr.write(`Reddit: ${queryCount}/${redditQueries.length} queries, ${results.length} domains\n`);
  }
}

// Also add domains we found in web_search citations
const citationDomains = [
  { domain: 'sleek.design', name: 'Sleek', source: 'indiehackers', metadata: { note: 'AI design tool, $10K MRR' } },
  { domain: 'ranklly.com', name: 'Ranklly', source: 'reddit_saas', metadata: { note: 'SEO content tool' } },
  { domain: 'requiems.xyz', name: 'Requiems API', source: 'reddit_saas', metadata: { note: 'Multi-endpoint API platform' } },
  { domain: 'rankinpublic.xyz', name: 'RankInPublic', source: 'reddit_saas', metadata: { note: 'SEO tool' } },
  { domain: 'heliocentrium.com', name: 'Heliocentrium', source: 'reddit_saas', metadata: { note: 'Solar software' } },
];
for (const c of citationDomains) {
  addDomain(c.domain, c.name, c.source, c.metadata);
}

// Write appended results
if (results.length > 0) {
  const lines = results.map(r => JSON.stringify(r)).join('\n') + '\n';
  appendFileSync(hnPath, lines);
}

console.log(`Reddit harvest: ${results.length} new domains appended`);
console.log(`Total queries: ${queryCount}`);
