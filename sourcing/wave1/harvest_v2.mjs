import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const dedupPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existingDomains = new Set(readFileSync(dedupPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));
console.log(`Loaded ${existingDomains.size} existing domains for dedup`);

const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/g2_domains.jsonl';
const progressPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/logs/g2_progress.md';

const skipDomains = new Set([
  'salesforce.com', 'oracle.com', 'sap.com', 'microsoft.com', 'google.com',
  'amazon.com', 'ibm.com', 'adobe.com', 'workday.com', 'servicenow.com',
  'atlassian.com', 'apple.com', 'meta.com', 'facebook.com', 'saashub.com',
  'appwiki.nl', 'github.com', 'wikipedia.org',
]);

const allDomains = new Map();
let categoriesDone = 0;

// Better approach: fetch SaaSHub alternatives pages which have actual website links
// The format is: href="https://actualwebsite.com?utm_source=saashub..."

const categories = [
  'project-management', 'task-management', 'time-tracking', 'collaboration',
  'team-communication', 'note-taking', 'document-management', 'knowledge-management',
  'workflow-automation', 'productivity', 'scheduling', 'meeting',
  'crm', 'sales', 'lead-generation', 'sales-engagement', 'proposal',
  'contract-management', 'invoicing', 'billing', 'subscription-management',
  'email-marketing', 'marketing-automation', 'social-media-management',
  'seo', 'content-marketing', 'landing-page', 'survey', 'form-builder',
  'push-notification', 'affiliate-marketing',
  'customer-support', 'live-chat', 'help-desk', 'knowledge-base',
  'customer-feedback', 'customer-success', 'chatbot',
  'hr', 'recruiting', 'applicant-tracking', 'employee-engagement',
  'payroll', 'performance-management', 'onboarding',
  'developer-tools', 'api-management', 'ci-cd', 'monitoring',
  'error-tracking', 'code-review', 'testing', 'deployment',
  'log-management', 'feature-flags',
  'analytics', 'business-intelligence', 'data-visualization',
  'ab-testing', 'session-recording', 'heatmap', 'product-analytics',
  'graphic-design', 'prototyping', 'video-editing', 'screen-recording',
  'video-conferencing', 'webinar', 'voip',
  'accounting', 'expense-management', 'budgeting',
  'payment-processing',
  'password-manager', 'vpn', 'backup',
  'e-commerce', 'inventory-management',
  'lms', 'online-course',
  'appointment-scheduling', 'digital-asset-management', 'data-integration',
  'customer-data-platform', 'product-management',
  'roadmap', 'feedback-management',
  'website-builder', 'cms', 'headless-cms',
  'no-code', 'low-code', 'automation', 'integration-platform',
  'web-scraping', 'competitive-intelligence',
  'conversational-ai', 'ai-writing',
  'transcription', 'translation',
  'event-management', 'loyalty-program', 'review-management',
  'status-page', 'incident-management', 'uptime-monitoring',
  'load-testing', 'vulnerability-scanning',
  'cloud-storage', 'file-sharing', 'remote-desktop',
  'whiteboard', 'okr', 'employee-recognition',
  'warehouse-management', 'procurement',
  'podcast-hosting', 'video-hosting',
];

// Phase 1: Crawl SaaSHub alternatives pages for top products per category
// These pages list 30+ alternatives with actual website links
const alternativesSlugs = [
  // Project Management
  'asana', 'trello', 'notion', 'clickup', 'monday', 'basecamp', 'wrike', 'jira',
  'linear', 'height', 'shortcut', 'plane-so', 'hive', 'teamwork', 'nifty-pm',
  // CRM
  'pipedrive', 'hubspot', 'freshsales-crm', 'zoho-crm', 'close', 'copper',
  'folk', 'attio', 'capsule-crm', 'less-annoying-crm', 'nutshell',
  // Support
  'zendesk', 'freshdesk', 'intercom', 'helpscout', 'crisp-chat', 'tidio',
  'livechat', 'olark', 'chatwoot', 'papercups', 'tawk-to',
  // Marketing
  'mailchimp', 'activecampaign', 'convertkit', 'drip', 'sendinblue', 'brevo',
  'mailerlite', 'getresponse', 'omnisend', 'klaviyo', 'customer-io',
  'sendpulse', 'moosend', 'emailoctopus', 'buttondown', 'substack',
  // Social Media
  'hootsuite', 'buffer', 'sprout-social', 'later', 'loomly', 'planable',
  'socialbee', 'publer', 'postiz',
  // Analytics
  'mixpanel', 'hotjar', 'amplitude', 'plausible-io', 'matomo', 'posthog',
  'heap', 'pendo', 'fullstory', 'logrocket', 'mouseflow',
  'fathom-analytics', 'simple-analytics', 'umami',
  // HR
  'bamboohr', 'gusto', 'rippling', 'deel', 'remote', 'oyster-hr',
  'personio', 'bob', 'lattice', 'culture-amp', '15five',
  // Dev Tools
  'vercel', 'netlify', 'heroku', 'render', 'railway', 'fly-io',
  'supabase', 'planetscale', 'neon', 'upstash',
  'sentry', 'datadog', 'new-relic', 'grafana', 'prometheus',
  'pagerduty', 'opsgenie', 'betterstack', 'statuspage', 'instatus',
  // Automation
  'zapier', 'make', 'n8n', 'pipedream', 'tray-io', 'workato',
  // No-code/Low-code
  'retool', 'appsmith', 'budibase', 'tooljet', 'nocodb', 'baserow',
  'airtable', 'coda', 'fibery', 'clickup-docs',
  // Forms
  'typeform', 'jotform', 'tally', 'formbricks', 'heyform',
  // Design
  'figma', 'canva', 'penpot', 'framer', 'webflow',
  // Communication
  'slack', 'discord', 'element', 'rocket-chat', 'mattermost', 'zulip',
  'zoom', 'google-meet', 'whereby', 'around', 'loom', 'screen-studio',
  // Payments
  'stripe', 'paddle', 'lemonsqueezy', 'gumroad', 'chargebee', 'recurly',
  // E-commerce
  'shopify', 'woocommerce', 'medusa', 'saleor', 'vendure',
  // Docs/Knowledge
  'confluence', 'gitbook', 'readme', 'mintlify', 'docusaurus',
  // Sales engagement
  'outreach', 'salesloft', 'apollo', 'instantly', 'lemlist', 'woodpecker',
  'reply-io', 'smartlead',
  // Product management  
  'productboard', 'aha', 'uservoice', 'canny', 'nolt',
  // Onboarding
  'appcues', 'userpilot', 'chameleon', 'userguiding', 'whatfix',
  // Data tools
  'fivetran', 'airbyte', 'stitch', 'segment', 'rudderstack',
  'metabase', 'preset', 'evidence', 'lightdash',
  'dbt', 'dagster', 'prefect', 'airflow',
  // Scheduling
  'calendly', 'cal-com', 'savvycal', 'reclaim', 'clockwise',
  // File/Cloud
  'dropbox', 'box', 'nextcloud', 'owncloud',
];

async function fetchPage(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

function extractDomainsFromHTML(html, category) {
  const results = [];
  
  // Extract direct website links (not saashub/appwiki tracking)
  // Pattern: links to actual product websites
  const linkRegex = /href="(https?:\/\/(?!(?:www\.)?(?:saashub\.com|appwiki\.nl|reddit\.com|twitter\.com|x\.com|youtube\.com|facebook\.com|linkedin\.com|github\.com|producthunt\.com))[^"]*?)"/gi;
  let match;
  const seen = new Set();
  
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1]);
      let domain = url.hostname.replace(/^www\./, '').toLowerCase();
      
      // Skip common non-product domains
      if (domain.includes('saashub') || domain.includes('appwiki') || 
          domain.includes('google.') || domain.includes('amazon.') ||
          domain.includes('similarweb') || domain.includes('ahrefs') ||
          domain.includes('moz.com') || domain.includes('reddit.') ||
          domain.includes('cloudflare') || domain.includes('jsdelivr') ||
          domain.includes('wp.com') || domain.includes('gravatar') ||
          domain.includes('schema.org') || domain.includes('w3.org') ||
          domain.endsWith('.gov') || domain.endsWith('.edu') ||
          domain.includes('twitter.') || domain.includes('x.com') ||
          domain.includes('facebook.') || domain.includes('instagram.') ||
          domain.includes('linkedin.') || domain.includes('youtube.') ||
          domain.includes('producthunt.') || domain.includes('trustpilot.') ||
          domain.includes('crunchbase.') || domain.includes('techcrunch.') ||
          domain.includes('medium.com') || domain.includes('substack.com') ||
          domain.includes('wordpress.org') || domain.includes('github.') ||
          domain.includes('gitlab.com') || domain.includes('ycombinator.'))
        continue;
      
      if (seen.has(domain)) continue;
      seen.add(domain);
      
      // Try to extract product name from nearby HTML context
      const pos = match.index;
      const context = html.substring(Math.max(0, pos - 500), pos + 200);
      
      // Look for product name in title or alt attributes
      const nameMatch = context.match(/(?:title|alt|aria-label)="([^"]{2,60})"/i) ||
                        context.match(/>([A-Z][a-zA-Z0-9\s.]{1,40})<\/(?:h[1-6]|a|span|strong)/);
      const name = nameMatch ? nameMatch[1].trim() : domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      results.push({ domain, name, category });
    } catch {}
  }
  
  // Also extract from slug-based product links: /productname-alternatives or /productname
  const slugRegex = /href="\/([a-z][a-z0-9-]{1,50})-alternatives"/g;
  while ((match = slugRegex.exec(html)) !== null) {
    const slug = match[1];
    // Skip blog-style slugs
    if (slug.startsWith('post-') || slug.startsWith('best-') || 
        slug.includes('2024') || slug.includes('2025') || slug.includes('2026') ||
        slug.length > 30) continue;
    
    results.push({ 
      domain: null,  // Will need resolution
      slug,
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      category 
    });
  }
  
  return results;
}

// Known slug-to-domain mappings (expanded)
const slugMap = {};
const knownMappings = `
asana:asana.com trello:trello.com notion:notion.so clickup:clickup.com monday:monday.com
basecamp:basecamp.com wrike:wrike.com jira:atlassian.com linear:linear.app
height:height.app shortcut:shortcut.com plane-so:plane.so hive:hive.com teamwork:teamwork.com
nifty-pm:nifty.pm pipedrive:pipedrive.com hubspot:hubspot.com freshsales-crm:freshsales.com
zoho-crm:zoho.com close:close.com copper:copper.com folk:folk.app attio:attio.com
capsule-crm:capsulecrm.com less-annoying-crm:lessannoyingcrm.com nutshell:nutshell.com
zendesk:zendesk.com freshdesk:freshdesk.com intercom:intercom.com helpscout:helpscout.com
crisp-chat:crisp.chat tidio:tidio.com livechat:livechat.com olark:olark.com
chatwoot:chatwoot.com tawk-to:tawk.to mailchimp:mailchimp.com activecampaign:activecampaign.com
convertkit:convertkit.com drip:drip.com brevo:brevo.com mailerlite:mailerlite.com
getresponse:getresponse.com omnisend:omnisend.com klaviyo:klaviyo.com customer-io:customer.io
sendpulse:sendpulse.com moosend:moosend.com emailoctopus:emailoctopus.com
buttondown:buttondown.email substack:substack.com hootsuite:hootsuite.com buffer:buffer.com
sprout-social:sproutsocial.com later:later.com loomly:loomly.com planable:planable.io
socialbee:socialbee.com publer:publer.io mixpanel:mixpanel.com hotjar:hotjar.com
amplitude:amplitude.com plausible-io:plausible.io matomo:matomo.org posthog:posthog.com
heap:heap.io pendo:pendo.io fullstory:fullstory.com logrocket:logrocket.com
mouseflow:mouseflow.com fathom-analytics:usefathom.com simple-analytics:simpleanalytics.com
umami:umami.is bamboohr:bamboohr.com gusto:gusto.com rippling:rippling.com deel:deel.com
remote:remote.com personio:personio.de lattice:lattice.com culture-amp:cultureamp.com
15five:15five.com vercel:vercel.com netlify:netlify.com heroku:heroku.com render:render.com
railway:railway.app fly-io:fly.io supabase:supabase.com planetscale:planetscale.com
neon:neon.tech upstash:upstash.com sentry:sentry.io datadog:datadoghq.com
new-relic:newrelic.com grafana:grafana.com pagerduty:pagerduty.com opsgenie:opsgenie.com
betterstack:betterstack.com instatus:instatus.com zapier:zapier.com make:make.com
n8n:n8n.io pipedream:pipedream.com tray-io:tray.io retool:retool.com appsmith:appsmith.com
budibase:budibase.com tooljet:tooljet.com nocodb:nocodb.com baserow:baserow.io
airtable:airtable.com coda:coda.io fibery:fibery.io typeform:typeform.com jotform:jotform.com
tally:tally.so figma:figma.com canva:canva.com penpot:penpot.app framer:framer.com
webflow:webflow.com slack:slack.com discord:discord.com element:element.io
rocket-chat:rocket.chat mattermost:mattermost.com zulip:zulip.com zoom:zoom.us
whereby:whereby.com loom:loom.com stripe:stripe.com paddle:paddle.com
lemonsqueezy:lemonsqueezy.com gumroad:gumroad.com chargebee:chargebee.com recurly:recurly.com
shopify:shopify.com medusa:medusajs.com vendure:vendure.io gitbook:gitbook.com
readme:readme.com mintlify:mintlify.com outreach:outreach.io salesloft:salesloft.com
apollo:apollo.io instantly:instantly.ai lemlist:lemlist.com woodpecker:woodpecker.co
reply-io:reply.io productboard:productboard.com aha:aha.io uservoice:uservoice.com
canny:canny.io appcues:appcues.com userpilot:userpilot.com userguiding:userguiding.com
whatfix:whatfix.com fivetran:fivetran.com airbyte:airbyte.com segment:segment.com
rudderstack:rudderstack.com metabase:metabase.com dbt:getdbt.com calendly:calendly.com
cal-com:cal.com savvycal:savvycal.com reclaim:reclaim.ai clockwise:getclockwise.com
dropbox:dropbox.com box:box.com nextcloud:nextcloud.com oyster-hr:oysterhr.com
smartlead:smartlead.ai formbricks:formbricks.com heyform:heyform.net dagster:dagster.io
prefect:prefect.io lightdash:lightdash.com evidence:evidence.dev statuspage:statuspage.io
gong:gong.io nolt:nolt.io chameleon:trychameleon.com screen-studio:screen.studio
workato:workato.com around:around.co saleor:saleor.io docusaurus:docusaurus.io
postiz:postiz.com papercups:papercups.io bob:hibob.com
`.trim();

for (const pair of knownMappings.split(/\s+/)) {
  const [slug, domain] = pair.split(':');
  if (slug && domain) slugMap[slug] = domain;
}

function addDomain(domain, name, category, source) {
  const d = domain.toLowerCase().replace(/^www\./, '');
  if (!d || d.length < 4 || !d.includes('.')) return false;
  if (skipDomains.has(d)) return false;
  if (existingDomains.has(d)) return false;
  if (allDomains.has(d)) return false;
  allDomains.set(d, { name, category, source });
  return true;
}

writeFileSync(progressPath, `# SaaSHub Domain Sourcing Progress\n\nStarted: ${new Date().toISOString()}\nSource: SaaSHub.com alternatives pages\nSlugs to process: ${alternativesSlugs.length}\nCategories to process: ${categories.length}\n\n## Updates\n\n`);

// Phase 1: Crawl alternatives pages (highest yield)
console.log('Phase 1: Crawling alternatives pages...');
const batchSize = 8;
for (let i = 0; i < alternativesSlugs.length; i += batchSize) {
  const batch = alternativesSlugs.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(async slug => {
    const html = await fetchPage(`https://www.saashub.com/${slug}-alternatives`);
    if (!html) return [];
    return extractDomainsFromHTML(html, slug);
  }));
  
  for (const products of results) {
    for (const p of products) {
      if (p.domain) {
        addDomain(p.domain, p.name, p.category, 'saashub-alternatives');
      } else if (p.slug && slugMap[p.slug]) {
        addDomain(slugMap[p.slug], p.name, p.category, 'saashub-alternatives');
      }
      // Skip unresolved slugs - we only want confirmed domains
    }
  }
  
  if ((i / batchSize) % 5 === 0) {
    console.log(`Alternatives: ${Math.min(i + batchSize, alternativesSlugs.length)}/${alternativesSlugs.length} done, ${allDomains.size} new domains`);
  }
  await new Promise(r => setTimeout(r, 200));
}

// Phase 2: Crawl category listing pages
console.log('\nPhase 2: Crawling category pages...');
for (let i = 0; i < categories.length; i += batchSize) {
  const batch = categories.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(async cat => {
    // Try both URL patterns
    let html = await fetchPage(`https://www.saashub.com/best-${cat}-software`);
    if (!html) html = await fetchPage(`https://www.saashub.com/best-${cat}`);
    if (!html) return [];
    return extractDomainsFromHTML(html, cat);
  }));
  
  for (const products of results) {
    for (const p of products) {
      if (p.domain) {
        addDomain(p.domain, p.name, p.category, 'saashub-category');
      } else if (p.slug && slugMap[p.slug]) {
        addDomain(slugMap[p.slug], p.name, p.category, 'saashub-category');
      }
    }
    categoriesDone++;
  }
  
  if ((i / batchSize) % 5 === 0) {
    console.log(`Categories: ${Math.min(i + batchSize, categories.length)}/${categories.length} done, ${allDomains.size} new domains`);
  }
  await new Promise(r => setTimeout(r, 200));
}

// Write output
console.log(`\nWriting ${allDomains.size} verified domains...`);
let output = '';
for (const [domain, info] of allDomains) {
  output += JSON.stringify({
    domain,
    name: info.name,
    source: info.source,
    category: info.category,
    metadata: {}
  }) + '\n';
}
writeFileSync(outPath, output);

appendFileSync(progressPath, `### Final - ${new Date().toISOString()}\n- Alternatives pages crawled: ${alternativesSlugs.length}\n- Categories crawled: ${categories.length}\n- Total unique new domains: ${allDomains.size}\n- Dedup against: ${existingDomains.size} existing\n`);

console.log(`Done! ${allDomains.size} new domains written.`);
