import { readFileSync, appendFileSync } from 'fs';

const dedupPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existingDomains = new Set(readFileSync(dedupPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));

const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/g2_domains.jsonl';
const existingOutput = new Set();
for (const line of readFileSync(outPath, 'utf8').split('\n').filter(Boolean)) {
  existingOutput.add(JSON.parse(line).domain);
}
console.log(`Starting with ${existingOutput.size} existing output domains`);

const skipDomains = new Set([
  'salesforce.com', 'oracle.com', 'sap.com', 'microsoft.com', 'google.com',
  'amazon.com', 'ibm.com', 'adobe.com', 'github.com', 'gitlab.com',
  'apache.org', 'python.org', 'w3.org', 'wikipedia.org',
  'youtube.com', 'twitter.com', 'reddit.com', 'linkedin.com', 'facebook.com',
  'medium.com', 'npmjs.com', 'docker.com', 'aws.amazon.com', 'cloud.google.com',
  'img.shields.io', 'shields.io', 'creativecommons.org', 'producthunt.com',
  'trackawesomelist.com', 'azure.microsoft.com', 'x.com', 'instagram.com',
]);

let newCount = 0;
let output = '';

function addDomain(domain, name, category, source) {
  const d = domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
  if (!d || d.length < 4 || !d.includes('.')) return;
  if (d.endsWith('.gov') || d.endsWith('.edu') || d.endsWith('.mil')) return;
  if (skipDomains.has(d)) return;
  if (existingDomains.has(d)) return;
  if (existingOutput.has(d)) return;
  
  output += JSON.stringify({ domain: d, name, source, category, metadata: {} }) + '\n';
  existingOutput.add(d);
  newCount++;
}

// Source 1: free-for-dev README
console.log('Fetching free-for-dev...');
const ffdResp = await fetch('https://raw.githubusercontent.com/ripienaar/free-for-dev/master/README.md');
const ffdText = await ffdResp.text();

const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
let match;
while ((match = urlRegex.exec(ffdText)) !== null) {
  try {
    const parsed = new URL(match[2]);
    let domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (domain.includes('github.') || domain.includes('gitlab.') || domain.includes('shields.io') || domain.includes('google.com') || domain.includes('amazon.com') || domain.includes('microsoft.com') || domain.includes('azure.')) continue;
    const name = match[1].replace(/\[.*?\]/g, '').trim().substring(0, 60) || domain;
    addDomain(domain, name, 'free-for-dev', 'github-free-for-dev');
  } catch {}
}
console.log(`After free-for-dev: ${newCount} new domains`);

// Source 2: Micro SaaS / Indie companies - manually add from search results
const microSaaS = [
  ['nomadlist.com', 'Nomad List', 'indie-saas'],
  ['systeme.io', 'Systeme.io', 'marketing-automation'],
  ['bannerbear.com', 'Bannerbear', 'design-automation'],
  ['tweethunter.io', 'TweetHunter', 'social-media'],
  ['baremetrics.com', 'Baremetrics', 'analytics'],
  ['carrd.co', 'Carrd', 'website-builder'],
  ['mysignature.io', 'MySignature', 'email-tools'],
  ['typefully.com', 'Typefully', 'social-media'],
  ['churnkey.co', 'Churnkey', 'retention'],
  ['churchdesk.com', 'ChurchDesk', 'crm'],
  ['leavemealone.app', 'Leave Me Alone', 'email-tools'],
  ['papermark.io', 'Papermark', 'document-sharing'],
  ['logsprout.com', 'Logsprout', 'monitoring'],
  ['userloop.io', 'UserLoop', 'surveys'],
  ['microconf.com', 'MicroConf', 'community'],
  ['microns.io', 'Microns', 'marketplace'],
  ['flowjam.com', 'Flowjam', 'content'],
  
  // More micro SaaS / indie SaaS
  ['plausible.io', 'Plausible Analytics', 'analytics'],
  ['fathom.video', 'Fathom', 'meetings'],
  ['gumroad.com', 'Gumroad', 'payments'],
  ['transistor.fm', 'Transistor', 'podcast-hosting'],
  ['savvycal.com', 'SavvyCal', 'scheduling'],
  ['pirsch.io', 'Pirsch', 'analytics'],
  ['buttondown.email', 'Buttondown', 'email'],
  ['simple-analytics.com', 'Simple Analytics', 'analytics'],
  ['simpleanalytics.com', 'Simple Analytics', 'analytics'],
  ['emailoctopus.com', 'EmailOctopus', 'email-marketing'],
  ['beehiiv.com', 'Beehiiv', 'newsletters'],
  ['convertkit.com', 'ConvertKit', 'email-marketing'],
  ['ghost.org', 'Ghost', 'cms'],
  ['cal.com', 'Cal.com', 'scheduling'],
  ['tally.so', 'Tally', 'forms'],
  ['loops.so', 'Loops', 'email'],
  ['resend.com', 'Resend', 'email-api'],
  ['dub.co', 'Dub', 'link-management'],
  ['dub.sh', 'Dub', 'link-management'],
  ['posthog.com', 'PostHog', 'analytics'],
  ['chatwoot.com', 'Chatwoot', 'customer-support'],
  ['n8n.io', 'n8n', 'automation'],
  ['appflowy.io', 'AppFlowy', 'productivity'],
  ['twenty.com', 'Twenty', 'crm'],
  ['heyform.net', 'HeyForm', 'forms'],
  ['erxes.io', 'Erxes', 'crm'],
  ['listmonk.app', 'Listmonk', 'email'],
  ['killbill.io', 'Kill Bill', 'billing'],
  ['invoiceninja.com', 'Invoice Ninja', 'invoicing'],
  ['crater.financial', 'Crater', 'invoicing'],
  ['akaunting.com', 'Akaunting', 'accounting'],
  ['kimai.org', 'Kimai', 'time-tracking'],
  ['maybe.co', 'Maybe', 'finance'],
  ['plane.so', 'Plane', 'project-management'],
  ['huly.io', 'Huly', 'project-management'],
  ['leantime.io', 'Leantime', 'project-management'],
  ['vikunja.io', 'Vikunja', 'task-management'],
  ['logchimp.codecarrot.net', 'LogChimp', 'feedback'],
  ['fider.io', 'Fider', 'feedback'],
  ['documenso.com', 'Documenso', 'digital-signature'],
  ['docuseal.co', 'DocuSeal', 'digital-signature'],
  ['formbricks.com', 'Formbricks', 'surveys'],
  ['openalternative.co', 'Open Alternative', 'directory'],
  ['nango.dev', 'Nango', 'integrations'],
  ['svix.com', 'Svix', 'webhooks'],
  ['flagsmith.com', 'Flagsmith', 'feature-flags'],
  ['openreplay.com', 'OpenReplay', 'session-recording'],
  ['highlight.io', 'Highlight', 'monitoring'],
  ['signoz.io', 'SigNoz', 'observability'],
  ['uptrace.dev', 'Uptrace', 'observability'],
  ['langfuse.com', 'Langfuse', 'llm-observability'],
  ['helicone.ai', 'Helicone', 'llm-observability'],
  ['pezzo.ai', 'Pezzo', 'llm-management'],
  ['promptfoo.dev', 'Promptfoo', 'llm-testing'],
  ['traceloop.com', 'Traceloop', 'llm-observability'],
  ['unkey.dev', 'Unkey', 'api-keys'],
  ['zuplo.com', 'Zuplo', 'api-management'],
  ['hatchet.run', 'Hatchet', 'task-queue'],
  ['trigger.dev', 'Trigger.dev', 'background-jobs'],
  ['inngest.com', 'Inngest', 'background-jobs'],
  ['cal.com', 'Cal.com', 'scheduling'],
  ['crowd.dev', 'Crowd.dev', 'community'],
  ['lago.dev', 'Lago', 'billing'],
  ['getlago.com', 'Lago', 'billing'],
  ['hyperswitch.io', 'Hyperswitch', 'payments'],
  ['dyrector.io', 'Dyrector', 'deployment'],
  ['coolify.io', 'Coolify', 'hosting'],
  ['dokploy.com', 'Dokploy', 'hosting'],
  ['railway.app', 'Railway', 'hosting'],
  ['render.com', 'Render', 'hosting'],
  ['fly.io', 'Fly.io', 'hosting'],
  ['zeabur.com', 'Zeabur', 'hosting'],
  ['sst.dev', 'SST', 'infrastructure'],
  ['seed.run', 'Seed', 'deployment'],
  ['depot.dev', 'Depot', 'ci-cd'],
  ['earthly.dev', 'Earthly', 'ci-cd'],
  ['dagger.io', 'Dagger', 'ci-cd'],
  ['cerbos.dev', 'Cerbos', 'authorization'],
  ['permit.io', 'Permit.io', 'authorization'],
  ['infisical.com', 'Infisical', 'secrets'],
  ['doppler.com', 'Doppler', 'secrets'],
  ['tolgee.io', 'Tolgee', 'localization'],
  ['novu.co', 'Novu', 'notifications'],
  ['knock.app', 'Knock', 'notifications'],
  ['magicbell.com', 'MagicBell', 'notifications'],
  ['fonoster.com', 'Fonoster', 'communication'],
  ['windmill.dev', 'Windmill', 'automation'],
  ['activepieces.com', 'Activepieces', 'automation'],
  ['automatisch.io', 'Automatisch', 'automation'],
  ['pipedream.com', 'Pipedream', 'automation'],
  ['directus.io', 'Directus', 'cms'],
  ['payload.cms.dev', 'Payload CMS', 'cms'],
  ['payloadcms.com', 'Payload CMS', 'cms'],
  ['tinacms.org', 'TinaCMS', 'cms'],
  ['keystonejs.com', 'Keystone', 'cms'],
  ['webiny.com', 'Webiny', 'cms'],
  ['pocketbase.io', 'PocketBase', 'backend'],
  ['appwrite.io', 'Appwrite', 'backend'],
  ['nhost.io', 'Nhost', 'backend'],
  ['convex.dev', 'Convex', 'backend'],
  ['encore.dev', 'Encore', 'backend'],
  ['wasp-lang.dev', 'Wasp', 'framework'],
  ['amplication.com', 'Amplication', 'code-gen'],
  ['refine.dev', 'Refine', 'framework'],
  ['medusajs.com', 'Medusa', 'ecommerce'],
  ['saleor.io', 'Saleor', 'ecommerce'],
  ['vendure.io', 'Vendure', 'ecommerce'],
  ['qdrant.tech', 'Qdrant', 'vector-db'],
  ['weaviate.io', 'Weaviate', 'vector-db'],
  ['pinecone.io', 'Pinecone', 'vector-db'],
  ['chroma.ai', 'Chroma', 'vector-db'],
  ['milvus.io', 'Milvus', 'vector-db'],
  ['typesense.org', 'Typesense', 'search'],
  ['meilisearch.com', 'Meilisearch', 'search'],
  ['growthbook.io', 'GrowthBook', 'ab-testing'],
  ['flipt.io', 'Flipt', 'feature-flags'],
  ['getunleash.io', 'Unleash', 'feature-flags'],
  ['configcat.com', 'ConfigCat', 'feature-flags'],
  ['featurevisor.com', 'Featurevisor', 'feature-flags'],
  ['tinybird.co', 'Tinybird', 'analytics-api'],
  ['clickhouse.com', 'ClickHouse', 'database'],
  ['questdb.io', 'QuestDB', 'database'],
  ['timescale.com', 'Timescale', 'database'],
  ['singlestore.com', 'SingleStore', 'database'],
  ['turso.tech', 'Turso', 'database'],
  ['xata.io', 'Xata', 'database'],
  ['edgedb.com', 'EdgeDB', 'database'],
  ['grafbase.com', 'Grafbase', 'api'],
  ['hasura.io', 'Hasura', 'api'],
  ['stepzen.com', 'StepZen', 'api'],
  ['wundergraph.com', 'WunderGraph', 'api'],
];

for (const [domain, name, category] of microSaaS) {
  addDomain(domain, name, category, 'micro-saas-indie');
}
console.log(`After micro SaaS: ${newCount} new domains`);

// Source 3: More SaaSHub pages (pages 2, 3 of popular categories)
console.log('\nFetching more SaaSHub pages...');
const extraCategories = [
  // Less common categories
  'documentation', 'wiki', 'password-manager', 'vpn-services',
  'screen-recording', 'video-hosting', 'podcast-hosting', 'audio-editing',
  'diagramming', 'wireframing', 'mind-mapping', 'whiteboard',
  'data-warehousing', 'data-catalog', 'data-quality', 'data-governance',
  'identity-management', 'single-sign-on', 'two-factor-authentication',
  'endpoint-security', 'network-security', 'email-security',
  'backup', 'disaster-recovery', 'cloud-storage',
  'container-registry', 'container-management',
  'service-mesh', 'api-gateway', 'load-balancer',
  'cloud-cost-management', 'finops',
  'changelog', 'release-notes', 'feature-request',
  'customer-onboarding', 'digital-adoption',
  'sales-enablement', 'sales-coaching',
  'revenue-operations', 'revenue-intelligence',
  'commission-management', 'compensation-management',
  'employee-wellness', 'employee-benefits',
  'learning-management', 'course-creation',
  'church-management', 'nonprofit-management',
  'property-management', 'real-estate-crm',
  'restaurant-management', 'hotel-management',
  'clinic-management', 'dental-software',
  'legal-practice-management', 'law-firm-management',
  'construction-management', 'fleet-management',
  'field-service', 'maintenance-management',
  'inventory-management', 'warehouse-management',
  'procurement', 'vendor-management',
  'contract-lifecycle-management',
  'proposal-management', 'cpq',
  'accounts-payable', 'accounts-receivable',
  'expense-reporting', 'spend-management',
  'tax-management', 'payroll-management',
  'affiliate-tracking', 'referral-marketing',
  'loyalty-management', 'customer-loyalty',
  'review-management', 'reputation-management',
  'social-listening', 'brand-monitoring',
  'influencer-marketing', 'creator-economy',
  'webinar-platform', 'virtual-event',
  'community-platform', 'forum-software',
  'customer-community', 'developer-community',
  'partner-management', 'channel-management',
  'marketplace-platform', 'multi-vendor',
];

for (let i = 0; i < extraCategories.length; i += 10) {
  const batch = extraCategories.slice(i, i + 10);
  const results = await Promise.all(batch.map(async cat => {
    for (const pattern of [`best-${cat}-software`, `best-${cat}`]) {
      try {
        const resp = await fetch(`https://www.saashub.com/${pattern}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
          signal: AbortSignal.timeout(8000),
        });
        if (resp.ok) {
          const html = await resp.text();
          const slugRegex = /\/([\w][\w-]{1,40})-alternatives/g;
          let m;
          const slugs = [];
          while ((m = slugRegex.exec(html)) !== null) {
            const slug = m[1];
            if (slug.startsWith('post-') || slug.startsWith('best-') || slug.includes('2024') || slug.includes('2025') || slug.includes('2026') || slug.length > 30) continue;
            slugs.push(slug);
          }
          return { cat, slugs };
        }
      } catch {}
    }
    return { cat, slugs: [] };
  }));
  
  for (const { cat, slugs } of results) {
    for (const slug of slugs) {
      const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      addDomain(`${slug}.com`, name, cat, 'saashub-extra');
    }
  }
  await new Promise(r => setTimeout(r, 300));
}
console.log(`After extra SaaSHub: ${newCount} new domains`);

// Write all new domains
if (output) {
  appendFileSync(outPath, output);
}

console.log(`\nTotal new domains added this run: ${newCount}`);
console.log(`Total in output file: ${existingOutput.size}`);
