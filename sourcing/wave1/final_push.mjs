import { readFileSync, appendFileSync } from 'fs';

const dedupPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt';
const existingDomains = new Set(readFileSync(dedupPath, 'utf8').split('\n').map(d => d.trim().toLowerCase()).filter(Boolean));

const outPath = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave1/g2_domains.jsonl';
const existingOutput = new Set();
for (const line of readFileSync(outPath, 'utf8').split('\n').filter(Boolean)) {
  existingOutput.add(JSON.parse(line).domain);
}
console.log(`Starting with ${existingOutput.size} existing output domains`);

let newCount = 0;
let output = '';

function add(domain, name, category, source = 'curated') {
  const d = domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');
  if (!d || !d.includes('.') || d.length < 4) return;
  if (existingDomains.has(d) || existingOutput.has(d)) return;
  output += JSON.stringify({ domain: d, name, source, category, metadata: {} }) + '\n';
  existingOutput.add(d);
  newCount++;
}

// MASSIVE batch of additional SaaS companies
const additions = [
  // AI/ML Tools
  ['anthropic.com', 'Anthropic', 'ai'], ['openai.com', 'OpenAI', 'ai'],
  ['cohere.com', 'Cohere', 'ai'], ['stability.ai', 'Stability AI', 'ai'],
  ['huggingface.co', 'Hugging Face', 'ai'], ['replicate.com', 'Replicate', 'ai'],
  ['together.ai', 'Together AI', 'ai'], ['anyscale.com', 'Anyscale', 'ai'],
  ['modal.com', 'Modal', 'ai'], ['banana.dev', 'Banana', 'ai'],
  ['deepgram.com', 'Deepgram', 'ai'], ['assemblyai.com', 'AssemblyAI', 'ai'],
  ['elevenlabs.io', 'ElevenLabs', 'ai'], ['play.ht', 'Play.ht', 'ai'],
  ['synthesia.io', 'Synthesia', 'ai'], ['runway.ml', 'Runway', 'ai'],
  ['midjourney.com', 'Midjourney', 'ai'], ['leonardo.ai', 'Leonardo.ai', 'ai'],
  ['ideogram.ai', 'Ideogram', 'ai'], ['perplexity.ai', 'Perplexity', 'ai'],
  ['you.com', 'You.com', 'ai'], ['phind.com', 'Phind', 'ai'],
  ['cursor.sh', 'Cursor', 'ai'], ['codeium.com', 'Codeium', 'ai'],
  ['tabnine.com', 'Tabnine', 'ai'], ['sourcegraph.com', 'Sourcegraph', 'ai'],
  ['v0.dev', 'v0', 'ai'], ['bolt.new', 'Bolt', 'ai'],
  ['lovable.dev', 'Lovable', 'ai'], ['gptzero.me', 'GPTZero', 'ai'],
  ['originality.ai', 'Originality.ai', 'ai'], ['undetectable.ai', 'Undetectable AI', 'ai'],
  ['lmsys.org', 'LMSYS', 'ai'], ['langchain.com', 'LangChain', 'ai'],
  ['llamaindex.ai', 'LlamaIndex', 'ai'], ['vellum.ai', 'Vellum', 'ai'],
  ['humanloop.com', 'Humanloop', 'ai'], ['promptlayer.com', 'PromptLayer', 'ai'],
  ['baseten.co', 'Baseten', 'ai'], ['fireworks.ai', 'Fireworks AI', 'ai'],
  ['groq.com', 'Groq', 'ai'], ['cerebras.net', 'Cerebras', 'ai'],
  ['sambanova.ai', 'SambaNova', 'ai'],
  
  // More Dev Tools
  ['linear.app', 'Linear', 'dev-tools'], ['arc.dev', 'Arc', 'dev-tools'],
  ['mintlify.com', 'Mintlify', 'dev-tools'], ['readme.com', 'ReadMe', 'dev-tools'],
  ['gitbook.com', 'GitBook', 'dev-tools'], ['swimm.io', 'Swimm', 'dev-tools'],
  ['devin.ai', 'Devin', 'dev-tools'], ['cognition.ai', 'Cognition', 'dev-tools'],
  ['trunk.io', 'Trunk', 'dev-tools'], ['codacy.com', 'Codacy', 'dev-tools'],
  ['codecov.io', 'Codecov', 'dev-tools'], ['coveralls.io', 'Coveralls', 'dev-tools'],
  ['renovatebot.com', 'Renovate', 'dev-tools'], ['release.com', 'Release', 'dev-tools'],
  ['gitpod.io', 'Gitpod', 'dev-tools'], ['coder.com', 'Coder', 'dev-tools'],
  ['codespaces.github.com', 'GitHub Codespaces', 'dev-tools'],
  ['stackblitz.com', 'StackBlitz', 'dev-tools'], ['codesandbox.io', 'CodeSandbox', 'dev-tools'],
  ['bun.sh', 'Bun', 'dev-tools'], ['deno.com', 'Deno', 'dev-tools'],
  ['nix.dev', 'Nix', 'dev-tools'], ['devpod.sh', 'DevPod', 'dev-tools'],
  ['fig.io', 'Fig', 'dev-tools'], ['warp.dev', 'Warp', 'dev-tools'],
  ['iterm2.com', 'iTerm2', 'dev-tools'], ['alacritty.org', 'Alacritty', 'dev-tools'],
  ['ray.so', 'Ray.so', 'dev-tools'], ['carbon.now.sh', 'Carbon', 'dev-tools'],
  ['snappify.com', 'Snappify', 'dev-tools'], ['chalk.ist', 'Chalk.ist', 'dev-tools'],
  
  // More CRM & Sales tools
  ['salesforce.com', 'Salesforce', 'crm'],
  ['highperformer.com', 'HighPerformer', 'crm'],
  ['freshworks.com', 'Freshworks', 'crm'],
  ['teamleader.eu', 'Teamleader', 'crm'],
  ['salesflare.com', 'Salesflare', 'crm'],
  ['nethunt.com', 'NetHunt CRM', 'crm'],
  ['daylite.com', 'Daylite', 'crm'],
  ['flowlu.com', 'Flowlu', 'crm'],
  ['vtiger.com', 'Vtiger', 'crm'],
  ['bitrix24.com', 'Bitrix24', 'crm'],
  ['odoo.com', 'Odoo', 'crm'],
  ['suitecrm.com', 'SuiteCRM', 'crm'],
  ['espocrm.com', 'EspoCRM', 'crm'],
  ['corteza.org', 'Corteza', 'crm'],
  ['twentycrm.com', 'Twenty CRM', 'crm'],
  
  // E-commerce / marketplace
  ['shopify.com', 'Shopify', 'ecommerce'],
  ['bigcommerce.com', 'BigCommerce', 'ecommerce'],
  ['woocommerce.com', 'WooCommerce', 'ecommerce'],
  ['squarespace.com', 'Squarespace', 'ecommerce'],
  ['wix.com', 'Wix', 'ecommerce'],
  ['ecwid.com', 'Ecwid', 'ecommerce'],
  ['volusion.com', 'Volusion', 'ecommerce'],
  ['3dcart.com', '3dcart', 'ecommerce'],
  ['prestashop.com', 'PrestaShop', 'ecommerce'],
  ['magento.com', 'Magento', 'ecommerce'],
  ['snipcart.com', 'Snipcart', 'ecommerce'],
  ['crystallize.com', 'Crystallize', 'ecommerce'],
  ['swell.is', 'Swell', 'ecommerce'],
  ['commerce.js', 'Commerce.js', 'ecommerce'],
  ['spree.io', 'Spree', 'ecommerce'],
  ['reaction.commerce', 'Reaction Commerce', 'ecommerce'],
  ['solidus.io', 'Solidus', 'ecommerce'],
  ['printful.com', 'Printful', 'ecommerce'],
  ['printify.com', 'Printify', 'ecommerce'],
  ['teespring.com', 'Teespring', 'ecommerce'],
  
  // Fintech & Payments
  ['wise.com', 'Wise', 'fintech'],
  ['revolut.com', 'Revolut', 'fintech'],
  ['mercury.com', 'Mercury', 'fintech'],
  ['brex.com', 'Brex', 'fintech'],
  ['ramp.com', 'Ramp', 'fintech'],
  ['deel.com', 'Deel', 'fintech'],
  ['payhawk.com', 'Payhawk', 'fintech'],
  ['airwallex.com', 'Airwallex', 'fintech'],
  ['adyen.com', 'Adyen', 'fintech'],
  ['checkout.com', 'Checkout.com', 'fintech'],
  ['plaid.com', 'Plaid', 'fintech'],
  ['teller.io', 'Teller', 'fintech'],
  ['mx.com', 'MX', 'fintech'],
  ['finicity.com', 'Finicity', 'fintech'],
  ['sardine.ai', 'Sardine', 'fintech'],
  ['unit.co', 'Unit', 'fintech'],
  ['treasury-prime.com', 'Treasury Prime', 'fintech'],
  ['column.com', 'Column', 'fintech'],
  ['synapse.fi', 'Synapse', 'fintech'],
  ['lithic.com', 'Lithic', 'fintech'],
  ['marqeta.com', 'Marqeta', 'fintech'],
  ['galileo-ft.com', 'Galileo', 'fintech'],
  ['i2c.com', 'i2c', 'fintech'],
  
  // Security
  ['snyk.io', 'Snyk', 'security'],
  ['1password.com', '1Password', 'security'],
  ['bitwarden.com', 'Bitwarden', 'security'],
  ['lastpass.com', 'LastPass', 'security'],
  ['dashlane.com', 'Dashlane', 'security'],
  ['keeper.io', 'Keeper', 'security'],
  ['nordpass.com', 'NordPass', 'security'],
  ['crowdstrike.com', 'CrowdStrike', 'security'],
  ['sentinelone.com', 'SentinelOne', 'security'],
  ['lacework.com', 'Lacework', 'security'],
  ['orca.security', 'Orca Security', 'security'],
  ['wiz.io', 'Wiz', 'security'],
  ['bridgecrew.io', 'Bridgecrew', 'security'],
  ['aquasec.com', 'Aqua Security', 'security'],
  ['falco.org', 'Falco', 'security'],
  ['sysdig.com', 'Sysdig', 'security'],
  ['chainguard.dev', 'Chainguard', 'security'],
  ['sigstore.dev', 'Sigstore', 'security'],
  ['socket.dev', 'Socket', 'security'],
  ['semgrep.dev', 'Semgrep', 'security'],
  ['endorlabs.com', 'Endor Labs', 'security'],
  ['jfrog.com', 'JFrog', 'security'],
  ['sonatype.com', 'Sonatype', 'security'],
  ['veracode.com', 'Veracode', 'security'],
  ['checkmarx.com', 'Checkmarx', 'security'],
  ['stackhawk.com', 'StackHawk', 'security'],
  ['probely.com', 'Probely', 'security'],
  ['detectify.com', 'Detectify', 'security'],
  ['intruder.io', 'Intruder', 'security'],
  
  // Infrastructure & Cloud
  ['terraform.io', 'Terraform', 'infrastructure'],
  ['crossplane.io', 'Crossplane', 'infrastructure'],
  ['portainer.io', 'Portainer', 'infrastructure'],
  ['rancher.com', 'Rancher', 'infrastructure'],
  ['k3s.io', 'K3s', 'infrastructure'],
  ['talos.dev', 'Talos', 'infrastructure'],
  ['siderolink.com', 'Sidero', 'infrastructure'],
  ['flux-cd.io', 'Flux', 'infrastructure'],
  ['argoproj.github.io', 'Argo', 'infrastructure'],
  ['tekton.dev', 'Tekton', 'infrastructure'],
  ['helm.sh', 'Helm', 'infrastructure'],
  ['kustomize.io', 'Kustomize', 'infrastructure'],
  ['cdk8s.io', 'CDK8s', 'infrastructure'],
  ['tilt.dev', 'Tilt', 'infrastructure'],
  ['garden.io', 'Garden', 'infrastructure'],
  ['skaffold.dev', 'Skaffold', 'infrastructure'],
  ['okteto.com', 'Okteto', 'infrastructure'],
  ['devspace.sh', 'DevSpace', 'infrastructure'],
  ['loft.sh', 'Loft', 'infrastructure'],
  ['vcluster.com', 'vCluster', 'infrastructure'],
  
  // Education & Learning
  ['teachable.com', 'Teachable', 'education'],
  ['thinkific.com', 'Thinkific', 'education'],
  ['podia.com', 'Podia', 'education'],
  ['kajabi.com', 'Kajabi', 'education'],
  ['learnworlds.com', 'LearnWorlds', 'education'],
  ['talentlms.com', 'TalentLMS', 'education'],
  ['docebo.com', 'Docebo', 'education'],
  ['360learning.com', '360Learning', 'education'],
  ['lessonly.com', 'Lessonly', 'education'],
  ['eduflow.com', 'Eduflow', 'education'],
  ['moodle.org', 'Moodle', 'education'],
  ['canvas.instructure.com', 'Canvas LMS', 'education'],
  
  // Legal & Contract
  ['clio.com', 'Clio', 'legal'],
  ['mycase.com', 'MyCase', 'legal'],
  ['smokeball.com', 'Smokeball', 'legal'],
  ['practicepanther.com', 'PracticePanther', 'legal'],
  ['rocketlawyer.com', 'Rocket Lawyer', 'legal'],
  ['legalzoom.com', 'LegalZoom', 'legal'],
  ['contractpodai.com', 'ContractPodAi', 'legal'],
  ['ironclad.com', 'Ironclad', 'legal'],
  ['icertis.com', 'Icertis', 'legal'],
  ['concord.app', 'Concord', 'legal'],
  ['precisely.com', 'Precisely', 'legal'],
  ['juro.com', 'Juro', 'legal'],
  ['getterms.io', 'GetTerms', 'legal'],
  
  // Real Estate & Property
  ['appfolio.com', 'AppFolio', 'real-estate'],
  ['buildium.com', 'Buildium', 'real-estate'],
  ['rentmanager.com', 'Rent Manager', 'real-estate'],
  ['propertyware.com', 'Propertyware', 'real-estate'],
  ['tokko.com', 'Tokko', 'real-estate'],
  ['guesty.com', 'Guesty', 'real-estate'],
  ['hostaway.com', 'Hostaway', 'real-estate'],
  ['ownerrez.com', 'OwnerRez', 'real-estate'],
  ['lodgify.com', 'Lodgify', 'real-estate'],
  
  // Healthcare
  ['drchrono.com', 'DrChrono', 'healthcare'],
  ['jane.app', 'Jane App', 'healthcare'],
  ['cliniko.com', 'Cliniko', 'healthcare'],
  ['simplepractice.com', 'SimplePractice', 'healthcare'],
  ['theranest.com', 'TheraNest', 'healthcare'],
  ['therapynotes.com', 'TherapyNotes', 'healthcare'],
  ['kareo.com', 'Kareo', 'healthcare'],
  ['athenahealth.com', 'Athenahealth', 'healthcare'],
  ['practicesuite.com', 'PracticeSuite', 'healthcare'],
  ['luminello.com', 'Luminello', 'healthcare'],
  
  // Restaurant & Food
  ['toast.com', 'Toast', 'restaurant'],
  ['square.com', 'Square', 'restaurant'],
  ['clover.com', 'Clover', 'restaurant'],
  ['lightspeedhq.com', 'Lightspeed', 'restaurant'],
  ['touchbistro.com', 'TouchBistro', 'restaurant'],
  ['revel.systems', 'Revel Systems', 'restaurant'],
  ['upserve.com', 'Upserve', 'restaurant'],
  ['marketman.com', 'MarketMan', 'restaurant'],
  ['crunchtime.com', 'CrunchTime', 'restaurant'],
  
  // Fitness & Wellness
  ['mindbodyonline.com', 'Mindbody', 'fitness'],
  ['glofox.com', 'Glofox', 'fitness'],
  ['wodify.com', 'Wodify', 'fitness'],
  ['zenplanner.com', 'Zen Planner', 'fitness'],
  ['pike13.com', 'Pike13', 'fitness'],
  ['vagaro.com', 'Vagaro', 'fitness'],
  ['acuityscheduling.com', 'Acuity', 'fitness'],
  ['fresha.com', 'Fresha', 'fitness'],
  ['booksy.com', 'Booksy', 'fitness'],
  ['mangomint.com', 'Mangomint', 'fitness'],
  
  // Construction & Field Service
  ['procore.com', 'Procore', 'construction'],
  ['buildertrend.com', 'Buildertrend', 'construction'],
  ['coconstruct.com', 'CoConstruct', 'construction'],
  ['fieldwire.com', 'Fieldwire', 'construction'],
  ['plangrid.com', 'PlanGrid', 'construction'],
  ['bluebeam.com', 'Bluebeam', 'construction'],
  ['jobber.com', 'Jobber', 'field-service'],
  ['housecallpro.com', 'Housecall Pro', 'field-service'],
  ['servicetitan.com', 'ServiceTitan', 'field-service'],
  ['synchroteam.com', 'Synchroteam', 'field-service'],
  ['fieldedge.com', 'FieldEdge', 'field-service'],
  
  // Nonprofit & Church
  ['bloomerang.co', 'Bloomerang', 'nonprofit'],
  ['neoncrm.com', 'NeonCRM', 'nonprofit'],
  ['networkforgood.com', 'Network for Good', 'nonprofit'],
  ['kindful.com', 'Kindful', 'nonprofit'],
  ['donorperfect.com', 'DonorPerfect', 'nonprofit'],
  ['pushpay.com', 'Pushpay', 'church'],
  ['tithe.ly', 'Tithe.ly', 'church'],
  ['planningcenter.com', 'Planning Center', 'church'],
  ['breezechms.com', 'Breeze ChMS', 'church'],
  
  // Event & Webinar
  ['eventbrite.com', 'Eventbrite', 'events'],
  ['hopin.com', 'Hopin', 'events'],
  ['bizzabo.com', 'Bizzabo', 'events'],
  ['splash.com', 'Splash', 'events'],
  ['whova.com', 'Whova', 'events'],
  ['cvent.com', 'Cvent', 'events'],
  ['demio.com', 'Demio', 'webinar'],
  ['livestorm.co', 'Livestorm', 'webinar'],
  ['ewebinar.com', 'eWebinar', 'webinar'],
  ['crowdcast.io', 'Crowdcast', 'webinar'],
  ['bigmarker.com', 'BigMarker', 'webinar'],
  
  // Community & Forum
  ['circle.so', 'Circle', 'community'],
  ['tribe.so', 'Tribe', 'community'],
  ['mighty.com', 'Mighty Networks', 'community'],
  ['commsor.com', 'Commsor', 'community'],
  ['orbit.love', 'Orbit', 'community'],
  ['commonroom.io', 'Common Room', 'community'],
  ['discord.com', 'Discord', 'community'],
  ['discoursehosting.com', 'Discourse', 'community'],
  
  // Proposal & Document
  ['proposify.com', 'Proposify', 'proposals'],
  ['qwilr.com', 'Qwilr', 'proposals'],
  ['better-proposals.com', 'Better Proposals', 'proposals'],
  ['pandadoc.com', 'PandaDoc', 'proposals'],
  ['getaccept.com', 'GetAccept', 'proposals'],
  ['docusend.com', 'DocuSend', 'proposals'],
  ['pitch.com', 'Pitch', 'proposals'],
  
  // Inventory & Supply Chain
  ['cin7.com', 'Cin7', 'inventory'],
  ['tradegecko.com', 'TradeGecko', 'inventory'],
  ['orderhive.com', 'Orderhive', 'inventory'],
  ['skuvault.com', 'SkuVault', 'inventory'],
  ['fishbowlinventory.com', 'Fishbowl', 'inventory'],
  ['katana.com', 'Katana', 'inventory'],
  ['inflow.com', 'inFlow', 'inventory'],
  ['unleashed.com', 'Unleashed', 'inventory'],
  ['dear.com', 'DEAR Systems', 'inventory'],
  
  // Additional SaaS (miscellaneous)
  ['notion.so', 'Notion', 'productivity'],
  ['obsidian.md', 'Obsidian', 'productivity'],
  ['logseq.com', 'Logseq', 'productivity'],
  ['roamresearch.com', 'Roam Research', 'productivity'],
  ['remnote.com', 'RemNote', 'productivity'],
  ['mem.ai', 'Mem', 'productivity'],
  ['craft.do', 'Craft', 'productivity'],
  ['notesnook.com', 'Notesnook', 'productivity'],
  ['anytype.io', 'Anytype', 'productivity'],
  ['affine.pro', 'AFFiNE', 'productivity'],
  ['heptabase.com', 'Heptabase', 'productivity'],
  ['capacities.io', 'Capacities', 'productivity'],
  ['tana.inc', 'Tana', 'productivity'],
  ['reflect.app', 'Reflect', 'productivity'],
  ['scrintal.com', 'Scrintal', 'productivity'],
  ['clover.app', 'Clover', 'productivity'],
  ['supernotes.app', 'Supernotes', 'productivity'],
  ['appflowy.io', 'AppFlowy', 'productivity'],
  ['slite.com', 'Slite', 'productivity'],
  ['nuclino.com', 'Nuclino', 'productivity'],
  ['slab.com', 'Slab', 'productivity'],
  ['tettra.com', 'Tettra', 'productivity'],
  
  // Testing & QA
  ['cypress.io', 'Cypress', 'testing'],
  ['browserstack.com', 'BrowserStack', 'testing'],
  ['lambdatest.com', 'LambdaTest', 'testing'],
  ['saucelabs.com', 'Sauce Labs', 'testing'],
  ['percy.io', 'Percy', 'testing'],
  ['chromatic.com', 'Chromatic', 'testing'],
  ['applitools.com', 'Applitools', 'testing'],
  ['testim.io', 'Testim', 'testing'],
  ['mabl.com', 'Mabl', 'testing'],
  ['rainforestqa.com', 'Rainforest QA', 'testing'],
  ['ghost-inspector.com', 'Ghost Inspector', 'testing'],
  ['loadforge.com', 'LoadForge', 'testing'],
  ['k6.io', 'k6', 'testing'],
  ['gatling.io', 'Gatling', 'testing'],
  ['artillery.io', 'Artillery', 'testing'],
  ['grafana.com/products/cloud/k6', 'Grafana k6 Cloud', 'testing'],
  
  // More niche verticals
  ['servicetrade.com', 'ServiceTrade', 'field-service'],
  ['upkeep.com', 'UpKeep', 'maintenance'],
  ['fiixsoftware.com', 'Fiix', 'maintenance'],
  ['fracttal.com', 'Fracttal', 'maintenance'],
  ['limblecmms.com', 'Limble CMMS', 'maintenance'],
  ['maintainx.com', 'MaintainX', 'maintenance'],
  
  // Affiliate & Partner
  ['impact.com', 'Impact', 'affiliate'],
  ['partnerstack.com', 'PartnerStack', 'affiliate'],
  ['rewardful.com', 'Rewardful', 'affiliate'],
  ['tapfiliate.com', 'Tapfiliate', 'affiliate'],
  ['firstpromoter.com', 'FirstPromoter', 'affiliate'],
  ['leaddyno.com', 'LeadDyno', 'affiliate'],
  ['referralcandy.com', 'ReferralCandy', 'affiliate'],
  ['friendbuy.com', 'Friendbuy', 'affiliate'],
  ['extole.com', 'Extole', 'affiliate'],
  ['yotpo.com', 'Yotpo', 'affiliate'],
  
  // CDP & Data Platform
  ['segment.com', 'Segment', 'cdp'],
  ['rudderstack.com', 'RudderStack', 'cdp'],
  ['mparticle.com', 'mParticle', 'cdp'],
  ['lytics.com', 'Lytics', 'cdp'],
  ['blueconic.com', 'BlueConic', 'cdp'],
  ['tealium.com', 'Tealium', 'cdp'],
  ['treasure-data.com', 'Treasure Data', 'cdp'],
  ['amperity.com', 'Amperity', 'cdp'],
  ['actioniq.com', 'ActionIQ', 'cdp'],
  
  // More API/Developer Infrastructure
  ['twilio.com', 'Twilio', 'api'],
  ['vonage.com', 'Vonage', 'api'],
  ['bandwidth.com', 'Bandwidth', 'api'],
  ['messagebird.com', 'MessageBird', 'api'],
  ['sinch.com', 'Sinch', 'api'],
  ['infobip.com', 'Infobip', 'api'],
  ['telnyx.com', 'Telnyx', 'api'],
  ['plivo.com', 'Plivo', 'api'],
  ['nexmo.com', 'Nexmo', 'api'],
  ['kaleyra.com', 'Kaleyra', 'api'],
  ['clicksend.com', 'ClickSend', 'api'],
  ['textmagic.com', 'TextMagic', 'api'],
  ['ringcentral.com', 'RingCentral', 'api'],
  ['dialpad.com', 'Dialpad', 'api'],
  ['grasshopper.com', 'Grasshopper', 'api'],
  ['openphone.com', 'OpenPhone', 'api'],
  ['aircall.io', 'Aircall', 'api'],
  ['justcall.io', 'JustCall', 'api'],
  ['cloudtalk.io', 'CloudTalk', 'api'],
  ['talkdesk.com', 'Talkdesk', 'api'],
  ['five9.com', 'Five9', 'api'],
  
  // Podcasting & Media
  ['transistor.fm', 'Transistor', 'podcast'],
  ['buzzsprout.com', 'Buzzsprout', 'podcast'],
  ['anchor.fm', 'Anchor', 'podcast'],
  ['simplecast.com', 'Simplecast', 'podcast'],
  ['podbean.com', 'Podbean', 'podcast'],
  ['spreaker.com', 'Spreaker', 'podcast'],
  ['captivate.fm', 'Captivate', 'podcast'],
  ['castos.com', 'Castos', 'podcast'],
  ['fireside.fm', 'Fireside', 'podcast'],
  ['zencastr.com', 'Zencastr', 'podcast'],
  ['squadcast.fm', 'Squadcast', 'podcast'],
  ['podcast.co', 'Podcast.co', 'podcast'],
  
  // More vertical SaaS
  ['caredash.com', 'CareDash', 'healthcare'],
  ['zocdoc.com', 'Zocdoc', 'healthcare'],
  ['solutionreach.com', 'Solutionreach', 'healthcare'],
  ['patientslikeme.com', 'PatientsLikeMe', 'healthcare'],
  ['webpt.com', 'WebPT', 'healthcare'],
  ['advancedmd.com', 'AdvancedMD', 'healthcare'],
  ['nexhealth.com', 'NexHealth', 'healthcare'],
  
  // Insurance tech
  ['lemonade.com', 'Lemonade', 'insurtech'],
  ['hippo.com', 'Hippo', 'insurtech'],
  ['newfront.com', 'Newfront', 'insurtech'],
  ['embroker.com', 'Embroker', 'insurtech'],
  ['vouch.us', 'Vouch', 'insurtech'],
  ['next-insurance.com', 'Next Insurance', 'insurtech'],
  ['pie.insurance', 'Pie Insurance', 'insurtech'],
  ['biberk.com', 'biBERK', 'insurtech'],
  ['coterie.com', 'Coterie', 'insurtech'],
  ['boldpenguin.com', 'Bold Penguin', 'insurtech'],
  
  // AgTech
  ['farmfundr.com', 'FarmFundr', 'agtech'],
  ['conservis.com', 'Conservis', 'agtech'],
  ['cropx.com', 'CropX', 'agtech'],
  ['farmersedge.ca', 'Farmers Edge', 'agtech'],
  ['agworld.com', 'Agworld', 'agtech'],
  
  // EdTech
  ['instructure.com', 'Instructure', 'edtech'],
  ['schoology.com', 'Schoology', 'edtech'],
  ['edmodo.com', 'Edmodo', 'edtech'],
  ['classdojo.com', 'ClassDojo', 'edtech'],
  ['kahoot.com', 'Kahoot!', 'edtech'],
  ['quizlet.com', 'Quizlet', 'edtech'],
  ['duolingo.com', 'Duolingo', 'edtech'],
  ['coursera.org', 'Coursera', 'edtech'],
  ['udemy.com', 'Udemy', 'edtech'],
  ['skillshare.com', 'Skillshare', 'edtech'],
  ['brilliant.org', 'Brilliant', 'edtech'],
  ['codecademy.com', 'Codecademy', 'edtech'],
  ['freecodecamp.org', 'freeCodeCamp', 'edtech'],
  ['scrimba.com', 'Scrimba', 'edtech'],
  ['boot.dev', 'Boot.dev', 'edtech'],
];

for (const [domain, name, category] of additions) {
  add(domain, name, category, 'curated-final');
}
console.log(`Added ${newCount} new curated domains`);

// Now crawl remaining SaaSHub alternatives for products not yet covered
console.log('\nCrawling more SaaSHub alternatives...');
const moreSlugs = [
  'teamwork', 'todoist', 'wrike', 'basecamp', 'airtable', 'coda',
  'bamboohr', 'lever', 'greenhouse', 'workable',
  'ghost', 'strapi', 'sanity', 'contentful',
  'gorgias', 'gladly', 'kustomer',
  'stripe', 'braintree', 'square',
  'harvest', 'toggl', 'clockify',
  'loom', 'vidyard', 'descript',
  'grammarly', 'writesonic', 'jasper',
  'algolia', 'elasticsearch',
  'notion', 'obsidian', 'roam-research',
  'calendly', 'doodle', 'acuity-scheduling',
  'eventbrite', 'hopin', 'bizzabo',
  'teachable', 'thinkific', 'kajabi',
  'clio', 'mycase', 'rocket-lawyer',
  'toast-pos', 'square-pos', 'lightspeed',
  'jobber', 'housecall-pro', 'servicetitan',
  'procore', 'buildertrend', 'coconstruct',
  'cin7', 'katana-mrp', 'fishbowl-inventory',
  'bloomerang', 'kindful', 'donorperfect',
  'mindbody', 'glofox', 'vagaro',
  'appfolio', 'buildium', 'guesty',
  'drchrono', 'simplepractice', 'cliniko',
  'impact-radius', 'partnerstack', 'tapfiliate',
  'transistor-fm', 'buzzsprout', 'simplecast',
];

const batchSize = 10;
for (let i = 0; i < moreSlugs.length; i += batchSize) {
  const batch = moreSlugs.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(async slug => {
    try {
      const resp = await fetch(`https://www.saashub.com/${slug}-alternatives`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return [];
      const html = await resp.text();
      const slugRegex = /\/([\w][\w-]{1,40})-alternatives/g;
      let m;
      const found = [];
      while ((m = slugRegex.exec(html)) !== null) {
        const s = m[1];
        if (s.startsWith('post-') || s.startsWith('best-') || s.includes('2024') || s.includes('2025') || s.includes('2026') || s.length > 30) continue;
        found.push(s);
      }
      return found;
    } catch { return []; }
  }));
  
  for (const slugs of results) {
    for (const slug of slugs) {
      const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      add(`${slug}.com`, name, 'alternatives', 'saashub-deep');
    }
  }
  await new Promise(r => setTimeout(r, 250));
}

console.log(`Final new count: ${newCount}`);

if (output) {
  appendFileSync(outPath, output);
}

console.log(`Total in output: ${existingOutput.size}`);
