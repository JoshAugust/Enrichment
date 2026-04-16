#!/usr/bin/env python3
"""Batch 9: More long-tail B2B SaaS, MarTech, HealthTech, EdTech, ConstructionTech."""
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
    # MarTech (less known)
    ("ortto.com", "Ortto"), ("vero.io", "Vero"),
    ("userlist.com", "Userlist"), ("encharge.io", "Encharge"),
    ("automizy.com", "Automizy"), ("moosend.com", "Moosend"),
    ("sendinblue.com", "Sendinblue"), ("mailerlite.com", "MailerLite"),
    ("getresponse.com", "GetResponse"), ("aweber.com", "AWeber"),
    ("constantcontact.com", "Constant Contact"), ("benchmark.email", "Benchmark Email"),
    ("emma.com", "Emma"), ("campaignmonitor.com", "Campaign Monitor"),
    ("mailjet.com", "Mailjet"), ("litmus.com", "Litmus"),
    ("emailonacid.com", "Email on Acid"), ("stripo.email", "Stripo"),
    ("beefree.io", "BEE Free"), ("chamaileon.io", "Chamaileon"),
    # Attribution / Analytics
    ("dreamdata.io", "Dreamdata"), ("hockeystack.com", "HockeyStack"),
    ("factors.ai", "Factors.ai"), ("windsor.ai", "Windsor.ai"),
    ("segment.io", "Segment"), ("rudderstack.com", "RudderStack"),
    ("freshpaint.io", "Freshpaint"), ("metarouter.io", "MetaRouter"),
    ("lytics.com", "Lytics"), ("twilio.com", "Twilio"),
    # Conversion / UX
    ("mutinyhq.com", "Mutiny"), ("intellimize.com", "Intellimize"),
    ("unbounce.com", "Unbounce"), ("instapage.com", "Instapage"),
    ("leadpages.com", "Leadpages"), ("swipepages.com", "SwipePages"),
    ("landingi.com", "Landingi"), ("pagewiz.com", "PageWiz"),
    ("wishpond.com", "Wishpond"), ("elementor.com", "Elementor"),
    # Video marketing
    ("vidyard.com", "Vidyard"), ("wistia.com", "Wistia"),
    ("brightcove.com", "Brightcove"), ("vimeo.com", "Vimeo"),
    ("twentythree.com", "TwentyThree"), ("hippo-video.com", "Hippo Video"),
    ("bonjoro.com", "Bonjoro"), ("dubb.com", "Dubb"),
    ("loom.com", "Loom"), ("sendspark.com", "Sendspark"),
    # Personalization / recommendations
    ("dynamic-yield.com", "Dynamic Yield"), ("nosto.com", "Nosto"),
    ("evergage.com", "Evergage"), ("qubit.com", "Qubit"),
    ("monetate.com", "Monetate"), ("barilliance.com", "Barilliance"),
    ("bloomreach.com", "Bloomreach"), ("algonomy.com", "Algonomy"),
    # Loyalty / Rewards
    ("talon.one", "Talon.One"), ("voucherify.io", "Voucherify"),
    ("loyaltylion.com", "LoyaltyLion"), ("smile.io", "Smile.io"),
    ("yotpo.com", "Yotpo"), ("stamped.io", "Stamped"),
    ("antavo.com", "Antavo"), ("punchh.com", "Punchh"),
    # ConstructionTech
    ("procore.com", "Procore"), ("autodesk.com", "Autodesk"),
    ("trimble.com", "Trimble"), ("bentley.com", "Bentley Systems"),
    ("plangrid.com", "PlanGrid"), ("bluebeam.com", "Bluebeam"),
    ("newforma.com", "Newforma"), ("e-builder.net", "e-Builder"),
    ("aconex.com", "Aconex"), ("viewpoint.com", "Viewpoint"),
    ("sage300.com", "Sage 300"), ("foundationsoft.com", "Foundation Software"),
    ("hcss.com", "HCSS"), ("assignar.com", "Assignar"),
    ("busybusy.com", "busybusy"), ("clockshark.com", "ClockShark"),
    ("buildertrend.com", "Buildertrend"), ("coconstruct.com", "CoConstruct"),
    ("knowify.com", "Knowify"), ("jobtread.com", "JobTread"),
    # HealthTech SaaS
    ("healthie.com", "Healthie"), ("hint.com", "Hint Health"),
    ("tebra.com", "Tebra"), ("simplepractice.com", "SimplePractice"),
    ("theranest.com", "TheraNest"), ("therapynotes.com", "TherapyNotes"),
    ("valant.io", "Valant"), ("kipu.com", "Kipu Health"),
    ("carelogic.com", "CareLogic"), ("nextstep.com", "NextStep"),
    ("kareo.com", "Kareo"), ("advancedmd.com", "AdvancedMD"),
    ("greenway.com", "Greenway Health"), ("allscripts.com", "Allscripts"),
    ("eclinicalworks.com", "eClinicalWorks"), ("nextgen.com", "NextGen"),
    ("modernizing.com", "Modernizing Medicine"), ("patientpop.com", "PatientPop"),
    ("solutionreach.com", "Solutionreach"), ("weaveconnect.com", "Weave"),
    # EdTech SaaS
    ("schoology.com", "Schoology"), ("canvaslms.com", "Canvas"),
    ("blackboard.com", "Blackboard"), ("moodle.org", "Moodle"),
    ("d2l.com", "D2L"), ("powerschool.com", "PowerSchool"),
    ("clever.com", "Clever"), ("schoolmint.com", "SchoolMint"),
    ("finalsite.com", "Finalsite"), ("blackbaud.com", "Blackbaud"),
    ("raiseme.com", "RaiseMe"), ("collegeboard.org", "College Board"),
    ("panoramaed.com", "Panorama Education"), ("newsela.com", "Newsela"),
    ("edpuzzle.com", "Edpuzzle"), ("peardeck.com", "Pear Deck"),
    ("kami.app", "Kami"), ("screencastify.com", "Screencastify"),
    # Retail Tech
    ("shopify.com", "Shopify"), ("lightspeedhq.com", "Lightspeed"),
    ("squareup.com", "Square"), ("vend.com", "Vend"),
    ("revel.com", "Revel"), ("kounta.com", "Kounta"),
    ("loyverse.com", "Loyverse"), ("erply.com", "Erply"),
    # Hospitality Tech
    ("cloudbeds.com", "Cloudbeds"), ("mews.com", "Mews"),
    ("stayntouch.com", "StayNTouch"), ("hotelogix.com", "Hotelogix"),
    ("eviivo.com", "eviivo"), ("guestline.com", "Guestline"),
    ("apaleo.com", "Apaleo"), ("shiji.com", "Shiji"),
    # Fitness / Wellness
    ("mindbodyonline.com", "Mindbody"), ("wellnessliving.com", "WellnessLiving"),
    ("zenplanner.com", "Zen Planner"), ("pushpress.com", "PushPress"),
    ("trainerize.com", "Trainerize"), ("exercise.com", "Exercise.com"),
    # Field Service Management
    ("servicetitan.com", "ServiceTitan"), ("housecallpro.com", "Housecall Pro"),
    ("jobber.com", "Jobber"), ("fieldpulse.com", "FieldPulse"),
    ("kickserv.com", "Kickserv"), ("servicefusion.com", "Service Fusion"),
    ("workiz.com", "Workiz"), ("fieldedge.com", "FieldEdge"),
    # Nonprofit Tech
    ("bloomerang.co", "Bloomerang"), ("neonone.com", "Neon One"),
    ("givebutter.com", "Givebutter"), ("networkforgood.com", "Network for Good"),
    ("classy.org", "Classy"), ("donorbox.org", "Donorbox"),
    ("everyaction.com", "EveryAction"), ("salsa.com", "Salsa"),
    # Church / Ministry Tech
    ("pushpay.com", "Pushpay"), ("planningcenter.com", "Planning Center"),
    ("fellowshipone.com", "FellowshipOne"), ("shelby.com", "Shelby Systems"),
    # Auto Tech
    ("tekion.com", "Tekion"), ("cargurus.com", "CarGurus"),
    ("carfax.com", "Carfax"), ("autotrader.com", "Autotrader"),
    ("dealersocket.com", "DealerSocket"), ("vauto.com", "vAuto"),
    ("lotlinx.com", "LotLinx"), ("spyne.ai", "Spyne"),
    # Manufacturing / Industrial
    ("tulip.co", "Tulip"), ("augmentir.com", "Augmentir"),
    ("plex.com", "Plex"), ("iqms.com", "IQMS"),
    ("epicor.com", "Epicor"), ("rootstock.com", "Rootstock"),
    ("cetec.com", "Cetec ERP"), ("megaventory.com", "Megaventory"),
    # Agriculture Tech
    ("cropx.com", "CropX"), ("taranis.com", "Taranis"),
    ("tracegenomics.com", "Trace Genomics"), ("farmwise.io", "FarmWise"),
    ("arable.com", "Arable"), ("sentera.com", "Sentera"),
    # Energy / Utilities
    ("arcadia.com", "Arcadia"), ("cleartrace.io", "ClearTrace"),
    ("watershedclimate.com", "Watershed"), ("persefoni.com", "Persefoni"),
    ("patch.io", "Patch"), ("sweep.net", "Sweep"),
    ("carbonchain.com", "CarbonChain"), ("emitwise.com", "Emitwise"),
    # Cannabis Tech
    ("dutchie.com", "Dutchie"), ("flowhub.com", "Flowhub"),
    ("treez.io", "Treez"), ("biotrackthc.com", "BioTrack"),
    ("leafly.com", "Leafly"), ("meadow.com", "Meadow"),
    # Pet Tech
    ("petdesk.com", "PetDesk"), ("pawlicy.com", "Pawlicy"),
    ("vetcove.com", "Vetcove"), ("digitail.io", "Digitail"),
    # Sports Tech
    ("hudl.com", "Hudl"), ("teamsnap.com", "TeamSnap"),
    ("sportsengine.com", "SportsEngine"), ("activenetwork.com", "Active Network"),
    ("dribbleup.com", "DribbleUp"), ("athleon.com", "Athleon"),
    # Parking / Mobility
    ("parkwhiz.com", "ParkWhiz"), ("spothero.com", "SpotHero"),
    ("parkme.com", "ParkMe"), ("flashparking.com", "Flash"),
    # Music Tech
    ("splice.com", "Splice"), ("landr.com", "LANDR"),
    ("distrokid.com", "DistroKid"), ("cdbaby.com", "CD Baby"),
    ("soundtrap.com", "Soundtrap"), ("bandcamp.com", "Bandcamp"),
    # Gaming / Interactive
    ("playio.com", "Play.io"), ("roblox.com", "Roblox"),
    ("unity.com", "Unity"), ("unrealengine.com", "Unreal Engine"),
    ("godotengine.org", "Godot"), ("improbable.io", "Improbable"),
    # Media / Publishing
    ("ceros.com", "Ceros"), ("shorthand.com", "Shorthand"),
    ("issuu.com", "Issuu"), ("foleon.com", "Foleon"),
    ("publitas.com", "Publitas"), ("flipsnack.com", "Flipsnack"),
]

for d, n in companies:
    add(d, n)

print(f"\nBatch 9 total new: {added}")
print(f"Total in output: {len(written)}")
