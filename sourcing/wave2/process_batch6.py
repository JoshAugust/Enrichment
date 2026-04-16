#!/usr/bin/env python3
"""Batch 6: TechCrunch funded startups 2025, SaaStr sponsors, more emerging."""
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
def add(domain, name, source="techcrunch_funded", category="saas", meta=None):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": meta or {}}) + '\n')
    written.add(d)
    added += 1

# TechCrunch 55 AI startups that raised $100M+ in 2025
tc_ai = [
    ("mythic.ai", "Mythic"), ("chaidiscovery.com", "Chai Discovery"),
    ("fal.ai", "Fal"), ("unconventional.ai", "Unconventional AI"),
    ("7ai.com", "7AI"), ("genspark.ai", "Genspark"),
    ("lumalabs.ai", "Luma AI"), ("cursor.com", "Cursor"),
    ("parallel.ai", "Parallel"), ("hippocraticai.com", "Hippocratic AI"),
    ("uniphore.com", "Uniphore"), ("sesame.com", "Sesame"),
    ("openevidence.com", "OpenEvidence"), ("lila.ai", "Lila Sciences"),
    ("reflection.ai", "Reflection AI"), ("evenuplaw.com", "EvenUp"),
    ("periodiclabs.com", "Periodic Labs"), ("cerebras.ai", "Cerebras"),
    ("modular.com", "Modular"), ("distyl.ai", "Distyl AI"),
    ("upscaleai.com", "Upscale AI"), ("groq.com", "Groq"),
    ("invisibletech.ai", "Invisible Technologies"),
    ("baseten.co", "Baseten"), ("sierra.ai", "Sierra"),
    ("you.com", "You.com"), ("eliseai.com", "EliseAI"),
    ("decart.ai", "Decart"), ("harvey.ai", "Harvey"),
    ("tennr.com", "Tennr"), ("eudia.com", "Eudia"),
    ("enchargeai.com", "EnCharge AI"), ("elevenlabs.io", "ElevenLabs"),
    ("sandboxaq.com", "SandboxAQ"), ("runway.com", "Runway"),
    ("nexthop.ai", "Nexthop AI"), ("insilicomedicine.com", "Insilico Medicine"),
    ("celestial.ai", "Celestial AI"), ("lambdalabs.com", "Lambda"),
    ("shield.ai", "Shield AI"), ("tensorwave.com", "TensorWave"),
    ("resolve.ai", "Resolve AI"), ("runware.com", "Runware"),
    ("wisdomai.com", "WisdomAI"), ("wonderful.com", "Wonderful"),
    ("momentic.ai", "Momentic"), ("sixsense.ai", "SixSense"),
    ("sphere.com", "Sphere"), ("empromptu.com", "Empromptu"),
    ("thinkingmachineslab.com", "Thinking Machines Lab"),
    ("harmonic.ai", "Harmonic"), ("reka.ai", "Reka AI"),
    ("snorkel.ai", "Snorkel AI"), ("lmarena.ai", "LMArena"),
]

# SaaStr 2024 top sponsors
saastr = [
    ("paddle.com", "Paddle"), ("mercury.com", "Mercury"),
    ("roam.ai", "Roam"), ("front.com", "Front"),
    ("bill.com", "Bill.com"), ("carta.com", "Carta"),
    ("prismatic.io", "Prismatic"), ("g2.com", "G2"),
]

# More TechCrunch smaller rounds
tc_smaller = [
    ("glimpse.ai", "Glimpse"), ("aaru.ai", "Aaru"),
]

# Additional well-known B2B SaaS not yet added
more_saas = [
    # API / Developer
    ("postman.com", "Postman"), ("insomnia.rest", "Insomnia"),
    ("stoplight.io", "Stoplight"), ("readme.com", "ReadMe"),
    ("swagger.io", "Swagger"), ("apidog.com", "Apidog"),
    ("hoppscotch.io", "Hoppscotch"),
    # Monitoring / Observability
    ("lightstep.com", "Lightstep"), ("honeycomb.io", "Honeycomb"),
    ("newrelic.com", "New Relic"), ("dynatrace.com", "Dynatrace"),
    ("elastic.co", "Elastic"), ("splunk.com", "Splunk"),
    ("sumologic.com", "Sumo Logic"), ("coralogix.com", "Coralogix"),
    ("logz.io", "Logz.io"), ("mezmo.com", "Mezmo"),
    # Cloud / Infrastructure
    ("hashicorp.com", "HashiCorp"), ("terraform.io", "Terraform"),
    ("crossplane.io", "Crossplane"), ("upbound.io", "Upbound"),
    ("portainer.io", "Portainer"), ("rancher.com", "Rancher"),
    ("d2iq.com", "D2iQ"), ("platform9.com", "Platform9"),
    ("mirantis.com", "Mirantis"), ("vmware.com", "VMware"),
    # Database
    ("mongodb.com", "MongoDB"), ("redis.com", "Redis"),
    ("neo4j.com", "Neo4j"), ("arangodb.com", "ArangoDB"),
    ("fauna.com", "Fauna"), ("singlestore.com", "SingleStore"),
    ("yugabyte.com", "Yugabyte"), ("vitess.io", "Vitess"),
    ("couchbase.com", "Couchbase"), ("mariadb.com", "MariaDB"),
    # Feature flags / experimentation
    ("split.io", "Split"), ("flagsmith.com", "Flagsmith"),
    ("configcat.com", "ConfigCat"), ("growthbook.io", "GrowthBook"),
    ("eppo.com", "Eppo"), ("statsig.com", "Statsig"),
    # Reverse ETL / CDP
    ("getcensus.com", "Census"), ("rudderstack.com", "RudderStack"),
    ("hightouch.io", "Hightouch"), ("lytics.com", "Lytics"),
    ("blueconic.com", "BlueConic"), ("treasure-data.com", "Treasure Data"),
    ("mparticle.com", "mParticle"),
    # API gateway / service mesh
    ("konghq.com", "Kong"), ("solo.io", "Solo.io"),
    ("tetrate.io", "Tetrate"), ("buoyant.io", "Buoyant"),
    ("envoyproxy.io", "Envoy"), ("traefik.io", "Traefik"),
    ("nginx.com", "NGINX"),
    # Workflow / BPM
    ("temporal.io", "Temporal"), ("camunda.com", "Camunda"),
    ("n8n.io", "n8n"), ("activepieces.com", "Activepieces"),
    ("pipedream.com", "Pipedream"), ("windmill.dev", "Windmill"),
    # Auth / Identity
    ("stytch.com", "Stytch"), ("clerk.dev", "Clerk"),
    ("fusionauth.io", "FusionAuth"), ("keycloak.org", "Keycloak"),
    ("descope.com", "Descope"), ("passage.id", "Passage"),
    # Email
    ("resend.com", "Resend"), ("mailpace.com", "MailPace"),
    ("loops.so", "Loops"), ("buttondown.email", "Buttondown"),
    # Search
    ("meilisearch.com", "Meilisearch"), ("typesense.org", "Typesense"),
    # Error tracking / debugging
    ("highlight.io", "Highlight"), ("bugsnag.com", "Bugsnag"),
    ("raygun.com", "Raygun"),
    # Background jobs
    ("inngest.com", "Inngest"), ("trigger.dev", "Trigger.dev"),
    ("quirrel.dev", "Quirrel"),
    # Feature management
    ("configcat.com", "ConfigCat"),
    # Misc B2B SaaS
    ("notion.so", "Notion"), ("craft.do", "Craft"),
    ("capacitor.io", "Capacitor"), ("expo.dev", "Expo"),
    ("tauri.app", "Tauri"), ("electronjs.org", "Electron"),
    ("warp.dev", "Warp"), ("fig.io", "Fig"),
    ("pieces.app", "Pieces"), ("raycast.com", "Raycast"),
    ("logseq.com", "Logseq"), ("obsidian.md", "Obsidian"),
    ("roamresearch.com", "Roam Research"), ("anytype.io", "Anytype"),
    ("appflowy.io", "AppFlowy"), ("affine.pro", "AFFiNE"),
    # Vertical SaaS (less known)
    ("prokeep.com", "Prokeep"), ("corebridge.com", "Corebridge"),
    ("qualia.com", "Qualia"), ("snapdocs.com", "Snapdocs"),
    ("blend.com", "Blend"), ("maxio.com", "Maxio"),
    ("ordway.com", "Ordway"), ("recurly.com", "Recurly"),
    ("zuora.com", "Zuora"), ("goformz.com", "GoFormz"),
    ("bluebeam.com", "Bluebeam"), ("fieldwire.com", "Fieldwire"),
    ("samsara.com", "Samsara"), ("motive.com", "Motive"),
    ("locus.sh", "Locus"), ("nextbillion.ai", "NextBillion.ai"),
    ("cargon.ai", "Cargon"), ("vizion.ai", "Vizion"),
    ("loadsmart.com", "Loadsmart"), ("turvo.com", "Turvo"),
    # PropTech
    ("helloalfred.com", "Alfred"), ("latch.com", "Latch"),
    ("smartrent.com", "SmartRent"), ("entrata.com", "Entrata"),
    ("realpage.com", "RealPage"), ("appfolio.com", "AppFolio"),
    ("buildium.com", "Buildium"), ("rentvine.com", "RentVine"),
    # Insurance Tech
    ("lemonade.com", "Lemonade"), ("rootinsurance.com", "Root"),
    ("hippo.com", "Hippo"), ("next-insurance.com", "Next Insurance"),
    ("newfront.com", "Newfront"), ("vouch.us", "Vouch"),
    ("embroker.com", "Embroker"), ("at-bay.com", "At-Bay"),
    ("corvus.com", "Corvus"), ("coalition.com", "Coalition"),
    # GovTech
    ("govio.com", "GovIO"), ("accela.com", "Accela"),
    ("civicplus.com", "CivicPlus"), ("granicus.com", "Granicus"),
    ("opengov.com", "OpenGov"), ("agiloft.com", "Agiloft"),
    ("icertis.com", "Icertis"), ("docusign.com", "DocuSign"),
    # Food / Restaurant Tech
    ("toasttab.com", "Toast"), ("square.com", "Square"),
    ("clover.com", "Clover"), ("lightspeedhq.com", "Lightspeed"),
    ("aloha.ncr.com", "Aloha"), ("popmenu.com", "Popmenu"),
    ("bentobox.com", "BentoBox"), ("chowly.com", "Chowly"),
    ("itsacheckmate.com", "Checkmate"), ("olo.com", "Olo"),
    ("grubhub.com", "Grubhub"), ("doordash.com", "DoorDash"),
    # Travel Tech
    ("amelia.com", "Amelia"), ("hopper.com", "Hopper"),
    ("navan.com", "Navan"), ("tripactions.com", "TripActions"),
    ("engine.com", "Engine"), ("troop.com", "Troop"),
    ("travelperk.com", "TravelPerk"), ("spotnana.com", "Spotnana"),
    # AgTech
    ("farmers.gov", "Farmers.gov"), ("farmcrowdy.com", "FarmCrowdy"),
    ("granular.ag", "Granular"), ("deere.com", "John Deere"),
    ("agjunction.com", "AgJunction"), ("prospera.ag", "Prospera"),
    ("ceres-imaging.com", "Ceres Imaging"),
    # Supply Chain
    ("coupa.com", "Coupa"), ("jaggaer.com", "Jaggaer"),
    ("tradeshift.com", "Tradeshift"), ("transporeon.com", "Transporeon"),
    ("relex.com", "RELEX Solutions"), ("o9solutions.com", "o9 Solutions"),
    ("kinaxis.com", "Kinaxis"), ("llamasoft.com", "LLamasoft"),
    # Accounting / Finance ops
    ("brex.com", "Brex"), ("mercury.com", "Mercury"),
    ("ramp.com", "Ramp"), ("navan.com", "Navan"),
    ("floqast.com", "FloQast"), ("blackline.com", "BlackLine"),
    ("onestream.com", "OneStream"), ("planful.com", "Planful"),
    ("vena.io", "Vena Solutions"), ("datarails.com", "Datarails"),
    ("cube.dev", "Cube"),
]

for d, n in tc_ai:
    add(d, n, "techcrunch_funded", "ai")
for d, n in saastr:
    add(d, n, "saastr_sponsor", "saas")
for d, n in tc_smaller:
    add(d, n, "techcrunch_funded", "ai")
for d, n in more_saas:
    add(d, n, "industry_directory", "saas")

print(f"\nBatch 6 total new: {added}")
print(f"Total in output: {len(written)}")
