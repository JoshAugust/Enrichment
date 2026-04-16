#!/usr/bin/env python3
"""Batch 15: Final massive push to reach 2000+."""
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
    # Fintech B2B — banking infrastructure
    ("plaid.com", "Plaid"), ("mx.com", "MX"),
    ("yodlee.com", "Yodlee"), ("finicity.com", "Finicity"),
    ("teller.io", "Teller"), ("railsr.com", "Railsr"),
    ("clearbank.co.uk", "ClearBank"), ("bankingcircle.com", "Banking Circle"),
    ("currencycloud.com", "CurrencyCloud"), ("nium.com", "Nium"),
    ("thunes.com", "Thunes"), ("dlocal.com", "dLocal"),
    ("ppro.com", "PPRO"), ("payu.com", "PayU"),
    ("razorpay.com", "Razorpay"), ("stripe.com", "Stripe"),
    ("checkout.com", "Checkout.com"), ("adyen.com", "Adyen"),
    ("worldpay.com", "Worldpay"),
    # Banking-as-a-Service
    ("unit.co", "Unit"), ("treasury-prime.com", "Treasury Prime"),
    ("synctera.com", "Synctera"), ("bond.tech", "Bond"),
    ("galileo-ft.com", "Galileo"), ("marqeta.com", "Marqeta"),
    ("lithic.com", "Lithic"), ("highnote.com", "Highnote"),
    # Lending infrastructure
    ("peach.finance", "Peach Finance"), ("canopy.inc", "Canopy"),
    ("loanpro.io", "LoanPro"), ("mambu.com", "Mambu"),
    ("thought-machine.com", "Thought Machine"), ("10x-banking.com", "10x Banking"),
    # Insurance infra
    ("socotra.com", "Socotra"), ("majesco.com", "Majesco"),
    ("guidewire.com", "Guidewire"), ("duck-creek.com", "Duck Creek"),
    ("origami.ms", "Origami Risk"), ("zywave.com", "Zywave"),
    # Wealth management
    ("addepar.com", "Addepar"), ("orion.com", "Orion"),
    ("blackdiamond.com", "Black Diamond"), ("envestnet.com", "Envestnet"),
    # Capital markets
    ("broadridge.com", "Broadridge"), ("ss-c.com", "SS&C"),
    ("ion.co", "ION Group"), ("murex.com", "Murex"),
    # Property management
    ("buildium.com", "Buildium"), ("rentmanager.com", "Rent Manager"),
    ("propertyware.com", "Propertyware"), ("rentec.com", "Rentec Direct"),
    ("turbotenant.com", "TurboTenant"), ("avail.co", "Avail"),
    ("cozy.co", "Cozy"), ("hemlane.com", "Hemlane"),
    ("stessa.com", "Stessa"),
    # Construction management
    ("procore.com", "Procore"), ("proceduretree.com", "ProcedureTree"),
    ("pype.com", "Pype"), ("rhumbix.com", "Rhumbix"),
    ("smartvidio.com", "SmartVid.io"),
    # Architecture / CAD SaaS
    ("arcol.io", "Arcol"), ("snaptrude.com", "Snaptrude"),
    ("testfit.io", "TestFit"), ("hypar.io", "Hypar"),
    ("speckle.systems", "Speckle"), ("ifc.js", "IFC.js"),
    # Manufacturing
    ("machinetools.com", "MachineTools"), ("xometry.com", "Xometry"),
    ("fictiv.com", "Fictiv"), ("hubs.com", "Hubs"),
    ("protolabs.com", "Protolabs"), ("shapeways.com", "Shapeways"),
    ("tulip.co", "Tulip"),
    # Supply chain visibility
    ("project44.com", "project44"), ("fourkites.com", "FourKites"),
    ("macropoint.com", "MacroPoint"), ("chain.io", "Chain.io"),
    ("flexe.com", "Flexe"), ("darkstore.com", "Darkstore"),
    # Procurement SaaS
    ("procurify.com", "Procurify"), ("precoro.com", "Precoro"),
    ("kissflow.com", "Kissflow"), ("tradogram.com", "Tradogram"),
    ("esker.com", "Esker"), ("basware.com", "Basware"),
    ("ivalua.com", "Ivalua"), ("gep.com", "GEP"),
    ("scoutbee.com", "Scoutbee"), ("sievo.com", "Sievo"),
    # Healthcare IT
    ("veradigm.com", "Veradigm"), ("netsmart.com", "Netsmart"),
    ("medhost.com", "MEDHOST"), ("cpsi.com", "CPSI"),
    ("evident.com", "Evident"), ("oracle-health.com", "Oracle Health"),
    # Telemedicine
    ("amwell.com", "Amwell"), ("teladoc.com", "Teladoc"),
    ("mdlive.com", "MDLive"), ("98point6.com", "98point6"),
    ("brightmd.com", "Bright.md"), ("zipnosis.com", "Zipnosis"),
    # Dental SaaS
    ("dentrix.com", "Dentrix"), ("eaglesoft.net", "Eaglesoft"),
    ("opendental.com", "Open Dental"), ("curvehero.com", "Curve Dental"),
    ("tab32.com", "tab32"), ("dentalintel.com", "Dental Intelligence"),
    # Optometry SaaS
    ("weaveconnect.com", "Weave"), ("eyefinity.com", "Eyefinity"),
    ("revolutionehr.com", "RevolutionEHR"), ("compulink.com", "Compulink"),
    # Veterinary SaaS
    ("ezyvet.com", "ezyVet"), ("smartflow.com", "SmartFlow"),
    ("vetspire.com", "Vetspire"), ("shepherd.vet", "Shepherd"),
    ("rhapsody.vet", "Rhapsody"), ("covetrus.com", "Covetrus"),
    # Pharmacy SaaS
    ("scriptpro.com", "ScriptPro"), ("mckesson.com", "McKesson"),
    ("carepoint.com", "CarePoint"),
    # Lab Information
    ("ovation.io", "Ovation"), ("starlims.com", "StarLIMS"),
    ("labvantage.com", "LabVantage"), ("benchling.com", "Benchling"),
    # Clinical Trials
    ("medidata.com", "Medidata"), ("veeva.com", "Veeva"),
    ("medable.com", "Medable"), ("science37.com", "Science 37"),
    ("decentralizedtrials.com", "Decentralized Trials"),
    # EdTech platforms
    ("campuslabs.com", "Campus Labs"), ("ellucian.com", "Ellucian"),
    ("jenzabar.com", "Jenzabar"), ("anthology.com", "Anthology"),
    ("qualtrics.com", "Qualtrics"), ("turnitin.com", "Turnitin"),
    ("gradescope.com", "Gradescope"), ("proctorio.com", "Proctorio"),
    ("examsoft.com", "ExamSoft"), ("honorlock.com", "Honorlock"),
    # Assessment / Testing
    ("testgorilla.com", "TestGorilla"), ("codility.com", "Codility"),
    ("hackerrank.com", "HackerRank"), ("codesignal.com", "CodeSignal"),
    ("qualified.io", "Qualified"), ("thinkexam.com", "ThinkExam"),
    # Tutoring platforms
    ("wyzant.com", "Wyzant"), ("varsitytutors.com", "Varsity Tutors"),
    ("tutor.com", "Tutor.com"), ("chegg.com", "Chegg"),
    # Church / Nonprofit SaaS
    ("givebutter.com", "Givebutter"), ("donorbox.org", "Donorbox"),
    ("funraise.org", "Funraise"), ("kindful.com", "Kindful"),
    ("virtuous.org", "Virtuous"), ("causevox.com", "CauseVox"),
    # Association management
    ("memberclicks.com", "MemberClicks"), ("wildapricot.com", "Wild Apricot"),
    ("memberplanet.com", "MemberPlanet"), ("joinit.org", "Join It"),
    # Event tech
    ("eventbrite.com", "Eventbrite"), ("splash.events", "Splash"),
    ("bizzabo.com", "Bizzabo"), ("hopin.com", "Hopin"),
    ("run.events", "Run The World"), ("airmeet.com", "Airmeet"),
    ("aventri.com", "Aventri"), ("cvent.com", "Cvent"),
    ("swoogo.com", "Swoogo"), ("whova.com", "Whova"),
    # Ticketing
    ("dice.fm", "DICE"), ("resident-advisor.net", "Resident Advisor"),
    ("tixr.com", "Tixr"), ("eventix.io", "Eventix"),
    ("yapsody.com", "Yapsody"), ("tickettailor.com", "Ticket Tailor"),
    # Venue management
    ("tripleseat.com", "Tripleseat"), ("perfectvenue.com", "Perfect Venue"),
    ("eventtemple.com", "Event Temple"),
    # Fitness / Gym
    ("exercise.com", "Exercise.com"), ("wodify.com", "Wodify"),
    ("zenplanner.com", "Zen Planner"), ("pushpress.com", "PushPress"),
    ("gymdesk.com", "GymDesk"), ("everfit.io", "Everfit"),
    # Salon / Spa
    ("vagaro.com", "Vagaro"), ("squareup.com", "Square Appointments"),
    ("phorest.com", "Phorest"), ("boulevard.io", "Boulevard"),
    ("zenoti.com", "Zenoti"), ("mangomint.com", "Mangomint"),
    # Auto repair
    ("shopware.com", "Shop-Ware"), ("tekmetric.com", "Tekmetric"),
    ("shopmonkey.io", "ShopMonkey"), ("omnique.com", "Omnique"),
    # Cleaning / Janitorial
    ("swept.com", "Swept"), ("cleansmarts.com", "CleanSmarts"),
    ("cleantelligent.com", "CleanTelligent"),
    # Pest control
    ("fieldroutes.com", "FieldRoutes"), ("pestpac.com", "PestPac"),
    ("briostack.com", "Briostack"),
    # HVAC / Plumbing
    ("servicetitan.com", "ServiceTitan"), ("housecallpro.com", "Housecall Pro"),
    ("jobber.com", "Jobber"), ("fieldpulse.com", "FieldPulse"),
    ("workiz.com", "Workiz"), ("mhelpdesk.com", "mHelpDesk"),
    # Lawn / Landscaping
    ("aspire.com", "Aspire"), ("goproposal.com", "GoProposal"),
    ("yardbook.com", "Yardbook"), ("singleops.com", "SingleOps"),
    # Moving companies
    ("smartmoving.com", "SmartMoving"), ("movecrm.com", "MoveCRM"),
    ("elromco.com", "Elromco"),
    # Roofing
    ("jobnimbus.com", "JobNimbus"), ("acculynx.com", "AccuLynx"),
    ("roofr.com", "Roofr"), ("leaptodigital.com", "Leap"),
    # Home services marketplace
    ("thumbtack.com", "Thumbtack"), ("taskrabbit.com", "TaskRabbit"),
    ("porch.com", "Porch"), ("bark.com", "Bark"),
    ("homeadvisor.com", "HomeAdvisor"),
    # Food delivery / Restaurant ops
    ("olo.com", "Olo"), ("chowly.com", "Chowly"),
    ("itsacheckmate.com", "Checkmate"), ("ordermark.com", "Ordermark"),
    ("deliverect.com", "Deliverect"), ("cuboh.com", "Cuboh"),
    # Kitchen Display Systems
    ("freshkds.com", "Fresh KDS"), ("kitchencut.com", "Kitchen CUT"),
    # Coffee shop POS
    ("square.com", "Square"), ("clover.com", "Clover"),
    ("touchbistro.com", "TouchBistro"), ("rezku.com", "Rezku"),
    ("upserve.com", "Upserve"),
    # Retail analytics
    ("dunnhumby.com", "dunnhumby"), ("shoppermotion.com", "ShopperMotion"),
    ("retailnext.net", "RetailNext"), ("placer.ai", "Placer.ai"),
    # Store management
    ("storehub.com", "StoreHub"), ("hike.one", "Hike POS"),
    ("retailedge.com", "RetailEdge"),
    # Fleet management
    ("samsara.com", "Samsara"), ("motive.com", "Motive"),
    ("geotab.com", "Geotab"), ("verizonconnect.com", "Verizon Connect"),
    ("teletrac.com", "Teletrac Navman"), ("azuga.com", "Azuga"),
    # Trucking / TMS
    ("rose-rocket.com", "Rose Rocket"), ("loadsmart.com", "Loadsmart"),
    ("turvo.com", "Turvo"), ("freightos.com", "Freightos"),
    ("xeneta.com", "Xeneta"), ("flexport.com", "Flexport"),
    # Last-mile delivery
    ("bringg.com", "Bringg"), ("onfleet.com", "Onfleet"),
    ("getswift.co", "GetSwift"), ("detrack.com", "Detrack"),
    ("routific.com", "Routific"), ("logistimatics.com", "Logistimatics"),
    # Warehouse management
    ("shiphero.com", "ShipHero"), ("logiwa.com", "Logiwa"),
    ("3plcentral.com", "3PL Central"), ("deposco.com", "Deposco"),
    ("infoplus.com", "Infoplus"), ("extensiv.com", "Extensiv"),
    # Print management
    ("gelato.com", "Gelato"), ("gooten.com", "Gooten"),
    ("printful.com", "Printful"), ("printify.com", "Printify"),
    # Digital signage
    ("yodeck.com", "Yodeck"), ("screenly.io", "Screenly"),
    ("rise-vision.com", "Rise Vision"), ("opti-signs.com", "OptiSigns"),
    ("screencloud.com", "ScreenCloud"),
    # Appointment scheduling (niche)
    ("acuityscheduling.com", "Acuity Scheduling"),
    ("simplybook.me", "SimplyBook.me"), ("square.com", "Square"),
    ("bookedin.com", "Bookedin"), ("genbook.com", "Genbook"),
    # Photography SaaS
    ("shootproof.com", "ShootProof"), ("pixieset.com", "Pixieset"),
    ("pic-time.com", "Pic-Time"), ("smugmug.com", "SmugMug"),
    ("zenfolio.com", "Zenfolio"),
    # Wedding SaaS
    ("honeybook.com", "HoneyBook"), ("aisle-planner.com", "Aisle Planner"),
    ("weddingspot.com", "WeddingSpot"),
    # Church tech (cont.)
    ("subsplash.com", "Subsplash"), ("faithlife.com", "Faithlife"),
    ("churchcenter.com", "Church Center"),
    # Childcare / Daycare
    ("procaresoftware.com", "Procare"), ("himama.com", "HiMama"),
    ("brightwheel.com", "Brightwheel"), ("kangarootime.com", "Kangaroo Time"),
    # Senior care
    ("aline.com", "Aline"), ("eldermark.com", "Eldermark"),
    ("pointclickcare.com", "PointClickCare"), ("yardi.com", "Yardi"),
    # Home health
    ("devero.com", "Devero"), ("homecarepulse.com", "Home Care Pulse"),
    ("alayacare.com", "AlayaCare"), ("caretend.com", "Caretend"),
    # More misc B2B
    ("affinity.co", "Affinity"), ("4degrees.ai", "4Degrees"),
    ("dynamo.fyi", "Dynamo"), ("visible.vc", "Visible"),
    ("carta.com", "Carta"), ("pulley.com", "Pulley"),
    ("ltse.com", "LTSE"), ("assure.co", "Assure"),
    ("aumni.fund", "Aumni"),
]

for d, n in companies:
    add(d, n)

print(f"\nBatch 15 total new: {added}")
print(f"Total in output: {len(written)}")
