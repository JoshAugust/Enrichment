/**
 * server.js — Corgi Outreach API server
 *
 * Starts the Express server and mounts all route modules.
 * DRY_RUN mode is always on unless explicitly disabled in env.
 */

'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('../config/default.json');

// Initialize DB on startup (schema creation runs in db.js)
require('./db');

const app = express();
const PORT = process.env.PORT || config.server.port || 3001;
const DRY_RUN = process.env.DRY_RUN !== 'false' && config.DRY_RUN !== false;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/companies',    require('./api/companies'));
app.use('/api/companies',    require('./api/company-chat'));
app.use('/api/companies',    require('./api/verification-routes').companyVerificationRouter);
app.use('/api/contacts',     require('./api/contacts'));
app.use('/api/outreach',     require('./api/outreach'));
app.use('/api/call-scripts', require('./api/call-scripts'));
app.use('/api/dashboard',    require('./api/dashboard'));
app.use('/api/research',     require('./api/research'));
app.use('/api/voice',        require('./api/voice-routes'));
app.use('/api/email',        require('./api/email-routes'));
app.use('/api/enrichment',   require('./api/enrichment-routes'));
app.use('/api/vapi',                require('./api/vapi-routes'));
app.use('/api/calls',              require('./api/call-results-routes'));
app.use('/api/calls/retries',      require('./api/vapi-routes').retryRouter);
app.use('/api/browser-call',       require('./api/browser-call-routes'));
app.use('/api/journal',            require('./api/journal-routes'));
app.use('/api/verification',       require('./api/verification-routes'));

// One-off: generate call scripts for all companies missing them
app.post('/api/generate-all-scripts', (_req, res) => {
  try {
    const { generateScript } = require('./crm/script-generator');
    const { v4: uuidv4 } = require('uuid');
    const { db } = require('./db');
    const companies = db.prepare('SELECT * FROM companies').all();
    const existing = new Set(db.prepare('SELECT DISTINCT company_id FROM call_scripts').all().map(r => r.company_id));
    const stmt = db.prepare('INSERT INTO call_scripts (id, company_id, script_version, customized_script, buyer_type) VALUES (?, ?, ?, ?, ?)');
    let created = 0;
    for (const company of companies) {
      if (existing.has(company.id)) continue;
      try {
        const script = generateScript(company);
        stmt.run(uuidv4(), company.id, script.version, JSON.stringify(script), script.buyer_type);
        created++;
      } catch (_) {}
    }
    const total = db.prepare('SELECT COUNT(*) as c FROM call_scripts').get().c;
    res.json({ success: true, created, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// One-off: generate talking points for all companies
app.post('/api/generate-talking-points', (_req, res) => {
  try {
    const { generateAll } = require('./crm/talking-points-generator');
    const result = generateAll();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audio file serving (BUG-001 fix) ─────────────────────────────────────────
const { audioMiddleware } = require('./api/voice-routes');
app.get('/audio/:planId/:file', audioMiddleware);

// ── Admin: manual seed trigger ────────────────────────────────────────────────
app.post('/api/admin/seed', (_req, res) => {
  try {
    const { db: database } = require('./db');
    const seedPath = path.resolve(__dirname, '../scripts/seed-data.sql');
    if (!fs.existsSync(seedPath)) return res.json({ error: 'No seed file found' });
    const sql = fs.readFileSync(seedPath, 'utf-8');
    const inserts = sql.split('\n').filter(line => line.trim().startsWith('INSERT'));
    let ok = 0, fail = 0;
    const errors = [];
    for (const line of inserts) {
      try { database.exec(line); ok++; } catch (e) { 
        fail++;
        if (errors.length < 5) errors.push({ table: line.slice(0, 40), error: e.message.slice(0, 200) });
      }
    }
    const count = database.prepare('SELECT COUNT(*) as c FROM companies').get();
    res.json({ success: true, inserted: ok, failed: fail, companies: count.c, sampleErrors: errors, seedFile: seedPath, lineCount: inserts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'corgi-outreach-api',
    version: '1.0.0',
    dry_run: DRY_RUN,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve frontend (built static files) ───────────────────────────────────────
const path = require('path');
const fs = require('fs');
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  console.log(`[server] Serving frontend from ${frontendDist}`);
}

// ── API Root ──────────────────────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    name: 'Corgi Outreach API',
    version: '1.0.0',
    dry_run: DRY_RUN,
    routes: [
      'GET  /health',
      // Companies
      'GET  /api/companies',
      'POST /api/companies',
      'GET  /api/companies/:id',
      'POST /api/companies/:id/research',
      // Contacts
      'GET  /api/contacts',
      'POST /api/contacts',
      'GET  /api/contacts/:id',
      'PATCH /api/contacts/:id',
      // Outreach
      'GET  /api/outreach',
      'POST /api/outreach',
      'PATCH /api/outreach/:id',
      'GET  /api/outreach/email-drafts',
      'POST /api/outreach/email-drafts',
      // Call scripts
      'GET  /api/call-scripts',
      'POST /api/call-scripts',
      'GET  /api/call-scripts/company/:id/variants',
      // Dashboard
      'GET  /api/dashboard/stats',
      // Research
      'POST /api/research/discover',
      'GET  /api/research/notes',
      'POST /api/research/notes',
      // Voice
      'GET  /api/voice/status',
      'GET  /api/voice/previews',
      'POST /api/voice/preview',
      'POST /api/voice/call-plan/:companyId',
      'POST /api/voice/dry-run/:companyId',
      'GET  /api/voice/call-plans',
      'GET  /api/voice/call-plans/:planId',
      'POST /api/voice/twiml/gather',
      'POST /api/voice/webhook/status',
      'POST /api/voice/webhook/recording',
      'GET  /audio/:planId/:file',
      // Email
      'GET  /api/email/templates',
      'GET  /api/email/templates/:slug',
      'POST /api/email/compose/:contactId',
      'POST /api/email/compose-batch',
      'GET  /api/email/drafts',
      'GET  /api/email/drafts/:id',
      'PATCH /api/email/drafts/:id',
      'POST /api/email/campaigns',
      'GET  /api/email/campaigns',
      'GET  /api/email/campaigns/:id',
      'GET  /api/email/campaigns/:id/report',
      'POST /api/email/campaigns/:id/approve',
      'POST /api/email/campaigns/:id/pause',
      'POST /api/email/campaigns/:id/generate-drafts',
      'GET  /api/email/contacts/discover/:companyId',
      'POST /api/email/send/dry-run/:draftId',
      // Enrichment
      'POST /api/enrichment/company/:id',
      'POST /api/enrichment/contact/:id',
      'POST /api/enrichment/batch',
      'GET  /api/enrichment/log',
      'GET  /api/enrichment/status',
      'POST /api/enrichment/company/:id/news',
      'GET  /api/enrichment/company/:id/summary',
      'GET  /api/enrichment/jobs/:jobId',
    ],
  });
});

// ── SPA fallback (serve index.html for non-API routes) ────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/audio/') || req.path === '/health') {
    return res.status(404).json({ error: 'Not found' });
  }
  const indexPath = path.resolve(__dirname, '../../frontend/dist/index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ error: 'Not found' });
});

// ── JSON parse error handler (WARN-004) ───────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next(err);
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const HOST = process.env.HOST || config.server.host || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`\n🐕 Corgi Outreach API running on http://${HOST}:${PORT}`);
  console.log(`   DRY_RUN: ${DRY_RUN} — ${DRY_RUN ? 'nothing will be sent externally' : '⚠️  LIVE MODE'}`);
  console.log(`   Docs: GET http://${HOST}:${PORT}/\n`);
}).on('error', (err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

module.exports = app;
