#!/usr/bin/env python3
"""Batch 2 - additional companies from state lists, more YC, and other directories."""
import json
import datetime

QUEUE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/overnight/shared/new_companies_queue.jsonl'

# Load existing domains
existing = set()
with open(QUEUE) as f:
    for line in f:
        line = line.strip()
        if line:
            try:
                d = json.loads(line)
                existing.add(d.get('domain', '').lower().strip())
            except:
                pass

print(f"Existing domains: {len(existing)}")

RAW_COMPANIES = [
    # ===== Georgia startups =====
    ("vivofitness.com", "Vivo Fitness", "GA-StartupList", "Online fitness SaaS"),
    ("finquery.com", "FinQuery", "GA-StartupList", "Financial contract SaaS"),
    ("prizepicks.com", "PrizePicks", "GA-StartupList", "Daily fantasy sports SaaS"),
    ("yellowcard.io", "Yellow Card", "GA-StartupList", "Crypto exchange SaaS"),
    ("sema4.ai", "Sema4.ai", "GA-StartupList", "AI agent platform SaaS"),
    ("speedchain.com", "Speedchain", "GA-StartupList", "Payment transparency SaaS"),

    # ===== Colorado startups =====
    ("billingplatform.com", "BillingPlatform", "CO-StartupList", "Revenue management SaaS"),
    ("usetilt.com", "Tilt", "CO-StartupList", "Employee leave management SaaS"),
    ("conga.com", "Conga", "CO-StartupList", "Revenue ops SaaS"),
    ("gloo.us", "Gloo", "CO-StartupList", "Faith community SaaS"),
    ("quantinuum.com", "Quantinuum", "CO-StartupList", "Quantum computing SaaS"),

    # ===== Tennessee startups =====
    ("rain.com", "Rain", "TN-StartupList", "Earned wage access fintech SaaS"),
    ("thymecare.com", "Thyme Care", "TN-StartupList", "Oncology care SaaS"),
    ("phosphoruscyber.com", "Phosphorus Cybersecurity", "TN-StartupList", "IoT security SaaS"),
    ("cloudrange.com", "Cloud Range", "TN-StartupList", "Cyber training SaaS"),
    ("goodship.ai", "GoodShip", "TN-StartupList", "Freight orchestration SaaS"),
    ("elysian.ai", "Elysian", "TN-StartupList", "Insurance claims AI SaaS"),
    ("marigold.com", "Marigold", "TN-StartupList", "Marketing technology SaaS"),

    # ===== Virginia startups =====
    ("shift5.com", "Shift5", "VA-StartupList", "OT security SaaS"),
    ("regscale.com", "RegScale", "VA-StartupList", "Compliance automation SaaS"),
    ("trustible.ai", "Trustible", "VA-StartupList", "AI governance SaaS"),
    ("silentpush.com", "Silent Push", "VA-StartupList", "Threat intelligence SaaS"),
    ("seekr.com", "Seekr", "VA-StartupList", "AI transparency SaaS"),
    ("quickcode.ai", "QuickCode AI", "VA-StartupList", "Data labeling SaaS"),
    ("interos.ai", "Interos", "VA-StartupList", "Supply chain risk SaaS"),

    # ===== Utah startups =====
    ("filevine.com", "Filevine", "UT-StartupList", "Legal case management SaaS"),
    ("moises.ai", "Moises", "UT-StartupList", "AI music tools SaaS"),
    ("fullcast.io", "Fullcast", "UT-StartupList", "GTM planning SaaS"),
    ("passivelogic.com", "PassiveLogic", "UT-StartupList", "Building autonomy SaaS"),
    ("awardco.com", "Awardco", "UT-StartupList", "Employee recognition SaaS"),
    ("striderintel.com", "Strider Technologies", "UT-StartupList", "Strategic intelligence SaaS"),

    # ===== Texas smaller SaaS startups =====
    ("kickfin.com", "Kickfin", "TX-StartupList", "Tip distribution SaaS"),
    ("jobtread.com", "JobTread", "TX-StartupList", "Construction management SaaS"),
    ("contentstack.com", "Contentstack", "TX-StartupList", "Headless CMS SaaS"),

    # ===== Additional TinySeed companies from deeper research =====
    ("salonscale.com", "SalonScale", "TinySeed", "Salon product cost SaaS"),
    ("upcoach.com", "UpCoach", "TinySeed", "Coaching platform SaaS"),
    ("loopgenius.com", "LoopGenius", "TinySeed", "Marketing automation SaaS"),
    ("aidaptive.com", "Aidaptive", "TinySeed", "Predictive commerce SaaS"),
    ("stackerhq.com", "Stacker", "TinySeed", "No-code app builder SaaS"),
    ("outseta.com", "Outseta", "TinySeed", "SaaS membership platform"),
    ("plausible.io", "Plausible Analytics", "TinySeed", "Privacy-first analytics SaaS"),
    ("beehiiv.com", "Beehiiv", "TinySeed", "Newsletter platform SaaS"),
    ("highlightapp.io", "Highlight", "TinySeed", "Product discovery SaaS"),
    ("notch.so", "Notch", "TinySeed", "Proposal SaaS"),
    ("gleap.io", "Gleap", "TinySeed", "Customer feedback SaaS"),
    ("screenshotone.com", "ScreenshotOne", "TinySeed", "Screenshot API SaaS"),
    ("recapped.io", "Recapped", "TinySeed", "Sales enablement SaaS"),
    ("ownpage.app", "OwnPage", "TinySeed", "Business profile SaaS"),
    ("getmagical.com", "Magical", "TinySeed", "Text expansion SaaS"),
    ("marketerly.io", "Marketerly", "TinySeed", "Email marketing SaaS"),
    ("linktr.ee", "Linktree", "TinySeed", "Link-in-bio SaaS"),
    ("explo.co", "Explo", "TinySeed", "Customer-facing analytics SaaS"),
    ("liveblocks.io", "Liveblocks", "TinySeed", "Real-time collaboration SaaS"),
    ("trigify.io", "Trigify", "TinySeed", "Sales trigger SaaS"),
    ("apphive.io", "AppHive", "TinySeed", "No-code app SaaS"),
    ("optily.co", "Optily", "TinySeed", "Ad optimization SaaS"),
    ("pocketsuite.io", "PocketSuite", "TinySeed", "Service business SaaS"),
    ("socialbee.io", "SocialBee", "TinySeed", "Social media SaaS"),
    ("chatguru.com.br", "ChatGuru", "TinySeed", "WhatsApp CRM SaaS"),
    ("duel.tech", "Duel", "TinySeed", "Brand advocacy SaaS"),
    ("getmaverick.io", "Maverick", "TinySeed", "Video email SaaS"),
    ("taplio.com", "Taplio", "TinySeed", "LinkedIn growth SaaS"),
    ("trendspider.com", "TrendSpider", "TinySeed", "Trading analysis SaaS"),
    ("getforma.com", "Forma", "TinySeed", "Lifestyle benefits SaaS"),
    ("plumo.io", "Plumo", "TinySeed", "Design asset SaaS"),
    ("writesonic.com", "Writesonic", "TinySeed", "AI writing SaaS"),
    ("postalytics.com", "Postalytics", "TinySeed", "Direct mail SaaS"),
    ("gistapp.com", "Gist", "TinySeed", "Customer messaging SaaS"),
    ("userguiding.com", "UserGuiding", "TinySeed", "User onboarding SaaS"),
    ("growthmentor.com", "GrowthMentor", "TinySeed", "Mentor marketplace SaaS"),
    ("scribeapp.com", "Scribe", "TinySeed", "Process documentation SaaS"),
    ("repuso.com", "Repuso", "TinySeed", "Social proof SaaS"),
    ("testimonify.io", "Testimonify", "TinySeed", "Testimonial SaaS"),
    ("reviewshake.com", "ReviewShake", "TinySeed", "Review management SaaS"),
    ("heyflow.app", "Heyflow", "TinySeed", "Interactive flow builder SaaS"),
    ("prelaunchify.com", "Prelaunchify", "TinySeed", "Pre-launch SaaS"),
    ("simplesat.io", "SimpleSat", "TinySeed", "CSAT survey SaaS"),
    ("refloat.io", "Refloat", "TinySeed", "Churn reduction SaaS"),
    ("supademo.com", "Supademo", "TinySeed", "Product demo SaaS"),
    ("getsprout.co", "Sprout", "TinySeed", "Customer success SaaS"),
    ("dashly.io", "Dashly", "TinySeed", "Conversational marketing SaaS"),
    ("salespanel.io", "Salespanel", "TinySeed", "Lead intelligence SaaS"),
    ("meetfrank.com", "Frank", "TinySeed", "Job marketplace SaaS"),
    ("reclaim.ai", "Reclaim.ai", "TinySeed", "Calendar scheduling SaaS"),
    ("engagebay.com", "EngageBay", "TinySeed", "CRM marketing SaaS"),
    ("leadboxer.com", "LeadBoxer", "TinySeed", "Lead generation SaaS"),
    ("mailparsing.com", "Mailparser", "TinySeed", "Email parsing SaaS"),
    ("productboard.com", "Productboard", "DirectoryMining", "Product management SaaS"),
    ("fibery.io", "Fibery", "DirectoryMining", "Connected workspace SaaS"),
    ("tana.inc", "Tana", "DirectoryMining", "Note-taking SaaS"),
    ("akiflow.com", "Akiflow", "DirectoryMining", "Task manager SaaS"),
    ("hypefury.com", "Hypefury", "DirectoryMining", "Twitter/X growth SaaS"),
    ("loom.com", "Loom", "DirectoryMining", "Async video SaaS"),
    ("claap.io", "Claap", "DirectoryMining", "Video wiki SaaS"),
    ("tango.us", "Tango", "DirectoryMining", "Process documentation SaaS"),
    ("scribe.how", "Scribe", "DirectoryMining", "SOPs SaaS"),
    ("missiveapp.com", "Missive", "DirectoryMining", "Team inbox SaaS"),
    ("superpath.co", "Superpath", "DirectoryMining", "Content marketing SaaS"),
    ("clearscope.io", "Clearscope", "DirectoryMining", "SEO content SaaS"),
    ("fathom.fm", "Fathom", "DirectoryMining", "Meeting assistant SaaS"),
    ("getthread.com", "Thread", "DirectoryMining", "Client portal SaaS"),
    ("copilot.com", "Copilot", "DirectoryMining", "Client platform SaaS"),
    ("honeybook.com", "HoneyBook", "DirectoryMining", "Client management SaaS"),
    ("proposify.com", "Proposify", "DirectoryMining", "Proposal SaaS"),
    ("clientjoy.io", "ClientJoy", "DirectoryMining", "Agency CRM SaaS"),
    ("sendlane.com", "Sendlane", "DirectoryMining", "Email/SMS SaaS ecommerce"),
    ("postmark.com", "Postmark", "DirectoryMining", "Transactional email SaaS"),
    ("mailerlite.com", "MailerLite", "DirectoryMining", "Email marketing SaaS"),
    ("lemlist.com", "Lemlist", "DirectoryMining", "Cold outreach SaaS"),
    ("reply.io", "Reply.io", "DirectoryMining", "Sales automation SaaS"),
    ("woodpecker.co", "Woodpecker", "DirectoryMining", "Cold email SaaS"),
    ("streak.com", "Streak", "DirectoryMining", "CRM for Gmail SaaS"),
    ("close.com", "Close", "DirectoryMining", "Sales CRM SaaS"),
    ("apptivo.com", "Apptivo", "DirectoryMining", "Business management SaaS"),
    ("nocrm.io", "noCRM.io", "DirectoryMining", "Lead management SaaS"),
    ("nutshell.com", "Nutshell", "DirectoryMining", "CRM SaaS"),
    ("copper.com", "Copper", "DirectoryMining", "Google CRM SaaS"),
    ("teamwork.com", "Teamwork", "DirectoryMining", "Project management SaaS"),
    ("niftypm.com", "Nifty", "DirectoryMining", "Project management SaaS"),
    ("teamgantt.com", "TeamGantt", "DirectoryMining", "Gantt chart SaaS"),
    ("toggl.com", "Toggl", "DirectoryMining", "Time tracking SaaS"),
    ("harvest.com", "Harvest", "DirectoryMining", "Time tracking SaaS"),
    ("freshbooks.com", "FreshBooks", "DirectoryMining", "Accounting SaaS"),
    ("bonsai.io", "Bonsai", "DirectoryMining", "Freelancer management SaaS"),
    ("indy.com", "Indy", "DirectoryMining", "Freelancer business SaaS"),
    ("plutio.com", "Plutio", "DirectoryMining", "All-in-one freelance SaaS"),
    ("zoeyhq.com", "Zoey", "DirectoryMining", "B2B ecommerce SaaS"),
    ("getlago.com", "Lago", "DirectoryMining", "Open-source billing SaaS"),
    ("paddle.com", "Paddle", "DirectoryMining", "Payments infra SaaS"),
    ("chargebee.com", "Chargebee", "DirectoryMining", "Subscription billing SaaS"),
    ("chargify.com", "Chargify", "DirectoryMining", "Recurring billing SaaS"),
    ("profitwell.com", "ProfitWell", "DirectoryMining", "SaaS metrics SaaS"),
    ("baremetrics.com", "Baremetrics", "DirectoryMining", "Subscription analytics SaaS"),
    ("chartmogul.com", "ChartMogul", "DirectoryMining", "Revenue analytics SaaS"),
    ("getbeamer.com", "Beamer", "DirectoryMining", "Product changelog SaaS"),
    ("headwayapp.co", "Headway", "DirectoryMining", "Changelog SaaS"),
    ("releasepad.com", "ReleasePad", "DirectoryMining", "Release notes SaaS"),
    ("canny.io", "Canny", "DirectoryMining", "User feedback SaaS"),
    ("pendo.io", "Pendo", "DirectoryMining", "Product analytics SaaS"),
    ("appcues.com", "Appcues", "DirectoryMining", "User onboarding SaaS"),
    ("userpilot.com", "Userpilot", "DirectoryMining", "Product growth SaaS"),
    ("userflow.com", "Userflow", "DirectoryMining", "Product tours SaaS"),
    ("commandbar.com", "CommandBar", "DirectoryMining", "User assistance SaaS"),
    ("intercom.com", "Intercom", "DirectoryMining", "Customer messaging SaaS"),
    ("crisp.chat", "Crisp", "DirectoryMining", "Customer support SaaS"),
    ("tidio.com", "Tidio", "DirectoryMining", "Live chat/AI SaaS"),
    ("gorgias.com", "Gorgias", "DirectoryMining", "eCommerce helpdesk SaaS"),
    ("reamaze.com", "Re:amaze", "DirectoryMining", "Customer support SaaS"),
    ("helpscout.com", "Help Scout", "DirectoryMining", "Customer support SaaS"),
    ("groove.co", "Groove", "DirectoryMining", "Help desk SaaS"),
    ("supportbee.com", "SupportBee", "DirectoryMining", "Shared inbox SaaS"),
    ("zammad.com", "Zammad", "DirectoryMining", "Ticketing SaaS"),
    ("freshdesk.com", "Freshdesk", "DirectoryMining", "Customer support SaaS"),
    ("wix.com", "Wix", "DirectoryMining", "Website builder SaaS"),
    ("webflow.com", "Webflow", "DirectoryMining", "Visual web builder SaaS"),
    ("squarespace.com", "Squarespace", "DirectoryMining", "Website builder SaaS"),
    ("ghost.org", "Ghost", "DirectoryMining", "Publishing SaaS"),
    ("substack.com", "Substack", "DirectoryMining", "Newsletter SaaS"),
    ("convertkit.com", "ConvertKit", "DirectoryMining", "Creator email SaaS"),
    ("drip.com", "Drip", "DirectoryMining", "Ecommerce CRM SaaS"),
    ("klaviyo.com", "Klaviyo", "DirectoryMining", "Email/SMS marketing SaaS"),
    ("omnisend.com", "Omnisend", "DirectoryMining", "Omnichannel marketing SaaS"),
    ("activetrail.com", "ActiveTrail", "DirectoryMining", "Email marketing SaaS"),
    ("moosend.com", "Moosend", "DirectoryMining", "Email automation SaaS"),
    ("benchmark.email", "Benchmark Email", "DirectoryMining", "Email marketing SaaS"),
    ("brevo.com", "Brevo", "DirectoryMining", "CRM/email SaaS"),
    ("liveagent.com", "LiveAgent", "DirectoryMining", "Help desk SaaS"),
    ("enchant.com", "Enchant", "DirectoryMining", "Customer support SaaS"),
    ("heymarket.com", "Heymarket", "DirectoryMining", "Business texting SaaS"),
    ("textmagic.com", "Textmagic", "DirectoryMining", "SMS business SaaS"),
    ("salesmsg.com", "Salesmsg", "DirectoryMining", "SMS for sales SaaS"),
    ("podium.com", "Podium", "DirectoryMining", "Local business messaging SaaS"),
    ("birdeye.com", "Birdeye", "DirectoryMining", "Reputation management SaaS"),
    ("grade.us", "Grade.us", "DirectoryMining", "Review management SaaS"),
    ("reputationloop.com", "ReputationLoop", "DirectoryMining", "Review automation SaaS"),
    ("soci.com", "SOCi", "DirectoryMining", "Multi-location marketing SaaS"),
    ("yext.com", "Yext", "DirectoryMining", "Digital presence SaaS"),
    ("brightlocal.com", "BrightLocal", "DirectoryMining", "Local SEO SaaS"),
    ("whitespark.ca", "Whitespark", "DirectoryMining", "Local SEO SaaS"),
    ("semrush.com", "SEMRush", "DirectoryMining", "SEO/marketing SaaS"),
    ("ahrefs.com", "Ahrefs", "DirectoryMining", "SEO tools SaaS"),
    ("mangools.com", "Mangools", "DirectoryMining", "SEO toolkit SaaS"),
    ("serprobot.com", "SERPRobot", "DirectoryMining", "SERP tracking SaaS"),
    ("nightwatch.io", "Nightwatch", "DirectoryMining", "SEO rank tracking SaaS"),
    ("rankranger.com", "Rank Ranger", "DirectoryMining", "SEO monitoring SaaS"),
    ("seomonitor.com", "SEOmonitor", "DirectoryMining", "SEO agency SaaS"),
    ("ryte.com", "Ryte", "DirectoryMining", "Website quality SaaS"),
    ("buzzsumo.com", "BuzzSumo", "DirectoryMining", "Content research SaaS"),
    ("mention.com", "Mention", "DirectoryMining", "Media monitoring SaaS"),
    ("brandwatch.com", "Brandwatch", "DirectoryMining", "Social listening SaaS"),
    ("talkwalker.com", "Talkwalker", "DirectoryMining", "Consumer intelligence SaaS"),
    ("synthesio.com", "Synthesio", "DirectoryMining", "Social intelligence SaaS"),
    ("meltwater.com", "Meltwater", "DirectoryMining", "Media intelligence SaaS"),
    ("cision.com", "Cision", "DirectoryMining", "PR/comms SaaS"),
    ("prezly.com", "Prezly", "DirectoryMining", "PR software SaaS"),
    ("muck-rack.com", "Muck Rack", "DirectoryMining", "PR SaaS"),
    ("prowly.com", "Prowly", "DirectoryMining", "PR software SaaS"),
    ("agility-pr.com", "Agility PR", "DirectoryMining", "PR SaaS"),

    # ===== Additional small bootstrapped SaaS companies =====
    ("logsnag.com", "LogSnag", "DirectoryMining", "Event tracking SaaS"),
    ("highlight.io", "Highlight.io", "DirectoryMining", "Full-stack monitoring SaaS"),
    ("zipy.ai", "Zipy", "DirectoryMining", "Session replay SaaS"),
    ("logrocket.com", "LogRocket", "DirectoryMining", "Product analytics SaaS"),
    ("fullstory.com", "FullStory", "DirectoryMining", "Digital experience SaaS"),
    ("smartlook.com", "Smartlook", "DirectoryMining", "Product analytics SaaS"),
    ("plerdy.com", "Plerdy", "DirectoryMining", "UX analytics SaaS"),
    ("mouseflow.com", "Mouseflow", "DirectoryMining", "Session analytics SaaS"),
    ("hotjar.com", "Hotjar", "DirectoryMining", "Behavior analytics SaaS"),
    ("clarity.microsoft.com", "Microsoft Clarity", "DirectoryMining", "Behavior analytics SaaS"),
    ("mixpanel.com", "Mixpanel", "DirectoryMining", "Product analytics SaaS"),
    ("amplitude.com", "Amplitude", "DirectoryMining", "Digital analytics SaaS"),
    ("heap.io", "Heap", "DirectoryMining", "Product analytics SaaS"),
    ("june.so", "June", "DirectoryMining", "Product analytics SaaS"),
    ("posthog.com", "PostHog", "DirectoryMining", "Open-source analytics SaaS"),
    ("metabase.com", "Metabase", "DirectoryMining", "BI/analytics SaaS"),
    ("redash.io", "Redash", "DirectoryMining", "Data visualization SaaS"),
    ("deepnote.com", "Deepnote", "DirectoryMining", "Data notebook SaaS"),
    ("hex.tech", "Hex", "DirectoryMining", "Data notebook SaaS"),
    ("mode.com", "Mode", "DirectoryMining", "Analytics platform SaaS"),
    ("thoughtspot.com", "ThoughtSpot", "DirectoryMining", "AI analytics SaaS"),
    ("sisense.com", "Sisense", "DirectoryMining", "Business intelligence SaaS"),
    ("domo.com", "Domo", "DirectoryMining", "Business intelligence SaaS"),
    ("looker.com", "Looker", "DirectoryMining", "Data platform SaaS"),
    ("sigma.ai", "Sigma", "DirectoryMining", "AI solutions SaaS"),
]

ts = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
new_entries = []
seen_in_batch = set()

for domain, name, source, desc in RAW_COMPANIES:
    domain = domain.lower().strip()
    if not domain:
        continue
    if domain in existing:
        continue
    if domain in seen_in_batch:
        continue
    seen_in_batch.add(domain)
    entry = {
        "domain": domain,
        "company_name": name,
        "source": source,
        "employees": None,
        "state": None,
        "description": desc,
        "timestamp": ts
    }
    new_entries.append(entry)

print(f"New unique entries to add: {len(new_entries)}")

with open(QUEUE, 'a') as f:
    for entry in new_entries:
        f.write(json.dumps(entry) + '\n')

print("Done!")
