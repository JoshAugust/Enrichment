/**
 * journal-routes.js — Call journal: post-call notes for manual calls
 *
 * Mounts at /api/journal
 *
 * Routes:
 *   GET    /api/journal              — list all journal entries
 *   GET    /api/journal/:id          — get single entry
 *   POST   /api/journal              — create a journal entry
 *   PATCH  /api/journal/:id          — update notes
 *   DELETE /api/journal/:id          — delete entry
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

const router = express.Router();

// ── Migrations (idempotent) ───────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS call_journal (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id    TEXT REFERENCES contacts(id) ON DELETE SET NULL,
    company_name  TEXT NOT NULL,
    contact_name  TEXT,
    contact_phone TEXT,
    notes         TEXT DEFAULT '',
    called_at     TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  )
`);

try { db.exec(`CREATE INDEX IF NOT EXISTS idx_call_journal_company ON call_journal(company_id)`); } catch (_) {}
try { db.exec(`CREATE INDEX IF NOT EXISTS idx_call_journal_called ON call_journal(called_at)`); } catch (_) {}

console.log('[journal] Table ready');

// ── GET /api/journal ──────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  try {
    const { limit = 100, offset = 0, company_id } = req.query;
    let query = `SELECT j.*, c.priority, c.type, c.outreach_status
                 FROM call_journal j
                 LEFT JOIN companies c ON c.id = j.company_id
                 WHERE 1=1`;
    const params = [];

    if (company_id) {
      query += ' AND j.company_id = ?';
      params.push(company_id);
    }

    query += ' ORDER BY j.called_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const entries = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as c FROM call_journal').get().c;

    res.json({ data: entries, total });
  } catch (err) {
    console.error('[journal] GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/journal/:id ──────────────────────────────────────────────────────

router.get('/:id', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM call_journal WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });
    res.json({ data: entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/journal ─────────────────────────────────────────────────────────

router.post('/', (req, res) => {
  try {
    const { company_id, contact_id, notes } = req.body;
    if (!company_id) return res.status(400).json({ error: 'company_id is required' });

    const company = db.prepare('SELECT id, name FROM companies WHERE id = ?').get(company_id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    let contact = null;
    if (contact_id) {
      contact = db.prepare('SELECT id, name, phone FROM contacts WHERE id = ?').get(contact_id);
    }
    // If no contact_id, grab the first contact with a phone
    if (!contact) {
      contact = db.prepare(
        `SELECT id, name, phone FROM contacts WHERE company_id = ? AND phone IS NOT NULL AND phone != '' ORDER BY verified DESC LIMIT 1`
      ).get(company_id) || null;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO call_journal (id, company_id, contact_id, company_name, contact_name, contact_phone, notes, called_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      company_id,
      contact?.id || null,
      company.name,
      contact?.name || null,
      contact?.phone || null,
      notes || '',
      now,
      now
    );

    // Also mark the company as manual_call_made
    db.prepare(`UPDATE companies SET manual_call_made = 1, updated_at = datetime('now') WHERE id = ?`).run(company_id);

    const entry = db.prepare('SELECT * FROM call_journal WHERE id = ?').get(id);
    res.status(201).json({ data: entry });
  } catch (err) {
    console.error('[journal] POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/journal/:id ────────────────────────────────────────────────────

router.patch('/:id', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM call_journal WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });

    const { notes, contact_name, contact_phone } = req.body;
    const updates = [];
    const params = [];

    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (contact_name !== undefined) { updates.push('contact_name = ?'); params.push(contact_name); }
    if (contact_phone !== undefined) { updates.push('contact_phone = ?'); params.push(contact_phone); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    db.prepare(`UPDATE call_journal SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM call_journal WHERE id = ?').get(req.params.id);
    res.json({ data: updated });
  } catch (err) {
    console.error('[journal] PATCH error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/journal/:id ───────────────────────────────────────────────────

router.delete('/:id', (req, res) => {
  try {
    const entry = db.prepare('SELECT * FROM call_journal WHERE id = ?').get(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Journal entry not found' });

    db.prepare('DELETE FROM call_journal WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
