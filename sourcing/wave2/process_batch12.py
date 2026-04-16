#!/usr/bin/env python3
"""Batch 12: YC W25 companies + more emerging startups."""
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
def add(domain, name, source="workatastartup", category="saas", meta=None):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": meta or {}}) + '\n')
    written.add(d)
    added += 1

# YC W25 batch companies (from extruct.ai page)
yc_w25 = [
    ("redbarnrobotics.com", "Red Barn Robotics"),
    ("mentra.glass", "Mentra"),
    ("blindpay.com", "BlindPay"),
    ("vantel.ai", "Vantel"),
    ("firaresearch.com", "Fira"),
    ("assistant-ui.com", "assistant-ui"),
    ("artifact.engineer", "Artifact"),
    ("axal.ai", "Axal"),
    ("getdexterity.com", "Dexterity"),
    ("tallyhq.com", "Tally"),
    ("sammylabs.com", "Sammy Labs"),
    ("instinct-space.com", "Instinct"),
    ("mercura.ai", "Mercura"),
    ("emojis.com", "emojis.com"),
    ("cedar.com", "Cedar"),
    ("browser-use.com", "Browser Use"),
    ("tamlabs.ai", "TamLabs"),
    ("runcopycat.com", "CopyCat"),
    ("paratushealth.com", "Paratus Health"),
    ("pig.dev", "Pig"),
    ("tensorpool.dev", "TensorPool"),
    ("dalus.io", "Dalus"),
    ("roark.ai", "Roark"),
    ("rebolt.ai", "Rebolt"),
    ("spott.io", "Spott"),
    ("withwoz.com", "Woz"),
    ("proception.ai", "Proception"),
    ("joindemeter.com", "Demeter"),
    ("wild-card.ai", "Wildcard"),
    ("permitify.com", "Permitify"),
    ("reditus.space", "Reditus Space"),
    ("startpinch.com", "Pinch"),
    ("retrofit.shop", "Retrofit"),
    ("archon.inc", "Archon"),
    ("forgeautomation.ca", "Forge Automation"),
    ("mastra.ai", "Mastra"),
    ("afterquery.com", "AfterQuery"),
    ("fuse.ai", "Fuse AI"),
    ("miyagilabs.ai", "Miyagi Labs"),
    ("societies.io", "Artificial Societies"),
    ("triplezip.ai", "TripleZip"),
    ("usepeppr.ai", "Peppr"),
    ("infinite.com", "Infinite"),
    ("sennu.ai", "Sennu AI"),
    ("orbitalops.tech", "Orbital Operations"),
    ("usemesh.com", "Mesh"),
    ("outlit.ai", "Outlit"),
    ("tireswingcollective.org", "Tire Swing"),
    ("harperinsure.com", "Harper"),
    ("calltree.ai", "Calltree AI"),
    ("nitrode.com", "Nitrode"),
    ("gokarsa.com", "Karsa"),
    ("exla.ai", "Exla"),
    ("withriviera.com", "Riviera"),
    ("waypointtransit.com", "Waypoint Transit"),
    ("vovana.com", "Vovana"),
    ("agentin.ai", "Agentin AI"),
    ("rejot.dev", "ReJot"),
    ("generaltrajectory.com", "General Trajectory"),
    ("solidroad.com", "SolidRoad"),
    ("trytrata.com", "Trata"),
    ("sophris.ai", "Sophris"),
    ("lucidic.ai", "Lucidic AI"),
    ("mundoai.world", "Mundo AI"),
    ("glnkco.com", "G LNK"),
    ("strikebet.app", "Strike"),
    ("athenahq.ai", "AthenaHQ"),
    ("lopus.ai", "Lopus AI"),
    ("joincenote.com", "Cenote"),
    ("harbera.com", "Harbera"),
    ("augento.ai", "Augento"),
    ("asteroid.ai", "Asteroid"),
    ("pave-robotics.com", "Pave Robotics"),
    ("pax.markets", "PAX Markets"),
    ("fromolive.com", "Olive"),
    ("hud.so", "HUD"),
    ("cuckoo.so", "Cuckoo Labs"),
    ("mecha-health.ai", "Mecha Health"),
    ("gradewiz.ai", "GradeWiz"),
    ("gethealthkey.com", "HealthKey"),
    ("operand.com", "Operand"),
    ("mosaicco.com", "Mosaic"),
    ("okiapplications.com", "Oki"),
    ("zeroentropy.dev", "ZeroEntropy"),
    ("cardamon.ai", "Cardamon"),
    ("tryamby.com", "Amby Health"),
    ("tergle.com", "Tergle"),
    ("getrally.com", "Rally"),
    ("inversionsemi.com", "Inversion Semiconductor"),
    ("carecycle.ai", "careCycle"),
    ("heysift.com", "Sift Dev"),
    ("salespatriot.com", "SalesPatriot"),
    ("maive.ai", "Maive"),
    ("workweave.dev", "Weave"),
    ("caseflood.ai", "Caseflood"),
    ("trytejas.ai", "Tejas AI"),
    ("usevora.ai", "Vora AI"),
    ("maritimefusion.com", "Maritime Fusion"),
    ("a0.dev", "a0.dev"),
    ("a1base.com", "A1Base"),
    ("verbiflow.com", "Verbiflow"),
    ("toothy.ai", "Toothy AI"),
    ("rocketable.com", "Rocketable"),
    ("sublingual.ai", "Sublingual"),
    ("contrario.ai", "Contrario"),
    ("ovlo.ai", "Ovlo"),
    ("trytruffle.ai", "Truffle AI"),
    ("superglue.ai", "superglue"),
    ("conntour.com", "Conntour"),
    ("closure-intel.com", "Closure"),
    ("gopromptless.ai", "Promptless"),
    ("scoutforschools.com", "Scout"),
    ("subtrace.dev", "Subtrace"),
    ("vocalityhealth.com", "Vocality Health"),
    ("astroenergy.ai", "Astro"),
    ("dartboardenergy.com", "Dartboard Energy"),
    ("awensolutions.com", "Awen"),
    ("dollyglot.com", "Dollyglot"),
    ("alice.tech", "Alice"),
    ("stampmail.ai", "Stamp"),
    ("guse.io", "Guse"),
    ("axiom.trade", "Axiom Trade"),
    ("subimage.io", "SubImage"),
    ("excellence-ai.com", "Excelligence"),
    ("nextbyte.ai", "NextByte"),
    ("casixty.com", "Casixty"),
    ("leapingai.com", "Leaping AI"),
    ("vetnio.com", "Vetnio"),
    ("bild.ai", "Bild AI"),
    ("tracetec.co", "Trace"),
    ("reviserobotics.com", "Revise Robotics"),
    ("enhancedradar.com", "Enhanced Radar"),
    ("edexia.ai", "Edexia"),
    ("quantstruct.com", "Quantstruct"),
    ("confident-ai.com", "Confident AI"),
]

for d, n in yc_w25:
    add(d, n, "workatastartup", "saas", {"batch": "W25", "source_note": "YC_company"})

print(f"\nBatch 12 total new: {added}")
print(f"Total in output: {len(written)}")
