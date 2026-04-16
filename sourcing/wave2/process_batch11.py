#!/usr/bin/env python3
"""Batch 11: Final push - more SaaS companies across all categories."""
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
    # Cyber / Security (less known)
    ("tessian.com", "Tessian"), ("abnormalsecurity.com", "Abnormal Security"),
    ("material.security", "Material Security"), ("inky.com", "INKY"),
    ("ironscales.com", "IRONSCALES"), ("avanan.com", "Avanan"),
    ("perception-point.io", "Perception Point"), ("greathorn.com", "GreatHorn"),
    ("valimail.com", "Valimail"), ("agari.com", "Agari"),
    ("proofpoint.com", "Proofpoint"), ("mimecast.com", "Mimecast"),
    ("darktrace.com", "Darktrace"), ("vectra.ai", "Vectra AI"),
    ("exabeam.com", "Exabeam"), ("securonix.com", "Securonix"),
    ("logrhythm.com", "LogRhythm"), ("rapid7.com", "Rapid7"),
    ("tenable.com", "Tenable"), ("qualys.com", "Qualys"),
    ("snyk.io", "Snyk"), ("sonatype.com", "Sonatype"),
    ("veracode.com", "Veracode"), ("checkmarx.com", "Checkmarx"),
    ("synopsys.com", "Synopsys"), ("invicti.com", "Invicti"),
    ("detectify.com", "Detectify"), ("intruder.io", "Intruder"),
    ("pentera.io", "Pentera"), ("cymulate.com", "Cymulate"),
    ("attackiq.com", "AttackIQ"), ("safebreach.com", "SafeBreach"),
    ("picus.io", "Picus Security"),
    # Infrastructure / Cloud
    ("replicated.com", "Replicated"), ("onprem.dev", "OnPrem"),
    ("massdriver.cloud", "Massdriver"), ("nullstone.io", "Nullstone"),
    ("porter.run", "Porter"), ("coherence.io", "Coherence"),
    ("flightcontrol.dev", "Flightcontrol"), ("northflank.com", "Northflank"),
    ("koyeb.com", "Koyeb"), ("zeabur.com", "Zeabur"),
    ("coolify.io", "Coolify"), ("caprover.com", "CapRover"),
    ("dokku.com", "Dokku"),
    # Analytics / BI (less known)
    ("count.co", "Count"), ("whaly.io", "Whaly"),
    ("steep.app", "Steep"), ("omni.co", "Omni Analytics"),
    ("mode.com", "Mode"), ("sigmahq.com", "Sigma"),
    ("thoughtspot.com", "ThoughtSpot"), ("tableau.com", "Tableau"),
    ("power-bi.com", "Power BI"), ("qlik.com", "Qlik"),
    ("microstrategy.com", "MicroStrategy"),
    # Privacy / GRC
    ("dataguard.co.uk", "DataGuard"), ("tugboatlogic.com", "Tugboat Logic"),
    ("hyperproof.io", "Hyperproof"), ("anecdotes.ai", "Anecdotes"),
    ("riskrecon.com", "RiskRecon"), ("bitsight.com", "BitSight"),
    ("securityscorecard.com", "SecurityScorecard"), ("upguard.com", "UpGuard"),
    ("panorays.com", "Panorays"),
    # Endpoint / MDM
    ("jamf.com", "Jamf"), ("kandji.io", "Kandji"),
    ("mosyle.com", "Mosyle"), ("addigy.com", "Addigy"),
    ("jumpcloud.com", "JumpCloud"), ("fleet.co", "Fleet"),
    ("kolide.com", "Kolide"),
    # Networking
    ("cato.networks", "Cato Networks"), ("netskope.com", "Netskope"),
    ("zscaler.com", "Zscaler"), ("paloaltonetworks.com", "Palo Alto Networks"),
    ("cloudgenix.com", "CloudGenix"),
    # Communication APIs
    ("vonage.com", "Vonage"), ("twilio.com", "Twilio"),
    ("bandwidth.com", "Bandwidth"), ("telnyx.com", "Telnyx"),
    ("plivo.com", "Plivo"), ("nexmo.com", "Nexmo"),
    ("signalwire.com", "SignalWire"),
    # Meeting / Conferencing
    ("zoom.us", "Zoom"), ("around.co", "Around"),
    ("livekit.io", "LiveKit"), ("whereby.com", "Whereby"),
    ("daily.co", "Daily.co"), ("100ms.live", "100ms"),
    ("agora.io", "Agora"), ("twilio.com", "Twilio"),
    # Screen recording / demo
    ("loom.com", "Loom"), ("screencast-o-matic.com", "Screencast-O-Matic"),
    ("getreprise.com", "Reprise"), ("navattic.com", "Navattic"),
    ("demostack.com", "Demostack"), ("saleo.io", "Saleo"),
    ("storylane.io", "Storylane"), ("tourial.com", "Tourial"),
    ("walnut.io", "Walnut"), ("consensus.com", "Consensus"),
    # Sales enablement
    ("highspot.com", "Highspot"), ("seismic.com", "Seismic"),
    ("showpad.com", "Showpad"), ("bigtincan.com", "Bigtincan"),
    ("brainshark.com", "Brainshark"), ("mindtickle.com", "Mindtickle"),
    ("allego.com", "Allego"), ("lessonly.com", "Lessonly"),
    ("guru.com", "Guru"), ("spekit.co", "Spekit"),
    # Sales compensation
    ("captivateiq.com", "CaptivateIQ"), ("spiff.com", "Spiff"),
    ("quotapath.com", "QuotaPath"), ("everstage.com", "Everstage"),
    ("performio.co", "Performio"), ("xactly.com", "Xactly"),
    # Sales forecasting
    ("clari.com", "Clari"), ("aviso.com", "Aviso"),
    ("boostup.ai", "BoostUp"), ("kluster.com", "Kluster"),
    ("weflow.io", "Weflow"), ("setyl.com", "Setyl"),
    # Email warm-up / deliverability
    ("warmbox.ai", "Warmbox"), ("mailreach.co", "MailReach"),
    ("lemwarm.com", "Lemwarm"), ("folderly.com", "Folderly"),
    ("emailguard.io", "EmailGuard"), ("glockapps.com", "GlockApps"),
    # Cold email / outbound
    ("instantly.ai", "Instantly"), ("smartlead.ai", "SmartLead"),
    ("saleshandy.com", "SalesHandy"), ("lemlist.com", "Lemlist"),
    ("woodpecker.co", "Woodpecker"), ("mailshake.com", "Mailshake"),
    ("reply.io", "Reply.io"), ("yesware.com", "Yesware"),
    ("mixmax.com", "Mixmax"), ("outreach.io", "Outreach"),
    ("salesloft.com", "SalesLoft"),
    # Lead enrichment / intent (less known)
    ("clearbit.com", "Clearbit"), ("zoominfo.com", "ZoomInfo"),
    ("apollo.io", "Apollo"), ("seamless.ai", "Seamless.AI"),
    ("lusha.com", "Lusha"), ("cognism.com", "Cognism"),
    ("kaspr.io", "Kaspr"), ("swordfish.ai", "Swordfish"),
    ("dropcontact.com", "Dropcontact"), ("datagma.com", "Datagma"),
    ("prospeo.io", "Prospeo"), ("signalio.com", "Signal.io"),
    # Knowledge graph / semantic
    ("diffbot.com", "Diffbot"), ("metaphor.systems", "Metaphor"),
    ("algolia.com", "Algolia"), ("coveo.com", "Coveo"),
    ("yext.com", "Yext"), ("swiftype.com", "Swiftype"),
    # Tax / compliance tech
    ("avalara.com", "Avalara"), ("vertex.com", "Vertex"),
    ("sovos.com", "Sovos"), ("taxjar.com", "TaxJar"),
    ("anrok.com", "Anrok"),
    # Treasury / cash management
    ("trovata.io", "Trovata"), ("kyriba.com", "Kyriba"),
    ("highradius.com", "HighRadius"), ("cforia.com", "Cforia"),
    # Collections / AR
    ("tesorio.com", "Tesorio"), ("invoicesherpa.com", "InvoiceSherpa"),
    ("gaviti.com", "Gaviti"), ("emagia.com", "Emagia"),
    # Payroll (less known)
    ("onpay.com", "OnPay"), ("patriotsoftware.com", "Patriot Software"),
    ("squarepayroll.com", "Square Payroll"), ("rippling.com", "Rippling"),
    ("zenefits.com", "Zenefits"), ("namely.com", "Namely"),
    ("payfit.com", "PayFit"), ("papaya.com", "Papaya Global"),
    ("letsdeel.com", "Deel"),
    # Benefits
    ("justworks.com", "Justworks"), ("gusto.com", "Gusto"),
    ("zenefits.com", "Zenefits"), ("rippling.com", "Rippling"),
    ("peoplekeep.com", "PeopleKeep"), ("level.com", "Level"),
    # Employee wellness
    ("headspace.com", "Headspace"), ("calm.com", "Calm"),
    ("lyrahealth.com", "Lyra Health"), ("springhealth.com", "Spring Health"),
    ("ginger.com", "Ginger"), ("talkspace.com", "Talkspace"),
    ("modernhealth.com", "Modern Health"), ("unmind.com", "Unmind"),
    # Task automation
    ("zapier.com", "Zapier"), ("make.com", "Make"),
    ("bardeen.ai", "Bardeen"), ("axiom.ai", "Axiom.ai"),
    ("browse.ai", "Browse AI"), ("apify.com", "Apify"),
    ("phantombuster.com", "PhantomBuster"), ("texau.com", "TexAu"),
    # Web scraping
    ("scrapingbee.com", "ScrapingBee"), ("scraperapi.com", "ScraperAPI"),
    ("brightdata.com", "Bright Data"), ("oxylabs.io", "Oxylabs"),
    ("zyte.com", "Zyte"), ("apify.com", "Apify"),
    # Proxy / CAPTCHA
    ("smartproxy.com", "Smartproxy"), ("geosurf.com", "GeoSurf"),
    ("soax.com", "SOAX"),
    # More open source SaaS
    ("appwrite.io", "Appwrite"), ("pocketbase.io", "PocketBase"),
    ("directus.io", "Directus"), ("strapi.io", "Strapi"),
    ("payload.cms", "Payload"), ("medusa.js", "Medusa"),
    ("saleor.io", "Saleor"), ("vendure.io", "Vendure"),
    ("reaction.com", "Reaction Commerce"), ("bagisto.com", "Bagisto"),
    # IoT platforms
    ("particle.io", "Particle"), ("balena.io", "Balena"),
    ("arduino.cc", "Arduino"), ("platformio.org", "PlatformIO"),
    ("thethingsnetwork.org", "The Things Network"),
    # Robotics / Automation
    ("viam.com", "Viam"), ("formant.io", "Formant"),
    ("freedomrobotics.ai", "Freedom Robotics"),
    ("intrinsic.ai", "Intrinsic"), ("ready.com", "Ready Robotics"),
    # Sustainability / ESG
    ("watershed.com", "Watershed"), ("persefoni.com", "Persefoni"),
    ("plan-a.earth", "Plan A"), ("normative.io", "Normative"),
    ("greenly.earth", "Greenly"), ("ecochain.com", "Ecochain"),
    ("sustain.life", "Sustain.Life"),
    # Creative tools
    ("canva.com", "Canva"), ("figma.com", "Figma"),
    ("pitch.com", "Pitch"), ("gamma.app", "Gamma"),
    ("beautiful.ai", "Beautiful.AI"), ("tome.app", "Tome"),
    ("slidesai.io", "SlidesAI"), ("presentations.ai", "Presentations.AI"),
    # Customer survey / feedback (less known)
    ("survicate.com", "Survicate"), ("refiner.io", "Refiner"),
    ("satismeter.com", "Satismeter"), ("wootric.com", "Wootric"),
    ("zonka.co", "Zonka Feedback"), ("sentisum.com", "SentiSum"),
    ("chattermill.com", "Chattermill"), ("unitq.com", "unitQ"),
    # Misc
    ("axiom.co", "Axiom"), ("baselime.io", "Baselime"),
    ("betterstack.com", "Better Stack"), ("checkly.com", "Checkly"),
    ("cronitor.io", "Cronitor"), ("hyperping.io", "Hyperping"),
    ("openstatus.dev", "OpenStatus"), ("updown.io", "Updown"),
    ("uptimerobot.com", "UptimeRobot"),
]

for d, n in companies:
    add(d, n)

print(f"\nBatch 11 total new: {added}")
print(f"Total in output: {len(written)}")
