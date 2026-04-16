#!/usr/bin/env python3
"""Batch 10: Omnius top 60, Wellows 40, plus more niche SaaS."""
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
def add(domain, name, source="startup_list", category="saas", meta=None):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": meta or {}}) + '\n')
    written.add(d)
    added += 1

# Omnius top 60 US SaaS (new ones)
omnius = [
    ("perplexity.ai", "Perplexity"), ("ninjaone.com", "NinjaOne"),
    ("zencoder.ai", "Zencoder"), ("workos.com", "WorkOS"),
    ("apptronik.com", "Apptronik"), ("solace.health", "Solace"),
    ("unitq.com", "unitQ"), ("textio.com", "Textio"),
    ("protectai.com", "Protect AI"), ("connectbase.com", "Connectbase"),
    ("sardine.ai", "Sardine"), ("redpanda.com", "Redpanda"),
    ("unqork.com", "Unqork"), ("abacus.ai", "Abacus AI"),
    ("knowbe4.com", "KnowBe4"), ("talkdesk.com", "Talkdesk"),
    ("benchling.com", "Benchling"), ("verkada.com", "Verkada"),
    ("recorded-future.com", "Recorded Future"), ("codeium.com", "Codeium"),
    ("windsurf.com", "Windsurf"),
]

# Wellows 40 (new ones)
wellows = [
    ("linktree.com", "Linktree"), ("printify.com", "Printify"),
]

# More emerging AI/SaaS from TechCrunch / Product Hunt
emerging_ai = [
    ("dub.co", "Dub"), ("hypertune.com", "Hypertune"),
    ("layercode.com", "Layercode"), ("raycast.com", "Raycast"),
    ("loki.build", "Loki.Build"), ("continue.dev", "Continue"),
    ("sparkenergy.ai", "Spark"), ("eloquent.ai", "Eloquent AI"),
    ("getreacher.com", "Reacher"), ("stablyai.com", "Stably AI"),
    ("agenthub.dev", "AgentHub"), ("acolite.io", "Acolite"),
    ("groww.in", "Groww"), ("olive.app", "Olive"),
]

# More niche SaaS companies (B2B focused)
more_niche = [
    # Proposal / CPQ
    ("pandadoc.com", "PandaDoc"), ("responsive.io", "Responsive"),
    ("loopio.com", "Loopio"), ("rfpio.com", "RFPIO"),
    ("bidops.com", "Bidops"), ("conga.com", "Conga"),
    # IT Service Management
    ("servicenow.com", "ServiceNow"), ("bmc.com", "BMC"),
    ("ivanti.com", "Ivanti"), ("manageengine.com", "ManageEngine"),
    ("solarwinds.com", "SolarWinds"), ("itarian.com", "ITarian"),
    # Digital Asset Management
    ("bynder.com", "Bynder"), ("canto.com", "Canto"),
    ("brandfolder.com", "Brandfolder"), ("widen.com", "Widen"),
    ("frontify.com", "Frontify"), ("air.inc", "Air"),
    ("brandy.io", "Brandy"), ("pickit.com", "Pickit"),
    # Translation / Localization
    ("phrase.com", "Phrase"), ("lokalise.com", "Lokalise"),
    ("crowdin.com", "Crowdin"), ("transifex.com", "Transifex"),
    ("smartling.com", "Smartling"), ("memsource.com", "Memsource"),
    # Product Information Management
    ("akeneo.com", "Akeneo"), ("salsify.com", "Salsify"),
    ("plytix.com", "Plytix"), ("pimcore.com", "Pimcore"),
    # E-commerce enablement
    ("nacelle.com", "Nacelle"), ("fabric.inc", "Fabric"),
    ("constructor.io", "Constructor"), ("nosto.com", "Nosto"),
    ("searchspring.com", "SearchSpring"), ("klevu.com", "Klevu"),
    ("algolia.com", "Algolia"), ("bloomreach.com", "Bloomreach"),
    # Customer Data Platform
    ("rudderstack.com", "RudderStack"), ("segment.com", "Segment"),
    ("lytics.com", "Lytics"), ("blueconic.com", "BlueConic"),
    ("treasure-data.com", "Treasure Data"), ("mparticle.com", "mParticle"),
    ("tealium.com", "Tealium"), ("actioniq.com", "ActionIQ"),
    ("zeotap.com", "Zeotap"),
    # Consent / Cookie management
    ("cookiebot.com", "Cookiebot"), ("onetrust.com", "OneTrust"),
    ("osano.com", "Osano"), ("iubenda.com", "Iubenda"),
    ("termly.io", "Termly"), ("complianz.io", "Complianz"),
    # Price optimization
    ("prisync.com", "Prisync"), ("competera.net", "Competera"),
    ("pricemoov.com", "PriceMoov"), ("zilliant.com", "Zilliant"),
    ("pros.com", "PROS"), ("vendavo.com", "Vendavo"),
    # Revenue management
    ("clari.com", "Clari"), ("gong.io", "Gong"),
    ("aviso.com", "Aviso"), ("xactly.com", "Xactly"),
    ("captivateiq.com", "CaptivateIQ"), ("spiff.com", "Spiff"),
    ("quotapath.com", "QuotaPath"), ("everstage.com", "Everstage"),
    # Customer engagement
    ("braze.com", "Braze"), ("iterable.com", "Iterable"),
    ("clevertap.com", "CleverTap"), ("moengage.com", "MoEngage"),
    ("insider.com", "Insider"), ("netcore.cloud", "Netcore"),
    ("webengage.com", "WebEngage"), ("pushpush.io", "PushPush"),
    # Conversational AI
    ("voiceflow.com", "Voiceflow"), ("botpress.com", "Botpress"),
    ("rasa.com", "Rasa"), ("yellow.ai", "Yellow.ai"),
    ("kore.ai", "Kore.ai"), ("avaamo.com", "Avaamo"),
    ("haptik.ai", "Haptik"), ("boost.ai", "Boost.ai"),
    # Integration platforms
    ("workato.com", "Workato"), ("make.com", "Make"),
    ("zapier.com", "Zapier"), ("tray.io", "Tray.io"),
    ("celigo.com", "Celigo"), ("snaplogic.com", "SnapLogic"),
    ("prismatic.io", "Prismatic"), ("paragon.one", "Paragon"),
    ("cyclr.com", "Cyclr"), ("embedded.io", "Embedded"),
    # Document collaboration
    ("notion.so", "Notion"), ("coda.io", "Coda"),
    ("clickup.com", "ClickUp"), ("fibery.io", "Fibery"),
    ("capacities.io", "Capacities"), ("scrintal.com", "Scrintal"),
    ("clover.app", "Clover Notes"), ("heptabase.com", "Heptabase"),
    # Developer analytics
    ("linearb.io", "LinearB"), ("sleuth.io", "Sleuth"),
    ("swarmia.com", "Swarmia"), ("pluralsight.com", "Pluralsight"),
    ("jellyfish.co", "Jellyfish"), ("keypup.io", "Keypup"),
    ("waydev.co", "Waydev"), ("getdx.com", "DX"),
    # Site reliability / SRE
    ("shoreline.io", "Shoreline"), ("nobl9.com", "Nobl9"),
    ("reliably.com", "Reliably"),
    # Data observability
    ("montecarlodata.com", "Monte Carlo"), ("bigeye.com", "Bigeye"),
    ("anomalo.com", "Anomalo"), ("soda.io", "Soda"),
    ("acceldata.io", "Acceldata"), ("kensu.io", "Kensu"),
    # API documentation
    ("readme.com", "ReadMe"), ("mintlify.com", "Mintlify"),
    ("redocly.com", "Redocly"), ("bump.sh", "Bump.sh"),
    ("scalar.com", "Scalar"), ("fern.api", "Fern"),
    # Open source companies
    ("temporal.io", "Temporal"), ("n8n.io", "n8n"),
    ("posthog.com", "PostHog"), ("supabase.com", "Supabase"),
    ("chatwoot.com", "Chatwoot"), ("cal.com", "Cal.com"),
    ("lago.dev", "Lago"), ("formbricks.com", "Formbricks"),
    ("documenso.com", "Documenso"), ("plane.so", "Plane"),
    ("huly.io", "Huly"), ("erxes.io", "erxes"),
    ("infisical.com", "Infisical"), ("novu.co", "Novu"),
    ("flagsmith.com", "Flagsmith"),
    ("boxyhq.com", "BoxyHQ"), ("hanko.io", "Hanko"),
    ("unkey.dev", "Unkey"), ("openstatus.dev", "OpenStatus"),
    ("papermark.io", "Papermark"), ("dub.co", "Dub"),
    ("twenty.com", "Twenty"), ("rallly.co", "Rallly"),
    ("ghostfolio.dev", "Ghostfolio"),
    # AI agent platforms
    ("langchain.com", "LangChain"), ("llamaindex.ai", "LlamaIndex"),
    ("crewai.com", "CrewAI"), ("autogpt.net", "AutoGPT"),
    ("fixie.ai", "Fixie"), ("dust.tt", "Dust"),
    ("humanloop.com", "Humanloop"), ("promptlayer.com", "PromptLayer"),
    ("helicone.ai", "Helicone"), ("langfuse.com", "Langfuse"),
    ("traceloop.com", "Traceloop"), ("arize.com", "Arize"),
    ("phoenix.arize.com", "Phoenix"), ("weights.com", "Weights"),
    ("braintrustdata.com", "Braintrust"), ("patronus.ai", "Patronus AI"),
    ("guardrailsai.com", "Guardrails AI"), ("rebuff.ai", "Rebuff"),
    ("lakera.ai", "Lakera"), ("protectai.com", "Protect AI"),
    # More misc SaaS
    ("tinybird.co", "Tinybird"), ("upstash.com", "Upstash"),
    ("neon.tech", "Neon"), ("turso.tech", "Turso"),
    ("convex.dev", "Convex"), ("liveblocks.io", "Liveblocks"),
    ("partykit.io", "PartyKit"), ("inngest.com", "Inngest"),
    ("trigger.dev", "Trigger.dev"), ("defer.run", "Defer"),
    ("val.town", "Val Town"), ("resend.com", "Resend"),
    ("loops.so", "Loops"),
]

for d, n in omnius:
    add(d, n, "omnius_top60")
for d, n in wellows:
    add(d, n, "wellows_40")
for d, n in emerging_ai:
    add(d, n, "product_hunt")
for d, n in more_niche:
    add(d, n, "industry_directory")

print(f"\nBatch 10 total new: {added}")
print(f"Total in output: {len(written)}")
