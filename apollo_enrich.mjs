#!/usr/bin/env node
/**
 * Apollo Org Enrichment Agent
 * Enriches Grade A companies via Apollo's FREE org enrichment API
 */

import { execSync } from 'child_process';
import { existsSync, appendFileSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import https from 'https';
import { tmpdir } from 'os';
import { join } from 'path';

const DB = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/pipeline/master.db';
const LOG_FILE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/apollo_enrichment_log.jsonl';
const PROGRESS_FILE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/apollo_enrichment_progress.json';
const API_KEY = '0P_stg_vxXj5xNdrCrRXbA';
const DELAY_MS = 400;
const BATCH_SIZE = 100;
const BATCH_PAUSE_MS = 10000;
const PROGRESS_NOTIFY_EVERY = 200;

let sqlFileCounter = 0;

// SQLite helper using temp files to avoid escaping issues
function dbExec(sql) {
  const tmpFile = join(tmpdir(), `apollo_sql_${process.pid}_${++sqlFileCounter}.sql`);
  writeFileSync(tmpFile, `PRAGMA journal_mode=WAL;\nPRAGMA busy_timeout=5000;\n${sql}`);
  try {
    execSync(`sqlite3 "${DB}" ".read ${tmpFile}"`, {
      stdio: 'pipe',
      timeout: 30000
    });
  } finally {
    try { execSync(`rm -f "${tmpFile}"`); } catch(e) {}
  }
}

function dbQuery(sql) {
  // Run pragma separately, then query with -json
  const tmpFile = join(tmpdir(), `apollo_sql_${process.pid}_${++sqlFileCounter}.sql`);
  writeFileSync(tmpFile, sql);
  try {
    // Set WAL mode first (non-json)
    execSync(`sqlite3 "${DB}" "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;"`, { stdio: 'pipe', timeout: 10000 });
    // Now run JSON query
    const result = execSync(`sqlite3 -json "${DB}" ".read ${tmpFile}"`, {
      stdio: 'pipe',
      timeout: 30000
    });
    const str = result.toString().trim();
    if (!str) return [];
    return JSON.parse(str);
  } finally {
    try { execSync(`rm -f "${tmpFile}"`); } catch(e) {}
  }
}

const TG_BOT_TOKEN = '8767153790:AAH2mKDZZ9rdeadawjyqqtd_hKZYTwd0jtc';
const TG_CHAT_ID = '1443217514';

// Telegram notify helper via curl (fire and forget)
function sendTelegram(msg) {
  try {
    const payload = JSON.stringify({ chat_id: TG_CHAT_ID, text: msg });
    const tmpMsg = join(tmpdir(), `tg_msg_${process.pid}_${Date.now()}.json`);
    writeFileSync(tmpMsg, payload);
    execSync(`curl -s -X POST "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" -H "Content-Type: application/json" -d @${tmpMsg} > /dev/null 2>&1 && rm -f ${tmpMsg}`, {
      timeout: 10000,
      stdio: 'ignore'
    });
    console.log(`[TG] Sent: ${msg.substring(0, 80)}`);
  } catch (e) {
    console.error('Telegram notify failed (non-fatal):', e.message);
  }
}

// Apollo API call
function apolloEnrich(domain) {
  return new Promise((resolve, reject) => {
    const path = `/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`;
    const options = {
      hostname: 'api.apollo.io',
      path,
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isFinite(val) ? val.toString() : 'NULL';
  return "'" + String(val).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

async function main() {
  console.log('🚀 Apollo Enrichment Agent starting...');

  // Load progress
  let progress = { processed: 0, enriched: 0, no_data: 0, errors: 0, started_at: new Date().toISOString() };
  if (existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`Resuming: ${progress.processed} already processed, ${progress.enriched} enriched`);
    } catch (e) {
      console.log('Starting fresh');
    }
  }

  // Get all targets
  const targets = dbQuery(
    `SELECT domain, bvd_employees, linkedin_employees, enrichment_sources, description, company_phone
     FROM companies 
     WHERE grade = 'A' 
       AND (enrichment_sources IS NULL OR enrichment_sources NOT LIKE '%apollo%')
       AND domain NOT LIKE '%.vercel.app'
       AND domain NOT LIKE '%.framer.app'
       AND domain NOT LIKE '%.streamlit.app'
       AND domain NOT LIKE '%.netlify.app'
       AND domain NOT LIKE '%.herokuapp.com'
       AND domain NOT LIKE '%.webflow.io'
     ORDER BY domain`
  );

  console.log(`Total targets to process: ${targets.length}`);
  sendTelegram(`🚀 Apollo Enrichment started — ${targets.length} Grade A companies to enrich`);

  let batchCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < targets.length; i++) {
    const company = targets[i];
    const domain = company.domain;

    // Batch pause every 100
    if (batchCount > 0 && batchCount % BATCH_SIZE === 0) {
      console.log(`⏸️  Batch pause after ${batchCount} (${BATCH_SIZE} in this batch)...`);
      await sleep(BATCH_PAUSE_MS);
    }

    // Progress notifications every 200
    if (batchCount > 0 && batchCount % PROGRESS_NOTIFY_EVERY === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
      const rate = elapsed > 0 ? Math.round(batchCount / elapsed) : batchCount;
      const remaining = targets.length - i;
      const eta = rate > 0 ? Math.round(remaining / rate) : '?';
      sendTelegram(
        `📊 Apollo Enrichment progress:\n` +
        `• ${i}/${targets.length} processed\n` +
        `• Enriched: ${progress.enriched} | No data: ${progress.no_data}\n` +
        `• Errors: ${progress.errors}\n` +
        `• Elapsed: ${elapsed}m | ETA ~${eta}m`
      );
    }

    let retries = 0;
    let result = null;

    while (retries < 3) {
      try {
        result = await apolloEnrich(domain);
        break;
      } catch (e) {
        retries++;
        console.error(`  Error ${domain} (attempt ${retries}): ${e.message}`);
        if (retries < 3) await sleep(2000 * retries);
      }
    }

    if (!result) {
      progress.errors++;
      appendFileSync(LOG_FILE, JSON.stringify({ domain, status: 'error', reason: 'request_failed', ts: new Date().toISOString() }) + '\n');
      progress.processed++;
      batchCount++;
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      await sleep(DELAY_MS);
      continue;
    }

    // Handle rate limiting
    if (result.status === 429) {
      console.log(`⚠️  Rate limited on ${domain}. Backing off 60s...`);
      await sleep(60000);
      try {
        result = await apolloEnrich(domain);
      } catch (e) {
        progress.errors++;
        appendFileSync(LOG_FILE, JSON.stringify({ domain, status: 'error', reason: '429_retry_failed', ts: new Date().toISOString() }) + '\n');
        progress.processed++;
        batchCount++;
        writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        await sleep(DELAY_MS);
        continue;
      }
    }

    if (result.status !== 200) {
      progress.errors++;
      appendFileSync(LOG_FILE, JSON.stringify({ domain, status: 'error', reason: `http_${result.status}`, ts: new Date().toISOString() }) + '\n');
      progress.processed++;
      batchCount++;
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      await sleep(DELAY_MS);
      continue;
    }

    // Parse response
    let parsed;
    try {
      parsed = JSON.parse(result.body);
    } catch (e) {
      progress.errors++;
      appendFileSync(LOG_FILE, JSON.stringify({ domain, status: 'error', reason: 'parse_failed', ts: new Date().toISOString() }) + '\n');
      progress.processed++;
      batchCount++;
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      await sleep(DELAY_MS);
      continue;
    }

    const org = parsed.organization;
    if (!org) {
      progress.no_data++;
      appendFileSync(LOG_FILE, JSON.stringify({ domain, status: 'no_data', ts: new Date().toISOString() }) + '\n');
      // Still mark as processed
      dbExec(`UPDATE companies SET enrichment_sources = CASE WHEN enrichment_sources IS NULL OR enrichment_sources = '' THEN 'apollo' ELSE enrichment_sources || ',apollo' END, last_updated = datetime('now') WHERE domain = ${escSql(domain)};`);
      progress.processed++;
      batchCount++;
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      await sleep(DELAY_MS);
      continue;
    }

    // Extract fields
    const estimated_employees = org.estimated_num_employees != null ? parseInt(org.estimated_num_employees) : null;
    const annual_revenue = org.annual_revenue != null ? parseFloat(org.annual_revenue) : null;
    const annual_revenue_printed = org.annual_revenue_printed || null;
    const founded_year = org.founded_year || null;
    const industry = org.industry || null;
    const city = org.city || null;
    const state_val = org.state || null;
    const country = org.country || null;
    const short_description = org.short_description || null;
    const phone = org.phone || null;
    const linkedin_url = org.linkedin_url || null;
    const apollo_name = org.name || null;

    // Log it
    appendFileSync(LOG_FILE, JSON.stringify({
      domain, status: 'enriched',
      estimated_employees, annual_revenue, annual_revenue_printed,
      founded_year, industry, city, state: state_val, country,
      phone, linkedin_url, apollo_name,
      ts: new Date().toISOString()
    }) + '\n');

    // Build update SQL
    const setClauses = [];
    
    if (estimated_employees !== null) {
      setClauses.push(`linkedin_employees = CASE WHEN linkedin_employees IS NULL THEN ${escSql(estimated_employees)} ELSE linkedin_employees END`);
    }
    if (industry !== null) setClauses.push(`apollo_industry = ${escSql(industry)}`);
    if (apollo_name !== null) setClauses.push(`apollo_name = ${escSql(apollo_name)}`);
    if (short_description !== null) {
      setClauses.push(`description = CASE WHEN description IS NULL OR description = '' THEN ${escSql(short_description)} ELSE description END`);
    }
    if (phone !== null) {
      setClauses.push(`apollo_phone = ${escSql(phone)}`);
      setClauses.push(`company_phone = CASE WHEN company_phone IS NULL OR company_phone = '' THEN ${escSql(phone)} ELSE company_phone END`);
    }
    if (annual_revenue !== null && isFinite(annual_revenue)) {
      // Apollo annual_revenue is in dollars; store as thousands USD
      setClauses.push(`revenue_th_usd = CASE WHEN revenue_th_usd IS NULL THEN ${escSql(annual_revenue / 1000)} ELSE revenue_th_usd END`);
    }
    setClauses.push(`enrichment_sources = CASE WHEN enrichment_sources IS NULL OR enrichment_sources = '' THEN 'apollo' ELSE enrichment_sources || ',apollo' END`);
    setClauses.push(`last_updated = datetime('now')`);

    const sql = `UPDATE companies SET ${setClauses.join(', ')} WHERE domain = ${escSql(domain)};`;
    try {
      dbExec(sql);
    } catch (e) {
      console.error(`  DB update error for ${domain}: ${e.message}`);
      progress.errors++;
    }

    progress.enriched++;
    progress.processed++;
    batchCount++;
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

    if (i % 25 === 0 || i < 5) {
      console.log(`[${i+1}/${targets.length}] ${domain} → emp=${estimated_employees ?? '—'}, industry=${industry ?? '—'}, phone=${phone ? '✓' : '—'}, rev=${annual_revenue_printed ?? '—'}`);
    }

    await sleep(DELAY_MS);
  }

  // Final summary
  const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
  const summary = `✅ Apollo Enrichment COMPLETE!\n• Processed: ${progress.processed}\n• Enriched with data: ${progress.enriched}\n• No data: ${progress.no_data}\n• Errors: ${progress.errors}\n• Time: ${elapsed}m`;
  console.log(summary);
  sendTelegram(summary);
  writeFileSync(PROGRESS_FILE, JSON.stringify({ ...progress, completed_at: new Date().toISOString() }, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
