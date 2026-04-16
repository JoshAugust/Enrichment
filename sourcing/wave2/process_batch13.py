#!/usr/bin/env python3
"""Batch 13: startup.jobs companies, more niche verticals, micro-SaaS."""
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
def add(domain, name, source="startup_jobs", category="saas", meta=None):
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
    # startup.jobs companies
    ("flowspace.com", "Flowspace"), ("dragos.com", "Dragos"),
    ("squiz.net", "Squiz"), ("leapfin.com", "Leapfin"),
    ("pandologic.com", "PandoLogic"), ("nextech.com", "Nextech Systems"),
    ("stickermule.com", "Sticker Mule"),
    # Micro-SaaS / bootstrapped gems
    ("baremetrics.com", "Baremetrics"), ("transistor.fm", "Transistor"),
    ("fathom.video", "Fathom"), ("savvycal.com", "SavvyCal"),
    ("tuple.app", "Tuple"), ("pop.com", "Pop"),
    ("campfire.to", "Campfire"), ("jam.dev", "Jam"),
    ("linear.app", "Linear"), ("height.app", "Height"),
    ("cal.com", "Cal.com"), ("dub.co", "Dub"),
    ("resend.com", "Resend"), ("loops.so", "Loops"),
    ("tinybird.co", "Tinybird"), ("neon.tech", "Neon"),
    ("turso.tech", "Turso"), ("upstash.com", "Upstash"),
    ("convex.dev", "Convex"), ("liveblocks.io", "Liveblocks"),
    ("partykit.io", "PartyKit"), ("inngest.com", "Inngest"),
    ("trigger.dev", "Trigger.dev"), ("val.town", "Val Town"),
    ("peerdb.io", "PeerDB"), ("singlebase.cloud", "SingleBase"),
    ("hatchet.run", "Hatchet"), ("logsnag.com", "LogSnag"),
    ("openreplay.com", "OpenReplay"), ("jam.dev", "Jam"),
    ("usefathom.com", "Fathom Analytics"),
    # More funded startups (from various lists)
    ("notion.so", "Notion"), ("canva.com", "Canva"),
    ("attio.com", "Attio"), ("clay.com", "Clay"),
    ("folk.app", "Folk"), ("twenty.com", "Twenty"),
    ("plane.so", "Plane"), ("huly.io", "Huly"),
    ("affine.pro", "AFFiNE"), ("appflowy.io", "AppFlowy"),
    # Data infrastructure
    ("motherduck.com", "MotherDuck"), ("duckdb.org", "DuckDB"),
    ("polarsignals.com", "Polar Signals"), ("hydrolix.io", "Hydrolix"),
    ("parseable.io", "Parseable"), ("cribl.io", "Cribl"),
    ("chronosphere.io", "Chronosphere"), ("calyptia.com", "Calyptia"),
    ("mezmo.com", "Mezmo"), ("vector.dev", "Vector"),
    ("fluentbit.io", "Fluent Bit"), ("graylog.org", "Graylog"),
    ("signoz.io", "SigNoz"), ("uptrace.dev", "Uptrace"),
    ("jaeger-tracing.io", "Jaeger"), ("zipkin.io", "Zipkin"),
    # ML feature stores / model serving
    ("feast.dev", "Feast"), ("tecton.ai", "Tecton"),
    ("featureform.com", "Featureform"), ("hopsworks.ai", "Hopsworks"),
    ("qdrant.tech", "Qdrant"), ("weaviate.io", "Weaviate"),
    ("pinecone.io", "Pinecone"), ("chroma.ai", "Chroma"),
    ("milvus.io", "Milvus"), ("zilliz.com", "Zilliz"),
    ("marqo.ai", "Marqo"), ("turbopuffer.com", "Turbopuffer"),
    ("lantern.dev", "Lantern"), ("pgvector.io", "pgvector"),
    # API monetization
    ("speakeasy.com", "Speakeasy"), ("zuplo.com", "Zuplo"),
    ("unkey.dev", "Unkey"), ("openmeter.io", "OpenMeter"),
    ("getlago.com", "Lago"), ("orb.com", "Orb"),
    ("metronome.com", "Metronome"), ("amberflo.io", "Amberflo"),
    ("stigg.io", "Stigg"), ("schematichq.com", "Schematic"),
    # Auth / Access
    ("clerk.com", "Clerk"), ("stytch.com", "Stytch"),
    ("descope.com", "Descope"), ("workos.com", "WorkOS"),
    ("fusionauth.io", "FusionAuth"), ("hanko.io", "Hanko"),
    ("boxyhq.com", "BoxyHQ"), ("permit.io", "Permit.io"),
    ("cerbos.dev", "Cerbos"), ("osohq.com", "Oso"),
    ("authzed.com", "AuthZed"), ("openfga.dev", "OpenFGA"),
    # Notifications
    ("novu.co", "Novu"), ("knock.app", "Knock"),
    ("courier.com", "Courier"), ("engagespot.co", "Engagespot"),
    ("magicbell.com", "MagicBell"), ("notificationapi.com", "NotificationAPI"),
    # Scheduling / Queue
    ("inngest.com", "Inngest"), ("trigger.dev", "Trigger.dev"),
    ("hatchet.run", "Hatchet"), ("qstash.upstash.com", "QStash"),
    # Edge compute
    ("deno.com", "Deno"), ("bun.sh", "Bun"),
    ("val.town", "Val Town"), ("workers.cloudflare.com", "Cloudflare Workers"),
    ("vercel.com", "Vercel"), ("netlify.com", "Netlify"),
    # Collaboration
    ("liveblocks.io", "Liveblocks"), ("partykit.io", "PartyKit"),
    ("yjs.dev", "Yjs"), ("convergence.io", "Convergence"),
    # PDF / Doc generation
    ("apitemplate.io", "APITemplate"), ("pdfmonkey.io", "PDF Monkey"),
    ("anvil.works", "Anvil"), ("docspring.com", "DocSpring"),
    ("pdfshift.io", "PDFShift"), ("htmlpdfapi.com", "HTML PDF API"),
    # Screenshot / image
    ("screenshotone.com", "ScreenshotOne"), ("urlbox.io", "UrlBox"),
    ("htmlcsstoimage.com", "HTML/CSS to Image"),
    # Webhooks
    ("svix.com", "Svix"), ("hookdeck.com", "Hookdeck"),
    ("convoy.io", "Convoy"),
    # Rate limiting
    ("arcjet.com", "Arcjet"),
    # More various SaaS
    ("buildwithfern.com", "Fern"), ("stainlessapi.com", "Stainless"),
    ("speakeasyapi.dev", "Speakeasy"), ("scalar.com", "Scalar"),
    ("bump.sh", "Bump.sh"), ("redocly.com", "Redocly"),
    ("readme.com", "ReadMe"), ("mintlify.com", "Mintlify"),
    # Compliance automation
    ("drata.com", "Drata"), ("vanta.com", "Vanta"),
    ("secureframe.com", "Secureframe"), ("sprinto.com", "Sprinto"),
    ("thoropass.com", "Thoropass"), ("scytale.ai", "Scytale"),
    ("anecdotes.ai", "Anecdotes"), ("hyperproof.io", "Hyperproof"),
    # SOC 2 / ISO
    ("laika.com", "Laika"), ("scrut.io", "Scrut"),
    ("getastra.com", "Astra"), ("securitypal.com", "SecurityPal"),
    # SBOM / Supply Chain Security
    ("chainguard.dev", "Chainguard"), ("stackhawk.com", "StackHawk"),
    ("endorlabs.com", "Endor Labs"), ("phylum.io", "Phylum"),
    ("socket.dev", "Socket"), ("deps.dev", "deps.dev"),
    # More DevOps
    ("env0.com", "env0"), ("spacelift.io", "Spacelift"),
    ("scalr.com", "Scalr"), ("terrateam.io", "Terrateam"),
    ("atlantis.io", "Atlantis"),
    # CI/CD
    ("buildkite.com", "Buildkite"), ("dagger.io", "Dagger"),
    ("earthly.dev", "Earthly"), ("depot.dev", "Depot"),
    ("namespace.so", "Namespace"), ("ubicloud.com", "Ubicloud"),
    # Container security
    ("aquasec.com", "Aqua Security"), ("sysdig.com", "Sysdig"),
    ("anchore.com", "Anchore"), ("grype.dev", "Grype"),
    ("trivy.dev", "Trivy"),
    # Additional emerging companies from various verticals
    ("rewind.ai", "Rewind"), ("granola.so", "Granola"),
    ("limitless.ai", "Limitless"), ("ScreenPipe.com", "ScreenPipe"),
    ("reclaim.ai", "Reclaim"), ("motion.com", "Motion"),
    ("sunsama.com", "Sunsama"), ("akiflow.com", "Akiflow"),
    ("amie.so", "Amie"), ("rise.ai", "Rise"),
    ("magical.so", "Magical"), ("textblaze.com", "Text Blaze"),
    ("espanso.org", "Espanso"),
    # Design tools
    ("pitch.com", "Pitch"), ("gamma.app", "Gamma"),
    ("tome.app", "Tome"), ("beautiful.ai", "Beautiful.AI"),
    ("presentations.ai", "Presentations.AI"), ("magicslides.app", "MagicSlides"),
    # Form builders
    ("tally.so", "Tally"), ("fillout.com", "Fillout"),
    ("formbricks.com", "Formbricks"), ("heyform.net", "HeyForm"),
    ("paperform.co", "Paperform"),
    # Landing page builders
    ("framer.com", "Framer"), ("webflow.com", "Webflow"),
    ("carrd.co", "Carrd"), ("typedream.com", "Typedream"),
    ("dorik.com", "Dorik"), ("umso.com", "Umso"),
    # Newsletter platforms
    ("beehiiv.com", "Beehiiv"), ("ghost.org", "Ghost"),
    ("buttondown.email", "Buttondown"), ("substack.com", "Substack"),
    ("convertkit.com", "ConvertKit"),
    # Link-in-bio
    ("linktree.com", "Linktree"), ("bio.link", "Bio Link"),
    ("stan.store", "Stan Store"), ("snipfeed.co", "Snipfeed"),
    ("koji.to", "Koji"),
    # Waitlist / Launch tools
    ("launchrock.com", "LaunchRock"), ("prefinery.com", "Prefinery"),
    ("getwaitlist.com", "GetWaitlist"), ("viral-loops.com", "Viral Loops"),
    # Digital commerce
    ("gumroad.com", "Gumroad"), ("lemonsqueezy.com", "Lemon Squeezy"),
    ("paddle.com", "Paddle"), ("stripe.com", "Stripe"),
    # Community platforms
    ("circle.so", "Circle"), ("mighty.com", "Mighty Networks"),
    ("heartbeat.chat", "Heartbeat"), ("skool.com", "Skool"),
    ("guild.co", "Guild"), ("hivebrite.com", "Hivebrite"),
    # Knowledge management
    ("slite.com", "Slite"), ("guru.com", "Guru"),
    ("slab.com", "Slab"), ("nuclino.com", "Nuclino"),
    ("getoutline.com", "Outline"), ("bookstack.io", "BookStack"),
    ("documize.com", "Documize"),
    # White-label SaaS
    ("saasykit.com", "SaaSykit"), ("shipfa.st", "ShipFast"),
    ("larafast.com", "LaraFast"), ("nextready.dev", "NextReady"),
    ("startkit.ai", "StartKit.AI"),
    # Boilerplate / Starter kits
    ("shipfast.co", "ShipFast"), ("makerkit.dev", "MakerKit"),
    ("nextarter.dev", "Nextarter"), ("supastarter.dev", "SupaStarter"),
    ("bedrock.computer", "Bedrock"),
]

for d, n in companies:
    add(d, n)

print(f"\nBatch 13 total new: {added}")
print(f"Total in output: {len(written)}")
