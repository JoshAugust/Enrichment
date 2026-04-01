#!/usr/bin/env node
/**
 * night-progress.js — Overnight run progress report
 * Prints a summary of what the overnight agents have accomplished.
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const db = new Database(DB_PATH, { readonly: true });

const total = db.prepare('SELECT COUNT(*) as c FROM companies').get().c;
const contacts = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c;
const byPriority = db.prepare("SELECT priority, COUNT(*) as c FROM companies GROUP BY priority ORDER BY priority").all();
const enriched = db.prepare("SELECT COUNT(*) as c FROM companies WHERE last_enriched_at IS NOT NULL").get().c;
const qaScored = db.prepare("SELECT COUNT(*) as c FROM companies WHERE agent_qa_score IS NOT NULL").get().c;
const qaAvg = db.prepare("SELECT AVG(agent_qa_score) as avg FROM companies WHERE agent_qa_score IS NOT NULL").get().avg;
const verifiedGreen = db.prepare("SELECT COUNT(*) as c FROM companies WHERE verification_status='verified'").get().c;
const verifiedYellow = db.prepare("SELECT COUNT(*) as c FROM companies WHERE verification_status='pending'").get().c;
const verifiedRed = db.prepare("SELECT COUNT(*) as c FROM companies WHERE verification_status='flagged'").get().c;

// Progress log (last 24h)
const progress = db.prepare("SELECT run_type, SUM(companies_added) as added, SUM(companies_enriched) as enriched, SUM(companies_qa_checked) as qa FROM overnight_progress WHERE run_at > datetime('now', '-24 hours') GROUP BY run_type").all();

// Recent adds (last 24h)
const recentAdds = db.prepare("SELECT name, type, priority, created_at FROM companies WHERE datetime(created_at) > datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 20").all();

// QA score distribution
const qaDistrib = db.prepare(`
  SELECT 
    COUNT(CASE WHEN agent_qa_score >= 80 THEN 1 END) as high,
    COUNT(CASE WHEN agent_qa_score >= 50 AND agent_qa_score < 80 THEN 1 END) as mid,
    COUNT(CASE WHEN agent_qa_score < 50 THEN 1 END) as low,
    COUNT(CASE WHEN agent_qa_score IS NULL THEN 1 END) as unscored
  FROM companies
`).get();

console.log('\n═══════════════════════════════════════════════════════');
console.log('  CORGI OUTREACH — OVERNIGHT PROGRESS REPORT');
console.log(`  Generated: ${new Date().toISOString()}`);
console.log('═══════════════════════════════════════════════════════\n');

console.log(`DATABASE TOTALS`);
console.log(`  Companies: ${total} | Contacts: ${contacts}`);
console.log(`  Priority: ${byPriority.map(r=>`${r.priority||'?'}=${r.c}`).join(', ')}`);
console.log(`  Enriched: ${enriched}/${total} (${Math.round(enriched/total*100)}%)`);
console.log('');

console.log(`OVERNIGHT AGENT RUNS (last 24h)`);
for (const p of progress) {
  const parts = [];
  if (p.added) parts.push(`${p.added} added`);
  if (p.enriched) parts.push(`${p.enriched} enriched`);
  if (p.qa) parts.push(`${p.qa} QA'd`);
  console.log(`  ${p.run_type}: ${parts.join(', ') || 'no output recorded'}`);
}
if (progress.length === 0) console.log('  (no runs yet)');
console.log('');

console.log(`AGENT QA SCORES`);
console.log(`  Total scored: ${qaScored}/${total} | Average: ${qaAvg ? Math.round(qaAvg) : 'N/A'}`);
console.log(`  🟢 High (80+): ${qaDistrib.high} | 🟡 Mid (50-79): ${qaDistrib.mid} | 🔴 Low (<50): ${qaDistrib.low} | Unscored: ${qaDistrib.unscored}`);
console.log('');

console.log(`VERIFICATION STATUS`);
console.log(`  🟢 Verified: ${verifiedGreen} | 🟡 Pending: ${verifiedYellow} | 🔴 Flagged: ${verifiedRed}`);
console.log('');

if (recentAdds.length > 0) {
  console.log(`RECENTLY ADDED (last 24h) — ${recentAdds.length} companies:`);
  for (const c of recentAdds) {
    console.log(`  [${c.priority}] ${c.name} (${c.type})`);
  }
}

console.log('\n═══════════════════════════════════════════════════════\n');
