#!/usr/bin/env python3
"""Process collected company data and write deduped JSONL output."""
import json
import os
from urllib.parse import urlparse

EXISTING = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt"
OUTPUT = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave2/jobboard_domains.jsonl"

# Load existing domains
with open(EXISTING) as f:
    existing = set(line.strip().lower() for line in f if line.strip())

# Load already written domains
written = set()
if os.path.exists(OUTPUT):
    with open(OUTPUT) as f:
        for line in f:
            try:
                d = json.loads(line)
                written.add(d['domain'].lower())
            except:
                pass

def clean_domain(url):
    """Extract clean domain from URL."""
    url = url.strip()
    if not url.startswith('http'):
        url = 'https://' + url
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        domain = domain.lower().strip()
        # Remove www.
        if domain.startswith('www.'):
            domain = domain[4:]
        # Remove trailing paths
        domain = domain.split('/')[0]
        # Remove port
        domain = domain.split(':')[0]
        # Remove query params from utm
        domain = domain.split('?')[0]
        return domain
    except:
        return None

def add_domain(domain, name, source, category="saas", metadata=None):
    """Add domain if not already existing."""
    domain = clean_domain(domain)
    if not domain or domain in existing or domain in written:
        return False
    entry = {
        "domain": domain,
        "name": name,
        "source": source,
        "category": category,
        "metadata": metadata or {}
    }
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps(entry) + '\n')
    written.add(domain)
    print(f"ADDED: {domain} ({name})")
    return True

added = 0

# === TOPSTARTUPS.IO SaaS companies ===
topstartups_saas = [
    ("hex.tech", "Hex", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$70M Series C"}),
    ("clickhouse.com", "ClickHouse", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$350M Series C"}),
    ("statsig.com", "Statsig", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$100M Series C"}),
    ("glean.com", "Glean", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$150M Series F"}),
    ("graphite.dev", "Graphite", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$52M Series B"}),
    ("clay.com", "Clay", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$40M Series B"}),
    ("hightouch.io", "Hightouch", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$80M Series C"}),
    ("withpersona.com", "Persona", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$200M Series D"}),
    ("stainlessapi.com", "Stainless", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$25M Series A"}),
    ("speak.com", "Speak", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$78M Series C"}),
    ("konghq.com", "Kong", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$175M Series E"}),
    # Page 2
    ("socket.dev", "Socket", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$40M Series B"}),
    ("rippling.com", "Rippling", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "1001-5000", "funding": "$200M Series F"}),
    ("repl.it", "Replit", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$97M Series B"}),
    ("clerk.dev", "Clerk", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$15M Series A"}),
    # Page 3
    ("kumo.ai", "Kumo", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$18M Series B"}),
    ("knoetic.com", "Knoetic", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$36M Series B"}),
    ("alloy.com", "Alloy", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$52M Series C"}),
    ("celonis.com", "Celonis", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "1001-5000", "funding": "$400M Series D"}),
    ("truework.com", "Truework", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$50M Series C"}),
    ("frontapp.com", "Front", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$65M Series D"}),
    ("courier.com", "Courier", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$35M Series B"}),
    ("fountain.com", "Fountain", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$100M Series C"}),
    # Page 4
    ("middesk.com", "Middesk", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "51-100", "funding": "$57M Series B"}),
    ("primer.com", "Primer", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$15M Series A"}),
    ("doppler.com", "Doppler", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$20M Series A"}),
    ("mutinyhq.com", "Mutiny", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$50M Series B"}),
    ("playbook.com", "Playbook", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$18M Series A"}),
    ("skiff.org", "Skiff", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$10M Series A"}),
    ("firstbasehq.com", "Firstbase", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "51-100", "funding": "$50M Series B"}),
    ("anyroad.com", "AnyRoad", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$47M Series B"}),
    # Page 5
    ("branch.io", "Branch", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$300M Series F"}),
    ("getcensus.com", "Census", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$60M Series B"}),
    ("productboard.com", "Productboard", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$125M Series D"}),
    ("supermove.co", "Supermove", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$18M Series A"}),
    ("lattice.com", "Lattice", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$175M Series F"}),
    ("conveyor.com", "Conveyor", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$10M Seed"}),
    ("miro.com", "Miro", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "1001-5000", "funding": "$400M Series C"}),
    ("bigpanda.io", "BigPanda", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$190M Series D"}),
    # Page 6
    ("searchlight.ai", "Searchlight", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$17M Series A"}),
    ("usecodex.com", "Codex", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "1-10", "funding": "$4M Seed"}),
    ("secoda.co", "Secoda", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$2M Seed"}),
    ("robustintelligence.com", "Robust Intelligence", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$30M Series B"}),
    ("cycognito.com", "CyCognito", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$100M Series C"}),
    ("snaplogic.com", "SnapLogic", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$165M Series G"}),
    ("simplified.co", "Simplified", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$8M Seed"}),
    ("vercel.com", "Vercel", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$150M Series D"}),
    ("conduktor.io", "Conduktor", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$20M Series A"}),
    ("getzuma.com", "Zuma", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$7M Seed"}),
    ("stytch.com", "Stytch", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$90M Series B"}),
    ("netlify.com", "Netlify", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$105M Series D"}),
    # Page 7
    ("netography.com", "Netography", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$45M Series A"}),
    ("thoughtspot.com", "ThoughtSpot", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$120M Series F"}),
    ("orderful.com", "Orderful", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$19M Series B"}),
    ("vergesense.com", "VergeSense", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "51-100", "funding": "$60M Series C"}),
    ("blotout.io", "Blotout", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$3M Seed"}),
    ("whimsical.com", "Whimsical", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$30M Series A"}),
    ("clickup.com", "ClickUp", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$400M Series C"}),
    ("matik.io", "Matik", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$20M Series A"}),
    ("elemenohealth.com", "Elemeno Health", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$7M Series A"}),
    ("withmedley.com", "Medley", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$4M Seed"}),
    ("gem.com", "Gem", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$37M Series C"}),
    ("clio.com", "Clio", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$20M Series E"}),
    # Page 8
    ("zapier.com", "Zapier", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "bootstrapped"}),
    ("stackerhq.com", "Stacker", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$20M Series A"}),
    ("robocorp.com", "Robocorp", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "$21M Series A"}),
    ("dover.com", "Dover", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "51-100", "funding": "$20M Series A"}),
    ("gimbooks.com", "GimBooks", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "11-50", "funding": "Seed"}),
    ("zomentum.com", "Zomentum", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "51-100", "funding": "$4M Series A"}),
    ("algolia.com", "Algolia", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$334M Series D"}),
    ("browserstack.com", "BrowserStack", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$250M Series B"}),
    ("slintel.com", "Slintel", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "101-200", "funding": "$26M Series A"}),
    ("lob.com", "Lob", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$79M Series C"}),
    ("sendbird.com", "Sendbird", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$221M Series C"}),
    # Page 9
    ("ophelia.com", "Ophelia", "topstartups", "healthcare_saas", {"hiring_for": "software engineer", "employees": "51-100", "funding": "$15M Series A"}),
    ("joinfightcamp.com", "FightCamp", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "51-100", "funding": "$90M Series B"}),
    ("launchdarkly.com", "LaunchDarkly", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "201-500", "funding": "$200M Series D"}),
    ("yotpo.com", "Yotpo", "topstartups", "saas", {"hiring_for": "software engineer", "employees": "501-1000", "funding": "$230M Series F"}),
]

# === WELLFOUND 10-of-10 2025 companies ===
wellfound_companies = [
    ("beautiful.ai", "Beautiful.AI", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("wandb.ai", "Weights & Biases", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("amperon.co", "Amperon", "wellfound", "saas", {"hiring_for": "software engineer", "location": "Houston"}),
    ("mutinyhq.com", "Mutiny", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("writer.com", "Writer", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("kalepa.com", "Kalepa", "wellfound", "saas", {"hiring_for": "software engineer", "location": "New York"}),
    ("squint.ai", "Squint", "wellfound", "saas", {"hiring_for": "software engineer", "location": "Denver"}),
    ("wyndlabs.ai", "Wynd Labs", "wellfound", "saas", {"hiring_for": "software engineer", "location": "New York"}),
    ("joinmesa.com", "Mesa", "wellfound", "fintech_saas", {"hiring_for": "software engineer", "location": "Austin"}),
    ("substack.com", "Substack", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("paperlesspost.com", "Paperless Post", "wellfound", "saas", {"hiring_for": "software engineer", "location": "New York"}),
    ("quora.com", "Quora", "wellfound", "saas", {"hiring_for": "software engineer", "location": "Mountain View"}),
    ("rover.com", "Rover", "wellfound", "saas", {"hiring_for": "software engineer", "location": "Seattle"}),
    ("turo.com", "Turo", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("checkhq.com", "Check", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("imprintpayments.com", "Imprint Payments", "wellfound", "fintech_saas", {"hiring_for": "software engineer", "location": "New York"}),
    ("taxbit.com", "TaxBit", "wellfound", "saas", {"hiring_for": "software engineer", "location": "Seattle"}),
    ("abridge.com", "Abridge", "wellfound", "healthcare_saas", {"hiring_for": "software engineer", "location": "Pittsburgh"}),
    ("alto.com", "Alto Pharmacy", "wellfound", "healthcare_saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("benchling.com", "Benchling", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("picovoice.ai", "Picovoice", "wellfound", "saas", {"hiring_for": "software engineer", "location": "Vancouver"}),
    ("atomus.com", "Atomus", "wellfound", "saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
    ("joinforage.com", "Forage", "wellfound", "saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("belfry.com", "Belfry", "wellfound", "saas", {"hiring_for": "full-stack engineer", "location": "New York"}),
    ("proton.ai", "Proton.ai", "wellfound", "saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("startengine.com", "StartEngine", "wellfound", "fintech_saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("sleekflow.io", "SleekFlow", "wellfound", "saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("methodfi.com", "Method", "wellfound", "fintech_saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("fathomhealth.com", "Fathom Health", "wellfound", "healthcare_saas", {"hiring_for": "software engineer", "location": "San Francisco"}),
]

# === WE WORK REMOTELY companies ===
wwr_companies = [
    ("uncap.com", "Uncap", "weworkremotely", "saas", {"hiring_for": "full-stack engineer", "location": "remote"}),
    ("berry.ai", "Berry AI", "weworkremotely", "saas", {"hiring_for": "full-stack engineer", "location": "remote"}),
    ("summedd.com", "Summedd", "weworkremotely", "saas", {"hiring_for": "full-stack engineer", "location": "remote"}),
    ("chilipiper.com", "Chili Piper", "weworkremotely", "saas", {"hiring_for": "QA engineer", "location": "remote"}),
    ("socialhub.io", "SocialHub", "weworkremotely", "saas", {"hiring_for": "full-stack developer", "location": "remote"}),
    ("remoteleverage.com", "Remote Leverage", "weworkremotely", "saas", {"hiring_for": "full-stack developer", "location": "remote"}),
    ("zandahealth.com", "Zanda Health", "weworkremotely", "healthcare_saas", {"hiring_for": "head of engineering", "location": "remote"}),
]

# === REMOTIVE companies ===
remotive_companies = [
    ("saas.group", "saas.group", "remotive", "saas", {"hiring_for": "platform engineer", "location": "Europe"}),
    ("higherlogic.com", "Higher Logic", "remotive", "saas", {"hiring_for": "software developer", "location": "USA"}),
    ("fsiservices.com", "FSI Services", "remotive", "saas", {"hiring_for": "senior software developer", "location": "remote"}),
    ("nordhealth.com", "Nordhealth", "remotive", "healthcare_saas", {"hiring_for": "full-stack developer", "location": "Europe"}),
    ("sambanova.ai", "SambaNova Systems", "remotive", "saas", {"hiring_for": "infrastructure engineer", "location": "remote"}),
    ("hypori.com", "Hypori", "remotive", "saas", {"hiring_for": "senior software engineer", "location": "remote"}),
    ("ecpinc.com", "ECP", "remotive", "saas", {"hiring_for": "software architect", "location": "remote"}),
    ("synthflow.ai", "Synthflow", "remotive", "saas", {"hiring_for": "sales engineer", "location": "remote"}),
]

# === BUILT IN companies ===
builtin_companies = [
    ("sosafe.de", "SoSafe", "builtin", "saas", {"hiring_for": "software engineer", "location": "Cologne"}),
    ("rewardful.com", "Rewardful", "builtin", "saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("sanas.ai", "Sanas", "builtin", "saas", {"hiring_for": "senior software engineer", "location": "remote"}),
    ("upstart.com", "Upstart", "builtin", "fintech_saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("saas-labs.com", "SaaS Labs", "builtin", "saas", {"hiring_for": "software engineer", "location": "remote"}),
    ("ideas.com", "IDeaS", "builtin", "saas", {"hiring_for": "software engineer", "location": "remote"}),
]

# === ADDITIONAL from search results ===
additional_companies = [
    ("pylon.com", "Pylon", "web_search", "saas", {"hiring_for": "software engineer", "funding": "$51M Series B"}),
    ("etched.ai", "Etched.ai", "web_search", "saas", {"hiring_for": "software engineer", "funding": "Series A"}),
    ("savvywealth.com", "Savvy Wealth", "web_search", "fintech_saas", {"hiring_for": "software engineer", "funding": "Series A"}),
    ("turionspace.com", "Turion Space", "web_search", "saas", {"hiring_for": "software engineer", "funding": "Series A"}),
    ("sully.ai", "Sully.ai", "web_search", "healthcare_saas", {"hiring_for": "software engineer", "funding": "Series A"}),
]

# Process all
all_companies = topstartups_saas + wellfound_companies + wwr_companies + remotive_companies + builtin_companies + additional_companies

for domain, name, source, category, metadata in all_companies:
    if add_domain(domain, name, source, category, metadata):
        added += 1

print(f"\n=== Total new domains added: {added} ===")
