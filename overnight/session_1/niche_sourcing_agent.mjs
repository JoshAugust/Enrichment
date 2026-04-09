#!/usr/bin/env node
// Niche Sourcing Agent - appends to new_companies_queue.jsonl

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const SHARED = `${WORKSPACE}/jordan.ai/overnight/shared/`;
const QUEUE_FILE = SHARED + 'new_companies_queue.jsonl';

// Build dedup set
const hubspot = JSON.parse(readFileSync(SHARED + 'hubspot_domains_current.json', 'utf8'));
const masterDb = JSON.parse(readFileSync(SHARED + 'master_db_domains.json', 'utf8'));
const queueLines = readFileSync(QUEUE_FILE, 'utf8').trim().split('\n');
const queueDomains = queueLines.map(l => { try { return JSON.parse(l).domain; } catch(e) { return null; } }).filter(Boolean);

const seen = new Set([
  ...hubspot,
  ...(Array.isArray(masterDb) ? masterDb : Object.keys(masterDb)),
  ...queueDomains
]);

console.log(`Dedup set loaded: ${seen.size} domains`);

let added = 0;
const newEntries = [];

function addCompany(domain, name, source, description) {
  if (!domain) return false;
  domain = domain.toLowerCase().trim().replace(/^www\./, '').replace(/\/$/, '');
  if (seen.has(domain)) return false;
  if (!domain.includes('.')) return false;
  if (domain.length < 4) return false;
  
  seen.add(domain);
  const entry = {
    domain,
    company_name: name,
    source,
    description,
    timestamp: new Date().toISOString()
  };
  appendFileSync(QUEUE_FILE, JSON.stringify(entry) + '\n');
  added++;
  newEntries.push(entry);
  return true;
}

// ============================================================
// DATA: Collected from web searches (pre-processed)
// ============================================================

// === BATCH 1: SaaS Acquisition Marketplaces ===
const acquisitionCompanies = [
  // Acquire.com / MicroAcquire listed SaaS companies
  { domain: 'acquire.com', name: 'Acquire.com', source: 'acquire_marketplace', description: 'SaaS acquisition marketplace' },
  { domain: 'getterms.io', name: 'GetTerms', source: 'acquire_marketplace', description: 'Privacy policy generator SaaS' },
  { domain: 'logoai.com', name: 'LogoAI', source: 'acquire_marketplace', description: 'AI logo generator SaaS' },
  { domain: 'sitechecker.pro', name: 'SiteChecker', source: 'acquire_marketplace', description: 'SEO site checker SaaS' },
  { domain: 'wordtune.com', name: 'Wordtune', source: 'acquire_marketplace', description: 'AI writing assistant' },
  { domain: 'taskade.com', name: 'Taskade', source: 'acquire_marketplace', description: 'AI-powered productivity SaaS' },
  { domain: 'notionly.com', name: 'Notionly', source: 'acquire_marketplace', description: 'Notification management SaaS' },
  { domain: 'saasframe.io', name: 'SaaSFrame', source: 'acquire_marketplace', description: 'SaaS landing page design inspiration' },
  { domain: 'microacquire.com', name: 'MicroAcquire', source: 'acquire_marketplace', description: 'Startup acquisition marketplace' },
  { domain: 'indiemaker.co', name: 'IndieMaker', source: 'acquire_marketplace', description: 'Indie makers marketplace' },
  // Flippa SaaS listings
  { domain: 'helpjuice.com', name: 'Helpjuice', source: 'flippa_saas', description: 'Knowledge base SaaS' },
  { domain: 'proofly.com', name: 'Proofly', source: 'flippa_saas', description: 'Social proof tool SaaS' },
  { domain: 'squadcast.fm', name: 'Squadcast', source: 'flippa_saas', description: 'Podcast recording platform' },
  { domain: 'gumroad.com', name: 'Gumroad', source: 'flippa_saas', description: 'Creator commerce platform' },
  { domain: 'storetasker.com', name: 'StorTasker', source: 'flippa_saas', description: 'Shopify expert marketplace' },
  { domain: 'widgetpack.com', name: 'WidgetPack', source: 'flippa_saas', description: 'Rating and review widget SaaS' },
  { domain: 'swipewell.com', name: 'Swipewell', source: 'flippa_saas', description: 'Swipe file tool for marketers' },
  { domain: 'fomo.com', name: 'Fomo', source: 'flippa_saas', description: 'Social proof notification SaaS' },
  { domain: 'lemonstand.com', name: 'LemonStand', source: 'flippa_saas', description: 'Ecommerce SaaS platform' },
  { domain: 'crowdfire.com', name: 'Crowdfire', source: 'flippa_saas', description: 'Social media management SaaS' },
];

// === BATCH 2: Podcast Guest Companies (Indie Hackers, etc.) ===
const podcastCompanies = [
  { domain: 'baremetrics.com', name: 'Baremetrics', source: 'indie_hackers_podcast', description: 'SaaS analytics and metrics' },
  { domain: 'transistor.fm', name: 'Transistor', source: 'indie_hackers_podcast', description: 'Podcast hosting platform' },
  { domain: 'convertkit.com', name: 'ConvertKit', source: 'indie_hackers_podcast', description: 'Email marketing for creators' },
  { domain: 'feedhive.io', name: 'FeedHive', source: 'indie_hackers_podcast', description: 'Social media content scheduling SaaS' },
  { domain: 'podia.com', name: 'Podia', source: 'indie_hackers_podcast', description: 'Creator platform for courses' },
  { domain: 'plausible.io', name: 'Plausible Analytics', source: 'indie_hackers_podcast', description: 'Privacy-friendly web analytics' },
  { domain: 'usefathom.com', name: 'Fathom Analytics', source: 'indie_hackers_podcast', description: 'Simple web analytics SaaS' },
  { domain: 'panelbear.com', name: 'Panelbear', source: 'saas_podcast_founders', description: 'Analytics and monitoring SaaS' },
  { domain: 'saas.group', name: 'SaaS.Group', source: 'saas_podcast_founders', description: 'SaaS acquirer and operator' },
  { domain: 'claritask.com', name: 'Claritask', source: 'saas_podcast_founders', description: 'Project management SaaS' },
  { domain: 'retainful.com', name: 'Retainful', source: 'bootstrapped_podcast', description: 'Email automation for ecommerce' },
  { domain: 'uploadcare.com', name: 'Uploadcare', source: 'bootstrapped_podcast', description: 'File uploading SaaS infrastructure' },
  { domain: 'canny.io', name: 'Canny', source: 'indie_hackers_podcast', description: 'Customer feedback management SaaS' },
  { domain: 'churnkey.co', name: 'Churnkey', source: 'saas_podcast_founders', description: 'Churn prevention SaaS' },
  { domain: 'profitwell.com', name: 'ProfitWell', source: 'saas_podcast_founders', description: 'SaaS financial metrics' },
  { domain: 'outseta.com', name: 'Outseta', source: 'bootstrapped_podcast', description: 'All-in-one SaaS toolkit' },
  { domain: 'smartlook.com', name: 'Smartlook', source: 'saas_podcast_founders', description: 'Session recording and analytics' },
  { domain: 'userpilot.com', name: 'Userpilot', source: 'saas_podcast_founders', description: 'User onboarding SaaS' },
  { domain: 'userguiding.com', name: 'UserGuiding', source: 'saas_podcast_founders', description: 'Product onboarding platform' },
  { domain: 'supademo.com', name: 'Supademo', source: 'indie_hackers_podcast', description: 'Interactive product demo SaaS' },
  { domain: 'storylane.io', name: 'Storylane', source: 'saas_podcast_founders', description: 'Interactive demo platform' },
  { domain: 'tourial.com', name: 'Tourial', source: 'saas_podcast_founders', description: 'Interactive tour builder' },
  { domain: 'saasdesign.io', name: 'SaaSDesign', source: 'indie_hackers_podcast', description: 'Design templates for SaaS' },
  { domain: 'makerpad.co', name: 'Makerpad', source: 'bootstrapped_podcast', description: 'No-code education platform' },
  { domain: 'bannerbear.com', name: 'Bannerbear', source: 'indie_hackers_podcast', description: 'Auto-generate social media images' },
];

// === BATCH 3: SaaStr / Conference Exhibitor Companies ===
const conferenceCompanies = [
  { domain: 'reprise.dev', name: 'Reprise', source: 'saas_conference_exhibitor', description: 'Demo creation platform' },
  { domain: 'clari.com', name: 'Clari', source: 'saas_conference_exhibitor', description: 'Revenue operations platform' },
  { domain: 'gong.io', name: 'Gong', source: 'saastr_exhibitor', description: 'Revenue intelligence platform' },
  { domain: 'outreach.io', name: 'Outreach', source: 'saastr_exhibitor', description: 'Sales engagement platform' },
  { domain: 'salesloft.com', name: 'Salesloft', source: 'saastr_exhibitor', description: 'Modern revenue workspace' },
  { domain: 'gainsight.com', name: 'Gainsight', source: 'saastr_exhibitor', description: 'Customer success platform' },
  { domain: 'mixmax.com', name: 'Mixmax', source: 'saastr_exhibitor', description: 'Sales engagement for Gmail' },
  { domain: 'chorus.ai', name: 'Chorus.ai', source: 'saastr_exhibitor', description: 'Conversation intelligence platform' },
  { domain: 'dooly.ai', name: 'Dooly', source: 'saastr_exhibitor', description: 'Sales productivity SaaS' },
  { domain: 'scratchpad.com', name: 'Scratchpad', source: 'saastr_exhibitor', description: 'Salesforce productivity tool' },
  { domain: 'sendoso.com', name: 'Sendoso', source: 'saastr_exhibitor', description: 'Sending platform for gifting' },
  { domain: 'alyce.com', name: 'Alyce', source: 'saastr_exhibitor', description: 'Corporate gifting platform' },
  { domain: 'postal.io', name: 'Postal', source: 'saastr_exhibitor', description: 'Offline marketing automation' },
  { domain: 'qualified.com', name: 'Qualified', source: 'saastr_exhibitor', description: 'Pipeline generation platform' },
  { domain: 'saas-north.com', name: 'SaaS North', source: 'saas_north_conf', description: 'SaaS conference organizer' },
  { domain: 'drift.com', name: 'Drift', source: 'saastr_exhibitor', description: 'Conversational marketing SaaS' },
  { domain: 'intercom.com', name: 'Intercom', source: 'saastr_exhibitor', description: 'Customer messaging platform' },
  { domain: 'chili.piper.com', name: 'Chili Piper', source: 'saastr_exhibitor', description: 'Meeting scheduling for revenue teams' },
  { domain: 'chilipiper.com', name: 'Chili Piper', source: 'saastr_exhibitor', description: 'Demand conversion platform' },
  { domain: 'salesmsg.com', name: 'Salesmsg', source: 'saastr_exhibitor', description: 'Business texting platform' },
  { domain: 'gorilla.io', name: 'Gorilla', source: 'saastr_exhibitor', description: 'Revenue intelligence SaaS' },
  { domain: 'attest.com', name: 'Attest', source: 'saas_conference_exhibitor', description: 'Consumer research platform' },
  { domain: 'testimonial.to', name: 'Testimonial', source: 'micro_saas_conf', description: 'Collect testimonials SaaS' },
  { domain: 'birdie.io', name: 'Birdie', source: 'saas_conference_exhibitor', description: 'Market research SaaS' },
  { domain: 'capterra.com', name: 'Capterra', source: 'saastr_exhibitor', description: 'Software review marketplace' },
];

// === BATCH 4: Email Marketing SaaS ===
const emailMarketingCompanies = [
  { domain: 'moosend.com', name: 'Moosend', source: 'email_marketing_saas', description: 'Email marketing automation' },
  { domain: 'sendinblue.com', name: 'Sendinblue', source: 'email_marketing_saas', description: 'Email and SMS marketing platform' },
  { domain: 'omnisend.com', name: 'Omnisend', source: 'email_marketing_saas', description: 'E-commerce marketing automation' },
  { domain: 'mailercloud.com', name: 'MailerCloud', source: 'email_marketing_saas', description: 'Email marketing SaaS' },
  { domain: 'emailoctopus.com', name: 'EmailOctopus', source: 'email_marketing_saas', description: 'Simple email marketing SaaS' },
  { domain: 'sender.net', name: 'Sender', source: 'email_marketing_saas', description: 'Email and SMS marketing' },
  { domain: 'encharge.io', name: 'Encharge', source: 'email_marketing_saas', description: 'Behavior-based email marketing' },
  { domain: 'mailerlite.com', name: 'MailerLite', source: 'email_marketing_saas', description: 'Email marketing for small businesses' },
  { domain: 'reachmail.net', name: 'ReachMail', source: 'email_marketing_saas', description: 'Email marketing service' },
  { domain: 'campaignmonitor.com', name: 'Campaign Monitor', source: 'email_marketing_saas', description: 'Email marketing SaaS' },
  { domain: 'drip.com', name: 'Drip', source: 'email_marketing_saas', description: 'E-commerce CRM and email marketing' },
  { domain: 'klavio.com', name: 'Klaviyo', source: 'email_marketing_saas', description: 'Email marketing for ecommerce' },
  { domain: 'klaviyo.com', name: 'Klaviyo', source: 'email_marketing_saas', description: 'Email marketing platform for ecommerce' },
  { domain: 'sendgrid.com', name: 'SendGrid', source: 'email_marketing_saas', description: 'Email delivery platform' },
  { domain: 'mailjet.com', name: 'Mailjet', source: 'email_marketing_saas', description: 'Email marketing platform' },
  { domain: 'benchmark.email', name: 'Benchmark Email', source: 'email_marketing_saas', description: 'Email marketing SaaS' },
  { domain: 'verticalresponse.com', name: 'VerticalResponse', source: 'email_marketing_saas', description: 'Email marketing for small businesses' },
  { domain: 'arpreach.com', name: 'ARPreach', source: 'email_marketing_saas', description: 'Email marketing automation' },
  { domain: 'maildroppa.com', name: 'Maildroppa', source: 'email_marketing_saas', description: 'Simple email marketing SaaS' },
  { domain: 'getresponse.com', name: 'GetResponse', source: 'email_marketing_saas', description: 'Email marketing and automation' },
];

// === BATCH 5: Project Management SaaS ===
const projectMgmtCompanies = [
  { domain: 'basecamp.com', name: 'Basecamp', source: 'project_mgmt_saas', description: 'Project management and team communication' },
  { domain: 'teamwork.com', name: 'Teamwork', source: 'project_mgmt_saas', description: 'Project management SaaS' },
  { domain: 'nifty.pm', name: 'Nifty', source: 'project_mgmt_saas', description: 'Project management platform' },
  { domain: 'freedcamp.com', name: 'Freedcamp', source: 'project_mgmt_saas', description: 'Free project management SaaS' },
  { domain: 'paymoapp.com', name: 'Paymo', source: 'project_mgmt_saas', description: 'Project management with invoicing' },
  { domain: 'activecollab.com', name: 'ActiveCollab', source: 'project_mgmt_saas', description: 'Project management tool' },
  { domain: 'projectmanager.com', name: 'ProjectManager', source: 'project_mgmt_saas', description: 'Online project management' },
  { domain: 'instagantt.com', name: 'Instagantt', source: 'project_mgmt_saas', description: 'Gantt chart project management' },
  { domain: 'zohosprints.com', name: 'Zoho Sprints', source: 'project_mgmt_saas', description: 'Agile project management' },
  { domain: 'hive.com', name: 'Hive', source: 'project_mgmt_saas', description: 'Project management and collaboration' },
  { domain: 'beesbusy.com', name: 'Beebusy', source: 'project_mgmt_saas', description: 'Project planning tool' },
  { domain: 'plan.io', name: 'Plan.io', source: 'project_mgmt_saas', description: 'Project management with git hosting' },
  { domain: 'ganttpro.com', name: 'GanttPRO', source: 'project_mgmt_saas', description: 'Online Gantt chart software' },
  { domain: 'taskworld.com', name: 'Taskworld', source: 'project_mgmt_saas', description: 'Project management platform' },
  { domain: 'wrike.com', name: 'Wrike', source: 'project_mgmt_saas', description: 'Work management SaaS' },
  { domain: 'projecthuddle.com', name: 'ProjectHuddle', source: 'project_mgmt_saas', description: 'Client feedback on websites/designs' },
  { domain: 'teamgantt.com', name: 'TeamGantt', source: 'project_mgmt_saas', description: 'Gantt chart project management' },
  { domain: 'acteamo.com', name: 'Acteamo', source: 'project_mgmt_saas', description: 'Task management SaaS' },
  { domain: 'proworkflow.com', name: 'ProWorkflow', source: 'project_mgmt_saas', description: 'Project management SaaS' },
  { domain: 'quire.io', name: 'Quire', source: 'project_mgmt_saas', description: 'Collaborative project management' },
];

// === BATCH 6: CRM SaaS ===
const crmCompanies = [
  { domain: 'close.com', name: 'Close CRM', source: 'crm_saas', description: 'CRM for inside sales' },
  { domain: 'pipedrive.com', name: 'Pipedrive', source: 'crm_saas', description: 'Sales CRM pipeline management' },
  { domain: 'nutshell.com', name: 'Nutshell', source: 'crm_saas', description: 'CRM for small businesses' },
  { domain: 'lessannoyingcrm.com', name: 'Less Annoying CRM', source: 'crm_saas', description: 'Simple CRM for small businesses' },
  { domain: 'capsulecrm.com', name: 'Capsule CRM', source: 'crm_saas', description: 'Online CRM for small businesses' },
  { domain: 'copper.com', name: 'Copper CRM', source: 'crm_saas', description: 'CRM for Google Workspace' },
  { domain: 'nimble.com', name: 'Nimble', source: 'crm_saas', description: 'Social CRM for small teams' },
  { domain: 'streak.com', name: 'Streak', source: 'crm_saas', description: 'CRM inside Gmail' },
  { domain: 'honeybook.com', name: 'HoneyBook', source: 'crm_saas', description: 'CRM for creative businesses' },
  { domain: 'salesflare.com', name: 'Salesflare', source: 'crm_saas', description: 'Intelligent CRM for B2B startups' },
  { domain: 'hubspot.com', name: 'HubSpot', source: 'crm_saas', description: 'CRM and marketing platform' },
  { domain: 'zendesk.com', name: 'Zendesk', source: 'crm_saas', description: 'Customer service CRM' },
  { domain: 'freshsales.io', name: 'Freshsales', source: 'crm_saas', description: 'AI-powered CRM' },
  { domain: 'agilecrm.com', name: 'Agile CRM', source: 'crm_saas', description: 'All-in-one CRM for SMBs' },
  { domain: 'insightly.com', name: 'Insightly', source: 'crm_saas', description: 'CRM for growing businesses' },
  { domain: 'prosperworks.com', name: 'ProsperWorks', source: 'crm_saas', description: 'Google CRM solution' },
  { domain: 'sugarcrm.com', name: 'SugarCRM', source: 'crm_saas', description: 'CRM platform for enterprises' },
  { domain: 'pipelinecrm.com', name: 'Pipeline CRM', source: 'crm_saas', description: 'Sales CRM for teams' },
  { domain: 'teamleader.eu', name: 'Teamleader', source: 'crm_saas', description: 'CRM and project management' },
  { domain: 'vtiger.com', name: 'Vtiger', source: 'crm_saas', description: 'CRM for small businesses' },
];

// === BATCH 7: Analytics SaaS ===
const analyticsCompanies = [
  { domain: 'mixpanel.com', name: 'Mixpanel', source: 'analytics_saas', description: 'Product analytics SaaS' },
  { domain: 'amplitude.com', name: 'Amplitude', source: 'analytics_saas', description: 'Digital analytics platform' },
  { domain: 'heap.io', name: 'Heap', source: 'analytics_saas', description: 'Digital insights platform' },
  { domain: 'indicative.com', name: 'Indicative', source: 'analytics_saas', description: 'Customer analytics SaaS' },
  { domain: 'kissmetrics.com', name: 'Kissmetrics', source: 'analytics_saas', description: 'Behavioral analytics SaaS' },
  { domain: 'woopra.com', name: 'Woopra', source: 'analytics_saas', description: 'Customer journey analytics' },
  { domain: 'countly.com', name: 'Countly', source: 'analytics_saas', description: 'Product analytics platform' },
  { domain: 'posthog.com', name: 'PostHog', source: 'analytics_saas', description: 'Open source product analytics' },
  { domain: 'june.so', name: 'June', source: 'analytics_saas', description: 'Product analytics for SaaS' },
  { domain: 'chartmogul.com', name: 'ChartMogul', source: 'analytics_saas', description: 'Subscription analytics platform' },
  { domain: 'metabase.com', name: 'Metabase', source: 'analytics_saas', description: 'Business intelligence SaaS' },
  { domain: 'holistics.io', name: 'Holistics', source: 'analytics_saas', description: 'BI and analytics platform' },
  { domain: 'pendo.io', name: 'Pendo', source: 'analytics_saas', description: 'Product analytics and guidance' },
  { domain: 'hotjar.com', name: 'Hotjar', source: 'analytics_saas', description: 'Heatmaps and user behavior analytics' },
  { domain: 'fullstory.com', name: 'FullStory', source: 'analytics_saas', description: 'Digital experience analytics' },
  { domain: 'looker.com', name: 'Looker', source: 'analytics_saas', description: 'Business intelligence platform' },
  { domain: 'chartio.com', name: 'Chartio', source: 'analytics_saas', description: 'Cloud analytics SaaS' },
  { domain: 'databox.com', name: 'Databox', source: 'analytics_saas', description: 'Business analytics dashboard' },
  { domain: 'geckoboard.com', name: 'Geckoboard', source: 'analytics_saas', description: 'KPI dashboard SaaS' },
  { domain: 'klipfolio.com', name: 'Klipfolio', source: 'analytics_saas', description: 'Business dashboard SaaS' },
];

// === BATCH 8: HR SaaS ===
const hrCompanies = [
  { domain: 'bamboohr.com', name: 'BambooHR', source: 'hr_saas', description: 'HR software for small businesses' },
  { domain: 'gusto.com', name: 'Gusto', source: 'hr_saas', description: 'Payroll and HR platform' },
  { domain: 'lattice.com', name: 'Lattice', source: 'hr_saas', description: 'People management SaaS' },
  { domain: 'leapsome.com', name: 'Leapsome', source: 'hr_saas', description: 'People enablement platform' },
  { domain: 'culture.amp', name: 'Culture Amp', source: 'hr_saas', description: 'Employee experience platform' },
  { domain: 'cultureamp.com', name: 'Culture Amp', source: 'hr_saas', description: 'Employee experience platform' },
  { domain: 'personio.com', name: 'Personio', source: 'hr_saas', description: 'HR management SaaS for SMBs' },
  { domain: 'hibob.com', name: 'HiBob', source: 'hr_saas', description: 'Modern HR platform' },
  { domain: 'rippling.com', name: 'Rippling', source: 'hr_saas', description: 'HR and IT platform' },
  { domain: 'zenefits.com', name: 'Zenefits', source: 'hr_saas', description: 'HR, payroll, benefits SaaS' },
  { domain: 'remote.com', name: 'Remote', source: 'hr_saas', description: 'Global HR and payroll platform' },
  { domain: 'deel.com', name: 'Deel', source: 'hr_saas', description: 'Global payroll and compliance' },
  { domain: 'namely.com', name: 'Namely', source: 'hr_saas', description: 'HR platform for mid-market' },
  { domain: 'paylocity.com', name: 'Paylocity', source: 'hr_saas', description: 'Cloud HR and payroll software' },
  { domain: 'hris.com', name: 'HRIS', source: 'hr_saas', description: 'HR information system' },
  { domain: 'paycor.com', name: 'Paycor', source: 'hr_saas', description: 'HR and payroll SaaS' },
  { domain: 'humaans.io', name: 'Humaans', source: 'hr_saas', description: 'Modern HR system for fast-growing companies' },
  { domain: 'charliehr.com', name: 'CharlieHR', source: 'hr_saas', description: 'HR software for small teams' },
  { domain: 'recruitee.com', name: 'Recruitee', source: 'hr_saas', description: 'Collaborative hiring software' },
  { domain: 'workable.com', name: 'Workable', source: 'hr_saas', description: 'Recruiting software SaaS' },
];

// === BATCH 9: Accounting SaaS ===
const accountingCompanies = [
  { domain: 'freshbooks.com', name: 'FreshBooks', source: 'accounting_saas', description: 'Accounting SaaS for small businesses' },
  { domain: 'wave.com', name: 'Wave', source: 'accounting_saas', description: 'Free accounting software' },
  { domain: 'zohobooks.com', name: 'Zoho Books', source: 'accounting_saas', description: 'Online accounting SaaS' },
  { domain: 'xero.com', name: 'Xero', source: 'accounting_saas', description: 'Cloud-based accounting SaaS' },
  { domain: 'bench.co', name: 'Bench', source: 'accounting_saas', description: 'Bookkeeping for small businesses' },
  { domain: 'beanworks.com', name: 'Beanworks', source: 'accounting_saas', description: 'Accounts payable automation' },
  { domain: 'quaderno.io', name: 'Quaderno', source: 'accounting_saas', description: 'Tax compliance SaaS' },
  { domain: 'invoicera.com', name: 'Invoicera', source: 'accounting_saas', description: 'Online invoicing and billing' },
  { domain: 'invoiceninja.com', name: 'Invoice Ninja', source: 'accounting_saas', description: 'Open source invoicing SaaS' },
  { domain: 'harpoon.app', name: 'Harpoon', source: 'accounting_saas', description: 'Time tracking and invoicing for freelancers' },
  { domain: 'fiverr.com', name: 'Fiverr', source: 'accounting_saas', description: 'Freelance marketplace' },
  { domain: 'bonsai.io', name: 'Bonsai', source: 'accounting_saas', description: 'Contracts and invoicing for freelancers' },
  { domain: 'helioscope.com', name: 'HelioScope', source: 'accounting_saas', description: 'Solar design software' },
  { domain: 'plooto.com', name: 'Plooto', source: 'accounting_saas', description: 'Business payment automation' },
  { domain: 'tipalti.com', name: 'Tipalti', source: 'accounting_saas', description: 'Accounts payable automation' },
  { domain: 'bill.com', name: 'Bill.com', source: 'accounting_saas', description: 'AP/AR automation platform' },
  { domain: 'brex.com', name: 'Brex', source: 'accounting_saas', description: 'Business finance platform' },
  { domain: 'ramp.com', name: 'Ramp', source: 'accounting_saas', description: 'Corporate card and expense management' },
  { domain: 'expensify.com', name: 'Expensify', source: 'accounting_saas', description: 'Expense management SaaS' },
  { domain: 'divvy.co', name: 'Divvy', source: 'accounting_saas', description: 'Business budgeting and expense management' },
];

// === BATCH 10: Developer Tools SaaS ===
const devToolsCompanies = [
  { domain: 'sentry.io', name: 'Sentry', source: 'developer_tools_saas', description: 'Error tracking SaaS' },
  { domain: 'datadog.com', name: 'Datadog', source: 'developer_tools_saas', description: 'Monitoring and analytics SaaS' },
  { domain: 'logrocket.com', name: 'LogRocket', source: 'developer_tools_saas', description: 'Frontend monitoring and session replay' },
  { domain: 'rollbar.com', name: 'Rollbar', source: 'developer_tools_saas', description: 'Error monitoring SaaS' },
  { domain: 'bugsnag.com', name: 'Bugsnag', source: 'developer_tools_saas', description: 'Application stability monitoring' },
  { domain: 'raygun.com', name: 'Raygun', source: 'developer_tools_saas', description: 'Error monitoring and crash reporting' },
  { domain: 'honeybadger.io', name: 'Honeybadger', source: 'developer_tools_saas', description: 'Error and uptime monitoring for developers' },
  { domain: 'airbrake.io', name: 'Airbrake', source: 'developer_tools_saas', description: 'Error monitoring SaaS' },
  { domain: 'timber.io', name: 'Timber', source: 'developer_tools_saas', description: 'Structured logging SaaS' },
  { domain: 'papertrailapp.com', name: 'Papertrail', source: 'developer_tools_saas', description: 'Cloud log management' },
  { domain: 'logdna.com', name: 'LogDNA', source: 'developer_tools_saas', description: 'Log management SaaS' },
  { domain: 'sumo.com', name: 'Sumo Logic', source: 'developer_tools_saas', description: 'Log management and security analytics' },
  { domain: 'retool.com', name: 'Retool', source: 'developer_tools_saas', description: 'Internal tool builder SaaS' },
  { domain: 'appsmith.com', name: 'Appsmith', source: 'developer_tools_saas', description: 'Open source low-code platform' },
  { domain: 'tooljet.com', name: 'ToolJet', source: 'developer_tools_saas', description: 'Open source low-code builder' },
  { domain: 'budibase.com', name: 'Budibase', source: 'developer_tools_saas', description: 'Low-code platform for internal tools' },
  { domain: 'pipedream.com', name: 'Pipedream', source: 'developer_tools_saas', description: 'Integration platform for developers' },
  { domain: 'n8n.io', name: 'n8n', source: 'developer_tools_saas', description: 'Workflow automation for developers' },
  { domain: 'temporal.io', name: 'Temporal', source: 'developer_tools_saas', description: 'Workflow orchestration SaaS' },
  { domain: 'prefect.io', name: 'Prefect', source: 'developer_tools_saas', description: 'Data workflow orchestration' },
];

// === BATCH 11: Security/Compliance SaaS ===
const securityCompanies = [
  { domain: 'vanta.com', name: 'Vanta', source: 'security_compliance_saas', description: 'SOC2 compliance automation' },
  { domain: 'drata.com', name: 'Drata', source: 'security_compliance_saas', description: 'Security compliance automation' },
  { domain: 'secureframe.com', name: 'Secureframe', source: 'security_compliance_saas', description: 'Compliance automation SaaS' },
  { domain: 'thoropass.com', name: 'Thoropass', source: 'security_compliance_saas', description: 'Compliance management platform' },
  { domain: 'sprinto.com', name: 'Sprinto', source: 'security_compliance_saas', description: 'Compliance automation SaaS' },
  { domain: 'tugboatlogic.com', name: 'Tugboat Logic', source: 'security_compliance_saas', description: 'Security assurance automation' },
  { domain: 'oneleet.com', name: 'Oneleet', source: 'security_compliance_saas', description: 'Cybersecurity compliance SaaS' },
  { domain: 'strike.sh', name: 'Strike', source: 'security_compliance_saas', description: 'Penetration testing platform' },
  { domain: 'cobalt.io', name: 'Cobalt', source: 'security_compliance_saas', description: 'Pentesting as a service SaaS' },
  { domain: 'synack.com', name: 'Synack', source: 'security_compliance_saas', description: 'Security testing SaaS' },
  { domain: 'detectify.com', name: 'Detectify', source: 'security_compliance_saas', description: 'Web application scanning SaaS' },
  { domain: 'qualys.com', name: 'Qualys', source: 'security_compliance_saas', description: 'Cloud security SaaS' },
  { domain: 'tenable.com', name: 'Tenable', source: 'security_compliance_saas', description: 'Cybersecurity SaaS' },
  { domain: 'orca.security', name: 'Orca Security', source: 'security_compliance_saas', description: 'Cloud security platform' },
  { domain: 'lacework.com', name: 'Lacework', source: 'security_compliance_saas', description: 'Cloud security SaaS' },
  { domain: 'snyk.io', name: 'Snyk', source: 'security_compliance_saas', description: 'Developer security SaaS' },
  { domain: 'semgrep.dev', name: 'Semgrep', source: 'security_compliance_saas', description: 'Code security scanning SaaS' },
  { domain: 'sonarqube.org', name: 'SonarQube', source: 'security_compliance_saas', description: 'Code quality and security SaaS' },
  { domain: 'checkmarx.com', name: 'Checkmarx', source: 'security_compliance_saas', description: 'Application security testing SaaS' },
  { domain: 'veracode.com', name: 'Veracode', source: 'security_compliance_saas', description: 'Application security SaaS' },
];

// === BATCH 12: Design Tools SaaS ===
const designToolsCompanies = [
  { domain: 'canva.com', name: 'Canva', source: 'design_tools_saas', description: 'Online design platform' },
  { domain: 'figma.com', name: 'Figma', source: 'design_tools_saas', description: 'Collaborative design tool' },
  { domain: 'sketch.com', name: 'Sketch', source: 'design_tools_saas', description: 'Digital design SaaS' },
  { domain: 'invisionapp.com', name: 'InVision', source: 'design_tools_saas', description: 'Digital product design SaaS' },
  { domain: 'zeplin.io', name: 'Zeplin', source: 'design_tools_saas', description: 'Design handoff SaaS' },
  { domain: 'abstract.com', name: 'Abstract', source: 'design_tools_saas', description: 'Design version control SaaS' },
  { domain: 'framer.com', name: 'Framer', source: 'design_tools_saas', description: 'Web design and prototyping' },
  { domain: 'marvel.app', name: 'Marvel', source: 'design_tools_saas', description: 'Prototyping and design SaaS' },
  { domain: 'maze.co', name: 'Maze', source: 'design_tools_saas', description: 'User testing SaaS' },
  { domain: 'loom.com', name: 'Loom', source: 'design_tools_saas', description: 'Video messaging SaaS' },
  { domain: 'streamyard.com', name: 'StreamYard', source: 'design_tools_saas', description: 'Live streaming studio SaaS' },
  { domain: 'descript.com', name: 'Descript', source: 'design_tools_saas', description: 'Video and audio editing SaaS' },
  { domain: 'kapwing.com', name: 'Kapwing', source: 'design_tools_saas', description: 'Online video editor SaaS' },
  { domain: 'piktochart.com', name: 'Piktochart', source: 'design_tools_saas', description: 'Infographic maker SaaS' },
  { domain: 'visme.co', name: 'Visme', source: 'design_tools_saas', description: 'Visual content creation SaaS' },
  { domain: 'crello.com', name: 'Crello', source: 'design_tools_saas', description: 'Graphic design tool SaaS' },
  { domain: 'designstripe.com', name: 'Designstripe', source: 'design_tools_saas', description: 'Illustration creation platform' },
  { domain: 'icons8.com', name: 'Icons8', source: 'design_tools_saas', description: 'Icons, photos, and design tools' },
  { domain: 'flaticon.com', name: 'Flaticon', source: 'design_tools_saas', description: 'Icon library SaaS' },
  { domain: 'noun.project', name: 'Noun Project', source: 'design_tools_saas', description: 'Icons and stock photos' },
];

// === BATCH 13: Alternatives to Slack/Notion/Airtable ===
const alternativeCompanies = [
  // Slack alternatives
  { domain: 'mattermost.com', name: 'Mattermost', source: 'alt_to_slack', description: 'Open source team messaging' },
  { domain: 'rocket.chat', name: 'Rocket.Chat', source: 'alt_to_slack', description: 'Open source team communication' },
  { domain: 'zulip.com', name: 'Zulip', source: 'alt_to_slack', description: 'Organized team chat SaaS' },
  { domain: 'flock.com', name: 'Flock', source: 'alt_to_slack', description: 'Team messaging SaaS' },
  { domain: 'chanty.com', name: 'Chanty', source: 'alt_to_slack', description: 'Team chat SaaS' },
  { domain: 'pumble.com', name: 'Pumble', source: 'alt_to_slack', description: 'Free team communication SaaS' },
  { domain: 'glip.com', name: 'Glip', source: 'alt_to_slack', description: 'Team messaging and collaboration' },
  { domain: 'twist.com', name: 'Twist', source: 'alt_to_slack', description: 'Async team communication SaaS' },
  { domain: 'nooklyn.com', name: 'Nooklyn', source: 'alt_to_slack', description: 'Real estate SaaS platform' },
  { domain: 'voxer.com', name: 'Voxer', source: 'alt_to_slack', description: 'Walkie-talkie messaging app' },
  // Notion alternatives
  { domain: 'craft.do', name: 'Craft', source: 'alt_to_notion', description: 'Document and notes SaaS' },
  { domain: 'coda.io', name: 'Coda', source: 'alt_to_notion', description: 'Doc platform for teams' },
  { domain: 'slab.com', name: 'Slab', source: 'alt_to_notion', description: 'Team knowledge hub SaaS' },
  { domain: 'gitbook.com', name: 'GitBook', source: 'alt_to_notion', description: 'Documentation SaaS' },
  { domain: 'nuclino.com', name: 'Nuclino', source: 'alt_to_notion', description: 'Team wiki and collaboration' },
  { domain: 'almanac.io', name: 'Almanac', source: 'alt_to_notion', description: 'Collaborative docs for remote teams' },
  { domain: 'tettra.com', name: 'Tettra', source: 'alt_to_notion', description: 'Knowledge management SaaS' },
  { domain: 'guru.com', name: 'Guru', source: 'alt_to_notion', description: 'Knowledge management SaaS' },
  { domain: 'confluence.com', name: 'Confluence', source: 'alt_to_notion', description: 'Team collaboration wiki' },
  { domain: 'notionhq.com', name: 'Notion', source: 'alt_to_notion', description: 'All-in-one workspace' },
  // Airtable alternatives
  { domain: 'stackby.com', name: 'Stackby', source: 'alt_to_airtable', description: 'Spreadsheet-database hybrid SaaS' },
  { domain: 'seatable.io', name: 'SeaTable', source: 'alt_to_airtable', description: 'Online database-spreadsheet SaaS' },
  { domain: 'nocodb.com', name: 'NocoDB', source: 'alt_to_airtable', description: 'Open source Airtable alternative' },
  { domain: 'baserow.io', name: 'Baserow', source: 'alt_to_airtable', description: 'Open source database SaaS' },
  { domain: 'grist.com', name: 'Grist', source: 'alt_to_airtable', description: 'Modern spreadsheet-database SaaS' },
  { domain: 'smartsheet.com', name: 'Smartsheet', source: 'alt_to_airtable', description: 'Work management SaaS' },
  { domain: 'gridfox.com', name: 'Gridfox', source: 'alt_to_airtable', description: 'Work management database SaaS' },
  { domain: 'tadabase.io', name: 'Tadabase', source: 'alt_to_airtable', description: 'No-code app builder SaaS' },
  { domain: 'jotform.com', name: 'Jotform', source: 'alt_to_airtable', description: 'Online form builder' },
  { domain: 'fibery.io', name: 'Fibery', source: 'alt_to_airtable', description: 'Team work management SaaS' },
];

// === BATCH 14: Additional Small SaaS (Product Hunt, etc.) ===
const additionalSaas = [
  { domain: 'zipy.ai', name: 'Zipy', source: 'product_hunt', description: 'Session replay and analytics SaaS' },
  { domain: 'openreplay.com', name: 'OpenReplay', source: 'product_hunt', description: 'Open source session replay' },
  { domain: 'mouseflow.com', name: 'Mouseflow', source: 'product_hunt', description: 'Session replay and heatmaps SaaS' },
  { domain: 'clarity.ms', name: 'Microsoft Clarity', source: 'product_hunt', description: 'Free session recording tool' },
  { domain: 'inspectlet.com', name: 'Inspectlet', source: 'product_hunt', description: 'Session recording and heatmaps' },
  { domain: 'crazyegg.com', name: 'Crazy Egg', source: 'product_hunt', description: 'Heatmaps and A/B testing SaaS' },
  { domain: 'optimizely.com', name: 'Optimizely', source: 'product_hunt', description: 'Digital experience platform' },
  { domain: 'convertflow.com', name: 'ConvertFlow', source: 'product_hunt', description: 'CRO and lead capture SaaS' },
  { domain: 'unbounce.com', name: 'Unbounce', source: 'product_hunt', description: 'Landing page builder SaaS' },
  { domain: 'leadpages.com', name: 'Leadpages', source: 'product_hunt', description: 'Landing page and lead gen SaaS' },
  { domain: 'instapage.com', name: 'Instapage', source: 'product_hunt', description: 'Landing page platform SaaS' },
  { domain: 'swipePages.com', name: 'Swipe Pages', source: 'product_hunt', description: 'Mobile-first landing page builder' },
  { domain: 'webflow.com', name: 'Webflow', source: 'product_hunt', description: 'No-code website builder' },
  { domain: 'bubble.io', name: 'Bubble', source: 'product_hunt', description: 'No-code app builder' },
  { domain: 'adalo.com', name: 'Adalo', source: 'product_hunt', description: 'No-code mobile app builder' },
  { domain: 'glideapps.com', name: 'Glide', source: 'product_hunt', description: 'No-code app from spreadsheets' },
  { domain: 'softr.io', name: 'Softr', source: 'product_hunt', description: 'No-code apps from Airtable' },
  { domain: 'bravo.studio', name: 'Bravo Studio', source: 'product_hunt', description: 'No-code mobile app builder' },
  { domain: 'draftbit.com', name: 'Draftbit', source: 'product_hunt', description: 'Low-code mobile app builder' },
  { domain: 'thunkable.com', name: 'Thunkable', source: 'product_hunt', description: 'No-code mobile app builder' },
  { domain: 'memberstack.com', name: 'Memberstack', source: 'product_hunt', description: 'Membership and auth for websites' },
  { domain: 'memberful.com', name: 'Memberful', source: 'product_hunt', description: 'Membership management SaaS' },
  { domain: 'disco.co', name: 'Disco', source: 'product_hunt', description: 'Community platform for learning' },
  { domain: 'circle.so', name: 'Circle', source: 'product_hunt', description: 'Community platform SaaS' },
  { domain: 'commsor.com', name: 'Commsor', source: 'product_hunt', description: 'Community-led growth platform' },
  { domain: 'orbit.love', name: 'Orbit', source: 'product_hunt', description: 'Community growth platform' },
  { domain: 'common.room', name: 'Common Room', source: 'product_hunt', description: 'Community intelligence SaaS' },
  { domain: 'birdbrain.co', name: 'Birdbrain', source: 'product_hunt', description: 'Twitter analytics SaaS' },
  { domain: 'tweetdeck.com', name: 'TweetDeck', source: 'product_hunt', description: 'Twitter management tool' },
  { domain: 'hypefury.com', name: 'Hypefury', source: 'product_hunt', description: 'Twitter scheduling and automation' },
];

// === BATCH 15: SaaSHub Discovered Companies ===
const saashubCompanies = [
  { domain: 'surveymonkey.com', name: 'SurveyMonkey', source: 'saashub_directory', description: 'Online survey platform' },
  { domain: 'typeform.com', name: 'Typeform', source: 'saashub_directory', description: 'Conversational form builder SaaS' },
  { domain: 'tally.so', name: 'Tally', source: 'saashub_directory', description: 'Free form builder SaaS' },
  { domain: 'paperform.co', name: 'Paperform', source: 'saashub_directory', description: 'Online form builder with payments' },
  { domain: 'formstack.com', name: 'Formstack', source: 'saashub_directory', description: 'Online form builder SaaS' },
  { domain: 'cognito.forms', name: 'Cognito Forms', source: 'saashub_directory', description: 'Online form builder SaaS' },
  { domain: 'cognitoforms.com', name: 'Cognito Forms', source: 'saashub_directory', description: 'Powerful forms with conditional logic' },
  { domain: 'wufoo.com', name: 'Wufoo', source: 'saashub_directory', description: 'Online form builder' },
  { domain: 'formsite.com', name: 'Formsite', source: 'saashub_directory', description: 'Online form and survey builder' },
  { domain: '123formbuilder.com', name: '123FormBuilder', source: 'saashub_directory', description: 'Form builder SaaS' },
  { domain: 'gravity.forms', name: 'Gravity Forms', source: 'saashub_directory', description: 'WordPress form builder' },
  { domain: 'gravityforms.com', name: 'Gravity Forms', source: 'saashub_directory', description: 'Advanced WordPress forms SaaS' },
  { domain: 'helpscout.com', name: 'Help Scout', source: 'saashub_directory', description: 'Customer support SaaS' },
  { domain: 'freshdesk.com', name: 'Freshdesk', source: 'saashub_directory', description: 'Customer support SaaS' },
  { domain: 'kayako.com', name: 'Kayako', source: 'saashub_directory', description: 'Customer service platform' },
  { domain: 'groove.co', name: 'Groove', source: 'saashub_directory', description: 'Simple help desk SaaS' },
  { domain: 'deskpro.com', name: 'DeskPro', source: 'saashub_directory', description: 'Help desk SaaS' },
  { domain: 'teamwork.desk.com', name: 'Teamwork Desk', source: 'saashub_directory', description: 'Help desk for client teams' },
  { domain: 'supportbee.com', name: 'SupportBee', source: 'saashub_directory', description: 'Email ticketing SaaS' },
  { domain: 're-amaze.com', name: 'Re:amaze', source: 'saashub_directory', description: 'Customer support SaaS' },
];

// === BATCH 16: More niche finds ===
const nicheCompanies = [
  // Scheduling SaaS
  { domain: 'calendly.com', name: 'Calendly', source: 'scheduling_saas', description: 'Meeting scheduling SaaS' },
  { domain: 'acuityscheduling.com', name: 'Acuity Scheduling', source: 'scheduling_saas', description: 'Online appointment scheduling' },
  { domain: 'appointlet.com', name: 'Appointlet', source: 'scheduling_saas', description: 'Meeting scheduler SaaS' },
  { domain: 'youcanbook.me', name: 'YouCanBook.me', source: 'scheduling_saas', description: 'Online booking SaaS' },
  { domain: 'setmore.com', name: 'Setmore', source: 'scheduling_saas', description: 'Appointment scheduling SaaS' },
  { domain: 'simplybook.me', name: 'SimplyBook.me', source: 'scheduling_saas', description: 'Booking software SaaS' },
  { domain: 'doodle.com', name: 'Doodle', source: 'scheduling_saas', description: 'Meeting scheduling SaaS' },
  { domain: 'when2meet.com', name: 'When2meet', source: 'scheduling_saas', description: 'Group meeting scheduler' },
  { domain: 'savvycal.com', name: 'SavvyCal', source: 'scheduling_saas', description: 'Meeting scheduling for busy people' },
  // Time tracking
  { domain: 'toggl.com', name: 'Toggl', source: 'time_tracking_saas', description: 'Time tracking SaaS' },
  { domain: 'harvest.com', name: 'Harvest', source: 'time_tracking_saas', description: 'Time tracking and invoicing SaaS' },
  { domain: 'clockify.me', name: 'Clockify', source: 'time_tracking_saas', description: 'Free time tracking SaaS' },
  { domain: 'hubstaff.com', name: 'Hubstaff', source: 'time_tracking_saas', description: 'Time tracking for remote teams' },
  { domain: 'everhour.com', name: 'Everhour', source: 'time_tracking_saas', description: 'Team time tracking SaaS' },
  { domain: 'tick.com', name: 'Tick', source: 'time_tracking_saas', description: 'Time tracking SaaS' },
  { domain: 'timely.app', name: 'Timely', source: 'time_tracking_saas', description: 'Automatic time tracking SaaS' },
  // Survey/Research
  { domain: 'qualtrics.com', name: 'Qualtrics', source: 'survey_saas', description: 'Experience management SaaS' },
  { domain: 'delighted.com', name: 'Delighted', source: 'survey_saas', description: 'NPS and feedback SaaS' },
  { domain: 'nicereply.com', name: 'Nicereply', source: 'survey_saas', description: 'Customer satisfaction survey SaaS' },
  { domain: 'satismeter.com', name: 'Satismeter', source: 'survey_saas', description: 'Customer feedback SaaS' },
  // Document/e-Sign
  { domain: 'docusign.com', name: 'DocuSign', source: 'esign_saas', description: 'e-Signature SaaS' },
  { domain: 'hellosign.com', name: 'HelloSign', source: 'esign_saas', description: 'e-Signature SaaS' },
  { domain: 'signnow.com', name: 'SignNow', source: 'esign_saas', description: 'e-Signature SaaS' },
  { domain: 'pandadoc.com', name: 'PandaDoc', source: 'esign_saas', description: 'Document automation SaaS' },
  { domain: 'proposify.com', name: 'Proposify', source: 'esign_saas', description: 'Proposal software SaaS' },
  { domain: 'qwilr.com', name: 'Qwilr', source: 'esign_saas', description: 'Proposal and document SaaS' },
  { domain: 'betterproposals.io', name: 'Better Proposals', source: 'esign_saas', description: 'Business proposal software' },
  { domain: 'docsketch.com', name: 'DocSketch', source: 'esign_saas', description: 'Online signature SaaS' },
  // Live Chat
  { domain: 'tawk.to', name: 'Tawk.to', source: 'live_chat_saas', description: 'Free live chat SaaS' },
  { domain: 'livechat.com', name: 'LiveChat', source: 'live_chat_saas', description: 'Live chat software' },
  { domain: 'olark.com', name: 'Olark', source: 'live_chat_saas', description: 'Live chat SaaS' },
  { domain: 'freshchat.com', name: 'Freshchat', source: 'live_chat_saas', description: 'Messaging software for sales and support' },
  { domain: 'userlike.com', name: 'Userlike', source: 'live_chat_saas', description: 'Live chat SaaS' },
  { domain: 'smartsupp.com', name: 'Smartsupp', source: 'live_chat_saas', description: 'Live chat with video recordings' },
];

// Process all batches
const allBatches = [
  acquisitionCompanies, podcastCompanies, conferenceCompanies, emailMarketingCompanies,
  projectMgmtCompanies, crmCompanies, analyticsCompanies, hrCompanies,
  accountingCompanies, devToolsCompanies, securityCompanies, designToolsCompanies,
  alternativeCompanies, additionalSaas, saashubCompanies, nicheCompanies
];

for (const batch of allBatches) {
  for (const co of batch) {
    addCompany(co.domain, co.name, co.source, co.description);
  }
}

console.log(`\nAdded ${added} new unique companies to the queue`);
console.log('New entries sample:', newEntries.slice(0, 5));
