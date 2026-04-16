import { readFileSync, appendFileSync } from 'fs';

const existingPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existing = new Set(readFileSync(existingPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));

const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/social_domains.jsonl';
const alreadyHarvested = new Set();
for (const line of readFileSync(outPath, 'utf8').split('\n').filter(Boolean)) {
  try { alreadyHarvested.add(JSON.parse(line).domain); } catch {}
}

const skipDomains = new Set([
  'github.com','gitlab.com','vercel.com','netlify.com','heroku.com','railway.app',
  'youtube.com','twitter.com','x.com','reddit.com','medium.com','substack.com',
  'google.com','amazon.com','microsoft.com','apple.com','facebook.com','instagram.com',
  'linkedin.com','wikipedia.org','wordpress.com','blogspot.com','notion.so',
  'producthunt.com','news.ycombinator.com','ycombinator.com','techcrunch.com',
  'stripe.com','npmjs.com','pypi.org','stackoverflow.com',
  'imgur.com','i.redd.it','v.redd.it','redd.it',
  'docs.google.com','drive.google.com','figma.com',
  'dropbox.com','slack.com','discord.com','zoom.us','twitch.tv',
  'docker.com','w3.org','mozilla.org','developer.mozilla.org',
  'play.google.com','apps.apple.com','chrome.google.com',
  'web.archive.org','archive.org','creativecommons.org',
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

function add(domain, name, source, metadata) {
  if (!domain || isSkip(domain) || existing.has(domain) || alreadyHarvested.has(domain) || seen.has(domain)) return;
  seen.add(domain);
  results.push({ domain, name: name || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1), source, category: 'saas', metadata: metadata || {} });
}

// HN Algolia - deeper pages and more queries
const hnQueries = [
  // Pages 2-5 of popular queries
  ...['launched+saas','my+startup','built+this','side+project','developer+tool','ai+tool'].flatMap(q => 
    [2,3,4,5].map(p => ({ query: q, page: p, tags: 'show_hn' }))
  ),
  // "Ask HN" and "story" tags with startup/saas terms
  ...['saas','startup+launched','my+product','built+a+tool','shipping+today'].map(q => 
    ({ query: q, page: 0, tags: 'story' })
  ),
  ...['saas','startup+launched','my+product','built+a+tool'].map(q => 
    ({ query: q, page: 1, tags: 'story' })
  ),
  // More specific product categories
  ...['crm','erp','hr+software','payroll+software','project+management+tool',
     'invoicing','scheduling+software','booking+system','helpdesk','ticketing+system',
     'email+marketing','newsletter+tool','cms+built','headless+cms',
     'design+tool','prototyping+tool','wireframe','mockup+tool',
     'data+visualization','dashboard+tool','reporting+tool',
     'workflow+automation','zapier+alternative','no+code+platform',
     'low+code','internal+tool','admin+panel','backend+as+a+service',
     'auth+provider','identity+management','sso+tool',
     'uptime+monitoring','error+tracking','logging+tool','observability',
     'cdn+service','hosting+platform','serverless+platform',
     'ci+cd+tool','deployment+platform','feature+flag',
     'a+b+testing','analytics+tool','product+analytics',
     'customer+feedback','nps+tool','survey+platform',
     'knowledge+base','documentation+tool','wiki+tool',
     'screen+recording','video+editing+tool','transcription',
     'meeting+scheduler','calendar+tool','time+zone',
     'password+manager','vpn+service','security+tool',
     'backup+service','file+sharing','cloud+storage',
     'ai+chatbot','ai+assistant','copilot+tool',
     'image+generation','text+to+speech','speech+to+text',
     'translation+tool','localization','i18n+tool',
     'payment+processing','billing+tool','subscription+billing',
     'tax+software','compliance+tool','legal+tech',
     'real+estate+software','property+management',
     'restaurant+software','pos+system','inventory',
     'fitness+app','health+tech','telemedicine',
     'edtech','learning+platform','course+platform',
     'recruiting+tool','applicant+tracking','job+board',
  ].map(q => ({ query: q, page: 0, tags: 'show_hn' })),
];

let count = 0;
for (const { query, page, tags } of hnQueries) {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=${tags}&hitsPerPage=50&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    for (const hit of (data.hits || [])) {
      const domain = cleanDomain(hit.url);
      add(domain, null, 'hackernews_show', { post_title: hit.title, hn_id: hit.objectID, created: hit.created_at, query_source: query });
    }
  } catch {}
  count++;
  if (count % 10 === 0) {
    await new Promise(r => setTimeout(r, 300));
    process.stderr.write(`HN extra: ${count}/${hnQueries.length} queries, ${results.length} new domains\n`);
  }
}

// Also try HN search_by_date for more recent results
const recentQueries = ['saas','startup','launched','product','tool','app','platform','service','software'];
for (const q of recentQueries) {
  try {
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${q}&tags=show_hn&hitsPerPage=50&page=0`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      for (const hit of (data.hits || [])) {
        const domain = cleanDomain(hit.url);
        add(domain, null, 'hackernews_recent', { post_title: hit.title, hn_id: hit.objectID, created: hit.created_at });
      }
    }
  } catch {}
}

if (results.length > 0) {
  appendFileSync(outPath, results.map(r => JSON.stringify(r)).join('\n') + '\n');
}

console.log(`Extra harvest: ${results.length} new domains appended`);
console.log(`Total file lines now: check with wc -l`);
