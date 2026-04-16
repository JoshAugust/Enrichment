import { readFileSync, appendFileSync } from 'fs';

const dedupPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existingDomains = new Set(readFileSync(dedupPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));

// Load existing output domains
const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/g2_domains.jsonl';
const existingOutput = new Set();
try {
  for (const line of readFileSync(outPath, 'utf8').split('\n').filter(Boolean)) {
    existingOutput.add(JSON.parse(line).domain);
  }
} catch {}

const skipDomains = new Set([
  'salesforce.com', 'oracle.com', 'sap.com', 'microsoft.com', 'google.com',
  'amazon.com', 'ibm.com', 'adobe.com', 'github.com', 'gitlab.com',
  'apache.org', 'python.org', 'nodejs.org', 'w3.org', 'wikipedia.org',
  'youtube.com', 'twitter.com', 'reddit.com', 'linkedin.com', 'facebook.com',
  'medium.com', 'npmjs.com', 'pypi.org', 'docker.com', 'kubernetes.io',
  'aws.amazon.com', 'cloud.google.com', 'img.shields.io', 'cdn.rawgit.com',
  'rawgit.com', 'shields.io', 'badgen.net', 'creativecommons.org',
]);

function addDomain(domain, name, category, source) {
  const d = domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
  if (!d || d.length < 4 || !d.includes('.')) return null;
  if (skipDomains.has(d)) return null;
  if (existingDomains.has(d)) return null;
  if (existingOutput.has(d)) return null;
  return { domain: d, name, category, source };
}

// Fetch and parse GitHub awesome lists
const urls = [
  'https://raw.githubusercontent.com/RunaCapital/awesome-oss-alternatives/master/README.md',
  'https://raw.githubusercontent.com/ripienaar/free-for-dev/main/README.md',
  'https://raw.githubusercontent.com/GetStream/awesome-saas-services/master/README.md',
  'https://raw.githubusercontent.com/LlamaGenAI/awesome-free-saas/main/README.md',
  'https://raw.githubusercontent.com/mahseema/awesome-saas-directories/main/README.md',
];

let newDomains = 0;
let output = '';

for (const url of urls) {
  try {
    console.log(`Fetching ${url.split('/')[4]}/${url.split('/')[5]}...`);
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) { console.log(`  Failed: ${resp.status}`); continue; }
    const text = await resp.text();
    
    // Extract all URLs from markdown links
    const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      try {
        const parsed = new URL(linkUrl);
        let domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
        
        // Skip github links, image badges, etc.
        if (domain.includes('github.') || domain.includes('gitlab.') ||
            domain.includes('shields.io') || domain.includes('rawgit') ||
            domain.includes('badge') || domain.includes('img.') ||
            domain.includes('about.gitlab') || domain.includes('creativecommons.'))
          continue;
        
        const name = linkText.trim() || domain.split('.')[0];
        const result = addDomain(domain, name, 'github-list', url.split('/')[5]);
        if (result) {
          output += JSON.stringify({
            domain: result.domain,
            name: result.name,
            source: 'github-awesome-list',
            category: result.category,
            metadata: { github_list: url.split('/').slice(3, 6).join('/') }
          }) + '\n';
          existingOutput.add(result.domain);
          newDomains++;
        }
      } catch {}
    }
    
    // Also extract bare URLs
    const bareUrlRegex = /(?:^|\s)(https?:\/\/(?:www\.)?([a-z0-9][-a-z0-9]+\.[a-z.]+[a-z])(?:\/[^\s)]*)?)/gm;
    while ((match = bareUrlRegex.exec(text)) !== null) {
      try {
        const parsed = new URL(match[1]);
        let domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
        if (domain.includes('github.') || domain.includes('gitlab.') || domain.includes('shields.io')) continue;
        const result = addDomain(domain, domain.split('.')[0], 'github-list', url.split('/')[5]);
        if (result) {
          output += JSON.stringify({
            domain: result.domain,
            name: result.name,
            source: 'github-awesome-list',
            category: result.category,
            metadata: { github_list: url.split('/').slice(3, 6).join('/') }
          }) + '\n';
          existingOutput.add(result.domain);
          newDomains++;
        }
      } catch {}
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
}

if (output) {
  appendFileSync(outPath, output);
}
console.log(`\nAdded ${newDomains} new domains from GitHub lists`);
console.log(`Total in output file: ${existingOutput.size}`);
