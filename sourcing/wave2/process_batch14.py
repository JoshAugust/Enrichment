#!/usr/bin/env python3
"""Batch 14: More verticals — HR, legal, finance, commerce, infrastructure."""
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
def add(domain, name, source="industry_directory", category="saas"):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": {}}) + '\n')
    written.add(d)
    added += 1

companies = [
    # More HR tech
    ("hireology.com", "Hireology"), ("breezy.hr", "Breezy HR"),
    ("recruitee.com", "Recruitee"), ("teamtailor.com", "Teamtailor"),
    ("smartrecruiters.com", "SmartRecruiters"), ("jobvite.com", "Jobvite"),
    ("icims.com", "iCIMS"), ("successfactors.com", "SuccessFactors"),
    ("cornerstoneondemand.com", "Cornerstone OnDemand"),
    ("skilltree.nz", "SkillTree"), ("togglhire.com", "Toggl Hire"),
    ("workable.com", "Workable"), ("comeet.com", "Comeet"),
    ("pinpoint.com", "Pinpoint"), ("applytosquad.com", "Squad"),
    ("ats.org", "ATS"), ("manatal.com", "Manatal"),
    ("zoho.com", "Zoho Recruit"),
    # Compliance / RegTech
    ("chainalysis.com", "Chainalysis"), ("elliptic.co", "Elliptic"),
    ("trmlabs.com", "TRM Labs"), ("sardine.ai", "Sardine"),
    ("unit21.ai", "Unit21"), ("alloy.com", "Alloy"),
    ("jumio.com", "Jumio"), ("onfido.com", "Onfido"),
    ("veriff.com", "Veriff"), ("socure.com", "Socure"),
    ("persona.com", "Persona"), ("sumsub.com", "Sumsub"),
    ("shufti.pro", "Shufti Pro"),
    # Fraud detection
    ("featurespace.com", "Featurespace"), ("feedzai.com", "Feedzai"),
    ("forter.com", "Forter"), ("riskified.com", "Riskified"),
    ("signifyd.com", "Signifyd"), ("sift.com", "Sift"),
    ("kount.com", "Kount"), ("ravelin.com", "Ravelin"),
    # Expense management
    ("ramp.com", "Ramp"), ("brex.com", "Brex"),
    ("spendesk.com", "Spendesk"), ("payhawk.com", "Payhawk"),
    ("expensify.com", "Expensify"), ("certify.com", "Certify"),
    ("concur.com", "SAP Concur"), ("abacus.com", "Abacus"),
    # Invoicing / AP automation
    ("stampli.com", "Stampli"), ("coupa.com", "Coupa"),
    ("mineraltree.com", "MineralTree"), ("beanworks.com", "Beanworks"),
    ("billrun.com", "BillRun"), ("invoicely.com", "Invoicely"),
    ("chargebee.com", "Chargebee"), ("fastbill.com", "FastBill"),
    # Legal tech
    ("clio.com", "Clio"), ("smokeball.com", "Smokeball"),
    ("mycase.com", "MyCase"), ("litify.com", "Litify"),
    ("lawcus.com", "Lawcus"), ("cosmolex.com", "CosmoLex"),
    ("legalzoom.com", "LegalZoom"), ("rocket-lawyer.com", "Rocket Lawyer"),
    ("notarize.com", "Notarize"), ("proof.com", "Proof"),
    # Contract analysis
    ("kira.com", "Kira Systems"), ("seal-software.com", "Seal Software"),
    ("docusign.com", "DocuSign"), ("contractbook.com", "Contractbook"),
    ("precisely.com", "Precisely"), ("concord.app", "Concord"),
    # E-commerce backend
    ("commercetools.com", "Commercetools"), ("elasticpath.com", "Elastic Path"),
    ("spryker.com", "Spryker"), ("saleor.io", "Saleor"),
    ("medusajs.com", "Medusa"), ("vendure.io", "Vendure"),
    ("crystallize.com", "Crystallize"), ("swell.is", "Swell"),
    # Marketplace platforms
    ("sharetribe.com", "Sharetribe"), ("arcadier.com", "Arcadier"),
    ("mirakl.com", "Mirakl"), ("marketplacer.com", "Marketplacer"),
    ("nautical.com", "Nautical Commerce"),
    # Subscription commerce
    ("rechargeapps.com", "ReCharge"), ("bold.com", "Bold Commerce"),
    ("skio.com", "Skio"), ("ordergroove.com", "Ordergroove"),
    ("smartrr.com", "Smartrr"), ("appstle.com", "Appstle"),
    # Checkout / Payment optimization
    ("bolt.com", "Bolt"), ("fast.co", "Fast"),
    ("skipify.com", "Skipify"), ("simpler.so", "Simpler"),
    # Returns management
    ("loop-returns.com", "Loop Returns"), ("returnly.com", "Returnly"),
    ("narvar.com", "Narvar"), ("aftership.com", "AfterShip"),
    ("returngo.ai", "ReturnGO"),
    # Commerce analytics
    ("triple-whale.com", "Triple Whale"), ("northbeam.io", "Northbeam"),
    ("rockerbox.com", "Rockerbox"), ("daasity.com", "Daasity"),
    ("lifetimely.io", "Lifetimely"),
    # More security tools
    ("beyondidentity.com", "Beyond Identity"), ("hypr.com", "HYPR"),
    ("trusona.com", "Trusona"), ("transmit-security.com", "Transmit Security"),
    ("silverfort.com", "Silverfort"), ("semperis.com", "Semperis"),
    # SIEM / XDR
    ("stellar.cyber", "Stellar Cyber"), ("hunters.ai", "Hunters"),
    ("logpoint.com", "LogPoint"), ("blumira.com", "Blumira"),
    ("uptycs.com", "Uptycs"), ("panther.com", "Panther"),
    # Cloud SIEM
    ("sumo-logic.com", "Sumo Logic"), ("logrhythm.com", "LogRhythm"),
    ("datadog.com", "Datadog"), ("splunk.com", "Splunk"),
    ("elastic.co", "Elastic"),
    # API security
    ("noname.security", "Noname Security"), ("salt.security", "Salt Security"),
    ("traceable.ai", "Traceable AI"), ("neosec.com", "Neosec"),
    ("apisec.ai", "APIsec"),
    # SAST / DAST
    ("checkmarx.com", "Checkmarx"), ("veracode.com", "Veracode"),
    ("contrast.com", "Contrast Security"), ("stackhawk.com", "StackHawk"),
    ("brightdata.com", "Bright Data"),
    # More AI companies
    ("openai.com", "OpenAI"), ("anthropic.com", "Anthropic"),
    ("google.com", "Google"), ("microsoft.com", "Microsoft"),
    ("meta.com", "Meta"), ("amazon.com", "Amazon"),
    ("nvidia.com", "NVIDIA"), ("amd.com", "AMD"),
    ("intel.com", "Intel"),
    # Robotics
    ("agility.com", "Agility Robotics"), ("figure.ai", "Figure"),
    ("1x.tech", "1X Technologies"), ("sanctuary.ai", "Sanctuary AI"),
    ("cobaltrobotics.com", "Cobalt Robotics"),
    ("locus.sh", "Locus Robotics"), ("6river.com", "6 River Systems"),
    ("fetchrobotics.com", "Fetch Robotics"),
    # Space tech
    ("spire.com", "Spire Global"), ("planet.com", "Planet Labs"),
    ("blacksky.com", "BlackSky"), ("satellogic.com", "Satellogic"),
    ("capella-space.com", "Capella Space"), ("iceye.com", "ICEYE"),
    ("hawkeye360.com", "HawkEye 360"), ("umbra.space", "Umbra"),
    # Quantum
    ("ibm.com", "IBM Quantum"), ("ionq.com", "IonQ"),
    ("rigetti.com", "Rigetti"), ("qc-ware.com", "QC Ware"),
    ("classiq.io", "Classiq"), ("pasqal.com", "PASQAL"),
    # Climate tech
    ("carbonbetter.com", "CarbonBetter"), ("carboncure.com", "CarbonCure"),
    ("clearlyenergy.com", "Clearly Energy"), ("palmetto.com", "Palmetto"),
    ("aurora-solar.com", "Aurora Solar"), ("enphase.com", "Enphase"),
    ("solaredge.com", "SolarEdge"), ("span.io", "Span"),
    # Battery / EV
    ("quantumscape.com", "QuantumScape"), ("solidpower.com", "Solid Power"),
    ("enevate.com", "Enevate"), ("silatech.com", "Sila"),
    ("proterra.com", "Proterra"), ("rivian.com", "Rivian"),
    ("lucidmotors.com", "Lucid Motors"), ("fiskerinc.com", "Fisker"),
    # Food tech
    ("apeel.com", "Apeel Sciences"), ("impossiblefoods.com", "Impossible Foods"),
    ("beyondmeat.com", "Beyond Meat"), ("eatjust.com", "Eat Just"),
    ("perfectday.com", "Perfect Day"), ("motif.com", "Motif FoodWorks"),
    # Biotech / Life Sciences SaaS
    ("benchling.com", "Benchling"), ("dotmatics.com", "Dotmatics"),
    ("revvity.com", "Revvity"), ("scibite.com", "SciBite"),
    ("geneious.com", "Geneious"), ("snapgene.com", "SnapGene"),
]

for d, n in companies:
    add(d, n)

print(f"\nBatch 14 total new: {added}")
print(f"Total in output: {len(written)}")
