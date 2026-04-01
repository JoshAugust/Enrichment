/**
 * api/contacts.js — Contact management endpoints
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

const router = express.Router();

// ── GET /api/contacts ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { company_id, verified, search, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT c.*, co.name as company_name, co.priority as company_priority
      FROM contacts c
      JOIN companies co ON co.id = c.company_id
      WHERE 1=1
    `;
    const params = [];

    if (company_id) { query += ' AND c.company_id = ?'; params.push(company_id); }
    if (verified !== undefined) { query += ' AND c.verified = ?'; params.push(Number(verified)); }
    if (search) {
      query += ' AND (c.name LIKE ? OR c.title LIKE ? OR c.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.verified DESC, co.priority ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const contacts = db.prepare(query).all(...params);
    res.json({ data: contacts, total: contacts.length });
  } catch (err) {
    console.error('[contacts] GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/contacts ────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { company_id, name, title, email, phone, linkedin_url, source, verified = 0 } = req.body;

    if (!company_id || !name) {
      return res.status(400).json({ error: 'company_id and name are required' });
    }

    // Verify company exists
    const company = db.prepare('SELECT id FROM companies WHERE id = ?').get(company_id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO contacts (id, company_id, name, title, email, phone, linkedin_url, source, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, company_id, name, title || null, email || null, phone || null,
           linkedin_url || null, source || 'manual', Number(verified));

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
    res.status(201).json({ data: contact });
  } catch (err) {
    console.error('[contacts] POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/contacts/:id ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const contact = db.prepare(`
      SELECT c.*, co.name as company_name, co.type as company_type, co.priority as company_priority
      FROM contacts c
      JOIN companies co ON co.id = c.company_id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const outreach = db.prepare('SELECT * FROM outreach_log WHERE contact_id = ? ORDER BY created_at DESC').all(contact.id);
    const drafts   = db.prepare('SELECT * FROM email_drafts WHERE contact_id = ? ORDER BY created_at DESC').all(contact.id);

    res.json({ data: { ...contact, outreach_log: outreach, email_drafts: drafts } });
  } catch (err) {
    console.error('[contacts] GET /:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/contacts/:id ───────────────────────────────────────────────────
router.patch('/:id', (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const allowed = ['name', 'title', 'email', 'phone', 'linkedin_url', 'source', 'verified'];
    const updates = [];
    const values = [];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(req.params.id);
    db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    res.json({ data: updated });
  } catch (err) {
    console.error('[contacts] PATCH error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
