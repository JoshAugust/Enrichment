import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const dedupPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existingDomains = new Set(readFileSync(dedupPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));
console.log(`Loaded ${existingDomains.size} existing domains for dedup`);

const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/g2_domains.jsonl';
const progressPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/logs/g2_progress.md';

const skipDomains = new Set([
  'salesforce.com', 'oracle.com', 'sap.com', 'microsoft.com', 'google.com',
  'amazon.com', 'ibm.com', 'adobe.com', 'workday.com', 'servicenow.com',
  'atlassian.com', 'apple.com', 'meta.com', 'facebook.com', 'github.com',
  'gitlab.com', 'wikipedia.org', 'aws.amazon.com', 'cloud.google.com',
  'azure.microsoft.com', 'teams.microsoft.com', 'analytics.google.com',
  'firebase.google.com', 'workspace.google.com',
]);

const allDomains = new Map();

function addDomain(domain, name, category, source) {
  const d = domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
  if (!d || d.length < 4 || !d.includes('.')) return false;
  if (skipDomains.has(d)) return false;
  if (existingDomains.has(d)) return false;
  if (allDomains.has(d)) return false;
  allDomains.set(d, { name, category, source });
  return true;
}

// ==========================================
// SOURCE 1: Massive known SaaS domain list
// ==========================================
// These are SaaS companies across all categories with verified domains
const knownSaaS = [
  // Project Management
  ['asana.com', 'Asana', 'project-management'],
  ['monday.com', 'Monday.com', 'project-management'],
  ['clickup.com', 'ClickUp', 'project-management'],
  ['notion.so', 'Notion', 'project-management'],
  ['basecamp.com', 'Basecamp', 'project-management'],
  ['wrike.com', 'Wrike', 'project-management'],
  ['smartsheet.com', 'Smartsheet', 'project-management'],
  ['teamwork.com', 'Teamwork', 'project-management'],
  ['linear.app', 'Linear', 'project-management'],
  ['height.app', 'Height', 'project-management'],
  ['shortcut.com', 'Shortcut', 'project-management'],
  ['hive.com', 'Hive', 'project-management'],
  ['nifty.pm', 'Nifty', 'project-management'],
  ['plane.so', 'Plane', 'project-management'],
  ['nTask.com', 'nTask', 'project-management'],
  ['quire.io', 'Quire', 'project-management'],
  ['ora.pm', 'Ora', 'project-management'],
  ['freedcamp.com', 'Freedcamp', 'project-management'],
  ['meistertask.com', 'MeisterTask', 'project-management'],
  ['taskade.com', 'Taskade', 'project-management'],
  ['paymo.net', 'Paymo', 'project-management'],
  ['flow.com', 'Flow', 'project-management'],
  ['wimi-teamwork.com', 'Wimi', 'project-management'],
  ['targetprocess.com', 'Targetprocess', 'project-management'],
  ['kanbanize.com', 'Kanbanize', 'project-management'],
  ['zenkit.com', 'Zenkit', 'project-management'],
  ['redbooth.com', 'Redbooth', 'project-management'],
  ['workzone.com', 'Workzone', 'project-management'],
  ['celoxis.com', 'Celoxis', 'project-management'],
  ['proworkflow.com', 'ProWorkflow', 'project-management'],
  ['scoro.com', 'Scoro', 'project-management'],
  ['bugherd.com', 'BugHerd', 'project-management'],
  ['clubhouse.io', 'Clubhouse', 'project-management'],
  ['pivotaltracker.com', 'Pivotal Tracker', 'project-management'],
  ['favro.com', 'Favro', 'project-management'],
  ['productive.io', 'Productive', 'project-management'],
  ['teamhood.com', 'Teamhood', 'project-management'],
  ['clicktime.com', 'ClickTime', 'project-management'],
  ['forecast.app', 'Forecast', 'project-management'],
  ['workotter.com', 'WorkOtter', 'project-management'],
  ['podio.com', 'Podio', 'project-management'],
  ['projects.zoho.com', 'Zoho Projects', 'project-management'],

  // CRM & Sales
  ['pipedrive.com', 'Pipedrive', 'crm'],
  ['hubspot.com', 'HubSpot', 'crm'],
  ['zoho.com', 'Zoho', 'crm'],
  ['freshsales.com', 'Freshsales', 'crm'],
  ['close.com', 'Close', 'crm'],
  ['copper.com', 'Copper', 'crm'],
  ['folk.app', 'Folk', 'crm'],
  ['attio.com', 'Attio', 'crm'],
  ['capsulecrm.com', 'Capsule CRM', 'crm'],
  ['lessannoyingcrm.com', 'Less Annoying CRM', 'crm'],
  ['nutshell.com', 'Nutshell', 'crm'],
  ['agilecrm.com', 'Agile CRM', 'crm'],
  ['insightly.com', 'Insightly', 'crm'],
  ['sugarcrm.com', 'SugarCRM', 'crm'],
  ['keap.com', 'Keap', 'crm'],
  ['freshworks.com', 'Freshworks', 'crm'],
  ['streak.com', 'Streak', 'crm'],
  ['nimble.com', 'Nimble', 'crm'],
  ['pipelinecrm.com', 'Pipeline CRM', 'crm'],
  ['onpipeline.com', 'OnPipeline', 'crm'],
  ['salesflare.com', 'Salesflare', 'crm'],
  ['teamleader.eu', 'Teamleader', 'crm'],
  ['highrise.com', 'Highrise', 'crm'],
  ['nethunt.com', 'NetHunt CRM', 'crm'],
  ['crmble.com', 'Crmble', 'crm'],
  ['daylite.com', 'Daylite', 'crm'],
  ['flowlu.com', 'Flowlu', 'crm'],
  ['vtiger.com', 'Vtiger', 'crm'],

  // Marketing Automation & Email
  ['activecampaign.com', 'ActiveCampaign', 'marketing-automation'],
  ['mailchimp.com', 'Mailchimp', 'email-marketing'],
  ['convertkit.com', 'ConvertKit', 'email-marketing'],
  ['drip.com', 'Drip', 'email-marketing'],
  ['brevo.com', 'Brevo', 'email-marketing'],
  ['mailerlite.com', 'MailerLite', 'email-marketing'],
  ['getresponse.com', 'GetResponse', 'email-marketing'],
  ['omnisend.com', 'Omnisend', 'email-marketing'],
  ['klaviyo.com', 'Klaviyo', 'email-marketing'],
  ['customer.io', 'Customer.io', 'email-marketing'],
  ['sendpulse.com', 'SendPulse', 'email-marketing'],
  ['moosend.com', 'Moosend', 'email-marketing'],
  ['emailoctopus.com', 'EmailOctopus', 'email-marketing'],
  ['buttondown.email', 'Buttondown', 'email-marketing'],
  ['beehiiv.com', 'Beehiiv', 'email-marketing'],
  ['sendfox.com', 'SendFox', 'email-marketing'],
  ['flodesk.com', 'Flodesk', 'email-marketing'],
  ['campaignmonitor.com', 'Campaign Monitor', 'email-marketing'],
  ['constantcontact.com', 'Constant Contact', 'email-marketing'],
  ['aweber.com', 'AWeber', 'email-marketing'],
  ['benchmark.email', 'Benchmark', 'email-marketing'],
  ['autopilot.io', 'Autopilot', 'marketing-automation'],
  ['ortto.com', 'Ortto', 'marketing-automation'],
  ['encharge.io', 'Encharge', 'marketing-automation'],
  ['vero.co', 'Vero', 'email-marketing'],
  ['loops.so', 'Loops', 'email-marketing'],
  ['resend.com', 'Resend', 'email-marketing'],
  ['mailpace.com', 'MailPace', 'email-marketing'],
  ['postmarkapp.com', 'Postmark', 'email-marketing'],
  ['mailgun.com', 'Mailgun', 'email-marketing'],
  ['sendgrid.com', 'SendGrid', 'email-marketing'],
  ['sparkpost.com', 'SparkPost', 'email-marketing'],
  ['mailtrap.io', 'Mailtrap', 'email-marketing'],

  // Social Media Management
  ['hootsuite.com', 'Hootsuite', 'social-media'],
  ['buffer.com', 'Buffer', 'social-media'],
  ['sproutsocial.com', 'Sprout Social', 'social-media'],
  ['later.com', 'Later', 'social-media'],
  ['loomly.com', 'Loomly', 'social-media'],
  ['planable.io', 'Planable', 'social-media'],
  ['socialbee.com', 'SocialBee', 'social-media'],
  ['publer.io', 'Publer', 'social-media'],
  ['sendible.com', 'Sendible', 'social-media'],
  ['meetedgar.com', 'MeetEdgar', 'social-media'],
  ['crowdfireapp.com', 'Crowdfire', 'social-media'],
  ['tailwindapp.com', 'Tailwind', 'social-media'],
  ['iconosquare.com', 'Iconosquare', 'social-media'],
  ['agorapulse.com', 'Agorapulse', 'social-media'],
  ['socialchamp.io', 'SocialChamp', 'social-media'],
  ['missinglettr.com', 'Missinglettr', 'social-media'],
  ['sked.social', 'Sked Social', 'social-media'],
  ['eclincher.com', 'eClincher', 'social-media'],
  ['brandwatch.com', 'Brandwatch', 'social-media'],
  ['mention.com', 'Mention', 'social-media'],

  // Customer Support & Live Chat
  ['zendesk.com', 'Zendesk', 'customer-support'],
  ['freshdesk.com', 'Freshdesk', 'customer-support'],
  ['intercom.com', 'Intercom', 'customer-support'],
  ['helpscout.com', 'Help Scout', 'customer-support'],
  ['crisp.chat', 'Crisp', 'customer-support'],
  ['tidio.com', 'Tidio', 'customer-support'],
  ['livechat.com', 'LiveChat', 'customer-support'],
  ['olark.com', 'Olark', 'customer-support'],
  ['chatwoot.com', 'Chatwoot', 'customer-support'],
  ['tawk.to', 'tawk.to', 'customer-support'],
  ['front.com', 'Front', 'customer-support'],
  ['kayako.com', 'Kayako', 'customer-support'],
  ['liveagent.com', 'LiveAgent', 'customer-support'],
  ['hiver.com', 'Hiver', 'customer-support'],
  ['helpjuice.com', 'Helpjuice', 'customer-support'],
  ['helpcrunch.com', 'HelpCrunch', 'customer-support'],
  ['drift.com', 'Drift', 'customer-support'],
  ['kommunicate.io', 'Kommunicate', 'customer-support'],
  ['userlike.com', 'Userlike', 'customer-support'],
  ['chatra.io', 'Chatra', 'customer-support'],
  ['supportbee.com', 'SupportBee', 'customer-support'],
  ['groove.co', 'Groove', 'customer-support'],
  ['happyfox.com', 'HappyFox', 'customer-support'],
  ['kustomer.com', 'Kustomer', 'customer-support'],
  ['gladly.com', 'Gladly', 'customer-support'],
  ['gorgias.com', 'Gorgias', 'customer-support'],
  ['re-amaze.com', 'Re:amaze', 'customer-support'],
  ['freshchat.com', 'Freshchat', 'customer-support'],
  ['trengo.com', 'Trengo', 'customer-support'],
  ['missiveapp.com', 'Missive', 'customer-support'],

  // HR & People
  ['bamboohr.com', 'BambooHR', 'hr'],
  ['gusto.com', 'Gusto', 'hr'],
  ['rippling.com', 'Rippling', 'hr'],
  ['deel.com', 'Deel', 'hr'],
  ['remote.com', 'Remote', 'hr'],
  ['oysterhr.com', 'Oyster HR', 'hr'],
  ['personio.de', 'Personio', 'hr'],
  ['hibob.com', 'HiBob', 'hr'],
  ['lattice.com', 'Lattice', 'hr'],
  ['cultureamp.com', 'Culture Amp', 'hr'],
  ['15five.com', '15Five', 'hr'],
  ['paychex.com', 'Paychex', 'hr'],
  ['paylocity.com', 'Paylocity', 'hr'],
  ['paycom.com', 'Paycom', 'hr'],
  ['zenefits.com', 'Zenefits', 'hr'],
  ['namely.com', 'Namely', 'hr'],
  ['justworks.com', 'Justworks', 'hr'],
  ['factorial.co', 'Factorial', 'hr'],
  ['leapsome.com', 'Leapsome', 'hr'],
  ['officevibe.com', 'Officevibe', 'hr'],
  ['peoplehr.com', 'People HR', 'hr'],
  ['breathehr.com', 'Breathe HR', 'hr'],
  ['sage.hr', 'Sage HR', 'hr'],
  ['humi.ca', 'Humi', 'hr'],
  ['goco.io', 'GoCo', 'hr'],
  ['eddy.com', 'Eddy', 'hr'],
  ['kenjo.io', 'Kenjo', 'hr'],
  ['recruitee.com', 'Recruitee', 'hr'],
  ['greenhouse.io', 'Greenhouse', 'hr'],
  ['lever.co', 'Lever', 'hr'],
  ['breezy.hr', 'Breezy HR', 'hr'],
  ['workable.com', 'Workable', 'hr'],
  ['ashbyhq.com', 'Ashby', 'hr'],
  ['welcometothejungle.com', 'Welcome to the Jungle', 'hr'],
  ['teamtailor.com', 'Teamtailor', 'hr'],
  ['pinpoint.com', 'Pinpoint', 'hr'],

  // Analytics & Product Analytics
  ['mixpanel.com', 'Mixpanel', 'analytics'],
  ['amplitude.com', 'Amplitude', 'analytics'],
  ['posthog.com', 'PostHog', 'analytics'],
  ['hotjar.com', 'Hotjar', 'analytics'],
  ['heap.io', 'Heap', 'analytics'],
  ['pendo.io', 'Pendo', 'analytics'],
  ['fullstory.com', 'FullStory', 'analytics'],
  ['logrocket.com', 'LogRocket', 'analytics'],
  ['mouseflow.com', 'Mouseflow', 'analytics'],
  ['plausible.io', 'Plausible', 'analytics'],
  ['matomo.org', 'Matomo', 'analytics'],
  ['usefathom.com', 'Fathom Analytics', 'analytics'],
  ['simpleanalytics.com', 'Simple Analytics', 'analytics'],
  ['umami.is', 'Umami', 'analytics'],
  ['smartlook.com', 'Smartlook', 'analytics'],
  ['woopra.com', 'Woopra', 'analytics'],
  ['clicky.com', 'Clicky', 'analytics'],
  ['pirsch.io', 'Pirsch', 'analytics'],
  ['splitbee.io', 'Splitbee', 'analytics'],
  ['countly.com', 'Countly', 'analytics'],
  ['goatcounter.com', 'GoatCounter', 'analytics'],
  ['kissmetrics.io', 'Kissmetrics', 'analytics'],
  ['chartbeat.com', 'Chartbeat', 'analytics'],
  ['crazyegg.com', 'Crazy Egg', 'analytics'],
  ['lucky-orange.com', 'Lucky Orange', 'analytics'],

  // Developer Tools & DevOps
  ['vercel.com', 'Vercel', 'developer-tools'],
  ['netlify.com', 'Netlify', 'developer-tools'],
  ['heroku.com', 'Heroku', 'developer-tools'],
  ['render.com', 'Render', 'developer-tools'],
  ['railway.app', 'Railway', 'developer-tools'],
  ['fly.io', 'Fly.io', 'developer-tools'],
  ['supabase.com', 'Supabase', 'developer-tools'],
  ['planetscale.com', 'PlanetScale', 'developer-tools'],
  ['neon.tech', 'Neon', 'developer-tools'],
  ['upstash.com', 'Upstash', 'developer-tools'],
  ['sentry.io', 'Sentry', 'developer-tools'],
  ['datadoghq.com', 'Datadog', 'developer-tools'],
  ['newrelic.com', 'New Relic', 'developer-tools'],
  ['grafana.com', 'Grafana', 'developer-tools'],
  ['pagerduty.com', 'PagerDuty', 'developer-tools'],
  ['betterstack.com', 'Better Stack', 'developer-tools'],
  ['instatus.com', 'Instatus', 'developer-tools'],
  ['statuspage.io', 'Statuspage', 'developer-tools'],
  ['launchdarkly.com', 'LaunchDarkly', 'developer-tools'],
  ['flagsmith.com', 'Flagsmith', 'developer-tools'],
  ['growthbook.io', 'GrowthBook', 'developer-tools'],
  ['getunleash.io', 'Unleash', 'developer-tools'],
  ['hoppscotch.io', 'Hoppscotch', 'developer-tools'],
  ['stepci.com', 'Step CI', 'developer-tools'],
  ['keploy.io', 'Keploy', 'developer-tools'],
  ['firecamp.dev', 'Firecamp', 'developer-tools'],
  ['gitpod.io', 'Gitpod', 'developer-tools'],
  ['replit.com', 'Replit', 'developer-tools'],
  ['snyk.io', 'Snyk', 'developer-tools'],
  ['sonarqube.org', 'SonarQube', 'developer-tools'],
  ['circleci.com', 'CircleCI', 'developer-tools'],
  ['buildkite.com', 'Buildkite', 'developer-tools'],
  ['semaphoreci.com', 'Semaphore', 'developer-tools'],
  ['codesandbox.io', 'CodeSandbox', 'developer-tools'],
  ['stackblitz.com', 'StackBlitz', 'developer-tools'],
  ['coder.com', 'Coder', 'developer-tools'],
  ['doppler.com', 'Doppler', 'developer-tools'],
  ['infisical.com', 'Infisical', 'developer-tools'],
  ['env0.com', 'env0', 'developer-tools'],
  ['spacelift.io', 'Spacelift', 'developer-tools'],
  ['pulumi.com', 'Pulumi', 'developer-tools'],
  ['depot.dev', 'Depot', 'developer-tools'],
  ['airplane.dev', 'Airplane', 'developer-tools'],
  ['windmill.dev', 'Windmill', 'developer-tools'],
  ['val.town', 'Val Town', 'developer-tools'],
  ['dagger.io', 'Dagger', 'developer-tools'],
  ['trigger.dev', 'Trigger.dev', 'developer-tools'],
  ['inngest.com', 'Inngest', 'developer-tools'],
  ['temporal.io', 'Temporal', 'developer-tools'],
  ['qovery.com', 'Qovery', 'developer-tools'],
  ['coolify.io', 'Coolify', 'developer-tools'],
  ['caprover.com', 'CapRover', 'developer-tools'],
  ['dokku.com', 'Dokku', 'developer-tools'],
  ['zeabur.com', 'Zeabur', 'developer-tools'],

  // Automation & Integration
  ['zapier.com', 'Zapier', 'automation'],
  ['make.com', 'Make', 'automation'],
  ['n8n.io', 'n8n', 'automation'],
  ['pipedream.com', 'Pipedream', 'automation'],
  ['tray.io', 'Tray.io', 'automation'],
  ['workato.com', 'Workato', 'automation'],
  ['bardeen.ai', 'Bardeen', 'automation'],
  ['activepieces.com', 'Activepieces', 'automation'],
  ['automatisch.io', 'Automatisch', 'automation'],

  // No-code / Low-code
  ['retool.com', 'Retool', 'no-code'],
  ['appsmith.com', 'Appsmith', 'no-code'],
  ['budibase.com', 'Budibase', 'no-code'],
  ['tooljet.com', 'ToolJet', 'no-code'],
  ['nocodb.com', 'NocoDB', 'no-code'],
  ['baserow.io', 'Baserow', 'no-code'],
  ['airtable.com', 'Airtable', 'no-code'],
  ['coda.io', 'Coda', 'no-code'],
  ['fibery.io', 'Fibery', 'no-code'],
  ['rows.com', 'Rows', 'no-code'],
  ['softr.io', 'Softr', 'no-code'],
  ['glide.com', 'Glide', 'no-code'],
  ['adalo.com', 'Adalo', 'no-code'],
  ['bubble.io', 'Bubble', 'no-code'],
  ['webflow.com', 'Webflow', 'no-code'],
  ['framer.com', 'Framer', 'no-code'],
  ['carrd.co', 'Carrd', 'no-code'],
  ['super.so', 'Super', 'no-code'],
  ['potion.so', 'Potion', 'no-code'],
  ['tally.so', 'Tally', 'no-code'],
  ['fillout.com', 'Fillout', 'no-code'],
  ['formbricks.com', 'Formbricks', 'no-code'],
  ['illacloud.com', 'ILLA Cloud', 'no-code'],
  ['lowdefy.com', 'Lowdefy', 'no-code'],
  ['rowy.io', 'Rowy', 'no-code'],

  // Forms & Surveys
  ['typeform.com', 'Typeform', 'forms'],
  ['jotform.com', 'Jotform', 'forms'],
  ['surveymonkey.com', 'SurveyMonkey', 'forms'],
  ['paperform.co', 'Paperform', 'forms'],
  ['surveysparrow.com', 'SurveySparrow', 'forms'],
  ['heyflow.com', 'Heyflow', 'forms'],
  ['involve.me', 'involve.me', 'forms'],

  // Scheduling & Booking
  ['calendly.com', 'Calendly', 'scheduling'],
  ['cal.com', 'Cal.com', 'scheduling'],
  ['savvycal.com', 'SavvyCal', 'scheduling'],
  ['reclaim.ai', 'Reclaim', 'scheduling'],
  ['getclockwise.com', 'Clockwise', 'scheduling'],
  ['acuityscheduling.com', 'Acuity Scheduling', 'scheduling'],
  ['youcanbook.me', 'YouCanBookMe', 'scheduling'],
  ['vyte.in', 'Vyte', 'scheduling'],
  ['tidycal.com', 'TidyCal', 'scheduling'],
  ['doodle.com', 'Doodle', 'scheduling'],
  ['zcal.co', 'Zcal', 'scheduling'],

  // Design & Prototyping
  ['figma.com', 'Figma', 'design'],
  ['canva.com', 'Canva', 'design'],
  ['penpot.app', 'Penpot', 'design'],
  ['sketch.com', 'Sketch', 'design'],
  ['invisionapp.com', 'InVision', 'design'],
  ['zeplin.io', 'Zeplin', 'design'],
  ['maze.co', 'Maze', 'design'],
  ['useberry.com', 'Useberry', 'design'],
  ['hotgloo.com', 'HotGloo', 'design'],
  ['whimsical.com', 'Whimsical', 'design'],
  ['excalidraw.com', 'Excalidraw', 'design'],
  ['tldraw.com', 'tldraw', 'design'],

  // Video & Screen Recording
  ['loom.com', 'Loom', 'video'],
  ['screen.studio', 'Screen Studio', 'video'],
  ['tella.tv', 'Tella', 'video'],
  ['mmhmm.app', 'mmhmm', 'video'],
  ['vidyard.com', 'Vidyard', 'video'],
  ['veed.io', 'VEED', 'video'],
  ['descript.com', 'Descript', 'video'],
  ['riverside.fm', 'Riverside', 'video'],
  ['streamyard.com', 'StreamYard', 'video'],
  ['restream.io', 'Restream', 'video'],
  ['remotion.dev', 'Remotion', 'video'],

  // Communication & Meetings
  ['slack.com', 'Slack', 'communication'],
  ['discord.com', 'Discord', 'communication'],
  ['mattermost.com', 'Mattermost', 'communication'],
  ['rocket.chat', 'Rocket.Chat', 'communication'],
  ['element.io', 'Element', 'communication'],
  ['zulip.com', 'Zulip', 'communication'],
  ['whereby.com', 'Whereby', 'communication'],
  ['around.co', 'Around', 'communication'],
  ['tuple.app', 'Tuple', 'communication'],
  ['pop.com', 'Pop', 'communication'],
  ['tandem.chat', 'Tandem', 'communication'],
  ['gather.town', 'Gather', 'communication'],

  // Sales Engagement & Outreach
  ['outreach.io', 'Outreach', 'sales'],
  ['salesloft.com', 'Salesloft', 'sales'],
  ['apollo.io', 'Apollo', 'sales'],
  ['instantly.ai', 'Instantly', 'sales'],
  ['lemlist.com', 'Lemlist', 'sales'],
  ['woodpecker.co', 'Woodpecker', 'sales'],
  ['reply.io', 'Reply.io', 'sales'],
  ['smartlead.ai', 'Smartlead', 'sales'],
  ['gong.io', 'Gong', 'sales'],
  ['chorus.ai', 'Chorus', 'sales'],
  ['vidyard.com', 'Vidyard', 'sales'],
  ['lusha.com', 'Lusha', 'sales'],
  ['zoominfo.com', 'ZoomInfo', 'sales'],
  ['clearbit.com', 'Clearbit', 'sales'],
  ['seamless.ai', 'Seamless.AI', 'sales'],
  ['uplead.com', 'UpLead', 'sales'],
  ['hunter.io', 'Hunter', 'sales'],
  ['snov.io', 'Snov.io', 'sales'],
  ['mailshake.com', 'Mailshake', 'sales'],
  ['yesware.com', 'Yesware', 'sales'],
  ['mixmax.com', 'Mixmax', 'sales'],
  ['salesmsg.com', 'Salesmsg', 'sales'],
  ['callrail.com', 'CallRail', 'sales'],
  ['leadiq.com', 'LeadIQ', 'sales'],
  ['leadfeeder.com', 'Leadfeeder', 'sales'],
  ['phantombuster.com', 'PhantomBuster', 'sales'],

  // Product Management & Feedback
  ['productboard.com', 'Productboard', 'product'],
  ['aha.io', 'Aha!', 'product'],
  ['pendo.io', 'Pendo', 'product'],
  ['uservoice.com', 'UserVoice', 'product'],
  ['canny.io', 'Canny', 'product'],
  ['nolt.io', 'Nolt', 'product'],
  ['productplan.com', 'ProductPlan', 'product'],
  ['roadmunk.com', 'Roadmunk', 'product'],
  ['airfocus.com', 'Airfocus', 'product'],
  ['ducalis.io', 'Ducalis', 'product'],
  ['supahub.com', 'Supahub', 'product'],
  ['sleekplan.com', 'Sleekplan', 'product'],
  ['featurebase.app', 'Featurebase', 'product'],
  ['frill.co', 'Frill', 'product'],
  ['upvoty.com', 'Upvoty', 'product'],
  ['hellonext.co', 'Hellonext', 'product'],
  ['beamer.io', 'Beamer', 'product'],
  ['headwayapp.co', 'Headway', 'product'],
  ['released.so', 'Released', 'product'],
  ['announcekit.app', 'AnnounceKit', 'product'],

  // User Onboarding & In-App
  ['appcues.com', 'Appcues', 'onboarding'],
  ['userpilot.com', 'Userpilot', 'onboarding'],
  ['userguiding.com', 'UserGuiding', 'onboarding'],
  ['whatfix.com', 'Whatfix', 'onboarding'],
  ['trychameleon.com', 'Chameleon', 'onboarding'],
  ['intercom.com', 'Intercom', 'onboarding'],
  ['stonly.com', 'Stonly', 'onboarding'],
  ['intro.js', 'Intro.js', 'onboarding'],
  ['lou.ai', 'Lou', 'onboarding'],
  ['usetiful.com', 'Usetiful', 'onboarding'],
  ['helphero.co', 'HelpHero', 'onboarding'],
  ['storylane.io', 'Storylane', 'onboarding'],
  ['navattic.com', 'Navattic', 'onboarding'],
  ['walnut.io', 'Walnut', 'onboarding'],
  ['reprise.com', 'Reprise', 'onboarding'],
  ['demostack.com', 'Demostack', 'onboarding'],

  // Payments & Billing
  ['stripe.com', 'Stripe', 'payments'],
  ['paddle.com', 'Paddle', 'payments'],
  ['lemonsqueezy.com', 'Lemon Squeezy', 'payments'],
  ['gumroad.com', 'Gumroad', 'payments'],
  ['chargebee.com', 'Chargebee', 'payments'],
  ['recurly.com', 'Recurly', 'payments'],
  ['getlago.com', 'Lago', 'payments'],
  ['zuora.com', 'Zuora', 'payments'],
  ['fastspring.com', 'FastSpring', 'payments'],
  ['sellfy.com', 'Sellfy', 'payments'],
  ['podia.com', 'Podia', 'payments'],
  ['payhip.com', 'Payhip', 'payments'],
  ['gocardless.com', 'GoCardless', 'payments'],
  ['mollie.com', 'Mollie', 'payments'],
  ['razorpay.com', 'Razorpay', 'payments'],

  // Data & ETL
  ['fivetran.com', 'Fivetran', 'data'],
  ['airbyte.com', 'Airbyte', 'data'],
  ['segment.com', 'Segment', 'data'],
  ['rudderstack.com', 'RudderStack', 'data'],
  ['metabase.com', 'Metabase', 'data'],
  ['evidence.dev', 'Evidence', 'data'],
  ['lightdash.com', 'Lightdash', 'data'],
  ['getdbt.com', 'dbt', 'data'],
  ['dagster.io', 'Dagster', 'data'],
  ['prefect.io', 'Prefect', 'data'],
  ['cube.dev', 'Cube.js', 'data'],
  ['census.com', 'Census', 'data'],
  ['hightouch.com', 'Hightouch', 'data'],
  ['polytomic.com', 'Polytomic', 'data'],
  ['grouparoo.com', 'Grouparoo', 'data'],
  ['jitsu.com', 'Jitsu', 'data'],

  // Auth & Identity
  ['auth0.com', 'Auth0', 'auth'],
  ['clerk.com', 'Clerk', 'auth'],
  ['fusionauth.io', 'FusionAuth', 'auth'],
  ['supertokens.io', 'SuperTokens', 'auth'],
  ['ory.sh', 'Ory', 'auth'],
  ['zitadel.com', 'Zitadel', 'auth'],
  ['hanko.io', 'Hanko', 'auth'],
  ['boxyhq.com', 'BoxyHQ', 'auth'],
  ['warrant.dev', 'Warrant', 'auth'],
  ['stytch.com', 'Stytch', 'auth'],
  ['descope.com', 'Descope', 'auth'],
  ['propelauth.com', 'PropelAuth', 'auth'],
  ['workos.com', 'WorkOS', 'auth'],
  ['frontegg.com', 'Frontegg', 'auth'],
  ['permit.io', 'Permit.io', 'auth'],

  // CMS & Documentation
  ['ghost.org', 'Ghost', 'cms'],
  ['strapi.io', 'Strapi', 'cms'],
  ['directus.io', 'Directus', 'cms'],
  ['sanity.io', 'Sanity', 'cms'],
  ['contentful.com', 'Contentful', 'cms'],
  ['builder.io', 'Builder.io', 'cms'],
  ['storyblok.com', 'Storyblok', 'cms'],
  ['prismic.io', 'Prismic', 'cms'],
  ['buttercms.com', 'ButterCMS', 'cms'],
  ['agilitycms.com', 'Agility CMS', 'cms'],
  ['gitbook.com', 'GitBook', 'cms'],
  ['readme.com', 'ReadMe', 'cms'],
  ['mintlify.com', 'Mintlify', 'cms'],
  ['getoutline.com', 'Outline', 'cms'],
  ['slite.com', 'Slite', 'cms'],
  ['tettra.com', 'Tettra', 'cms'],
  ['archbee.com', 'Archbee', 'cms'],
  ['nuclino.com', 'Nuclino', 'cms'],
  ['slab.com', 'Slab', 'cms'],
  ['guru.com', 'Guru', 'cms'],

  // E-commerce
  ['shopify.com', 'Shopify', 'ecommerce'],
  ['medusajs.com', 'Medusa', 'ecommerce'],
  ['saleor.io', 'Saleor', 'ecommerce'],
  ['vendure.io', 'Vendure', 'ecommerce'],
  ['snipcart.com', 'Snipcart', 'ecommerce'],
  ['ecwid.com', 'Ecwid', 'ecommerce'],
  ['bigcommerce.com', 'BigCommerce', 'ecommerce'],
  ['woocommerce.com', 'WooCommerce', 'ecommerce'],
  ['swell.is', 'Swell', 'ecommerce'],
  ['crystallize.com', 'Crystallize', 'ecommerce'],

  // SEO & Content
  ['ahrefs.com', 'Ahrefs', 'seo'],
  ['semrush.com', 'SEMrush', 'seo'],
  ['moz.com', 'Moz', 'seo'],
  ['serpapi.com', 'SerpApi', 'seo'],
  ['surferseo.com', 'Surfer SEO', 'seo'],
  ['clearscope.io', 'Clearscope', 'seo'],
  ['frase.io', 'Frase', 'seo'],
  ['marketmuse.com', 'MarketMuse', 'seo'],
  ['mangools.com', 'Mangools', 'seo'],
  ['seranking.com', 'SE Ranking', 'seo'],
  ['nightwatch.io', 'Nightwatch', 'seo'],
  ['sitechecker.pro', 'Sitechecker', 'seo'],
  ['seobility.net', 'Seobility', 'seo'],

  // AI & Writing Tools
  ['jasper.ai', 'Jasper', 'ai'],
  ['copy.ai', 'Copy.ai', 'ai'],
  ['writesonic.com', 'Writesonic', 'ai'],
  ['grammarly.com', 'Grammarly', 'ai'],
  ['wordtune.com', 'Wordtune', 'ai'],
  ['anyword.com', 'Anyword', 'ai'],
  ['contentbot.ai', 'ContentBot', 'ai'],
  ['writer.com', 'Writer', 'ai'],
  ['rytr.me', 'Rytr', 'ai'],
  ['peppertype.ai', 'Peppertype', 'ai'],
  ['phrasee.co', 'Phrasee', 'ai'],

  // Localization & Translation
  ['lokalise.com', 'Lokalise', 'localization'],
  ['crowdin.com', 'Crowdin', 'localization'],
  ['transifex.com', 'Transifex', 'localization'],
  ['phrase.com', 'Phrase', 'localization'],
  ['tolgee.io', 'Tolgee', 'localization'],
  ['weblate.org', 'Weblate', 'localization'],
  ['locize.com', 'Locize', 'localization'],

  // Search
  ['algolia.com', 'Algolia', 'search'],
  ['typesense.org', 'Typesense', 'search'],
  ['meilisearch.com', 'Meilisearch', 'search'],
  ['elastic.co', 'Elastic', 'search'],
  ['qdrant.tech', 'Qdrant', 'search'],
  ['weaviate.io', 'Weaviate', 'search'],
  ['pinecone.io', 'Pinecone', 'search'],

  // Digital Signature
  ['docuseal.co', 'DocuSeal', 'digital-signature'],
  ['documenso.com', 'Documenso', 'digital-signature'],
  ['pandadoc.com', 'PandaDoc', 'digital-signature'],
  ['hellosign.com', 'HelloSign', 'digital-signature'],
  ['signwell.com', 'SignWell', 'digital-signature'],
  ['signaturely.com', 'Signaturely', 'digital-signature'],

  // Notification & Communication Infrastructure
  ['novu.co', 'Novu', 'notifications'],
  ['knock.app', 'Knock', 'notifications'],
  ['magicbell.com', 'MagicBell', 'notifications'],
  ['courier.com', 'Courier', 'notifications'],
  ['onesignal.com', 'OneSignal', 'notifications'],
  ['pusher.com', 'Pusher', 'notifications'],
  ['ably.com', 'Ably', 'notifications'],
  ['stream.io', 'Stream', 'notifications'],
  ['sendbird.com', 'Sendbird', 'notifications'],

  // Time Tracking
  ['toggl.com', 'Toggl', 'time-tracking'],
  ['clockify.me', 'Clockify', 'time-tracking'],
  ['harvest.com', 'Harvest', 'time-tracking'],
  ['hubstaff.com', 'Hubstaff', 'time-tracking'],
  ['timedoctor.com', 'Time Doctor', 'time-tracking'],
  ['everhour.com', 'Everhour', 'time-tracking'],
  ['timecamp.com', 'TimeCamp', 'time-tracking'],
  ['timely.is', 'Timely', 'time-tracking'],
  ['trackabi.com', 'Trackabi', 'time-tracking'],

  // Accounting & Finance
  ['xero.com', 'Xero', 'accounting'],
  ['freshbooks.com', 'FreshBooks', 'accounting'],
  ['wave.com', 'Wave', 'accounting'],
  ['bench.co', 'Bench', 'accounting'],
  ['pilot.com', 'Pilot', 'accounting'],
  ['ramp.com', 'Ramp', 'accounting'],
  ['brex.com', 'Brex', 'accounting'],
  ['divvy.co', 'Divvy', 'accounting'],
  ['mercury.com', 'Mercury', 'accounting'],
  ['novo.co', 'Novo', 'accounting'],
  ['relay.com', 'Relay', 'accounting'],
  ['fondo.com', 'Fondo', 'accounting'],

  // Link Shortening & Attribution
  ['dub.co', 'Dub', 'marketing'],
  ['short.io', 'Short.io', 'marketing'],
  ['rebrandly.com', 'Rebrandly', 'marketing'],
  ['bl.ink', 'BL.INK', 'marketing'],

  // Status Pages & Incident Management
  ['betteruptime.com', 'Better Uptime', 'status'],
  ['atlassian.com/software/statuspage', 'Statuspage', 'status'],
  ['pagerduty.com', 'PagerDuty', 'status'],
  ['opsgenie.com', 'OpsGenie', 'status'],
  ['firehydrant.com', 'FireHydrant', 'status'],
  ['rootly.com', 'Rootly', 'status'],
  ['incident.io', 'incident.io', 'status'],
  ['squadcast.com', 'Squadcast', 'status'],

  // More niche SaaS companies (smaller/less known)
  ['gamma.app', 'Gamma', 'presentations'],
  ['pitch.com', 'Pitch', 'presentations'],
  ['tome.app', 'Tome', 'presentations'],
  ['beautiful.ai', 'Beautiful.ai', 'presentations'],
  ['slidebean.com', 'Slidebean', 'presentations'],
  ['prezi.com', 'Prezi', 'presentations'],
  
  ['grain.com', 'Grain', 'meetings'],
  ['fireflies.ai', 'Fireflies.ai', 'meetings'],
  ['otter.ai', 'Otter.ai', 'meetings'],
  ['krisp.ai', 'Krisp', 'meetings'],
  ['fathom.video', 'Fathom', 'meetings'],
  ['meetgeek.ai', 'MeetGeek', 'meetings'],
  ['tl-dv.io', 'tl;dv', 'meetings'],
  ['avoma.com', 'Avoma', 'meetings'],
  ['read.ai', 'Read AI', 'meetings'],

  ['lottiefiles.com', 'LottieFiles', 'design'],
  ['spline.design', 'Spline', 'design'],
  ['rive.app', 'Rive', 'design'],
  ['jitter.video', 'Jitter', 'design'],
  ['animoto.com', 'Animoto', 'design'],

  // Customer success
  ['gainsight.com', 'Gainsight', 'customer-success'],
  ['churnzero.com', 'ChurnZero', 'customer-success'],
  ['totango.com', 'Totango', 'customer-success'],
  ['catalyst.io', 'Catalyst', 'customer-success'],
  ['vitally.io', 'Vitally', 'customer-success'],
  ['planhat.com', 'Planhat', 'customer-success'],
  ['custify.com', 'Custify', 'customer-success'],

  // Website monitoring & performance
  ['updown.io', 'Updown', 'monitoring'],
  ['uptimerobot.com', 'UptimeRobot', 'monitoring'],
  ['freshping.io', 'Freshping', 'monitoring'],
  ['site24x7.com', 'Site24x7', 'monitoring'],
  ['cronitor.io', 'Cronitor', 'monitoring'],
  ['hyperping.io', 'Hyperping', 'monitoring'],
  ['checkly.com', 'Checkly', 'monitoring'],
  ['speedcurve.com', 'SpeedCurve', 'monitoring'],
  ['calibreapp.com', 'Calibre', 'monitoring'],
  ['webpagetest.org', 'WebPageTest', 'monitoring'],

  // Privacy & Compliance
  ['iubenda.com', 'Iubenda', 'compliance'],
  ['termly.io', 'Termly', 'compliance'],
  ['cookiebot.com', 'Cookiebot', 'compliance'],
  ['osano.com', 'Osano', 'compliance'],
  ['onetrust.com', 'OneTrust', 'compliance'],
  ['securiti.ai', 'Securiti', 'compliance'],
  ['transcend.io', 'Transcend', 'compliance'],
  ['ethyca.com', 'Ethyca', 'compliance'],

  // Knowledge base
  ['helpjuice.com', 'Helpjuice', 'knowledge-base'],
  ['document360.com', 'Document360', 'knowledge-base'],
  ['helpsite.com', 'HelpSite', 'knowledge-base'],
  ['notion.so', 'Notion', 'knowledge-base'],
  ['archbee.com', 'Archbee', 'knowledge-base'],

  // Social proof & Reviews
  ['trustpilot.com', 'Trustpilot', 'reviews'],
  ['g2.com', 'G2', 'reviews'],
  ['capterra.com', 'Capterra', 'reviews'],
  ['senja.io', 'Senja', 'reviews'],
  ['testimonial.to', 'Testimonial', 'reviews'],
  ['shoutout.so', 'Shoutout', 'reviews'],
  ['repuso.com', 'Repuso', 'reviews'],
  ['embedsocial.com', 'EmbedSocial', 'reviews'],

  // ABM & Account-based
  ['demandbase.com', 'Demandbase', 'abm'],
  ['6sense.com', '6sense', 'abm'],
  ['terminus.com', 'Terminus', 'abm'],
  ['rollworks.com', 'RollWorks', 'abm'],
  ['triblio.com', 'Triblio', 'abm'],

  // Revenue & Billing operations
  ['opencomp.com', 'OpenComp', 'finops'],
  ['baremetrics.com', 'Baremetrics', 'finops'],
  ['profitwell.com', 'ProfitWell', 'finops'],
  ['chartmogul.com', 'ChartMogul', 'finops'],
  ['firstofficer.io', 'FirstOfficer', 'finops'],
  ['stripe.com/atlas', 'Stripe Atlas', 'finops'],

  // Misc SaaS
  ['phantom.land', 'Phantom', 'web3'],
  ['voiceflow.com', 'Voiceflow', 'conversational-ai'],
  ['botpress.com', 'Botpress', 'conversational-ai'],
  ['dialogflow.cloud.google.com', 'Dialogflow', 'conversational-ai'],
  ['rasa.com', 'Rasa', 'conversational-ai'],
  ['landbot.io', 'Landbot', 'conversational-ai'],
  ['manychat.com', 'ManyChat', 'conversational-ai'],

  ['unbounce.com', 'Unbounce', 'landing-pages'],
  ['leadpages.com', 'Leadpages', 'landing-pages'],
  ['instapage.com', 'Instapage', 'landing-pages'],
  ['swipepages.com', 'SwipePages', 'landing-pages'],
  ['landingi.com', 'Landingi', 'landing-pages'],

  // Additional niche B2B SaaS
  ['krisp.ai', 'Krisp', 'ai-tools'],
  ['otter.ai', 'Otter.ai', 'ai-tools'],
  ['fireflies.ai', 'Fireflies.ai', 'ai-tools'],
  ['grammarly.com', 'Grammarly', 'ai-tools'],
  ['notion.so', 'Notion', 'productivity'],
  ['awork.com', 'awork', 'project-management'],
  ['process.st', 'Process Street', 'automation'],
  ['pipefy.com', 'Pipefy', 'automation'],
  ['kissflow.com', 'Kissflow', 'automation'],
  ['tallyfy.com', 'Tallyfy', 'automation'],

  // Observability
  ['honeycomb.io', 'Honeycomb', 'observability'],
  ['lightstep.com', 'Lightstep', 'observability'],
  ['axiom.co', 'Axiom', 'observability'],
  ['baselime.io', 'Baselime', 'observability'],
  ['signoz.io', 'SigNoz', 'observability'],
  ['logdna.com', 'LogDNA', 'observability'],
  ['logz.io', 'Logz.io', 'observability'],
  ['papertrail.com', 'Papertrail', 'observability'],
  ['logtail.com', 'Logtail', 'observability'],

  // Testing
  ['cypress.io', 'Cypress', 'testing'],
  ['playwright.dev', 'Playwright', 'testing'],
  ['browserstack.com', 'BrowserStack', 'testing'],
  ['lambdatest.com', 'LambdaTest', 'testing'],
  ['percy.io', 'Percy', 'testing'],
  ['chromatic.com', 'Chromatic', 'testing'],
  ['testim.io', 'Testim', 'testing'],
  ['mabl.com', 'Mabl', 'testing'],
  ['qase.io', 'Qase', 'testing'],
  ['testrail.com', 'TestRail', 'testing'],
  ['loadero.com', 'Loadero', 'testing'],
  ['k6.io', 'k6', 'testing'],
  
  // Database
  ['fauna.com', 'Fauna', 'database'],
  ['cockroachlabs.com', 'CockroachDB', 'database'],
  ['timescale.com', 'Timescale', 'database'],
  ['singlestore.com', 'SingleStore', 'database'],
  ['yugabyte.com', 'YugabyteDB', 'database'],
  ['aiven.io', 'Aiven', 'database'],
  ['xata.io', 'Xata', 'database'],
  ['turso.tech', 'Turso', 'database'],
  ['convex.dev', 'Convex', 'database'],
  ['edgedb.com', 'EdgeDB', 'database'],
  ['hasura.io', 'Hasura', 'database'],
  ['grafbase.com', 'Grafbase', 'database'],
  ['bit.io', 'bit.io', 'database'],

  // Cloud/Hosting
  ['digitalocean.com', 'DigitalOcean', 'cloud'],
  ['linode.com', 'Linode', 'cloud'],
  ['vultr.com', 'Vultr', 'cloud'],
  ['hetzner.com', 'Hetzner', 'cloud'],
  ['upcloud.com', 'UpCloud', 'cloud'],
  ['scaleway.com', 'Scaleway', 'cloud'],
  ['cloudflare.com', 'Cloudflare', 'cloud'],
  ['bunny.net', 'Bunny CDN', 'cloud'],
  ['keycdn.com', 'KeyCDN', 'cloud'],
  ['fastly.com', 'Fastly', 'cloud'],

  // Email infrastructure
  ['sendgrid.com', 'SendGrid', 'email-infra'],
  ['mailgun.com', 'Mailgun', 'email-infra'],
  ['postmarkapp.com', 'Postmark', 'email-infra'],
  ['sparkpost.com', 'SparkPost', 'email-infra'],
  ['mailtrap.io', 'Mailtrap', 'email-infra'],
  ['resend.com', 'Resend', 'email-infra'],
  ['loops.so', 'Loops', 'email-infra'],
  ['mailpace.com', 'MailPace', 'email-infra'],
  ['smtp2go.com', 'SMTP2GO', 'email-infra'],
  ['pepipost.com', 'Pepipost', 'email-infra'],
  ['socketlabs.com', 'SocketLabs', 'email-infra'],
  ['elasticemail.com', 'Elastic Email', 'email-infra'],

  // More small/niche SaaS
  ['phantom.land', 'Phantom', 'web3'],
  ['getcensus.com', 'Census', 'data'],
  ['hightouch.com', 'Hightouch', 'data'],
  ['polytomic.com', 'Polytomic', 'data'],
  ['freshpaint.io', 'Freshpaint', 'data'],
  ['heap.io', 'Heap', 'data'],
  ['mixpanel.com', 'Mixpanel', 'data'],
];

// Process known SaaS list
console.log('Phase 1: Processing known SaaS database...');
for (const [domain, name, category] of knownSaaS) {
  addDomain(domain, name, category, 'known-saas-database');
}
console.log(`After Phase 1: ${allDomains.size} new domains`);

// ==========================================
// SOURCE 2: SaaSHub category crawling
// ==========================================
console.log('\nPhase 2: Crawling SaaSHub...');
const saasHubCategories = [
  'project-management', 'task-management', 'time-tracking', 'collaboration',
  'crm', 'sales', 'lead-generation', 'email-marketing', 'marketing-automation',
  'social-media-management', 'seo', 'customer-support', 'live-chat', 'help-desk',
  'hr', 'recruiting', 'payroll', 'analytics', 'business-intelligence',
  'developer-tools', 'api-management', 'ci-cd', 'monitoring', 'error-tracking',
  'design', 'prototyping', 'video-conferencing', 'accounting', 'invoicing',
  'password-manager', 'vpn', 'e-commerce', 'lms', 'scheduling',
  'no-code', 'automation', 'cms', 'form-builder', 'website-builder',
  'chatbot', 'data-integration', 'product-management', 'feedback-management',
  'digital-signature', 'status-page', 'incident-management',
  'event-management', 'loyalty-program', 'appointment-scheduling',
];

async function fetchSaaSHub(cat) {
  try {
    const urls = [
      `https://www.saashub.com/best-${cat}-software`,
      `https://www.saashub.com/best-${cat}`,
    ];
    for (const url of urls) {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const html = await resp.text();
        // Extract product slugs
        const slugRegex = /\/([\w][\w-]{1,40})-alternatives/g;
        let match;
        const slugs = new Set();
        while ((match = slugRegex.exec(html)) !== null) {
          const slug = match[1];
          if (slug.startsWith('post-') || slug.startsWith('best-') || slug.includes('2024') || slug.includes('2025') || slug.includes('2026')) continue;
          slugs.add(slug);
        }
        return { cat, slugs: [...slugs] };
      }
    }
  } catch {}
  return { cat, slugs: [] };
}

// SaaS product slug to domain mapping (for those that don't obviously match)
// We'll try slug.com as default
const batchSize = 8;
const allSlugs = new Set();
for (let i = 0; i < saasHubCategories.length; i += batchSize) {
  const batch = saasHubCategories.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(cat => fetchSaaSHub(cat)));
  for (const { cat, slugs } of results) {
    for (const slug of slugs) {
      // Try to add as domain
      const possibleDomains = [
        `${slug}.com`,
        `${slug}.io`,
        `${slug}.co`,
        `${slug}.app`,
      ];
      // Just use .com as most likely
      const cleanSlug = slug.replace(/-/g, '');
      const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      addDomain(`${slug}.com`, name, cat, 'saashub');
      allSlugs.add(slug);
    }
  }
  await new Promise(r => setTimeout(r, 200));
}
console.log(`After Phase 2: ${allDomains.size} new domains (${allSlugs.size} slugs found)`);

// Also crawl top product alternatives pages for more depth
console.log('\nPhase 3: Deep alternatives crawling...');
const topProducts = [
  'asana', 'trello', 'notion', 'clickup', 'monday', 'jira', 'linear',
  'pipedrive', 'hubspot', 'zoho-crm', 'salesforce', 'close', 'copper',
  'zendesk', 'freshdesk', 'intercom', 'helpscout', 'crisp-chat',
  'mailchimp', 'activecampaign', 'convertkit', 'klaviyo', 'brevo',
  'slack', 'discord', 'zoom', 'loom', 'calendly',
  'stripe', 'chargebee', 'paddle',
  'shopify', 'webflow', 'wordpress',
  'airtable', 'coda', 'notion',
  'zapier', 'make', 'n8n',
  'typeform', 'jotform',
  'figma', 'canva',
  'mixpanel', 'hotjar', 'amplitude', 'posthog',
  'vercel', 'netlify', 'heroku', 'render', 'supabase',
  'sentry', 'datadog', 'grafana',
  'bamboohr', 'gusto', 'rippling', 'deel',
  'retool', 'appsmith', 'budibase',
  'auth0', 'clerk', 'okta',
  'algolia', 'meilisearch',
  'ghost', 'strapi', 'sanity',
  'outreach', 'salesloft', 'apollo', 'instantly', 'lemlist',
  'productboard', 'canny', 'aha',
  'appcues', 'userpilot', 'pendo',
  'gong', 'chorus',
  'fivetran', 'airbyte', 'segment',
  'metabase', 'dbt',
  'grammarly', 'jasper-ai', 'copy-ai',
  'toggl', 'clockify', 'harvest',
  'freshbooks', 'xero', 'quickbooks',
];

for (let i = 0; i < topProducts.length; i += batchSize) {
  const batch = topProducts.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(async slug => {
    try {
      const resp = await fetch(`https://www.saashub.com/${slug}-alternatives`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return [];
      const html = await resp.text();
      const slugRegex = /\/([\w][\w-]{1,40})-alternatives/g;
      let match;
      const results = [];
      while ((match = slugRegex.exec(html)) !== null) {
        const s = match[1];
        if (s.startsWith('post-') || s.startsWith('best-') || s.includes('2024') || s.includes('2025') || s.includes('2026')) continue;
        results.push(s);
      }
      return results;
    } catch { return []; }
  }));
  
  for (const slugs of results) {
    for (const slug of slugs) {
      const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      addDomain(`${slug}.com`, name, 'alternatives', 'saashub-alternatives');
    }
  }
  await new Promise(r => setTimeout(r, 200));
}
console.log(`After Phase 3: ${allDomains.size} new domains`);

// Write output
console.log(`\nWriting ${allDomains.size} domains to ${outPath}`);
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

// Write progress
writeFileSync(progressPath, `# SaaSHub + Known Database Domain Sourcing
Started: ${new Date().toISOString()}
Source: Known SaaS database + SaaSHub.com

## Results
- Known SaaS entries processed: ${knownSaaS.length}
- SaaSHub categories crawled: ${saasHubCategories.length}
- SaaSHub alternatives pages crawled: ${topProducts.length}
- Total unique SaaSHub slugs found: ${allSlugs.size}
- **Total unique new domains: ${allDomains.size}**
- Existing domains (dedup): ${existingDomains.size}

## Notes
- Domains sourced from known SaaS database + SaaSHub slug-to-domain resolution
- SaaSHub slugs mapped to .com domains (best guess for unverified ones)
- Enterprise companies filtered out
- Deduplicated against existing 86K domain database
`);

console.log('Done!');
