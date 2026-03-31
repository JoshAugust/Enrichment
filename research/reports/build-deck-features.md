# Build Report: Advanced Presentation Deck Features

**Date:** 2026-03-29  
**Status:** ✅ Complete — TypeScript compiles clean, Vite build passes

---

## What Was Built

### 1. Real-Time Stats Dashboard — `RunStats.tsx`
**Location:** `client/src/components/PresentationDeck/RunStats.tsx`

- Sticky header in the deck (above tab bar, below deck title)
- One compact line: ⏱ elapsed · agents X/101 · tokens · ~$X.XX · ▶ ActiveAgentName
- Live elapsed time: `useEffect` interval ticks every 500ms calling `store.tickDuration()`
- Elapsed starts at `runStartedAt` (set in `startRun`) and stops when run completes
- Numbers in JetBrains Mono, labels in Inter 9px
- Green pulsing dot during active run
- "✓ COMPLETE" badge when run finishes
- Hidden when no run is active and no agents have completed

### 2. Agent Deep Dive Modal — `AgentDeepDive/index.tsx`
**Location:** `client/src/components/AgentDeepDive/index.tsx`

- Centered modal, 600px wide, dark themed
- Border glow in agent's phase color (`box-shadow` with rgba from phase color)
- Mounted globally in `App.tsx` — triggered from both canvas nodes AND deck cards
- Header: phase label + agent name (Space Grotesk 20px) + model/temp badges
- Description: hand-crafted personality strings for ~25 major agents, generic fallback for others
- Stats section: token breakdown (input/output split 70/30), duration, per-agent cost
- Full scrollable output in ReactMarkdown with phase-color theming
- Close: Escape key, click-outside overlay, or close button
- Fade+scale animation on open

**Trigger points:**
- `AgentNode.tsx`: clicking a complete node with output opens deep dive
- `DeckAgentOutput.tsx`: `↗` button in agent card header

### 3. Comparison View — `ComparisonView/index.tsx`
**Location:** `client/src/components/ComparisonView/index.tsx`

- Full-screen overlay component, consumed by Gallery
- Fetches `GET /api/runs/:runIdA/compare/:runIdB` 
- Run A (blue) vs Run B (orange) side-by-side
- Phase-by-phase sections with color-coded headers
- Each agent row: two collapsible cells, collapsed to 3-line preview by default
- **Divergence detection**: Jaccard similarity on word tokens — if < 60% overlap, marks cell "Differs" in amber
- Quality score bar chart at top if both runs have `qualityScore` field
- Run header cards with brief, date, token/cost stats
- Full-screen overlay with Escape to close

**API contract expected:**
```ts
GET /api/runs/:runId1/compare/:runId2
→ { runA: RunSummary, runB: RunSummary }
```
Where `RunSummary.agents: AgentOutput[]` — the server needs to implement this.

### 4. Search Across All Agents
**Location:** `client/src/components/PresentationDeck/index.tsx` + `DeckAgentOutput.tsx`

- Search query moved from local state to Zustand store (`searchQuery`)
- `searchResults` computed: counts matches per agent + total
- Status line: "12 matches · 8 agents"
- Up/Down arrow buttons + keyboard shortcuts (↑↓, Enter/Shift+Enter) to jump between `<mark>` elements
- In search mode: switches to "all phases" view with phase section headers
- **Text highlighting** in `DeckAgentOutput`: custom `applyHighlight()` utility recursively walks ReactNode children and wraps string matches in `<mark style={{ background: rgba(255,235,0,0.28) }}>`. Applied to all text-producing ReactMarkdown components: p, h1-h3, strong, em, li, blockquote, inline code.
- Agent cards auto-expand when search query matches their output

### 5. Collapsible Phase Sections
**Location:** `client/src/components/PresentationDeck/index.tsx`

- `expandedPhases: Set<number>` in Zustand store
- Phase section headers (`PhaseSectionHeader` component): click to toggle phase
- "EXPAND ALL" / "COLLAPSE ALL" buttons appear in both normal and search modes
- Active phase has pulsing dot indicator
- `0.3s ease` height transition via `maxHeight: isExpanded ? 999999 : 0`
- Auto-expand: `store.autoExpandPhase(phase)` called in `useSSE.ts` when `agent:started` fires
- During streaming: active phase stays expanded, others can be manually collapsed
- Default state: phase 1 expanded, all others collapsed

### 6. Store Updates
**Location:** `client/src/stores/pipelineStore.ts`

New fields added:

| Field | Type | Purpose |
|---|---|---|
| `totalTokensUsed` | `number` | Cumulative tokens from all completed agents |
| `estimatedCostUsd` | `number` | Cumulative cost (replaces/augments `accruedCostUsd`) |
| `activeAgentId` | `string \| null` | Currently running agent ID |
| `runDurationMs` | `number` | Elapsed ms since run start |
| `runStartedAt` | `number \| null` | Epoch ms when run started |
| `expandedPhases` | `Set<number>` | Which phase sections are open in deck |
| `deepDiveAgentId` | `string \| null` | Controls deep dive modal |
| `searchQuery` | `string` | Deck search query (global) |

New actions:
- `addTokens(tokens, costUsd)` — atomic update of tokens + cost
- `setActiveAgentId(id)` — set currently active agent
- `tickDuration()` — increment elapsed time based on `runStartedAt`
- `togglePhaseExpanded(phase)` / `expandAllPhases()` / `collapseAllPhases()` / `autoExpandPhase(phase)`
- `setDeepDiveAgentId(id)` — open/close deep dive
- `setSearchQuery(q)` — update deck search

`AgentState` extended with `tokensUsed?: number` and `durationMs?: number` (populated on `agent:complete`).

Updated `useSSE.ts`:
- `agent:started` → sets `activeAgentId`, calls `autoExpandPhase`
- `agent:complete` → stores `tokensUsed`/`durationMs` on agent state, clears `activeAgentId`, calls `addTokens` with per-agent cost (Opus: $15/$75, Sonnet: $3/$15, Haiku: $0.25/$1.25 per MTok)

---

## Files Modified / Created

| File | Action |
|---|---|
| `client/src/stores/pipelineStore.ts` | Modified — added 8 new fields + 8 new actions |
| `client/src/hooks/useSSE.ts` | Modified — populate new store fields on SSE events |
| `client/src/components/PresentationDeck/RunStats.tsx` | **Created** |
| `client/src/components/AgentDeepDive/index.tsx` | **Created** |
| `client/src/components/ComparisonView/index.tsx` | **Created** |
| `client/src/components/PresentationDeck/index.tsx` | Modified — search, collapsible phases, RunStats |
| `client/src/components/PresentationDeck/DeckAgentOutput.tsx` | Modified — search highlight, deep dive button |
| `client/src/components/WarRoomCanvas/AgentNode.tsx` | Modified — click to open deep dive |
| `client/src/App.tsx` | Modified — global AgentDeepDive modal |

---

## Build Verification

```
✓ tsc --noEmit → EXIT:0 (no TypeScript errors)
✓ vite build   → 471 modules, built in 869ms
```

---

## Notes / Known Limitations

1. **Sync-scroll in ComparisonView**: The layout uses a single outer scroll container with a `grid-template-columns: 1fr 1fr` row-per-agent structure, so both columns naturally scroll together without needing JS sync. The per-column scroll refs are stubbed for potential future per-column independent scrolling.

2. **ComparisonView API**: Requires server to implement `GET /api/runs/:runId1/compare/:runId2`. Component handles HTTP errors gracefully with a UI error state.

3. **Search jump navigation**: Uses `document.querySelectorAll('mark')` on the scroll container. Works well once agents are expanded. Agents auto-expand when their content matches the search query.

4. **Agent descriptions**: Provided for ~25 major/named agents. The 70+ unnamed/specialised agents fall back to a generic description. A full descriptions map can be added to `AgentDeepDive/index.tsx` as agents are fleshed out.

5. **Input context**: Not available in current SSE payload (`agent:started` doesn't include input). The DeepDive modal omits the "Input context" section. Can be added if server starts emitting `inputContext` in the `agent:started` event.
