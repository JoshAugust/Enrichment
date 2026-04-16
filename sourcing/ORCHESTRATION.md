# Sourcing Operation — New Domain Discovery

**Goal:** Harvest new company domains from 10+ sources that might fit Corgi's ICP (small US SaaS startups). These get fed into the existing production line (Apollo enrich → LLM classify → website check → ICP score).

**We only need domains + basic metadata.** The production line handles everything else.

## Output Format (JSONL)
Each agent writes one JSONL file per source. Each line:
```json
{"domain": "example.com", "name": "Example Inc", "source": "g2", "category": "project-management", "metadata": {"employees": "11-50", "rating": 4.5}}
```

Required: `domain`, `source`
Optional: `name`, `category`, `metadata` (any extra context)

## Dedup
- `shared/existing_domains.txt` — 86,294 domains already in master.db
- Each agent loads this at start, skips any domain already present
- Agents also dedup within their own output

## Wave Plan
- **Wave 1** (high yield): G2/Capterra, GitHub orgs, Indie Hackers, Reddit/Twitter signals
- **Wave 2** (medium): AWS/GCP/Azure Marketplace, Chrome Web Store, Shopify App Store
- **Wave 3** (scrappy): Job boards (Wellfound, Otta, Work at a Startup), BuiltWith reverse lookup

## Architecture
- Main session = orchestrator (spawns all agents, monitors, merges)
- Sub-agents = workers (single-purpose, write to per-source output files)
- Max 5 concurrent sub-agents at a time
- All output to `jordan.ai/sourcing/wave1/` etc.
- Progress logs to `jordan.ai/sourcing/logs/`

## After Sourcing
1. Merge all JSONL → dedup → bulk insert into master.db
2. Run Apollo batch enrichment (free)
3. Run Mk2 ICP scoring
4. Website liveness checks on Grade A
5. Deliver new leads
