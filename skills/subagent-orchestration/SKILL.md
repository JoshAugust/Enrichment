---
name: subagent-orchestration
description: MANDATORY for all multi-step builds, pipelines, and complex tasks. Prevents subagent timeout/death by breaking work into small chunks with frequent handoffs. Use when spawning subagents, planning builds, running enrichment pipelines, or orchestrating any work that takes more than 10 minutes. Triggers on: build, implement, run pipeline, spawn agents, orchestrate, multi-step, create feature, long task, subagent, swarm.
---

# Subagent Orchestration Protocol

## Before Starting ANY Build

### 1. Make a Tech Plan
- Write a concrete plan with numbered steps BEFORE touching code
- Share with the Tribal Chief for approval
- Flag any paid API/credit usage and get sign-off before launch
- Ask clarifying questions if ANYTHING is unclear — don't guess

### 2. Check Existing Skills
- Scan the Eragon skills library for relevant skills that could assist, inform, or improve the build
- Read any matching skills before planning

### 3. Break Into Small Tasks
The primary agent (you) is the **orchestrator**. You do NOT do the heavy lifting. You:
- Decompose the plan into discrete subtasks (2-3 per subagent)
- Each subtask must be completable in **15-20 minutes max**
- Never give a subagent more than 3 related tasks at once

## Spawning Subagents

### Task Sizing
- **Opus** for: coding, architecture, complex analysis, debugging, review
- **Sonnet** for: data processing, formatting, simple scripts, docs, memory updates

### Rules
- Each subagent gets 2-3 tasks max
- Set `runTimeoutSeconds` to 1200 (20 min) — if it needs longer, the task is too big
- Tell subagents to **commit frequently** (every meaningful change)
- Tell subagents to **checkpoint progress** for resumable work
- Subagents that touch the SAME files must run **sequentially**
- Subagents that touch DIFFERENT files can run **in parallel**

### Subagent Task Template
Always include in the task description:
```
## Task: [clear name]
[2-3 specific deliverables]

## Rules
- Commit after each meaningful change
- Checkpoint progress to [path] every [N] items
- If you hit an error you can't resolve in 5 minutes, stop and report it
- Do NOT modify files outside your assigned scope: [list files]

## Context
[relevant decisions, prior work, file locations]
```

## During the Build

### 4. Review Each Subagent's Work
When a subagent completes:
- Read the output/result
- Verify the work is correct (quick spot-check, not full audit)
- Log what was done in the decision log
- Only THEN spawn the next subagent

### 5. Sequential Handoffs
- Subagent A finishes → orchestrator reviews → subagent B picks up where A left off
- Pass explicit context: "Subagent A completed X, files changed: Y, you need to do Z next"
- Never assume a subagent knows what the previous one did

### 6. Parallel Where Safe
- Identify tasks that don't touch the same files
- Spawn those in parallel (up to 3-5 concurrent)
- Still review each when they complete

## Monitoring & Communication

### 7. Watchdog Cron
- Set a cron job to check progress every 5-10 minutes for long-running work
- If a subagent dies or times out, the orchestrator catches it and respawns

### 8. Decision Log
Maintain a running log (in memory or a file) of:
- Decisions made and why
- Bugs encountered and how they were fixed
- What each subagent accomplished
- What's left to do

### 9. Progress Updates
- Update the Tribal Chief every ~3 minutes on long tasks
- Never go dark for more than 3 minutes

### 10. Delivery
- Send any files the user needs via Telegram directly (use `message` tool with `filePath`)
- Never just give file paths — send the actual file
- Flag completion of each major milestone

## Credit/API Safety

### 11. Paid API Gate
Before ANY paid API call:
- Calculate estimated credit/cost
- Report to Tribal Chief with the estimate
- Wait for approval before proceeding
- Track credits spent and report running totals

## Anti-Patterns (DO NOT)

- ❌ Spawn a subagent with >30 min of work
- ❌ Give a subagent vague instructions ("build the feature")
- ❌ Let subagents run without a watchdog
- ❌ Assume a subagent succeeded without checking
- ❌ Spawn multiple subagents that edit the same file
- ❌ Go dark while subagents are running
- ❌ Spend paid API credits without flagging first
- ❌ Poll subagents in a loop — wait for completion events
