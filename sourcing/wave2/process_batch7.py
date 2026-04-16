#!/usr/bin/env python3
"""Batch 7: Startup Savant, less-known B2B SaaS, European startups, niche verticals."""
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
def add(domain, name, source="startup_directory", category="saas", meta=None):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": meta or {}}) + '\n')
    written.add(d)
    added += 1

# Startup Savant B2B SaaS to Watch
savant = [
    ("coschedule.com", "CoSchedule"), ("gonative.ai", "Native AI"),
    ("ambition.com", "Ambition"), ("mightynetworks.com", "Mighty Networks"),
    ("demodesk.com", "Demodesk"), ("bluesky.com", "Bluesky"),
    ("rainforestpay.com", "Rainforest"), ("worth.com", "Worth"),
]

# European B2B SaaS (Sifted Rising 100 type)
eu_saas = [
    ("personio.com", "Personio"), ("factorial.co", "Factorial"),
    ("pleo.io", "Pleo"), ("spendesk.com", "Spendesk"),
    ("payhawk.com", "Payhawk"), ("ramp.com", "Ramp"),
    ("qonto.com", "Qonto"), ("mollie.com", "Mollie"),
    ("gocardless.com", "GoCardless"), ("sumup.com", "SumUp"),
    ("contentful.com", "Contentful"), ("babbel.com", "Babbel"),
    ("messagebird.com", "MessageBird"), ("mambu.com", "Mambu"),
    ("solaris.com", "Solarisbank"), ("forto.com", "Forto"),
    ("sennder.com", "Sennder"), ("taxfix.de", "Taxfix"),
    ("gorillas.io", "Gorillas"), ("wolt.com", "Wolt"),
    ("getir.com", "Getir"), ("flink.com", "Flink"),
    ("tier.app", "TIER Mobility"), ("bolt.eu", "Bolt"),
    ("lilium.com", "Lilium"), ("volocopter.com", "Volocopter"),
    ("hopin.com", "Hopin"), ("bevy.com", "Bevy"),
    ("swapcard.com", "Swapcard"), ("eventbrite.com", "Eventbrite"),
    ("bizzabo.com", "Bizzabo"), ("splash.events", "Splash"),
    ("airmeet.com", "Airmeet"), ("remo.co", "Remo"),
    ("typeform.com", "Typeform"), ("survey-monkey.com", "SurveyMonkey"),
    ("getfeedback.com", "GetFeedback"), ("medallia.com", "Medallia"),
    ("qualtrics.com", "Qualtrics"), ("delighted.com", "Delighted"),
    ("promoter.io", "Promoter.io"), ("nicereply.com", "Nicereply"),
    ("productboard.com", "Productboard"),
    ("aha.io", "Aha!"), ("airfocus.com", "Airfocus"),
    ("prodpad.com", "ProdPad"), ("pendo.io", "Pendo"),
    ("launchnotes.com", "LaunchNotes"), ("releasenotes.io", "ReleaseNotes"),
    ("beamer.io", "Beamer"), ("announcekit.app", "AnnounceKit"),
    ("canny.io", "Canny"), ("roadmunk.com", "Roadmunk"),
    ("craft.io", "Craft.io"),
]

# Niche B2B SaaS (less likely to be in 86K list)
niche_saas = [
    # Revenue Operations
    ("dealroom.co", "Dealroom"), ("harmonic.ai", "Harmonic"),
    ("commonroom.io", "Common Room"), ("stackadapt.com", "StackAdapt"),
    ("metadata.io", "Metadata"), ("rollworks.com", "RollWorks"),
    ("rev.com", "Rev"), ("grata.com", "Grata"),
    ("usergems.com", "UserGems"), ("champify.io", "Champify"),
    ("warmly.ai", "Warmly"), ("koala.live", "Koala"),
    ("pocus.com", "Pocus"), ("breadcrumbs.io", "Breadcrumbs"),
    ("correlated.com", "Correlated"), ("toplyne.io", "Toplyne"),
    ("calixa.io", "Calixa"), ("endgame.io", "Endgame"),
    # Data Privacy / Compliance
    ("onetrust.com", "OneTrust"), ("cookiebot.com", "Cookiebot"),
    ("osano.com", "Osano"), ("transcend.io", "Transcend"),
    ("ethyca.com", "Ethyca"), ("privacera.com", "Privacera"),
    ("securiti.ai", "Securiti"), ("bigid.com", "BigID"),
    ("immuta.com", "Immuta"), ("collibra.com", "Collibra"),
    ("atlan.com", "Atlan"), ("alation.com", "Alation"),
    ("castor.app", "Castor"), ("datahub.io", "DataHub"),
    ("metaphor.io", "Metaphor"), ("monte-carlo.io", "Monte Carlo"),
    ("bigeye.com", "Bigeye"), ("anomalo.com", "Anomalo"),
    ("soda.io", "Soda"), ("datafold.com", "Datafold"),
    ("great-expectations.io", "Great Expectations"),
    # Sales Intelligence / Engagement
    ("seamless.ai", "Seamless.AI"), ("lusha.com", "Lusha"),
    ("cognism.com", "Cognism"), ("surfe.com", "Surfe"),
    ("amplemarket.com", "Amplemarket"), ("outplay.io", "Outplay"),
    ("mailshake.com", "Mailshake"), ("woodpecker.co", "Woodpecker"),
    ("lemlist.com", "Lemlist"), ("instantly.ai", "Instantly"),
    ("smartlead.ai", "SmartLead"), ("saleshandy.com", "SalesHandy"),
    ("snov.io", "Snov.io"), ("hunter.io", "Hunter"),
    ("findthatlead.com", "FindThatLead"), ("rocketreach.co", "RocketReach"),
    ("contactout.com", "ContactOut"), ("anymailfinder.com", "AnyMailFinder"),
    ("voilanorbert.com", "VoilaNorbert"), ("uplead.com", "UpLead"),
    ("adapt.io", "Adapt"), ("datanyze.com", "Datanyze"),
    ("leadgenius.com", "LeadGenius"), ("growbots.com", "Growbots"),
    # Customer Success
    ("gainsight.com", "Gainsight"), ("totango.com", "Totango"),
    ("catalyst.io", "Catalyst"), ("churnzero.com", "ChurnZero"),
    ("planhat.com", "Planhat"), ("vitally.io", "Vitally"),
    ("custify.com", "Custify"), ("clientsuccess.com", "ClientSuccess"),
    ("staircase.ai", "Staircase AI"), ("salesmachine.io", "Salesmachine"),
    # Subscription / Billing
    ("chargebee.com", "Chargebee"), ("paddle.com", "Paddle"),
    ("stripe.com", "Stripe"), ("recurly.com", "Recurly"),
    ("revenuecat.com", "RevenueCat"), ("chargify.com", "Chargify"),
    ("getlago.com", "Lago"), ("orb.com", "Orb"),
    ("metronome.com", "Metronome"), ("amberflo.io", "Amberflo"),
    ("stigg.io", "Stigg"), ("schematichq.com", "Schematic"),
    # Contract / Agreement
    ("pandadoc.com", "PandaDoc"), ("proposify.com", "Proposify"),
    ("qwilr.com", "Qwilr"), ("getaccept.com", "GetAccept"),
    ("dealfront.com", "Dealfront"), ("dealhub.io", "DealHub"),
    ("revenuegrid.com", "Revenue Grid"),
    # Scheduling / Calendar
    ("calendly.com", "Calendly"), ("savvycal.com", "SavvyCal"),
    ("cal.com", "Cal.com"), ("acuityscheduling.com", "Acuity"),
    ("youcanbook.me", "YouCanBook.me"), ("doodle.com", "Doodle"),
    ("clockwise.com", "Clockwise"), ("reclaim.ai", "Reclaim"),
    ("motion.com", "Motion"), ("sunsama.com", "Sunsama"),
    ("akiflow.com", "Akiflow"), ("amie.so", "Amie"),
    # Support / Helpdesk
    ("plain.com", "Plain"), ("hiver.com", "Hiver"),
    ("kayako.com", "Kayako"), ("groove.co", "Groove"),
    ("livechat.com", "LiveChat"), ("tidio.com", "Tidio"),
    ("crisp.chat", "Crisp Chat"), ("olark.com", "Olark"),
    ("tawk.to", "Tawk.to"), ("happyfox.com", "HappyFox"),
    ("freshdesk.com", "Freshdesk"),
    # Document / Knowledge
    ("notion.so", "Notion"), ("slite.com", "Slite"),
    ("guru.com", "Guru"), ("tettra.com", "Tettra"),
    ("slab.com", "Slab"), ("nuclino.com", "Nuclino"),
    ("notion.so", "Notion"), ("almanac.io", "Almanac"),
    ("gitbook.com", "GitBook"), ("readme.com", "ReadMe"),
    ("docusaurus.io", "Docusaurus"), ("mintlify.com", "Mintlify"),
    ("swimm.io", "Swimm"), ("archbee.com", "Archbee"),
    # Video / Meeting
    ("loom.com", "Loom"), ("grain.com", "Grain"),
    ("otter.ai", "Otter.ai"), ("fireflies.ai", "Fireflies"),
    ("fathom.video", "Fathom"), ("rewatch.com", "Rewatch"),
    ("claap.io", "Claap"), ("tella.tv", "Tella"),
    ("synthesia.io", "Synthesia"), ("descript.com", "Descript"),
    ("riverside.fm", "Riverside"), ("streamyard.com", "StreamYard"),
    # Website / Landing pages
    ("webflow.com", "Webflow"), ("framer.com", "Framer"),
    ("carrd.co", "Carrd"), ("umso.com", "Umso"),
    ("typedream.com", "Typedream"), ("dorik.com", "Dorik"),
    ("unicornplatform.com", "Unicorn Platform"),
    # SEO / Content
    ("ahrefs.com", "Ahrefs"), ("semrush.com", "Semrush"),
    ("moz.com", "Moz"), ("surfer.ai", "Surfer"),
    ("clearscope.io", "Clearscope"), ("frase.io", "Frase"),
    ("marketmuse.com", "MarketMuse"), ("searchmetrics.com", "Searchmetrics"),
    ("brightedge.com", "BrightEdge"), ("conductor.com", "Conductor"),
    ("seranking.com", "SE Ranking"), ("mangools.com", "Mangools"),
    ("serpstat.com", "Serpstat"), ("spyfu.com", "SpyFu"),
    # Social Media Management
    ("buffer.com", "Buffer"), ("hootsuite.com", "Hootsuite"),
    ("sproutsocial.com", "Sprout Social"), ("latercom.com", "Later"),
    ("socialbee.com", "SocialBee"), ("agora-pulse.com", "Agorapulse"),
    ("iconosquare.com", "Iconosquare"), ("brandwatch.com", "Brandwatch"),
    ("mention.com", "Mention"), ("meltwater.com", "Meltwater"),
    ("cision.com", "Cision"), ("prowly.com", "Prowly"),
    # Webinar / Events
    ("livestorm.co", "Livestorm"), ("demio.com", "Demio"),
    ("crowdcast.io", "Crowdcast"), ("webinargeek.com", "WebinarGeek"),
    ("ewebinar.com", "eWebinar"), ("goldcast.io", "Goldcast"),
    ("on24.com", "ON24"), ("bigmarker.com", "BigMarker"),
    # E-signature / CLM
    ("docusign.com", "DocuSign"), ("hellosign.com", "HelloSign"),
    ("pandadoc.com", "PandaDoc"), ("signaturely.com", "Signaturely"),
    ("signwell.com", "SignWell"), ("signnow.com", "signNow"),
    ("concord.app", "Concord"), ("contractworks.com", "ContractWorks"),
    ("ironclad.com", "Ironclad"), ("juro.com", "Juro"),
    ("precisely.com", "Precisely"), ("lexion.ai", "Lexion"),
    ("spotdraft.com", "SpotDraft"),
    # Affiliate / Partnership
    ("partnerstack.com", "PartnerStack"), ("impact.com", "Impact"),
    ("tapfiliate.com", "Tapfiliate"), ("firstpromoter.com", "FirstPromoter"),
    ("referralrock.com", "Referral Rock"), ("getreditus.com", "Reditus"),
    # ABM / Intent Data
    ("6sense.com", "6Sense"), ("demandbase.com", "Demandbase"),
    ("n.rich", "N.Rich"), ("albacross.com", "Albacross"),
    ("leadfeeder.com", "Leadfeeder"),
    # Competitive Intelligence
    ("klue.com", "Klue"), ("crayon.co", "Crayon"),
    ("kompyte.com", "Kompyte"),
    # Revenue Intelligence
    ("gong.io", "Gong"), ("clari.com", "Clari"),
    ("aviso.com", "Aviso"), ("people.ai", "People.ai"),
    ("boostup.ai", "BoostUp"), ("mediafly.com", "Mediafly"),
    ("groove.co", "Groove"), ("revenuehero.io", "RevenueHero"),
    # Product Analytics
    ("amplitude.com", "Amplitude"), ("mixpanel.com", "Mixpanel"),
    ("heap.io", "Heap"), ("posthog.com", "PostHog"),
    ("june.so", "June"), ("tinybird.co", "Tinybird"),
    ("pirsch.io", "Pirsch"), ("plausible.io", "Plausible"),
    ("fathom.analytics", "Fathom Analytics"),
    # Feature Flag / AB Test
    ("launchdarkly.com", "LaunchDarkly"), ("optimizely.com", "Optimizely"),
    ("vwo.com", "VWO"), ("kameleoon.com", "Kameleoon"),
    ("ab-tasty.com", "AB Tasty"), ("convert.com", "Convert"),
    # Misc Emerging
    ("linear.app", "Linear"), ("attio.com", "Attio"),
    ("folk.app", "Folk"), ("clay.com", "Clay"),
    ("causal.app", "Causal"), ("rows.com", "Rows"),
    ("equals.com", "Equals"), ("coefficient.io", "Coefficient"),
    ("grid.is", "GRID"), ("arctype.com", "Arctype"),
    ("retool.com", "Retool"), ("airplane.dev", "Airplane"),
    ("appsmith.com", "Appsmith"), ("budibase.com", "Budibase"),
    ("tooljet.com", "ToolJet"), ("dronahq.com", "DronaHQ"),
    ("noloco.io", "Noloco"), ("baserow.io", "Baserow"),
    ("nocodb.com", "NocoDB"), ("grist.org", "Grist"),
    ("teable.io", "Teable"), ("rowy.io", "Rowy"),
]

for d, n in savant:
    add(d, n, "startup_savant")
for d, n in eu_saas:
    add(d, n, "eu_saas_directory")
for d, n in niche_saas:
    add(d, n, "industry_directory")

print(f"\nBatch 7 total new: {added}")
print(f"Total in output: {len(written)}")
