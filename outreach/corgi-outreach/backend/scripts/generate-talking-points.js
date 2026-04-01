/**
 * generate-talking-points.js
 *
 * Generates company-specific talking points for manual calls.
 * Each company gets 4-6 sentences a caller could actually say,
 * tailored to the company's type, context, and Corgi's pitch.
 *
 * Usage: node scripts/generate-talking-points.js [--limit N] [--priority A]
 */

'use strict';

require('dotenv').config();
const { db } = require('../src/db');
const { selectVersion, BASE_SCRIPTS } = require('../src/crm/script-generator');

// ── Corgi context ─────────────────────────────────────────────────────────────

const CORGI_CONTEXT = {
  what: 'Corgi provides residual value coverage for data-center GPUs, reducing lender risk on hardware collateral value at loan maturity.',
  how: 'By giving lenders a floor on future GPU value, Corgi helps operators get better debt terms — cheaper rates, higher leverage, or longer tenor.',
  who: 'Josh Augustine and Isaac (co-founders). Josh makes the outreach calls.',
  ask: 'A 20-minute introductory call with the founders to explore fit.',
};

// ── Talking point templates by company type ───────────────────────────────────

function generateForOperator(company) {
  const points = [];
  const name = company.name;

  // Opening context line
  if (company.estimated_gpu_scale) {
    points.push(`I saw ${name} is running ${company.estimated_gpu_scale} — at that scale, the financing structure on hardware really starts to matter.`);
  } else if (company.description && company.description.length > 20) {
    const desc = extractCoreActivity(company.description);
    points.push(`I've been looking into ${name} — ${desc}. We work with companies in this space on the financing side.`);
  } else {
    points.push(`We've been researching GPU infrastructure operators and ${name} came up — are you currently financing or planning to finance GPU hardware?`);
  }

  // Financing-aware lines
  if (company.financing_status && company.financing_status !== 'unknown') {
    if (company.financing_status.toLowerCase().includes('active') || company.total_raised) {
      const raised = company.total_raised ? ` — I saw the ${company.total_raised} raise` : '';
      points.push(`Given your active financing${raised}, one thing lenders typically get stuck on is what the GPUs will be worth at maturity. That's exactly what we solve.`);
    } else {
      points.push(`If you're looking at debt financing for your next deployment, lenders will ask about residual value on the hardware. We can make that conversation much easier.`);
    }
  } else {
    points.push(`When operators go to finance GPU clusters, lenders always ask: what's the hardware worth in 3-4 years? We give them an answer they can underwrite against.`);
  }

  // Value prop line
  points.push(`The practical effect is you can get better terms — whether that's lower cost of capital, higher advance rates, or longer tenor on the debt.`);

  // Investor/credibility line
  if (company.investors && company.investors.length > 5) {
    const investorSnippet = company.investors.slice(0, 80);
    points.push(`I noticed you've worked with ${investorSnippet} — we're already in conversations with similar firms on how this fits into GPU-backed lending.`);
  }

  // Recent news hook
  if (company.recent_news && company.recent_news.length > 5) {
    try {
      const news = JSON.parse(company.recent_news);
      if (Array.isArray(news) && news.length > 0) {
        const headline = (news[0].title || news[0]).slice(0, 100);
        points.push(`I also saw the recent news about ${headline} — that's actually what prompted me to reach out, since residual value coverage becomes more relevant as you scale.`);
      }
    } catch (_) {}
  }

  // Specific pain point by industry
  if (company.industry_segment) {
    const seg = company.industry_segment.toLowerCase();
    if (seg.includes('cloud') || seg.includes('hyperscal')) {
      points.push(`Cloud providers especially benefit because the utilization model means GPUs cycle through faster — having residual value coverage from day one protects the financing.`);
    } else if (seg.includes('ai') || seg.includes('ml') || seg.includes('training')) {
      points.push(`For AI training workloads specifically, the hardware refresh cycle is getting shorter with each generation — that creates uncertainty lenders don't love. We address that directly.`);
    } else if (seg.includes('colocation') || seg.includes('colo')) {
      points.push(`For colo operators, the question of what happens to GPUs when a tenant leaves is a real underwriting concern. Our coverage gives lenders comfort there.`);
    }
  }

  // CTA
  points.push(`I'm not trying to sell anything on this call — I just want to see if it's worth 20 minutes with my co-founders Isaac and Josh to walk through how it works.`);

  // Objection handler
  points.push(`If it helps, we're not asking you to change your financing structure. We slot into whatever you already have or are building.`);

  return points;
}

function generateForLender(company) {
  const points = [];
  const name = company.name;

  if (company.description && company.description.length > 20) {
    const desc = extractCoreActivity(company.description);
    points.push(`I've been looking at ${name}'s work in ${desc}. We're building something that could expand the deals you can do in GPU-backed lending.`);
  } else {
    points.push(`We're reaching out to lenders who are active or interested in GPU-backed credit — is that something ${name} is looking at?`);
  }

  if (company.industry_segment) {
    const seg = company.industry_segment.toLowerCase();
    if (seg.includes('equipment') || seg.includes('asset')) {
      points.push(`For equipment finance lenders specifically, GPUs are an interesting asset class but the residual value question makes underwriting tough. That's the exact problem we solve.`);
    } else if (seg.includes('infrastructure') || seg.includes('project')) {
      points.push(`Infrastructure lenders are starting to look at GPU clusters the way they look at other capex — but the residual value uncertainty makes it harder to size. We fix that.`);
    } else {
      points.push(`The GPU lending space is growing fast, but most lenders get stuck on one question: what's the hardware worth at maturity? We provide a definitive answer.`);
    }
  } else {
    points.push(`The GPU lending space is growing fast, but most lenders get stuck on one question: what's the hardware worth at maturity? We provide a definitive answer.`);
  }

  points.push(`We provide residual value coverage that gives you a floor on the collateral. That means you can underwrite more aggressively — better advance rates, longer tenor, more deal flow.`);

  if (company.total_raised || company.estimated_gpu_scale) {
    points.push(`Given your scale, even a small improvement in how you underwrite GPU collateral could open up a meaningful pipeline of new deals.`);
  }

  points.push(`We're not adding complexity to the deal — this is designed to make your existing credit process work better for hardware-backed lending.`);

  points.push(`Would it be worth a 20-minute call with our founders to walk through a couple of real deal structures where this has made a difference?`);

  return points;
}

function generateForArranger(company) {
  const points = [];
  const name = company.name;

  if (company.description && company.description.length > 20) {
    const desc = extractCoreActivity(company.description);
    points.push(`I've been looking at ${name}'s work — ${desc}. We think there's an interesting intersection with GPU infrastructure financing.`);
  } else {
    points.push(`We're reaching out to firms that work on structured deals or specialty risk — ${name} came up in our research.`);
  }

  const seg = (company.industry_segment || '').toLowerCase();
  if (seg.includes('insurance') || seg.includes('reinsur')) {
    points.push(`On the insurance/reinsurance side, residual value coverage for GPUs is a new product category that's emerging as the GPU financing market scales into the hundreds of billions.`);
    points.push(`We're building the data infrastructure and actuarial framework to price GPU residual value risk accurately — which is what the market currently lacks.`);
  } else if (seg.includes('invest') || seg.includes('bank') || seg.includes('advisory')) {
    points.push(`If you're advising on or structuring GPU-backed deals, the residual value piece is increasingly what determines whether a deal gets done. We solve that.`);
    points.push(`We've seen deals get stuck or re-priced because lenders can't get comfortable with end-of-term hardware value. Our product removes that friction.`);
  } else {
    points.push(`The GPU financing market is scaling rapidly, and the biggest structural gap is residual value risk — nobody's been able to price it well until now.`);
    points.push(`We're building the solution that sits between operators and lenders to make GPU-backed deals work at scale.`);
  }

  points.push(`We think there could be an interesting partnership or distribution angle worth exploring — would a 20-minute call make sense?`);

  return points;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractCoreActivity(description) {
  if (!description) return 'your operations';
  // Take first sentence, clean it up
  const first = description.split(/[.!]\s/)[0].trim();
  if (first.length > 120) return first.slice(0, 117) + '...';
  return first.toLowerCase();
}

function generateTalkingPoints(company) {
  const type = (company.type || 'operator').toLowerCase();

  let points;
  if (type === 'lender') {
    points = generateForLender(company);
  } else if (type === 'arranger') {
    points = generateForArranger(company);
  } else {
    points = generateForOperator(company);
  }

  // Add universal follow-up questions
  const followups = [];
  if (type === 'operator') {
    followups.push(`Do you already have a lender asking about collateral value at maturity for your upcoming deployments?`);
    followups.push(`Are you financing owned GPUs, leased, or both?`);
  } else if (type === 'lender') {
    followups.push(`What's the typical tenor you're comfortable with on hardware-backed facilities?`);
    followups.push(`Is the bigger constraint on your side advance rate, or residual value assumptions?`);
  } else {
    followups.push(`Is this a space you're actively exploring, or more something on the horizon?`);
  }

  return { points, followups };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const prioIdx = args.indexOf('--priority');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null;
  const priority = prioIdx >= 0 ? args[prioIdx + 1].toUpperCase() : null;

  let query = 'SELECT * FROM companies WHERE 1=1';
  const params = [];
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  query += ' ORDER BY priority ASC, qualification_score DESC';
  if (limit) { query += ` LIMIT ${limit}`; }

  const companies = db.prepare(query).all(...params);
  console.log(`\n🐕 Generating talking points for ${companies.length} companies...\n`);

  const stmt = db.prepare('UPDATE companies SET talking_points = ?, updated_at = datetime(?) WHERE id = ?');
  let updated = 0;

  for (const company of companies) {
    try {
      const { points, followups } = generateTalkingPoints(company);

      const talkingPoints = JSON.stringify({ points, followups, generated_at: new Date().toISOString() });
      stmt.run(talkingPoints, new Date().toISOString(), company.id);
      updated++;

      if (updated % 50 === 0) {
        console.log(`  [${updated}/${companies.length}] ...`);
      }
    } catch (err) {
      console.error(`  ❌ ${company.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ Generated talking points for ${updated}/${companies.length} companies\n`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
