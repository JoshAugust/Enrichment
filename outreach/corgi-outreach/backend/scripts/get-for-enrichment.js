#!/usr/bin/env node
/**
 * get-for-enrichment.js — Print companies needing enrichment
 * 
 * Usage:
 *   node get-for-enrichment.js [--limit 6] [--format ids|json|names]
 * 
 * Picks companies that:
 *   1. Have no last_enriched_at (never enriched)
 *   2. OR were enriched 7+ days ago
 * Ordered by priority (A first), then oldest enrichment
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const db = new Database(DB_PATH, { readonly: true });

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 6;
const formatIdx = args.indexOf('--format');
const FORMAT = formatIdx >= 0 ? args[formatIdx + 1] : 'json';

const companies = db.prepare(`
  SELECT id, name, type, priority, website, last_enriched_at
  FROM companies
  WHERE last_enriched_at IS NULL 
     OR datetime(last_enriched_at) < datetime('now', '-7 days')
  ORDER BY
    CASE priority WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 3 END,
    last_enriched_at ASC NULLS FIRST
  LIMIT ?
`).all(LIMIT);

if (FORMAT === 'ids') {
  console.log(companies.map(c => c.id).join('\n'));
} else if (FORMAT === 'names') {
  console.log(companies.map(c => `${c.name} (${c.priority})`).join('\n'));
} else {
  console.log(JSON.stringify(companies, null, 2));
}
