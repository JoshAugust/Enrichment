#!/usr/bin/env node
/**
 * insert-companies.js — Insert new companies from JSON
 * 
 * Usage:
 *   echo '[{"name":"Acme","type":"operator","website":"acme.com","description":"...","priority":"B","industry_segment":"GPU Cloud","estimated_gpu_scale":"$50M-$150M","headquarters":"San Francisco, CA","total_raised":"$120M","founded_year":2020}]' | node insert-companies.js
 * 
 *   Or pass a JSON file:
 *   node insert-companies.js companies.json
 * 
 * Each company object supports all companies columns. Required: name, type.
 * Valid types: operator, lender, arranger
 * Valid priorities: A, B, C
 */

'use strict';

const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const VALID_TYPES = ['operator', 'lender', 'arranger'];
const VALID_PRIORITIES = ['A', 'B', 'C'];

const insertCompany = db.prepare(`
  INSERT INTO companies (
    id, name, type, website, description, priority, industry_segment,
    estimated_gpu_scale, financing_status, headquarters, total_raised,
    last_funding_round, investors, founded_year, employee_count,
    linkedin_url, gpu_asset_value, created_at, updated_at
  ) VALUES (
    @id, @name, @type, @website, @description, @priority, @industry_segment,
    @estimated_gpu_scale, @financing_status, @headquarters, @total_raised,
    @last_funding_round, @investors, @founded_year, @employee_count,
    @linkedin_url, @gpu_asset_value, datetime('now'), datetime('now')
  )
`);

const checkExists = db.prepare('SELECT id FROM companies WHERE LOWER(name) = LOWER(?)');

function insertBatch(companies) {
  let added = 0, skipped = 0, errors = 0;
  const results = [];

  const run = db.transaction(() => {
    for (const c of companies) {
      if (!c.name || !c.type) {
        console.error(`SKIP: missing name or type — ${JSON.stringify(c).slice(0,80)}`);
        errors++;
        continue;
      }
      if (!VALID_TYPES.includes(c.type)) {
        console.error(`SKIP: invalid type '${c.type}' for ${c.name} — must be operator|lender|arranger`);
        errors++;
        continue;
      }
      const existing = checkExists.get(c.name);
      if (existing) {
        console.log(`SKIP (exists): ${c.name}`);
        skipped++;
        continue;
      }
      const row = {
        id: c.id || randomUUID(),
        name: c.name,
        type: c.type,
        website: c.website || null,
        description: c.description || null,
        priority: VALID_PRIORITIES.includes(c.priority) ? c.priority : 'B',
        industry_segment: c.industry_segment || null,
        estimated_gpu_scale: c.estimated_gpu_scale || null,
        financing_status: c.financing_status || null,
        headquarters: c.headquarters || null,
        total_raised: c.total_raised || null,
        last_funding_round: c.last_funding_round || null,
        investors: c.investors || null,
        founded_year: c.founded_year || null,
        employee_count: c.employee_count || null,
        linkedin_url: c.linkedin_url || null,
        gpu_asset_value: c.gpu_asset_value || null,
      };
      try {
        insertCompany.run(row);
        console.log(`ADDED: ${c.name} [${c.type}] [${row.priority}]`);
        added++;
        results.push({ id: row.id, name: c.name, type: c.type, priority: row.priority });
      } catch (e) {
        console.error(`ERROR inserting ${c.name}: ${e.message}`);
        errors++;
      }
    }
  });

  run();
  console.log(`\nSummary: ${added} added, ${skipped} skipped (already exist), ${errors} errors`);
  
  // Log to overnight_progress
  if (added > 0) {
    db.prepare(`INSERT INTO overnight_progress (run_type, companies_added, notes) VALUES ('discovery', ?, ?)`)
      .run(added, `Added: ${results.map(r=>r.name).join(', ')}`);
  }

  return { added, skipped, errors, results };
}

// ── Main ────────────────────────────────────────────────────────────────────

let input = '';

if (process.argv[2] && fs.existsSync(process.argv[2])) {
  // File argument
  input = fs.readFileSync(process.argv[2], 'utf8');
} else if (!process.stdin.isTTY) {
  // Stdin
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
  let companies;
  try {
    companies = JSON.parse(raw);
    if (!Array.isArray(companies)) companies = [companies];
  } catch (e) {
    console.error('ERROR: Invalid JSON input:', e.message);
    process.exit(1);
  }

  console.log(`Processing ${companies.length} companies...`);
  const result = insertBatch(companies);
  process.exit(result.errors > 0 && result.added === 0 ? 1 : 0);
}

if (input) run(input);
