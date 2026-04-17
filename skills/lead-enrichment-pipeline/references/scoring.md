# Scoring System

## Vibe Score (0-100)

Website quality/tech assessment via homepage scrape + AI analysis.

**Signals scored:**
- Software/SaaS product language (+20-30)
- Modern tech stack indicators (+10-15)
- Team/careers page presence (+5-10)
- API/developer documentation (+10)
- Pricing page (+5)
- Professional design quality (+5-10)
- Blog/content presence (+5)
- Domain signals: .io/.ai/.dev (+5)

**DQ threshold:** vibe=0 means no fetchable content or completely non-tech.

## Blueprint Score v3 (max ~95)

### Tech Signals (max 65)
| Signal | Points |
|--------|--------|
| Software/AI/ML/automation keywords in description | +25 |
| SIC code 7371-7379 (software services) | +15 |
| Vibe score >60 | +30 |
| Vibe score 30-60 | +15 |
| Domain TLD .io/.ai | +5 |
| GitHub org with recent activity | +5 |

Note: vibe bands are mutually exclusive (>60 OR 30-60, not both).

### Non-Tech Signals (max 35)
| Signal | Points |
|--------|--------|
| LinkedIn employees 1-20 | +8 |
| LinkedIn employees 21-50 | +3 |
| Small entity type | +3 |
| Incorporated <5 years ago | +7 |
| Incorporated 5-10 years ago | +3 |
| Revenue <$1M | +4 |
| Revenue $1-5M | +2 |
| Tech hub state (CA, NY, TX, WA, MA, CO, etc.) | +3 |
| Accelerator-backed | +5 |

Note: employee bands, incorporation bands, and revenue bands are mutually exclusive within each group.

### Grade Thresholds
| Grade | Score | Action |
|-------|-------|--------|
| A | ≥75 | Priority enrichment + outreach |
| B | ≥50 | Standard enrichment |
| C | ≥25 | Hold — only enrich if capacity allows |
| D | <25 | Do not enrich |

### Max Score Reality
- Max realistic score for BvD-sourced: 90 (non-tech bands mutually exclusive)
- Need accelerator-backed (+5) to reach 95
- 100 is mathematically unreachable with current weights

## Scoring Rules
- **Zero tech = DQ**: Companies scoring 0 on ALL tech signals are disqualified
- **BvD data excluded from scoring**: Employee counts and revenue from BvD are NOT used. Only LinkedIn-verified employee counts (from Apollo org enrichment) feed into scoring.
- **Vibe score is the primary tech qualifier**: A high vibe score (+30) is the strongest single signal
