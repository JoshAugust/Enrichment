# Build Report: Innovation Mode

**Date:** 2026-03-29  
**Subagent:** build-innovation-mode  
**Status:** ✅ Complete — TypeScript compiles

---

## Summary

Built the "Innovation Mode" (11th mode) for the Creativity Engine — a structured product/service innovation pipeline that takes an industry or problem space and produces three fully formed innovation concepts plus an investor pitch.

---

## What Was Built

### New Files Created

#### `server/src/pipeline/prompts/innovation-mode.ts`
10 deeply crafted agent system prompts:

| Agent | Phase | Model | Temperature | Tokens |
|---|---|---|---|---|
| problem-archaeologist | 1000a | Opus | 0.80 | 900 |
| unmet-needs-detector | 1000b | Opus | 0.85 | 950 |
| technology-scout | 1001a | Opus | 0.90 | 900 |
| business-model-inventor | 1001b | Opus | 0.85 | 900 |
| experience-reimaginer | 1001c | Opus | 0.95 | 950 |
| value-chain-disruptor | 1002a | Sonnet | 0.60 | 850 |
| regulation-exploiter | 1002b | Sonnet | 0.55 | 850 |
| adjacent-market-finder | 1002c | Sonnet | 0.75 | 850 |
| innovation-synthesiser | 1003 | Opus | 0.85 | 1200 |
| pitch-writer | 1004 | Opus | 0.90 | 900 |

Each prompt has a distinct research lens and a specific, opinionated output format. They're not generic — each has a defined point of view on what's valuable.

#### `server/src/pipeline/orchestrator-innovation.ts`
Full orchestrator implementing the 5-phase parallel/sequential pipeline:

```
Phase 1000: problem-archaeologist + unmet-needs-detector    [PARALLEL]
Phase 1001: technology-scout + business-model-inventor + experience-reimaginer [PARALLEL]
Phase 1002: value-chain-disruptor + regulation-exploiter + adjacent-market-finder [PARALLEL]
Phase 1003: innovation-synthesiser                           [SEQUENTIAL]
Phase 1004: pitch-writer                                     [SEQUENTIAL]
```

Features:
- `pLimit(4)` concurrency control for API rate limiting
- Exponential backoff retry with 429 handling
- Contextual message building — each phase has access to all prior outputs
- Graceful abort if synthesiser fails (pitch can't run without synthesis)
- SSE events: `agent:queued`, `phase:started`, `phase:complete`, `run:complete`

### Files Modified

#### `server/src/routes/run.ts`
- Added `executeInnovationPipeline` import
- Added `'innovation'` to `RunMode` union type
- Added `'innovation'` to `validModes` array
- Added `innovation: 40` to `estimatedDurations`
- Added dispatch branch: `else if (mode === 'innovation')`

#### `server/src/pipeline/agents.ts`
Three additions:
1. **AGENT_TEMPERATURES**: 10 innovation agents with calibrated temperatures
2. **AGENT_MODELS**: All 10 agents mapped (7× Opus, 3× Sonnet)
3. **MAX_TOKENS**: Per-agent token budgets

#### `client/src/agents/config.ts`
- Added `'innovation'` to `EngineMode` union type
- Added `INNOVATION_MODE_AGENTS` — 10 agents with canvas coordinates, colors, models
- Added `INNOVATION_MODE_PHASE_CENTERS`, `INNOVATION_MODE_PHASE_ZOOMS`, `INNOVATION_MODE_PHASE_LABELS`
- Added `innovation` key to `MODE_CONFIGS` with full config
- Registered all innovation agents in `AGENTS_BY_ID`
- Constants declared **before** `MODE_CONFIGS` to avoid forward-reference errors

---

## Pipeline Architecture

### Why This Structure

The 3-parallel-wave approach mirrors how great consulting firms do innovation sprints:

**Wave 1 (Excavation):** Find the real problem before jumping to solutions. Two agents with different lenses — one archaeological (what's broken), one anthropological (what's missing).

**Wave 2 (Exploration):** Solution vectors across three dimensions — technology (what's newly possible), business model (how you capture value), experience (what the human moment feels like). All three run in parallel because they're independent lenses.

**Wave 3 (Disruption):** Market forces — the value chain (structural opportunity), regulation (timing opportunity), adjacencies (expansion opportunity). Sonnet here because these are more analytical/structured than the Opus wave.

**Synthesis:** One Opus agent with all 8 prior outputs. Produces 3 fully-formed concepts, not ideas. Each concept has: name, what it is, who it's for, business model, first step, why now, risk.

**Pitch:** Takes the #1 ranked concept and writes the 60-second investor pitch. Spoken prose, six-part structure, plus full dissection and the three hardest questions an investor will ask.

### Estimated Cost
~$0.50 per run (7 Opus + 3 Sonnet, ~35K tokens avg)

### Estimated Duration
~40 seconds (parallelism across all three waves)

---

## Design Decisions

**Accent color #06B6D4 (cyan):** Distinct from all 10 existing modes. Positioned between blue (research/information) and green (product/growth) — which is exactly where innovation sits conceptually.

**Phase numbering 1000–1004:** Follows the existing convention (Naming=400, Research=500, Writing=600, Strategy=700, Product=800, Debate=1100, Calendar=1200, Audit=1400). Innovation gets 1000 — thematically the foundation number.

**Sonnet for disruption wave:** Value chain mapping, regulatory analysis, and market adjacency identification are more structured/analytical tasks. The Opus budget is spent on the creative and synthesis tasks where reasoning depth matters.

**Pitch-writer separate from synthesiser:** Deliberate. The synthesiser produces three options and a ranking. The pitch-writer then zooms in on #1. This creates a natural review point — if the synthesis output is weak, the pitch won't happen cleanly, surfacing the issue.

**Mode placeholder:** "What industry, market, or problem space do you want to innovate in?" — broad enough for any input, directive enough that users understand the mode is for spaces not specific products.

---

## TypeScript Compilation

| Package | Status |
|---|---|
| `server` | ✅ 0 errors |
| `client` | Pre-existing errors only (audit/brainstorm forward-reference, inherited from prior mode additions) |

The pre-existing client errors are a structural pattern in this codebase where late-declared mode constants are referenced inside `MODE_CONFIGS`. The innovation constants are correctly positioned **before** `MODE_CONFIGS` to avoid contributing to this pattern. The remaining errors (audit, brainstorm) are from modes added before this build.

---

## What the Output Looks Like

A completed Innovation run produces:

1. **Problem Archaeology** — 3 buried problem types with hierarchy of pain and root cause insight
2. **Unmet Needs Detection** — 3 unarticulated needs with jobs-to-be-done analysis and gap matrix
3. **Technology Scout** — 3 cross-domain tech applications with readiness assessment and combination plays
4. **Business Model Inventor** — 3 structural models with unit economics and flywheel analysis
5. **Experience Reimaginer** — worst experience audit + full first-principles redesign with delight moments
6. **Value Chain Disruptor** — full chain map + leak points + specific disruption move
7. **Regulation Exploiter** — 3 regulatory shifts + grey area + risk assessment
8. **Adjacent Market Finder** — 3 adjacencies + convergence play + build priority
9. **Innovation Synthesis** — 3 fully-formed concepts with name/what/who/model/first-step/why-now/risk + ranking
10. **The Pitch** — 150-word spoken pitch + dissection + 3 hardest investor questions answered

---

## Files Changed (Summary)

```
CREATED:
  server/src/pipeline/prompts/innovation-mode.ts      (28KB, 10 agent prompts)
  server/src/pipeline/orchestrator-innovation.ts      (13KB, full orchestrator)
  research/reports/build-innovation-mode.md           (this file)

MODIFIED:
  server/src/routes/run.ts                            (import + type + dispatch + duration)
  server/src/pipeline/agents.ts                       (temperatures + models + tokens)
  client/src/agents/config.ts                         (EngineMode + agents + constants + MODE_CONFIGS)
```
