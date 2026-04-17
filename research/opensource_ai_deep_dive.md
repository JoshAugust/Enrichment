# Open Source & Agentic AI Companies — Deep Dive
**Research for Josh A — Cambridge MBA | Builder of Eragon (OpenClaw)**
*Compiled: April 2026 | Target: SF-based summer consulting project / internship*

---

## Research Methodology

Searched across:
- Y Combinator company database (W23–S25 batches)
- Crunchbase/PitchBook SF AI seed/Series A rounds 2024–2025
- GitHub trending AI agent repos + org lookups
- AI Engineer World's Fair 2024/2025 exhibitors
- Latent Space / Cerebral Valley community signals
- Product Hunt AI agent launches 2024–2025

---

## The Shortlist — 18 Companies

Sorted roughly by "fit score" for Josh's specific background (built his own agentic runtime, open-source, systems-level thinking).

---

### 1. 🧠 Letta
**Website:** letta.com
**GitHub:** github.com/letta-ai/letta
**What they build:** Platform for building stateful AI agents with persistent, self-editing memory. The MemGPT research project came out of UC Berkeley and became Letta. Agents can learn and update their own memory over time — solving the context window problem for long-horizon tasks.
**Team size:** ~15–20
**Funding:** $10M seed (Sep 2024), led by Felicis. Angels include Jeff Dean (Google DeepMind), Clem Delangue (HuggingFace), Robert Nishihara (Anyscale).
**Location:** San Francisco, CA (Berkeley spinout)
**Why Josh = great match:** Josh built Eragon, his own multi-tool agentic runtime — Letta is literally solving the memory architecture problem Josh would have run into head-on. His hands-on perspective on agent loops + open-source community building makes him a uniquely credible voice here.

---

### 2. 🏗️ E2B
**Website:** e2b.dev
**GitHub:** github.com/e2b-dev/E2B
**What they build:** Open-source cloud sandbox infrastructure for AI agents — secure, isolated VMs that start in <200ms where AI-generated code can be safely executed. The "cloud runtime" for agents. 88% of Fortune 100 already use it.
**Team size:** ~20–30 (hiring in-person only in SF)
**Funding:** $32M total — $3M pre-seed (Kaya VC), $11.5M seed (Decibel Partners), $21M Series A (Jul 2025, Insight Partners)
**Location:** San Francisco, CA (Czech-founded)
**Why Josh = great match:** Eragon executes real tool calls and commands — E2B is the infrastructure layer that makes agentic code execution safe at scale. Josh's systems + open-source mindset is a direct fit, and they're explicitly SF-only and early-stage.

---

### 3. 🌐 Browserbase
**Website:** browserbase.com
**GitHub:** (Stagehand SDK open-source)
**What they build:** Cloud browser infrastructure for AI agents — headless browsers at scale, with Stagehand (open-source SDK over Playwright/Puppeteer) as the high-level abstraction. Used by Perplexity, Vercel, Commure.
**Team size:** ~30–60 (actively hiring post-Series B)
**Funding:** $68M total — $6.5M seed (Kleiner Perkins), $21M Series A, $40M Series B (2025, Notable Capital, $300M valuation)
**Location:** San Francisco, CA
**Why Josh = great match:** Josh built agents that use browser tools — Browserbase provides the infra layer below. Their open-source investment (dedicated OS engineer) + fast-growing enterprise business makes it a great consulting landing ground.

---

### 4. 🖱️ Browser Use
**Website:** browser-use.com
**GitHub:** github.com/browser-use/browser-use (74K+ stars, 24x growth)
**What they build:** Open-source Python library that lets AI agents control web browsers — the leading open-source framework for web-browsing agents. Competes with Anthropic Operator.
**Team size:** ~5–10 (very small)
**Funding:** $17M seed (Mar 2025), led by Felicis (Astasia Myers). Paul Graham invested personally.
**Location:** San Francisco, CA (founders from ETH Zurich)
**Why Josh = great match:** Browser Use is essentially a library version of part of Eragon's tool-use surface. Josh building his own agent framework is direct proof-of-work. A small team = huge consulting leverage.

---

### 5. 🐉 Skyvern
**Website:** skyvern.com
**GitHub:** github.com/Skyvern-AI/skyvern
**What they build:** Open-source AI agent for browser-based workflow automation via API — uses computer vision + LLMs to navigate websites it has never seen before. No hardcoded selectors, fully adaptive.
**Team size:** 6 people (!)
**Funding:** ~$2.7M (YC S23)
**Location:** San Francisco, CA
**Why Josh = great match:** Six people building an open-source agentic browser automation engine — this is Josh's sweet spot. A 6-week consulting engagement here could move the needle on their developer ecosystem, go-to-market, or product strategy significantly. The open-source angle is identical to what he's built.

---

### 6. 🔌 Composio
**Website:** composio.dev
**GitHub:** github.com/ComposioHQ/composio
**What they build:** Developer-first integration platform for AI agents — 850+ pre-built connectors (GitHub, Salesforce, Slack, etc.), a unified framework for tool use, and a shared learning layer where solved tasks propagate across all agents. Think "tool registry for agents."
**Team size:** ~100 (growing fast post-Series A)
**Funding:** $29M total — $4M seed, $25M Series A (Jul 2025, Lightspeed)
**Location:** San Francisco + Bengaluru (founded by IIT Bombay alumni)
**Why Josh = great match:** Josh's Eragon uses tools extensively — Composio is building the canonical tool-use infrastructure layer. His perspective on what devs actually need when building agent integrations is exactly what a growing product team needs to hear.

---

### 7. 🔍 Helicone
**Website:** helicone.ai
**GitHub:** github.com/Helicone/helicone
**What they build:** Open-source LLM observability gateway — one line of code to monitor, log, cache, and evaluate all LLM calls. Built in Rust for <1ms overhead. YC W23.
**Team size:** 5 people (!)
**Funding:** YC W23 (undisclosed seed)
**Location:** San Francisco, CA
**Why Josh = great match:** Five people, open source, core developer infrastructure for anyone building LLM apps. Josh's Eragon is exactly the kind of system that would want Helicone-style observability built in. He could consult on product direction, integrations, or developer adoption.

---

### 8. ✅ Confident AI
**Website:** confident-ai.com
**GitHub:** github.com/confident-ai/deepeval (12.6K stars, 3M+ monthly downloads)
**What they build:** Open-source LLM evaluation platform (DeepEval) + enterprise SaaS. Lets teams benchmark, test, and monitor AI quality in CI/CD pipelines. Used by Microsoft, AstraZeneca, BCG.
**Team size:** 7 people (!)
**Funding:** $2.2M seed (YC W25), raised in 5 days
**Location:** San Francisco, CA
**Why Josh = great match:** The testing + eval layer is exactly what any serious agent builder like Josh cares about. Seven people, fresh YC money, open-source foundation — this is the kind of place where a 6-week engagement shapes product roadmap directly.

---

### 9. 🎨 Sim (formerly Sim Studio)
**Website:** sim.ai
**GitHub:** github.com/simstudioai/sim (27K+ stars)
**What they build:** Open-source visual canvas for building, deploying, and orchestrating AI agent workflows — Figma-like drag-and-drop interface to connect LLMs and tools. $7M Series A, 100K+ builders.
**Team size:** ~5–10 (two UC Berkeley alumni founders)
**Funding:** $7M Series A (YC-backed)
**Location:** San Francisco, CA
**Why Josh = great match:** Josh's Eragon is a runtime; Sim is adding a visual layer on top of that pattern. His builder intuition + open-source credibility is a direct asset if they're expanding how developers orchestrate agents.

---

### 10. 🤖 All Hands AI (OpenHands)
**Website:** all-hands.dev / openhands.dev
**GitHub:** github.com/All-Hands-AI/OpenHands (top SWE-bench performer)
**What they build:** The leading open-source AI coding agent platform. Agents can write code, run terminal commands, browse the web, and call APIs. MIT-licensed core. Ranked #1 on SWE-bench Verified at various points in 2025.
**Team size:** ~20–30
**Funding:** Not fully disclosed (reportedly raised a significant round in 2024/2025)
**Location:** San Francisco, CA (spun out of UIUC research)
**Why Josh = great match:** OpenHands is building what Josh built — an autonomous agent that can interact with real systems. His Eragon project is the best possible signal that he deeply understands the problem space. Contributing to or consulting for the leading open-source coding agent is a natural fit.

---

### 11. ⚡ Morph
**Website:** morph.ai (YC-backed)
**GitHub:** YC portfolio company
**What they build:** Subagents and specialized tools that improve the performance of coding agents — custom AI models optimized to be used as components by larger orchestration systems. "Infrastructure for the agent stack."
**Team size:** ~5 (very small YC company)
**Funding:** ~$19M seed (Mar 2024)
**Location:** San Francisco, CA
**Why Josh = great match:** Josh's Eragon orchestrates subagents — Morph is literally building the models and tools that make subagents better. The conceptual overlap is exact, and small team = high leverage.

---

### 12. 🔬 AgentOps
**Website:** agentops.ai
**GitHub:** github.com/AgentOps-AI/agentops
**What they build:** Agent observability and governance platform — traces entire agent lifecycles (tool calls, planning loops, self-correction), supports 400+ LLMs, claims 25x reduction in fine-tuning costs. Graph-based agent debugging.
**Team size:** ~10–15
**Funding:** $2.6M (Aug 2024)
**Location:** San Francisco, CA (founders: Adam Silverman, Alex Reibman)
**Why Josh = great match:** When you build an agent runtime like Eragon, observability is an open problem. AgentOps is solving exactly the "how do I debug what my agent did" problem. Josh's real-world context makes him a sharp product advisor.

---

### 13. 🏗️ Magnitude
**Website:** magnitude.run
**GitHub:** github.com/magnitudedev/magnitude
**What they build:** Open-source, subagent-native coding agent — lead agent coordinates specialized subagents (explorers, planners, builders, reviewers, debuggers, browser agents) to complete longer, more reliable coding tasks. YC S25.
**Team size:** 2 people (!!)
**Funding:** YC S25 (early stage)
**Location:** San Francisco, CA
**Why Josh = great match:** Two-person team building a subagent-native coding agent at YC — this is almost exactly what Eragon does architecturally. Josh's experience building and running a real agentic system is extremely rare signal at this stage.

---

### 14. 🌊 Dify
**Website:** dify.ai
**GitHub:** github.com/langgenius/dify (131K+ stars — top 5 AI repos globally)
**What they build:** Open-source agentic workflow builder — visual canvas + API for composing LLM apps, RAG pipelines, and agent workflows. 1.4M+ self-hosted instances worldwide, 2,000+ enterprise teams. Pre-A funded at $180M valuation.
**Team size:** ~50–100
**Funding:** $30M Series Pre-A (Mar 2026), led by HSG/GL Ventures/Bessemer spinout
**Location:** San Francisco, CA (548 Market Street)
**Why Josh = great match:** 131K GitHub stars, SF HQ, open-source agent builder — Josh is the exact power user and builder they want consulting on developer experience, community strategy, or enterprise positioning.

---

### 15. 🖥️ BrowserOS
**Website:** YC company (browseros.io)
**GitHub:** YC portfolio
**What they build:** Open-source, privacy-first agentic browser — runs AI agents locally using your existing logged-in sessions. BYOK (bring your own API keys) or run models with Ollama. No data leaves your machine.
**Team size:** 4 people (!!)
**Funding:** YC-backed (early stage, 2024)
**Location:** San Francisco, CA
**Why Josh = great match:** Four people building a privacy-first local agent browser. Josh's Eragon is a personal agentic system — the philosophical and technical overlap is direct. Small team = massive impact from a 6-week consulting engagement.

---

### 16. 🎯 Braintrust
**Website:** braintrust.dev
**What they build:** AI evaluation and observability platform — lets teams systematically evaluate LLM outputs, track regressions, and run CI-style testing on AI behavior. Loop AI agent for automated optimization. Used by Notion, Stripe, Zapier, Vercel.
**Team size:** ~30–50
**Funding:** Series A (undisclosed, 2024)
**Location:** San Francisco, CA
**Why Josh = great match:** Any agent builder needs to evaluate their agents — Braintrust is building the gold-standard eval layer. Josh could bring real-world insight from running agentic systems in production.

---

### 17. 🔴 Arize AI (Phoenix)
**Website:** arize.com | phoenix.arize.com
**GitHub:** github.com/Arize-ai/phoenix (open-source)
**What they build:** AI observability and evaluation platform — open-source Phoenix for tracing/debugging agent workflows, enterprise Arize AX for production. Built on OpenTelemetry, framework-agnostic. Used by Microsoft, Handshake, TripAdvisor.
**Team size:** ~100–150
**Funding:** $70M Series C (Feb 2025)
**Location:** San Francisco, CA
**Why Josh = great match:** Arize Phoenix is the most widely adopted open-source agent observability tool. A consulting engagement here could focus on agentic-specific observability patterns — an area where Josh's hands-on Eragon experience provides direct insight.

---

### 18. 📝 Wordware
**Website:** wordware.ai
**GitHub:** YC portfolio
**What they build:** AI development platform that treats English as a programming language — build complex AI apps, agents, and pipelines using natural language instructions backed by a visual IDE. YC-backed, $30M seed (Spark Capital, Felicis, YC).
**Team size:** ~10–20
**Funding:** $30M seed
**Location:** San Francisco, CA
**Why Josh = great match:** Josh has deep intuition on where natural-language agent programming works vs. where you need real code — that's exactly the tension Wordware is navigating. His perspective as someone who built a real agentic system is precisely what their product team needs.

---

## Quick Comparison Table

| Company | Stage | Team | Funding | Josh Fit |
|---------|-------|------|---------|----------|
| Letta | Seed | ~15 | $10M | ⭐⭐⭐⭐⭐ |
| E2B | Series A | ~25 | $32M | ⭐⭐⭐⭐⭐ |
| Skyvern | YC Seed | 6 | $2.7M | ⭐⭐⭐⭐⭐ |
| Magnitude | YC S25 | 2 | Pre-seed | ⭐⭐⭐⭐⭐ |
| BrowserOS | YC Seed | 4 | Pre-seed | ⭐⭐⭐⭐⭐ |
| Helicone | YC W23 | 5 | ~$1M | ⭐⭐⭐⭐⭐ |
| Confident AI | YC W25 | 7 | $2.2M | ⭐⭐⭐⭐ |
| All Hands AI | Series A | ~25 | undisclosed | ⭐⭐⭐⭐ |
| Morph | Seed | ~5 | $19M | ⭐⭐⭐⭐ |
| Sim | Series A | ~8 | $7M | ⭐⭐⭐⭐ |
| AgentOps | Seed | ~12 | $2.6M | ⭐⭐⭐⭐ |
| Browserbase | Series B | ~35 | $68M | ⭐⭐⭐ |
| Browser Use | Seed | ~8 | $17M | ⭐⭐⭐ |
| Composio | Series A | ~100 | $29M | ⭐⭐⭐ |
| Dify | Pre-A | ~75 | $30M | ⭐⭐⭐ |
| Wordware | Seed | ~15 | $30M | ⭐⭐⭐ |
| Braintrust | Series A | ~40 | undisclosed | ⭐⭐⭐ |
| Arize AI | Series C | ~120 | $70M | ⭐⭐ |

---

## Josh's Top 5 (If I Had to Pick)

**1. Letta** — Berkeley spinout doing memory for agents, $10M seed, perfect conceptual overlap with Eragon's agent loop. Small-ish team that would value a builder who's run a real agent runtime.

**2. Skyvern** — 6-person YC company building open-source browser-automation agent. A 6-week consulting engagement here could materially shape their product/community direction. The scrappy open-source energy matches OpenClaw.

**3. E2B** — Open-source agent execution infrastructure, $32M Series A, small SF team hiring in-person only. Josh's understanding of what agents *need* to run reliably makes him their ideal consulting hire.

**4. Magnitude** — Two-person YC S25 team building a subagent-native coding agent. Conceptually identical to Eragon's architecture. High risk, extremely high impact.

**5. All Hands AI (OpenHands)** — The leading open-source AI coding agent. Josh's Eragon work is the best possible proof-of-work. A consulting engagement here could be career-defining.

---

## Outreach Framing for Josh

When reaching out, lead with:
> *"I built Eragon — an open-source agentic AI runtime (part of the OpenClaw project) — while doing my MBA at Cambridge. I've run it in production with [X users/tools], implemented subagent orchestration, and dealt with [specific challenge like memory/tool-calling/observability]. I'm doing a 6-week summer project and want to work with a company building in this exact space."*

This immediately separates you from every MBA intern who read a blog post about AI agents. You're a practitioner.

---

*Research depth: GitHub orgs, YC portfolio 2023–2025, Crunchbase, TechCrunch funding announcements, Latent Space / Cerebral Valley community posts, AI Engineer World's Fair exhibitor lists.*
