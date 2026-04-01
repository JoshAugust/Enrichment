/**
 * api/companies.js — Company CRUD and research trigger endpoints
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, touchCompany } = require('../db');
const { scrapeCompany, collapseScrapedText } = require('../research/scraper');
const { enrichCompany } = require('../research/enricher');
const { scoreCompany } = require('../research/scorer');
const { generateScript } = require('../crm/script-generator');

const router = express.Router();

// ── GET /api/companies ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { priority, type, search, limit = 100, offset = 0 } = req.query;

    // WARN-002 fix: validate limit/offset
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedLimit) || parsedLimit < 0 || parsedLimit > 1000) {
      return res.status(400).json({ error: 'Invalid limit: must be an integer 0–1000' });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'Invalid offset: must be a non-negative integer' });
    }

    let query = 'SELECT * FROM companies WHERE 1=1';
    const params = [];

    if (priority) { query += ' AND priority = ?'; params.push(priority.toUpperCase()); }
    if (type)     { query += ' AND type = ?';     params.push(type.toLowerCase()); }
    if (search)   {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY priority ASC, qualification_score DESC LIMIT ? OFFSET ?';
    params.push(parsedLimit, parsedOffset);

    const companies = db.prepare(query).all(...params);

    // Attach contact count + primary phone
    const countStmt = db.prepare('SELECT COUNT(*) as cnt FROM contacts WHERE company_id = ?');
    const phoneStmt = db.prepare(
      `SELECT name, phone FROM contacts
       WHERE company_id = ? AND phone IS NOT NULL AND phone != ''
       ORDER BY verified DESC, created_at ASC LIMIT 1`
    );
    const allPhonesStmt = db.prepare(
      `SELECT name, title, phone FROM contacts
       WHERE company_id = ? AND phone IS NOT NULL AND phone != ''
       ORDER BY verified DESC, created_at ASC LIMIT 5`
    );
    const result = companies.map((c) => {
      const phoneRow = phoneStmt.get(c.id);
      const allPhones = allPhonesStmt.all(c.id);
      return {
        ...c,
        contact_count: countStmt.get(c.id).cnt,
        primary_phone: phoneRow?.phone || c.phone || null,
        primary_phone_contact: phoneRow?.name || null,
        phone_contacts: allPhones,
      };
    });

    res.json({ data: result, total: result.length });
  } catch (err) {
    console.error('[companies] GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/companies ───────────────────────────────────────────────────────
const VALID_TYPES = ['operator', 'lender', 'arranger'];
const VALID_PRIORITIES = ['A', 'B', 'C'];

router.post('/', (req, res) => {
  try {
    const {
      name, type, website, description, priority = 'C',
      industry_segment, estimated_gpu_scale, financing_status,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }

    // WARN-003 fix: validate type and priority before insert
    if (!VALID_TYPES.includes(type.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }
    if (!VALID_PRIORITIES.includes(priority.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid priority "${priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO companies (id, name, type, website, description, priority,
        industry_segment, estimated_gpu_scale, financing_status, qualification_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, name, type.toLowerCase(), website || null, description || null, priority.toUpperCase(),
           industry_segment || null, estimated_gpu_scale || 'unknown',
           financing_status || 'unknown');

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    res.status(201).json({ data: company });
  } catch (err) {
    console.error('[companies] POST error:', err);
    // WARN-003: reformat SQLite constraint errors
    if (err.message && err.message.includes('CHECK constraint failed')) {
      return res.status(400).json({ error: 'Invalid field value: ' + err.message.replace('CHECK constraint failed: ', '') });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/companies/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const contacts = db.prepare('SELECT * FROM contacts WHERE company_id = ? ORDER BY verified DESC').all(company.id);
    const research = db.prepare('SELECT * FROM research_notes WHERE company_id = ? ORDER BY created_at DESC LIMIT 5').all(company.id);
    const scripts  = db.prepare('SELECT * FROM call_scripts WHERE company_id = ? ORDER BY created_at DESC').all(company.id);
    const outreach = db.prepare(`
      SELECT ol.*, c.name as contact_name, c.email as contact_email
      FROM outreach_log ol
      JOIN contacts c ON c.id = ol.contact_id
      WHERE c.company_id = ?
      ORDER BY ol.created_at DESC
      LIMIT 20
    `).all(company.id);
    const emailDrafts = db.prepare(`
      SELECT ed.* FROM email_drafts ed
      JOIN contacts c ON c.id = ed.contact_id
      WHERE c.company_id = ?
      ORDER BY ed.created_at DESC
    `).all(company.id);

    res.json({
      data: {
        ...company,
        contacts,
        research_notes: research,
        call_scripts: scripts,
        outreach_log: outreach,
        email_drafts: emailDrafts,
      },
    });
  } catch (err) {
    console.error('[companies] GET /:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/companies/:id ──────────────────────────────────────────────────
router.patch('/:id', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const allowedFields = [
      'manual_call_made', 'outreach_status', 'call_notes',
      'headquarters', 'website', 'phone', 'description', 'priority',
      'industry_segment', 'linkedin_url', 'twitter_url', 'estimated_gpu_scale',
      'financing_status', 'total_raised', 'employee_count', 'founded_year',
    ];
    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    db.prepare(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // Audit trail: log notes changes so they're never lost
    if (req.body.call_notes !== undefined) {
      try {
        db.prepare(`INSERT INTO notes_history (company_id, notes_text, action) VALUES (?, ?, 'save')`)
          .run(req.params.id, req.body.call_notes);
      } catch (_) { /* notes_history table may not exist yet on old DBs */ }
    }

    // Audit trail: log call status changes
    if (req.body.manual_call_made !== undefined) {
      try {
        db.prepare(`INSERT INTO notes_history (company_id, notes_text, action) VALUES (?, ?, 'call_status')`)
          .run(req.params.id, `manual_call_made set to ${req.body.manual_call_made}`);
      } catch (_) {}
    }

    const updated = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    res.json({ data: updated });
  } catch (err) {
    console.error('[companies] PATCH error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/companies/:id/research ─────────────────────────────────────────
// Triggers async research pipeline: scrape → enrich → score → generate script
router.post('/:id/research', async (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  // Respond immediately — research runs in background
  res.json({ message: 'Research started', company_id: company.id });

  try {
    console.log(`[research] Starting pipeline for: ${company.name}`);

    // 1. Scrape
    const scraped = await scrapeCompany(company.name, company.website);
    const text = collapseScrapedText(scraped);

    // 2. Save research note
    const noteId = uuidv4();
    db.prepare(`
      INSERT INTO research_notes (id, company_id, source_url, summary, raw_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      noteId, company.id, company.website,
      text.slice(0, 1000),
      JSON.stringify(scraped)
    );

    // 3. Enrich
    const enriched = enrichCompany(company, text);

    // 4. Update company with enriched data
    db.prepare(`
      UPDATE companies
      SET type = ?, industry_segment = ?, estimated_gpu_scale = ?,
          financing_status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      enriched.type || company.type,
      enriched.industry_segment || company.industry_segment,
      enriched.estimated_gpu_scale || company.estimated_gpu_scale,
      enriched.financing_status || company.financing_status,
      company.id
    );

    // 5. Score
    const contacts = db.prepare('SELECT * FROM contacts WHERE company_id = ?').all(company.id);
    const { score } = scoreCompany({ ...company, ...enriched }, contacts, enriched);
    db.prepare('UPDATE companies SET qualification_score = ? WHERE id = ?').run(score, company.id);

    // 6. Generate and store call script
    const updatedCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(company.id);
    const script = generateScript(updatedCompany);
    const scriptId = uuidv4();
    db.prepare(`
      INSERT INTO call_scripts (id, company_id, script_version, customized_script, buyer_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(scriptId, company.id, script.version, JSON.stringify(script), script.buyer_type);

    console.log(`[research] Done for ${company.name} — score: ${score}, script: ${script.version}`);
  } catch (err) {
    console.error(`[research] Pipeline error for ${company.name}:`, err);
  }
});

module.exports = router;
