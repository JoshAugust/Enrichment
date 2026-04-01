#!/usr/bin/env node
/**
 * write-agent-qa.js — Write agent QA verification scores to DB
 * 
 * Usage:
 *   echo '[{"company_id":"uuid","agent_qa_score":75,"issues":["stale LinkedIn","CEO left"],"recommendation":"enrich before outreach"}]' | node write-agent-qa.js
 *   node write-agent-qa.js results.json
 * 
 * Score guide:
 *   90-100: Fully verified, accurate data, decision-maker contacts confirmed
 *   70-89:  Mostly accurate, minor gaps or slight staleness
 *   50-69:  Some issues — data may be stale, contacts uncertain
 *   30-49:  Significant issues — key info unverified, contacts likely wrong
 *   0-29:   Major problems — company may not exist or be completely wrong fit
 */

'use strict';

const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const updateQA = db.prepare(`
  UPDATE companies SET
    agent_qa_score = @score,
    agent_qa_notes = @notes,
    agent_qa_flags = @flags,
    agent_qa_checked_at = datetime('now'),
    updated_at = datetime('now')
  WHERE id = @id
`);

const insertLog = db.prepare(`
  INSERT INTO agent_qa_log (id, company_id, agent_qa_score, checks_run, issues_found, recommendation)
  VALUES (@id, @company_id, @score, @checks_run, @issues_found, @recommendation)
`);

function processResults(results) {
  let updated = 0, errors = 0;
  
  const run = db.transaction(() => {
    for (const r of results) {
      if (!r.company_id) { console.error('SKIP: missing company_id'); errors++; continue; }
      
      const score = Math.max(0, Math.min(100, parseInt(r.agent_qa_score) || 0));
      const issues = Array.isArray(r.issues) ? r.issues : [];
      const notes = [
        r.recommendation ? `Recommendation: ${r.recommendation}` : null,
        issues.length > 0 ? `Issues: ${issues.join('; ')}` : null,
      ].filter(Boolean).join('\n');
      
      updateQA.run({
        id: r.company_id,
        score,
        notes: notes || null,
        flags: issues.length > 0 ? JSON.stringify(issues) : null,
      });
      
      insertLog.run({
        id: randomUUID(),
        company_id: r.company_id,
        score,
        checks_run: r.checks_run || null,
        issues_found: issues.length > 0 ? issues.join('; ') : null,
        recommendation: r.recommendation || null,
      });
      
      const status = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴';
      console.log(`${status} [${score}] ${r.company_name || r.company_id} — ${r.recommendation || 'scored'}`);
      updated++;
    }
  });
  
  run();
  
  // Log to overnight_progress
  if (updated > 0) {
    db.prepare(`INSERT INTO overnight_progress (run_type, companies_qa_checked, notes) VALUES ('qa', ?, ?)`)
      .run(updated, `QA scored ${updated} companies`);
  }
  
  console.log(`\nSummary: ${updated} updated, ${errors} errors`);
  return { updated, errors };
}

let input = '';

if (process.argv[2] && fs.existsSync(process.argv[2])) {
  input = fs.readFileSync(process.argv[2], 'utf8');
} else if (!process.stdin.isTTY) {
  const chunks = [];
  process.stdin.on('data', d => chunks.push(d));
  process.stdin.on('end', () => {
    input = chunks.join('');
    run(input);
  });
  process.stdin.resume();
  return;
}

function run(raw) {
  let results;
  try {
    results = JSON.parse(raw);
    if (!Array.isArray(results)) results = [results];
  } catch (e) {
    console.error('ERROR: Invalid JSON:', e.message);
    process.exit(1);
  }
  const out = processResults(results);
  process.exit(out.errors > 0 && out.updated === 0 ? 1 : 0);
}

if (input) run(input);
