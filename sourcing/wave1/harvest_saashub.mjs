import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';

// Load dedup set
const dedupPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existingDomains = new Set(readFileSync(dedupPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));
console.log(`Loaded ${existingDomains.size} existing domains for dedup`);

const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/g2_domains.jsonl';
const progressPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/logs/g2_progress.md';

// SaaSHub categories to crawl - focus on ones with small SaaS companies
const categories = [
  // Project management & productivity
  'project-management', 'task-management', 'time-tracking', 'collaboration',
  'team-communication', 'note-taking', 'document-management', 'knowledge-management',
  'workflow-automation', 'productivity', 'scheduling', 'meeting',
  // CRM & Sales
  'crm', 'sales', 'lead-generation', 'sales-engagement', 'proposal',
  'contract-management', 'invoicing', 'billing', 'subscription-management',
  // Marketing
  'email-marketing', 'marketing-automation', 'social-media-management',
  'seo', 'content-marketing', 'landing-page', 'survey', 'form-builder',
  'push-notification', 'affiliate-marketing', 'influencer-marketing',
  // Customer support
  'customer-support', 'live-chat', 'help-desk', 'knowledge-base',
  'customer-feedback', 'customer-success', 'chatbot',
  // HR & People
  'hr', 'recruiting', 'applicant-tracking', 'employee-engagement',
  'payroll', 'performance-management', 'onboarding', 'employee-scheduling',
  // Developer tools
  'developer-tools', 'api-management', 'ci-cd', 'monitoring',
  'error-tracking', 'code-review', 'testing', 'deployment',
  'server-monitoring', 'log-management', 'feature-flags',
  // Analytics & BI
  'analytics', 'business-intelligence', 'data-visualization',
  'ab-testing', 'session-recording', 'heatmap', 'product-analytics',
  // Design & Creative
  'graphic-design', 'prototyping', 'wireframing', 'video-editing',
  'screen-recording', 'screenshot', 'design-collaboration',
  // Communication
  'video-conferencing', 'webinar', 'team-messaging', 'voip',
  'virtual-phone', 'sms', 'email',
  // Finance & Accounting
  'accounting', 'expense-management', 'budgeting', 'financial-planning',
  'payment-processing', 'tax',
  // Security & IT
  'password-manager', 'vpn', 'backup', 'identity-management',
  'endpoint-security', 'network-monitoring',
  // E-commerce
  'e-commerce', 'shopping-cart', 'dropshipping', 'inventory-management',
  'order-management', 'product-information-management',
  // Education & LMS
  'lms', 'online-course', 'training', 'e-learning',
  // Legal & Compliance
  'legal', 'compliance', 'gdpr', 'document-signing',
  // Database & Infrastructure
  'database', 'hosting', 'cdn', 'dns', 'cloud-storage',
  // Niche SaaS categories
  'appointment-scheduling', 'digital-asset-management', 'data-integration',
  'etl', 'reverse-etl', 'customer-data-platform', 'product-management',
  'roadmap', 'feedback-management', 'user-onboarding', 'in-app-messaging',
  'website-builder', 'cms', 'headless-cms', 'static-site-generator',
  'no-code', 'low-code', 'automation', 'integration-platform',
  'data-enrichment', 'web-scraping', 'competitive-intelligence',
  'pricing-optimization', 'revenue-intelligence', 'sales-intelligence',
  'conversational-ai', 'ai-writing', 'ai-image-generator',
  'transcription', 'translation', 'localization',
  'field-service-management', 'fleet-management', 'construction-management',
  'real-estate', 'property-management', 'restaurant-pos',
  'church-management', 'nonprofit', 'gym-management',
  'veterinary', 'dental', 'medical-practice-management',
  'spa-and-salon', 'photography', 'music-production',
  'podcast-hosting', 'video-hosting', 'file-sharing',
  'remote-desktop', 'screen-sharing', 'whiteboard',
  'okr', 'employee-recognition', 'whistleblowing',
  'visitor-management', 'digital-signage', 'kiosk',
  'fleet-tracking', 'asset-tracking', 'warehouse-management',
  'supply-chain', 'procurement', 'vendor-management',
  'event-management', 'ticketing', 'registration',
  'loyalty-program', 'referral', 'review-management',
  'social-proof', 'pop-up', 'exit-intent',
  'customer-journey', 'attribution', 'tag-management',
  'data-catalog', 'data-governance', 'data-quality',
  'api-gateway', 'service-mesh', 'container-orchestration',
  'secret-management', 'infrastructure-as-code', 'configuration-management',
  'status-page', 'incident-management', 'on-call',
  'uptime-monitoring', 'synthetic-monitoring', 'real-user-monitoring',
  'load-testing', 'security-testing', 'penetration-testing',
  'vulnerability-scanning', 'siem', 'soar',
  'managed-detection', 'email-security', 'web-application-firewall',
  'bot-protection', 'ddos-protection', 'fraud-detection',
];

// Known domain mappings for common products
const knownDomains = {
  'asana': 'asana.com', 'trello': 'trello.com', 'basecamp': 'basecamp.com',
  'wrike': 'wrike.com', 'monday': 'monday.com', 'clickup': 'clickup.com',
  'jira': 'atlassian.com', 'smartsheet': 'smartsheet.com', 'todoist': 'todoist.com',
  'teamwork': 'teamwork.com', 'teamgantt': 'teamgantt.com', 'notion': 'notion.so',
  'pipedrive': 'pipedrive.com', 'freshsales-crm': 'freshworks.com',
  'hubspot': 'hubspot.com', 'insightly': 'insightly.com', 'sugarcrm': 'sugarcrm.com',
  'salesforce': 'salesforce.com', 'intercom': 'intercom.com',
  'agile-crm': 'agilecrm.com', 'worketc-crm': 'worketc.com',
  'alore-crm': 'alore.io', 'copper': 'copper.com', 'prosperworks': 'copper.com',
  'activecampaign': 'activecampaign.com', 'mailchimp': 'mailchimp.com',
  'ortto': 'ortto.com', 'getresponse': 'getresponse.com',
  'sharpspring': 'sharpspring.com', 'omnisend': 'omnisend.com',
  'klaviyo': 'klaviyo.com', 'hootsuite': 'hootsuite.com',
  'zendesk': 'zendesk.com', 'freshdesk': 'freshdesk.com',
  'liveagent': 'liveagent.com', 'livechat': 'livechat.com',
  'helpscout': 'helpscout.com', 'tawk-to': 'tawk.to',
  'crisp-chat': 'crisp.chat', 'zoho-desk': 'zoho.com',
  'drift': 'drift.com', 'tidio': 'tidio.com', 'kayako': 'kayako.com',
  'front': 'front.com', 'bamboohr': 'bamboohr.com', 'workday': 'workday.com',
  'gusto': 'gusto.com', 'zenefits': 'zenefits.com', 'paychex': 'paychex.com',
  'paylocity': 'paylocity.com', 'paycom': 'paycom.com',
  '15five': '15five.com', 'workleap': 'workleap.com',
  'google-analytics': 'analytics.google.com', 'mixpanel': 'mixpanel.com',
  'plausible-io': 'plausible.io', 'matomo': 'matomo.org',
  'fathom-analytics': 'usefathom.com', 'hotjar': 'hotjar.com',
  'smartlook': 'smartlook.com', 'heap': 'heap.io',
  'simple-analytics': 'simpleanalytics.com', 'amplitude': 'amplitude.com',
  'clicky': 'clicky.com', 'woopra': 'woopra.com',
  'brevo': 'brevo.com', 'mailerlite': 'mailerlite.com',
  'campaign-monitor': 'campaignmonitor.com', 'constant-contact': 'constantcontact.com',
  'sendgrid': 'sendgrid.com', 'sendpulse': 'sendpulse.com',
  'tabidoo': 'tabidoo.cloud', 'salestarget-ai': 'salestarget.ai',
  'mailreach-co': 'mailreach.co', 'datapalo': 'datapalo.app',
  'itilite': 'itilite.com', 'arrence-ai': 'arrenceai.com',
  'zoho-crm': 'zoho.com', 'miro': 'miro.com',
  'vercel': 'vercel.com', 'supabase': 'supabase.com',
  'firebase': 'firebase.google.com',
};

// Enterprise companies to skip
const skipDomains = new Set([
  'salesforce.com', 'oracle.com', 'sap.com', 'microsoft.com', 'google.com',
  'amazon.com', 'ibm.com', 'adobe.com', 'workday.com', 'servicenow.com',
  'atlassian.com', 'apple.com', 'meta.com', 'facebook.com',
  'analytics.google.com', 'firebase.google.com',
]);

const allDomains = new Map(); // domain -> {name, category, source}
let categoriesDone = 0;
let totalFound = 0;
let totalNew = 0;

async function fetchCategory(cat) {
  const url = `https://www.saashub.com/best-${cat}-software`;
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    if (!resp.ok) {
      // Try without -software suffix
      const url2 = `https://www.saashub.com/best-${cat}`;
      const resp2 = await fetch(url2, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
      });
      if (!resp2.ok) return [];
      return extractProducts(await resp2.text(), cat);
    }
    return extractProducts(await resp.text(), cat);
  } catch (e) {
    console.error(`Error fetching ${cat}: ${e.message}`);
    return [];
  }
}

function extractProducts(html, category) {
  const products = [];
  // Extract product slugs from alternative links: /productname-alternatives
  const altRegex = /\/([\w-]+)-alternatives/g;
  let match;
  while ((match = altRegex.exec(html)) !== null) {
    const slug = match[1];
    if (slug === 'best' || slug.length < 2) continue;
    products.push({ slug, category });
  }
  // Also extract from Visit website links
  const visitRegex = /Visit website.*?href="(https?:\/\/[^"]+)"/g;
  while ((match = visitRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1]);
      let domain = url.hostname.replace(/^www\./, '');
      // Skip tracking domains
      if (domain.includes('appwiki.nl') || domain.includes('saashub')) continue;
      products.push({ slug: domain.split('.')[0], category, domain });
    } catch {}
  }
  // Extract from direct product links with utm params
  const utmRegex = /href="(https?:\/\/(?!www\.saashub)[^"]*utm_source=saashub[^"]*)"/gi;
  while ((match = utmRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1]);
      let domain = url.hostname.replace(/^www\./, '');
      products.push({ slug: domain.split('.')[0], category, domain });
    } catch {}
  }
  return products;
}

function slugToDomain(slug) {
  if (knownDomains[slug]) return knownDomains[slug];
  // Common patterns
  const clean = slug.replace(/-/g, '');
  return `${slug.replace(/-+$/, '')}.com`; // Best guess
}

async function fetchAlternativesPage(slug, category) {
  // The alternatives page lists many more products
  const url = `https://www.saashub.com/${slug}-alternatives`;
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    if (!resp.ok) return [];
    return extractProducts(await resp.text(), category);
  } catch {
    return [];
  }
}

// Write initial progress
writeFileSync(progressPath, `# G2/SaaSHub Domain Sourcing Progress\n\nStarted: ${new Date().toISOString()}\nSource: SaaSHub.com\nCategories to process: ${categories.length}\n\n## Updates\n\n`);

// Process in batches of 5
const batchSize = 5;
for (let i = 0; i < categories.length; i += batchSize) {
  const batch = categories.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(cat => fetchCategory(cat)));
  
  for (let j = 0; j < batch.length; j++) {
    const products = results[j];
    for (const p of products) {
      const domain = p.domain || slugToDomain(p.slug);
      const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
      
      if (skipDomains.has(normalizedDomain)) continue;
      if (existingDomains.has(normalizedDomain)) continue;
      if (allDomains.has(normalizedDomain)) continue;
      
      allDomains.set(normalizedDomain, {
        name: p.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        category: p.category || batch[j],
        source: 'saashub'
      });
    }
    categoriesDone++;
  }
  
  // Write domains found so far
  if (i % 10 === 0 || i + batchSize >= categories.length) {
    console.log(`Progress: ${categoriesDone}/${categories.length} categories, ${allDomains.size} new domains`);
  }
  
  // Small delay between batches
  await new Promise(r => setTimeout(r, 300));
}

// Now also crawl alternatives pages for the top products to find more obscure ones
console.log('\nPhase 2: Crawling alternatives pages for deeper discovery...');
const topSlugs = [
  'asana', 'trello', 'notion', 'clickup', 'monday',
  'pipedrive', 'hubspot', 'freshdesk', 'zendesk', 'intercom',
  'mailchimp', 'activecampaign', 'bamboohr', 'gusto',
  'mixpanel', 'hotjar', 'amplitude', 'segment',
  'slack', 'zoom', 'calendly', 'loom', 'figma',
  'stripe', 'quickbooks', 'xero', 'freshbooks',
  'shopify', 'webflow', 'squarespace', 'wordpress',
  'airtable', 'coda', 'linear', 'jira',
  'datadog', 'sentry', 'pagerduty', 'statuspage',
  'twilio', 'sendgrid', 'postmark', 'mailgun',
  'auth0', 'okta', 'onelogin', 'jumpcloud',
  'terraform', 'ansible', 'docker', 'kubernetes',
  'vercel', 'netlify', 'heroku', 'render',
  'supabase', 'planetscale', 'neon', 'fauna',
  'retool', 'appsmith', 'budibase', 'tooljet',
  'zapier', 'make', 'n8n', 'tray-io',
  'typeform', 'jotform', 'google-forms', 'surveymonkey',
  'canva', 'figma', 'sketch', 'adobe-xd',
  'buffer', 'hootsuite', 'sprout-social', 'later',
  'gong', 'chorus', 'salesloft', 'outreach',
  'lemlist', 'reply-io', 'woodpecker', 'instantly',
  'close', 'copper', 'folk', 'attio',
  'productboard', 'aha', 'pendo', 'uservoice',
  'chameleon', 'appcues', 'whatfix', 'userpilot',
  'chargebee', 'recurly', 'paddle', 'fastspring',
  'metabase', 'looker', 'mode', 'preset',
  'dbt', 'fivetran', 'airbyte', 'stitch',
  'snowflake', 'databricks', 'bigquery', 'redshift',
];

for (let i = 0; i < topSlugs.length; i += batchSize) {
  const batch = topSlugs.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(s => fetchAlternativesPage(s, 'alternatives')));
  
  for (const products of results) {
    for (const p of products) {
      const domain = p.domain || slugToDomain(p.slug);
      const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
      
      if (skipDomains.has(normalizedDomain)) continue;
      if (existingDomains.has(normalizedDomain)) continue;
      if (allDomains.has(normalizedDomain)) continue;
      
      allDomains.set(normalizedDomain, {
        name: p.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        category: p.category || 'alternatives',
        source: 'saashub'
      });
    }
  }
  
  await new Promise(r => setTimeout(r, 300));
}

// Write all results
console.log(`\nWriting ${allDomains.size} domains to output...`);
let output = '';
for (const [domain, info] of allDomains) {
  output += JSON.stringify({
    domain,
    name: info.name,
    source: 'saashub',
    category: info.category,
    metadata: { source_url: `https://www.saashub.com/best-${info.category}-software` }
  }) + '\n';
}
writeFileSync(outPath, output);

// Final progress
const finalProgress = `\n### Final Report - ${new Date().toISOString()}\n- Categories processed: ${categoriesDone}\n- Alternatives pages crawled: ${topSlugs.length}\n- Total unique new domains: ${allDomains.size}\n- Domains skipped (enterprise): ${skipDomains.size}\n- Domains skipped (dedup): already in 86K database\n`;
appendFileSync(progressPath, finalProgress);

console.log(`\nDone! ${allDomains.size} new unique domains written to ${outPath}`);
