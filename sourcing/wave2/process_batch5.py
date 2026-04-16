#!/usr/bin/env python3
"""Batch 5: Deloitte Fast 500, Forbes Cloud 100, more B2B SaaS, vertical SaaS."""
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
def add(domain, name, source="deloitte_fast500", category="saas", meta=None):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": meta or {}}) + '\n')
    written.add(d)
    added += 1

# Deloitte Fast 500 2024 (NYC + Bay Area)
deloitte = [
    ("tgtherapeutics.com", "TG Therapeutics"), ("talkiatry.com", "Talkiatry"),
    ("odeko.com", "Odeko"), ("trullion.com", "Trullion"), ("gocrisp.com", "Crisp"),
    ("cowbell.insure", "Cowbell"), ("observeinc.com", "Observe"),
    ("wisetack.com", "Wisetack"), ("radai.com", "Rad AI"),
    ("corellium.com", "Corellium"), ("lessen.com", "Lessen"),
    ("klarivis.com", "KlariVis"), ("fluency.inc", "Fluency"),
    ("payabli.com", "Payabli"),
]

# Forbes Cloud 100 2024
cloud100 = [
    ("onetrust.com", "OneTrust"), ("yardi.com", "Yardi"),
    ("island.io", "Island"), ("appsflyer.com", "AppsFlyer"),
    ("deepl.com", "DeepL"), ("cribl.io", "Cribl"),
    ("canva.com", "Canva"), ("stripe.com", "Stripe"),
    ("databricks.com", "Databricks"), ("figma.com", "Figma"),
    ("grammarly.com", "Grammarly"), ("notion.so", "Notion"),
    ("servicetitan.com", "ServiceTitan"), ("celonis.com", "Celonis"),
    ("faire.com", "Faire"), ("wiz.io", "Wiz"),
    ("fivetran.com", "Fivetran"), ("gusto.com", "Gusto"),
    ("snyk.io", "Snyk"), ("gong.io", "Gong"),
    ("navan.com", "Navan"), ("relativity.com", "Relativity"),
    ("toast.com", "Toast"), ("highspot.com", "Highspot"),
    ("harness.io", "Harness"), ("lacework.com", "Lacework"),
    ("cockroachlabs.com", "CockroachDB"), ("drata.com", "Drata"),
    ("grafana.com", "Grafana Labs"), ("launchdarkly.com", "LaunchDarkly"),
]

# Vertical SaaS companies (hiring, real signals)
vertical_saas = [
    # Construction
    ("procore.com", "Procore"), ("plangrid.com", "PlanGrid"),
    ("buildertrend.com", "Buildertrend"), ("fieldwire.com", "Fieldwire"),
    ("cosmicfrog.com", "Cosmic Frog"), ("houzz.com", "Houzz"),
    # Real Estate
    ("buildatmos.com", "Atmos"), ("opendoor.com", "Opendoor"),
    ("offerpad.com", "Offerpad"), ("sundae.com", "Sundae"),
    ("flyhomes.com", "Flyhomes"), ("realtor.com", "Realtor.com"),
    # Legal
    ("lawgeex.com", "LawGeex"), ("luminance.com", "Luminance"),
    ("casetext.com", "Casetext"), ("evisort.com", "Evisort"),
    ("contractpodai.com", "ContractPodAi"), ("simplelaw.com", "SimpleLaw"),
    # Logistics
    ("project44.com", "project44"), ("fourkites.com", "FourKites"),
    ("shippo.com", "Shippo"), ("easypost.com", "EasyPost"),
    ("flexport.com", "Flexport"), ("shipbob.com", "ShipBob"),
    ("logiwa.com", "Logiwa"), ("shiphero.com", "ShipHero"),
    ("stord.com", "Stord"), ("deliverr.com", "Deliverr"),
    # HR / People
    ("justworks.com", "Justworks"), ("paylocity.com", "Paylocity"),
    ("paychex.com", "Paychex"), ("paycom.com", "Paycom"),
    ("ceridian.com", "Ceridian"), ("ultimatesoftware.com", "Ultimate Software"),
    ("greenhouse.io", "Greenhouse"), ("workday.com", "Workday"),
    ("cornerstone.com", "Cornerstone"), ("sap.com", "SAP"),
    # Healthcare
    ("veracyte.com", "Veracyte"), ("doximity.com", "Doximity"),
    ("healthgorilla.com", "Health Gorilla"), ("redoxengine.com", "Redox"),
    ("collectivemedical.com", "Collective Medical"),
    ("wellsky.com", "WellSky"), ("phreesia.com", "Phreesia"),
    ("drchrono.com", "DrChrono"), ("elationhealth.com", "Elation Health"),
    ("athenahealth.com", "athenahealth"),
    # EdTech
    ("instructure.com", "Instructure"), ("duolingo.com", "Duolingo"),
    ("coursera.com", "Coursera"), ("masterclass.com", "MasterClass"),
    ("codecademy.com", "Codecademy"), ("brilliant.org", "Brilliant"),
    ("outschool.com", "Outschool"), ("classdojo.com", "ClassDojo"),
    ("nearpod.com", "Nearpod"), ("kahoot.com", "Kahoot!"),
    # Marketing
    ("hubspot.com", "HubSpot"), ("marketo.com", "Marketo"),
    ("pardot.com", "Pardot"), ("mailgun.com", "Mailgun"),
    ("klaviyo.com", "Klaviyo"), ("attentive.com", "Attentive"),
    ("postscript.io", "Postscript"), ("omnisend.com", "Omnisend"),
    ("drip.com", "Drip"), ("activecampaign.com", "ActiveCampaign"),
    # Finance / Accounting
    ("billtrust.com", "Billtrust"), ("bill.com", "Bill.com"),
    ("ramp.com", "Ramp"), ("brex.com", "Brex"),
    ("divvy.com", "Divvy"), ("airbase.io", "Airbase"),
    ("center.com", "Center"), ("teampay.co", "Teampay"),
    ("spendflo.com", "Spendflo"), ("vendr.com", "Vendr"),
    ("zylo.com", "Zylo"), ("productiv.com", "Productiv"),
    ("torii.app", "Torii"), ("blissfully.com", "Blissfully"),
    # Security
    ("huntress.com", "Huntress"), ("sentinelone.com", "SentinelOne"),
    ("crowdstrike.com", "CrowdStrike"), ("cybereason.com", "Cybereason"),
    ("dragos.com", "Dragos"), ("claroty.com", "Claroty"),
    ("nozominetworks.com", "Nozomi Networks"), ("armis.com", "Armis"),
    ("axonius.com", "Axonius"), ("jfrog.com", "JFrog"),
    ("sonatype.com", "Sonatype"), ("anchore.com", "Anchore"),
    ("chainguard.dev", "Chainguard"), ("sigstore.dev", "Sigstore"),
    ("teleport.com", "Teleport"), ("strongdm.com", "StrongDM"),
    ("cyberark.com", "CyberArk"), ("delinea.com", "Delinea"),
    ("beyondtrust.com", "BeyondTrust"), ("saviynt.com", "Saviynt"),
    # DevOps / Infrastructure
    ("pulumi.com", "Pulumi"), ("spacelift.io", "Spacelift"),
    ("env0.com", "env0"), ("scalr.com", "Scalr"),
    ("circleci.com", "CircleCI"), ("buildkite.com", "Buildkite"),
    ("sourcegraph.com", "Sourcegraph"), ("codacy.com", "Codacy"),
    ("qodo.ai", "Qodo"), ("tabnine.com", "Tabnine"),
    ("gitpod.io", "Gitpod"), ("coder.com", "Coder"),
    ("jetbrains.com", "JetBrains"),
    # Data / Analytics
    ("snowflake.com", "Snowflake"), ("dbt.com", "dbt Labs"),
    ("starburst.io", "Starburst"), ("trino.io", "Trino"),
    ("clickhouse.com", "ClickHouse"), ("timescale.com", "Timescale"),
    ("influxdata.com", "InfluxData"), ("questdb.io", "QuestDB"),
    ("materialize.com", "Materialize"), ("rockset.com", "Rockset"),
    ("startree.ai", "StarTree"), ("imply.io", "Imply"),
    ("lightdash.com", "Lightdash"), ("evidence.dev", "Evidence"),
    # Communication / Collaboration
    ("livekit.io", "LiveKit"), ("daily.co", "Daily"),
    ("vonage.com", "Vonage"), ("twilio.com", "Twilio"),
    ("bandwidth.com", "Bandwidth"), ("telnyx.com", "Telnyx"),
    ("plivo.com", "Plivo"), ("messagebird.com", "MessageBird"),
    ("sinch.com", "Sinch"), ("infobip.com", "Infobip"),
    # Testing / QA
    ("browserstack.com", "BrowserStack"), ("lambdatest.com", "LambdaTest"),
    ("saucelabs.com", "Sauce Labs"), ("cypress.io", "Cypress"),
    ("playwright.dev", "Playwright"),
    ("qawolf.com", "QA Wolf"), ("rainforestqa.com", "Rainforest QA"),
    ("testim.io", "Testim"), ("mabl.com", "mabl"),
    # eCommerce platforms
    ("shopify.com", "Shopify"), ("bigcommerce.com", "BigCommerce"),
    ("woocommerce.com", "WooCommerce"), ("squarespace.com", "Squarespace"),
    ("webflow.com", "Webflow"), ("wix.com", "Wix"),
    ("rechargeapps.com", "ReCharge"), ("yotpo.com", "Yotpo"),
    ("klaviyo.com", "Klaviyo"), ("gorgias.com", "Gorgias"),
    ("rebuy.com", "Rebuy"), ("junip.co", "Junip"),
    ("stamped.io", "Stamped"), ("loox.io", "Loox"),
    ("okendo.io", "Okendo"), ("smile.io", "Smile.io"),
    # Payments
    ("stripe.com", "Stripe"), ("adyen.com", "Adyen"),
    ("checkout.com", "Checkout.com"), ("rapyd.net", "Rapyd"),
    ("airwallex.com", "Airwallex"), ("payoneer.com", "Payoneer"),
    ("wise.com", "Wise"), ("remitly.com", "Remitly"),
    ("flywire.com", "Flywire"), ("tipalti.com", "Tipalti"),
    ("melio.com", "Melio"), ("routable.com", "Routable"),
    ("trolley.com", "Trolley"), ("plastiq.com", "Plastiq"),
    # Productivity / no-code
    ("zapier.com", "Zapier"), ("make.com", "Make"),
    ("tray.io", "Tray.io"), ("workato.com", "Workato"),
    ("celigo.com", "Celigo"), ("boomi.com", "Boomi"),
    ("mulesoft.com", "MuleSoft"), ("snaplogic.com", "SnapLogic"),
    ("bubble.io", "Bubble"), ("glideapps.com", "Glide"),
    ("softr.io", "Softr"), ("internal.io", "Internal"),
    # Design
    ("framer.com", "Framer"), ("spline.design", "Spline"),
    ("rive.app", "Rive"), ("protopie.io", "ProtoPie"),
    ("phase.so", "Phase"), ("uxpin.com", "UXPin"),
    ("invisionapp.com", "InVision"), ("sketch.com", "Sketch"),
    ("adobe.com", "Adobe"), ("affinity.serif.com", "Affinity"),
    # CRM
    ("salesforce.com", "Salesforce"), ("close.com", "Close"),
    ("copper.com", "Copper"), ("nutshell.com", "Nutshell"),
    ("freshsales.io", "Freshsales"), ("pipedrive.com", "Pipedrive"),
    ("attio.com", "Attio"), ("folk.app", "Folk"),
    ("twenty.com", "Twenty"), ("affinity.co", "Affinity"),
    # CPaaS / Comms
    ("stream.io", "Stream"), ("pusher.com", "Pusher"),
    ("ably.com", "Ably"), ("pubnub.com", "PubNub"),
]

# More from other sources
more = [
    ("opensea.io", "OpenSea"), ("kitchenful.com", "Kitchenful"),
    ("vendease.com", "Vendease"), ("buildatmos.com", "Atmos"),
    ("boompop.com", "BoomPop"), ("agencycluster.com", "AgencyCluster"),
]

for d, n in deloitte:
    add(d, n, "deloitte_fast500")
for d, n in cloud100:
    add(d, n, "forbes_cloud100")
for d, n in vertical_saas:
    add(d, n, "industry_directory", "vertical_saas")
for d, n in more:
    add(d, n, "web_search")

print(f"\nBatch 5 total new: {added}")
print(f"Total in output: {len(written)}")
