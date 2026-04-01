/**
 * api/outreach.js — Outreach log and email draft endpoints
 *
 * All actual sending is guarded by DRY_RUN=true.
 * In dry-run mode, records are created but nothing leaves the machine.
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const config = require('../../config/default.json');

const router = express.Router();
const DRY_RUN = process.env.DRY_RUN !== 'false' && config.DRY_RUN !== false;

// ── GET /api/outreach ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { channel, status, company_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ol.*,
             c.name as contact_name, c.email as contact_email, c.title as contact_title,
             co.name as company_name, co.priority as company_priority
      FROM outreach_log ol
      JOIN contacts c ON c.id = ol.contact_id
      JOIN companies co ON co.id = c.company_id
      WHERE 1=1
    `;
    const params = [];

    if (channel)    { query += ' AND ol.channel = ?';    params.push(channel); }
    if (status)     { query += ' AND ol.status = ?';     params.push(status); }
    if (company_id) { query += ' AND co.id = ?';         params.push(company_id); }

    query += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = db.prepare(query).all(...params);
    res.json({ data: rows, total: rows.length, dry_run: DRY_RUN });
  } catch (err) {
    console.error('[outreach] GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/outreach ────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { contact_id, channel, status = 'draft', script_version, notes, scheduled_at } = req.body;

    if (!contact_id || !channel) {
      return res.status(400).json({ error: 'contact_id and channel are required' });
    }

    const contact = db.prepare('SELECT id FROM contacts WHERE id = ?').get(contact_id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO outreach_log (id, contact_id, channel, status, script_version, notes, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, contact_id, channel, status, script_version || null, notes || null, scheduled_at || null);

    const row = db.prepare('SELECT * FROM outreach_log WHERE id = ?').get(id);
    res.status(201).json({ data: row, dry_run: DRY_RUN });
  } catch (err) {
    console.error('[outreach] POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/outreach/:id ───────────────────────────────────────────────────
router.patch('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM outreach_log WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Outreach log entry not found' });

    const allowed = ['status', 'notes', 'scheduled_at', 'completed_at', 'script_version'];
    const updates = [];
    const values = [];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    // Auto-set completed_at when marking complete
    if (req.body.status === 'completed' && !req.body.completed_at) {
      updates.push("completed_at = datetime('now')");
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(req.params.id);
    db.prepare(`UPDATE outreach_log SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM outreach_log WHERE id = ?').get(req.params.id);
    res.json({ data: updated });
  } catch (err) {
    console.error('[outreach] PATCH error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/email-drafts ─────────────────────────────────────────────────────
router.get('/email-drafts', (req, res) => {
  try {
    const { contact_id, status, limit = 50 } = req.query;

    let query = `
      SELECT ed.*, c.name as contact_name, c.email, co.name as company_name
      FROM email_drafts ed
      JOIN contacts c ON c.id = ed.contact_id
      JOIN companies co ON co.id = c.company_id
      WHERE 1=1
    `;
    const params = [];

    if (contact_id) { query += ' AND ed.contact_id = ?'; params.push(contact_id); }
    if (status)     { query += ' AND ed.status = ?';     params.push(status); }

    query += ' ORDER BY ed.created_at DESC LIMIT ?';
    params.push(Number(limit));

    res.json({ data: db.prepare(query).all(...params), dry_run: DRY_RUN });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/email-drafts ────────────────────────────────────────────────────
router.post('/email-drafts', (req, res) => {
  try {
    const { contact_id, subject, body, template_name, status = 'draft' } = req.body;

    if (!contact_id || !subject || !body) {
      return res.status(400).json({ error: 'contact_id, subject, and body are required' });
    }

    const contact = db.prepare('SELECT id FROM contacts WHERE id = ?').get(contact_id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO email_drafts (id, contact_id, subject, body, template_name, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, contact_id, subject, body, template_name || null, status);

    const draft = db.prepare('SELECT * FROM email_drafts WHERE id = ?').get(id);
    res.status(201).json({ data: draft, dry_run: DRY_RUN });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
