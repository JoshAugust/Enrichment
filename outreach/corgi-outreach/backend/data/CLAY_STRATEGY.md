# Clay Strategy for Corgi Outreach

_Last updated: March 2026_

---

## What Is Clay?

Clay (clay.com) is a B2B data enrichment and GTM (go-to-market) automation platform. It sits above individual data providers — rather than subscribing to each source separately, Clay gives you access to **150+ data providers** (Apollo, Hunter, Clearbit, LinkedIn, PDL, ZoomInfo, etc.) through a single unified UI and credit system.

Think of it as a spreadsheet that can automatically enrich itself using any combination of data sources.

**Core workflow:**
1. Import a list of companies or contacts (CSV, CRM, webhook, API)
2. Add "enrichment columns" — each one queries a different data source
3. Clay returns enriched data row by row
4. Export to your CRM, outreach tool, or webhook

---

## Does Clay Have a Public API?

**Short answer: No — not a traditional REST API as of early 2026.**

Clay is primarily a UI-driven tool. However, it offers several programmatic integration points:

### Webhooks (Explorer plan and above)
- Every Clay table has a unique inbound webhook URL
- You can POST JSON records to it and Clay will process/enrich them
- Great for: CRM-triggered enrichment, form submissions, pipeline events
- Pricing: Explorer plan ($349/mo or $314/mo annually)

### HTTP API Integration (Explorer plan and above)
- Clay's "Sculptor" AI feature auto-generates HTTP API configurations from natural language
- You can call external APIs from within Clay enrichment workflows
- This is Clay calling _out_, not you calling _in_

### Enterprise API (Enterprise plan only)
- Limited proprietary API for accessing Clay's own People + Company data
- Can query by email/LinkedIn URL → person profile, or domain → company info
- Not the full enrichment pipeline — just Clay's native data layer
- Requires Enterprise contract (pricing not public)

### Make/Zapier integrations
- Clay has a connector on Make (formerly Integromat)
- Enables trigger-based automation without the full Enterprise API

---

## Clay's Waterfall Enrichment Model

This is Clay's most powerful concept and its key differentiator from single-source tools.

### The Problem with Single-Source Enrichment
No single data provider has 100% coverage. Apollo might have 70% of contacts; Hunter might have a different 60%; PDL another 55%. If you only use one source, you miss data that other sources have.

### How Waterfall Enrichment Works
Clay queries multiple sources **sequentially**, stopping as soon as a source returns a result:

```
Company: acme.com
→ Try Apollo for email     → Found: john@acme.com ✅ STOP
   
Company: obscure-corp.io
→ Try Apollo for email     → Not found ❌
→ Try Hunter.io            → Not found ❌  
→ Try Clearbit             → Found: ceo@obscure-corp.io ✅ STOP

Company: dark-pool-startup.com  
→ Try Apollo               → Not found ❌
→ Try Hunter.io            → Not found ❌
→ Try Clearbit             → Not found ❌
→ Try PDL                  → Found via LinkedIn ✅ STOP
```

Each step costs credits only if it _succeeds_ (some plans work this way). The waterfall ensures:
- **Maximum coverage** — you don't give up after one failure
- **Cost efficiency** — you don't burn credits on sources that won't help
- **Source diversity** — first source to return data wins

### Corgi's Equivalent: Our Enrichment Pipeline
Corgi's `enrichment-pipeline.js` already implements a similar concept by running all sources in parallel and merging results. The key difference is:

| Clay Waterfall | Corgi Pipeline |
|---|---|
| Sequential (stops at first hit) | Parallel (runs all sources) |
| Optimizes for cost (fewer credit burns) | Optimizes for speed and completeness |
| Managed UI, easy to add sources | Code-level control, fully custom |
| 150+ sources pre-integrated | Build your own source integrations |

We could implement a true waterfall for credit-burning calls (like Apollo enrichment) while keeping parallel execution for free sources.

---

## Clay vs Apollo: Comparison for B2B Prospecting

| Feature | Clay | Apollo.io |
|---|---|---|
| **Primary use** | Multi-source enrichment orchestration | All-in-one prospecting + outreach |
| **Data sources** | 150+ (includes Apollo, Hunter, etc.) | Apollo's own database (280M+ contacts) |
| **Email sequences** | ❌ (integrates with others) | ✅ Built-in |
| **CRM sync** | ✅ (Pro plan+) | ✅ |
| **Free tier** | 100 credits/mo | 100 credits/mo (or 10k w/ corporate email) |
| **API access** | Webhooks only (no public REST API) | Full REST API (v1) |
| **Waterfall enrichment** | ✅ Native feature | ❌ Single source |
| **Pricing entry point** | $149/mo (Starter) | $49/user/mo (Basic) |
| **Best for** | Enrichment at scale with max coverage | End-to-end outbound sales motion |
| **Code integration** | Hard (no API) | Easy (well-documented REST API) |

**For Corgi specifically:**
- **Apollo** is the right call for programmatic integration — it has a real API, a generous free tier, and good decision-maker data for our GPU infrastructure targets
- **Clay** is better as a manual workflow tool — ideal for one-off list enrichment campaigns, not as a code-level enrichment source

---

## Should Corgi Integrate Clay Directly?

### Current Recommendation: Not Yet

Clay doesn't offer a public API, so we can't integrate it into `enrichment-pipeline.js` the way we can Apollo, Hunter, or SEC EDGAR.

**What we should do instead:**
1. Use **Apollo** (already built) for programmatic enrichment
2. Use **Clay as a manual supplement** — export company lists as CSV, run them through Clay's Explorer plan for waterfall enrichment of edge cases, import results back
3. **Revisit Clay Enterprise API** if we scale to where coverage gaps become a problem

### When Clay Makes Sense for Corgi

Consider Clay if/when:
- We have >500 companies and are getting <40% email coverage from Apollo + Hunter combined
- We want to run enrichment campaigns without engineering effort (marketing/sales team use)
- Clay releases a proper REST API (they're likely to do this given market pressure)

### Clay Webhook Integration (Future)

If we want to push records _into_ Clay for enrichment and receive results back:

```
[Corgi DB] → POST JSON to Clay table webhook → [Clay enriches with 150+ sources]
           ← Webhook callback with enriched data ←
```

This requires:
1. Clay Explorer plan ($349/mo)
2. A Clay table configured with enrichment columns
3. A webhook receiver in our backend
4. Manual setup of the Clay table (no code)

Estimated implementation: ~4 hours of Clay table setup + 2 hours of backend webhook receiver code.

---

## Waterfall Enrichment: Implementation in Corgi

To implement a true waterfall for email discovery specifically, we could modify `enrichment-pipeline.js` to run email sources sequentially rather than in parallel:

```javascript
// Waterfall for email-bearing sources (credit-efficient)
const EMAIL_SOURCES_WATERFALL = ['apollo', 'hunter', 'email-discovery'];

async function waterfallEmail(companyId, existingData) {
  for (const sourceName of EMAIL_SOURCES_WATERFALL) {
    const source = sources[sourceName];
    const result = await source.enrich('company', companyId, existingData);
    const contacts = result.contacts || [];
    const emailedContacts = contacts.filter(c => c.email);
    
    if (emailedContacts.length > 0) {
      console.log(`[waterfall] Found emails via ${sourceName} — stopping waterfall`);
      return { source: sourceName, contacts };
    }
  }
  return { source: null, contacts: [] };
}
```

This is a future optimization — current parallel approach is fine for our scale.

---

## Summary

| Tool | Status | Use Case |
|---|---|---|
| **Apollo.io** | ✅ Integrated | Programmatic enrichment + contact discovery |
| **Clay.com** | 📋 Manual | One-off enrichment campaigns, no API available |
| **Waterfall model** | 🔮 Future | Implement when email coverage < 40% |

Clay is powerful but not code-friendly. Apollo is our primary enrichment API layer.
