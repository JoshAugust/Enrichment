#!/usr/bin/env python3
"""Batch 8: More B2B SaaS, remote companies, dev tools, infra, misc."""
import json, os

EXISTING = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt"
OUTPUT = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave2/jobboard_domains.jsonl"

with open(EXISTING) as f:
    existing = set(line.strip().lower() for line in f if line.strip())
written = set()
if os.path.exists(OUTPUT):
    with open(OUTPUT) as f:
        for line in f:
            try: written.add(json.loads(line)['domain'].lower())
            except: pass

added = 0
def add(domain, name, source="industry_directory", category="saas", meta=None):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": meta or {}}) + '\n')
    written.add(d)
    added += 1

companies = [
    # Remote companies from Remote.co
    ("timedoctor.com", "Time Doctor"), ("toggl.com", "Toggl"),
    ("jacksonriver.com", "Jackson River"), ("tri.be", "Modern Tribe"),
    ("sitepen.com", "SitePen"), ("angi.com", "Angi"),
    # Dev tools / Infrastructure (less known)
    ("depot.dev", "Depot"), ("earthly.dev", "Earthly"),
    ("dagger.io", "Dagger"), ("devzero.io", "DevZero"),
    ("garden.io", "Garden"), ("tilt.dev", "Tilt"),
    ("skaffold.dev", "Skaffold"), ("telepresence.io", "Telepresence"),
    ("okteto.com", "Okteto"), ("gitpod.io", "Gitpod"),
    ("codespaces.github.com", "GitHub Codespaces"),
    ("stackblitz.com", "StackBlitz"), ("codesandbox.io", "CodeSandbox"),
    ("repl.it", "Replit"), ("glitch.com", "Glitch"),
    # API platforms
    ("rapidapi.com", "RapidAPI"), ("kong.cloud", "Kong Konnect"),
    ("tyk.io", "Tyk"), ("gravitee.io", "Gravitee"),
    ("apigee.com", "Apigee"), ("mulesoft.com", "MuleSoft"),
    ("axway.com", "Axway"), ("wso2.com", "WSO2"),
    # ML/AI Ops
    ("mlflow.org", "MLflow"), ("kubeflow.org", "Kubeflow"),
    ("seldon.io", "Seldon"), ("bentoml.com", "BentoML"),
    ("valohai.com", "Valohai"), ("algorithmia.com", "Algorithmia"),
    ("cnvrg.io", "cnvrg.io"), ("polyaxon.com", "Polyaxon"),
    ("clear.ml", "ClearML"), ("layer.ai", "Layer"),
    # Cloud Cost / FinOps
    ("kubecost.com", "Kubecost"), ("vantage.sh", "Vantage"),
    ("infracost.io", "Infracost"), ("cloudkeeper.ai", "CloudKeeper"),
    ("anodot.com", "Anodot"), ("spot.io", "Spot by NetApp"),
    ("cast.ai", "CAST AI"), ("perfectscale.io", "PerfectScale"),
    # Internal tools / Low-code
    ("retool.com", "Retool"), ("appsmith.com", "Appsmith"),
    ("tooljet.com", "ToolJet"), ("budibase.com", "Budibase"),
    ("superblocks.com", "Superblocks"), ("interval.com", "Interval"),
    ("airplane.dev", "Airplane"), ("windmill.dev", "Windmill"),
    # Data pipeline / ETL
    ("getdbt.com", "dbt Labs"), ("fivetran.com", "Fivetran"),
    ("stitch.com", "Stitch"), ("matillion.com", "Matillion"),
    ("rivery.io", "Rivery"), ("integrate.io", "Integrate.io"),
    ("hevodata.com", "Hevo Data"), ("rudderstack.com", "RudderStack"),
    ("polytomic.com", "Polytomic"), ("omnata.com", "Omnata"),
    # Knowledge base / Wiki
    ("document360.com", "Document360"), ("helpjuice.com", "HelpJuice"),
    ("knowledgeowl.com", "KnowledgeOwl"), ("clickhelp.com", "ClickHelp"),
    ("archbee.com", "Archbee"), ("gitbook.com", "GitBook"),
    ("readme.com", "ReadMe"), ("mintlify.com", "Mintlify"),
    # Status pages
    ("atlassian.com", "Atlassian"), ("statuspage.io", "StatusPage"),
    ("betteruptime.com", "Better Uptime"), ("instatus.com", "Instatus"),
    ("statuspal.io", "Statuspal"), ("cachet.io", "Cachet"),
    ("pagerduty.com", "PagerDuty"), ("opsgenie.com", "Opsgenie"),
    ("victorops.com", "VictorOps"), ("firehydrant.com", "FireHydrant"),
    ("rootly.com", "Rootly"), ("incident.io", "incident.io"),
    ("blameless.com", "Blameless"),
    # Developer experience
    ("backstage.io", "Backstage"), ("getport.io", "Port"),
    ("configure8.io", "Configure8"), ("opslevel.com", "OpsLevel"),
    ("cortex.io", "Cortex"), ("roadie.io", "Roadie"),
    # Cloud security
    ("aquasec.com", "Aqua Security"), ("sysdig.com", "Sysdig"),
    ("twistlock.com", "Twistlock"), ("prismacloud.io", "Prisma Cloud"),
    ("bridgecrew.io", "Bridgecrew"), ("checkov.io", "Checkov"),
    ("snyk.io", "Snyk"), ("sonarqube.org", "SonarQube"),
    ("whitesource.io", "WhiteSource"), ("fossa.com", "FOSSA"),
    ("socket.dev", "Socket"), ("deps.dev", "deps.dev"),
    # Feature management (less known)
    ("molasses.app", "Molasses"), ("unleash.com", "Unleash"),
    ("featurevisor.com", "Featurevisor"), ("taplytics.com", "Taplytics"),
    # Error tracking (less known)
    ("exceptionless.com", "Exceptionless"), ("airbrake.io", "Airbrake"),
    ("trackjs.com", "TrackJS"), ("logrocket.com", "LogRocket"),
    # Session replay
    ("logrocket.com", "LogRocket"), ("smartlook.com", "Smartlook"),
    ("mouseflow.com", "Mouseflow"), ("clarity.ms", "Microsoft Clarity"),
    ("luckyorange.com", "Lucky Orange"), ("inspectlet.com", "Inspectlet"),
    # A/B Testing
    ("vwo.com", "VWO"), ("optimizely.com", "Optimizely"),
    ("splitbee.io", "Splitbee"), ("changefly.com", "Changefly"),
    # Push notifications
    ("onesignal.com", "OneSignal"), ("pushwoosh.com", "Pushwoosh"),
    ("catapush.com", "Catapush"), ("kumulos.com", "Kumulos"),
    # In-app messaging
    ("appcues.com", "Appcues"), ("pendo.io", "Pendo"),
    ("chameleon.io", "Chameleon"), ("userflow.com", "Userflow"),
    ("userlane.com", "Userlane"), ("whatfix.com", "Whatfix"),
    ("apty.io", "Apty"),
    # Scheduling
    ("appointy.com", "Appointy"), ("setmore.com", "Setmore"),
    ("booksy.com", "Booksy"), ("fresha.com", "Fresha"),
    ("vagaro.com", "Vagaro"), ("styleseat.com", "StyleSeat"),
    ("mindbodyonline.com", "Mindbody"), ("glofox.com", "Glofox"),
    ("virtuagym.com", "Virtuagym"),
    # Accounting / Bookkeeping
    ("bench.co", "Bench"), ("pilot.com", "Pilot"),
    ("quickbooks.intuit.com", "QuickBooks"), ("xero.com", "Xero"),
    ("waveapps.com", "Wave"), ("zoho.com", "Zoho"),
    ("freshbooks.com", "FreshBooks"), ("patriotsoftware.com", "Patriot Software"),
    # Invoicing
    ("invoice.ninja", "Invoice Ninja"), ("invoiced.com", "Invoiced"),
    ("billdu.com", "Billdu"), ("hiveage.com", "Hiveage"),
    ("blinksale.com", "Blinksale"),
    # Time tracking
    ("harvest.com", "Harvest"), ("clockify.me", "Clockify"),
    ("everhour.com", "Everhour"), ("hubstaff.com", "Hubstaff"),
    ("desktime.com", "DeskTime"), ("toptracker.com", "TopTracker"),
    # ERP / Business management
    ("netsuite.com", "NetSuite"), ("acumatica.com", "Acumatica"),
    ("odoo.com", "Odoo"), ("erpnext.com", "ERPNext"),
    ("sage.com", "Sage"), ("infor.com", "Infor"),
    # Logistics / Shipping (less known)
    ("aftership.com", "AfterShip"), ("shipstation.com", "ShipStation"),
    ("ordoro.com", "Ordoro"), ("shipengine.com", "ShipEngine"),
    ("goshippo.com", "Shippo"), ("stamps.com", "Stamps.com"),
    ("pirateship.com", "Pirate Ship"),
    # Inventory management
    ("cin7.com", "Cin7"), ("tradegecko.com", "TradeGecko"),
    ("fishbowlinventory.com", "Fishbowl"), ("skubana.com", "Skubana"),
    ("brightpearl.com", "Brightpearl"), ("sellbrite.com", "Sellbrite"),
    ("ecomdash.com", "Ecomdash"),
    # Customer Feedback
    ("typeform.com", "Typeform"), ("surveymonkey.com", "SurveyMonkey"),
    ("jotform.com", "Jotform"), ("paperform.co", "Paperform"),
    ("tally.so", "Tally"), ("formbricks.com", "Formbricks"),
    ("heyform.net", "HeyForm"), ("fillout.com", "Fillout"),
    # Password management
    ("1password.com", "1Password"), ("bitwarden.com", "Bitwarden"),
    ("keeper.io", "Keeper"), ("nordpass.com", "NordPass"),
    # VPN / Network
    ("tailscale.com", "Tailscale"), ("zerotier.com", "ZeroTier"),
    ("netbird.io", "NetBird"), ("firezone.dev", "Firezone"),
    ("pritunl.com", "Pritunl"), ("defined.net", "Defined Networking"),
    # Embedded analytics
    ("sigma.com", "Sigma"), ("reveal.bi", "Reveal"),
    ("cumul.io", "Cumul.io"), ("boldbi.com", "Bold BI"),
    ("holistics.io", "Holistics"), ("gooddata.com", "GoodData"),
    ("explo.co", "Explo"),
    # Task/issue tracking (less known)
    ("plane.so", "Plane"), ("huly.io", "Huly"),
    ("taiga.io", "Taiga"), ("openproject.org", "OpenProject"),
    ("youtrack.com", "YouTrack"), ("pivotaltracker.com", "Pivotal Tracker"),
    ("targetprocess.com", "Targetprocess"),
    # Communication
    ("slack.com", "Slack"), ("discord.com", "Discord"),
    ("element.io", "Element"), ("rocket.chat", "Rocket.Chat"),
    ("matrix.org", "Matrix"), ("zulip.com", "Zulip"),
    ("mattermost.com", "Mattermost"),
    # CMS headless
    ("contentful.com", "Contentful"), ("sanity.io", "Sanity"),
    ("storyblok.com", "Storyblok"), ("strapi.io", "Strapi"),
    ("directus.io", "Directus"), ("payload.cms", "Payload"),
    ("ghost.org", "Ghost"), ("keystonejs.com", "KeystoneJS"),
    ("builder.io", "Builder.io"), ("hygraph.com", "Hygraph"),
    ("kontent.ai", "Kontent.ai"), ("buttercms.com", "ButterCMS"),
    ("agilitycms.com", "Agility CMS"), ("caisy.io", "Caisy"),
    # Browser automation / RPA
    ("browse.ai", "Browse AI"), ("axiom.ai", "Axiom.ai"),
    ("bardeen.ai", "Bardeen"), ("automa.site", "Automa"),
    ("uipath.com", "UiPath"), ("automationanywhere.com", "Automation Anywhere"),
    ("blueprism.com", "Blue Prism"), ("kofax.com", "Kofax"),
    # Document processing
    ("rossum.ai", "Rossum"), ("nanonets.com", "Nanonets"),
    ("hyperscience.com", "Hyperscience"), ("instabase.com", "Instabase"),
    ("veryfi.com", "Veryfi"), ("mindee.com", "Mindee"),
    # Procurement
    ("coupa.com", "Coupa"), ("precoro.com", "Precoro"),
    ("tradogram.com", "Tradogram"), ("order.co", "Order.co"),
    ("procurify.com", "Procurify"), ("kissflow.com", "Kissflow"),
    # Spend management
    ("ramp.com", "Ramp"), ("brex.com", "Brex"),
    ("divvy.com", "Divvy"), ("airbase.io", "Airbase"),
    ("center.com", "Center"), ("mesh.ai", "Mesh"),
    # Contract lifecycle
    ("agiloft.com", "Agiloft"), ("icertis.com", "Icertis"),
    ("concord.app", "Concord"), ("conga.com", "Conga"),
    # Quote-to-cash / CPQ
    ("dealroom.co", "Dealroom"), ("pandadoc.com", "PandaDoc"),
    ("proposify.com", "Proposify"), ("conga.com", "Conga"),
    ("nue.io", "Nue"), ("subskribe.com", "Subskribe"),
    # Workplace / Office
    ("envoy.com", "Envoy"), ("robin.com", "Robin"),
    ("officely.ai", "Officely"), ("kadence.co", "Kadence"),
    ("desana.io", "Desana"), ("hubble.com", "Hubble"),
    # Learning / LMS
    ("360learning.com", "360Learning"), ("docebo.com", "Docebo"),
    ("learnworlds.com", "LearnWorlds"), ("thinkific.com", "Thinkific"),
    ("teachable.com", "Teachable"), ("podia.com", "Podia"),
    ("kajabi.com", "Kajabi"), ("skilljar.com", "Skilljar"),
    ("lessonly.com", "Lessonly"), ("northpass.com", "Northpass"),
    # Performance management
    ("lattice.com", "Lattice"), ("15five.com", "15Five"),
    ("culturemonkey.io", "CultureMonkey"), ("peoplebox.ai", "PeopleBox"),
    ("leapsome.com", "Leapsome"), ("betterworks.com", "BetterWorks"),
    ("engagedly.com", "Engagedly"), ("reflektive.com", "Reflektive"),
    ("quantumworkplace.com", "Quantum Workplace"),
    # Compensation / Equity
    ("pave.com", "Pave"), ("carta.com", "Carta"),
    ("compport.com", "Compport"), ("beqom.com", "beqom"),
    ("payfactors.com", "Payfactors"), ("payscale.com", "Payscale"),
    ("salary.com", "Salary.com"),
    # Employee engagement
    ("lattice.com", "Lattice"), ("cultureamp.com", "Culture Amp"),
    ("tinypulse.com", "TINYpulse"), ("bonusly.com", "Bonusly"),
    ("motivosity.com", "Motivosity"), ("kudos.com", "Kudos"),
    ("achievers.com", "Achievers"), ("workleap.com", "Workleap"),
    # Background checks
    ("checkr.com", "Checkr"), ("certn.co", "Certn"),
    ("veremark.com", "Veremark"),
    # Compliance / Legal
    ("drata.com", "Drata"), ("vanta.com", "Vanta"),
    ("secureframe.com", "Secureframe"), ("laika.com", "Laika"),
    ("tugboatlogic.com", "Tugboat Logic"), ("sprinto.com", "Sprinto"),
    ("scytale.ai", "Scytale"), ("thoropass.com", "Thoropass"),
    # Developer community
    ("orbit.love", "Orbit"), ("commonroom.io", "Common Room"),
    ("crowd.dev", "crowd.dev"), ("commusor.com", "Commusor"),
    # Email infrastructure
    ("mailgun.com", "Mailgun"), ("sendgrid.com", "SendGrid"),
    ("ses.aws", "Amazon SES"), ("postmarkapp.com", "Postmark"),
    ("sparkpost.com", "SparkPost"), ("mailtrap.io", "Mailtrap"),
    ("mailhog.io", "MailHog"), ("ethereal.email", "Ethereal"),
    # Misc SaaS (less known)
    ("getstream.io", "Stream"), ("liveblocks.io", "Liveblocks"),
    ("partykit.io", "PartyKit"), ("convex.dev", "Convex"),
    ("nhost.io", "Nhost"), ("hasura.io", "Hasura"),
    ("graphcdn.io", "GraphCDN"), ("stellate.co", "Stellate"),
    ("stepzen.com", "StepZen"), ("grafbase.com", "Grafbase"),
    ("edgedb.com", "EdgeDB"), ("surreal.io", "SurrealDB"),
    ("turso.tech", "Turso"), ("libsql.org", "libSQL"),
    ("xata.io", "Xata"), ("upstash.com", "Upstash"),
    ("deno.com", "Deno"), ("bun.sh", "Bun"),
    ("val.town", "Val Town"), ("val.run", "Val.run"),
    ("defer.run", "Defer"), ("qstash.upstash.com", "QStash"),
    # Database hosting / DBaaS
    ("aiven.io", "Aiven"), ("tembo.io", "Tembo"),
    ("neon.tech", "Neon"), ("crunchydata.com", "Crunchy Data"),
    ("timescale.com", "Timescale"), ("cockroachlabs.com", "CockroachDB"),
    ("planetscale.com", "PlanetScale"), ("vitess.io", "Vitess"),
    # Misc
    ("cal.com", "Cal.com"), ("documenso.com", "Documenso"),
    ("formbricks.com", "Formbricks"), ("openbb.co", "OpenBB"),
    ("lago.dev", "Lago"), ("erxes.io", "erxes"),
    ("chatwoot.com", "Chatwoot"), ("papercups.io", "Papercups"),
]

for d, n in companies:
    add(d, n)

print(f"\nBatch 8 total new: {added}")
print(f"Total in output: {len(written)}")
