/**
 * api/research.js — Company discovery endpoint
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { discoverCompanies } = require('../research/discovery');

const router = express.Router();

// ── POST /api/research/notes — manual note submission (WARN-005 fix) ──────────
router.post('/notes', (req, res) => {
  try {
    const { company_id, summary, source_url } = req.body || {};
    if (!company_id || !summary) {
      return res.status(400).json({ error: 'company_id and summary are required' });
    }
    const company = db.prepare('SELECT id FROM companies WHERE id = ?').get(company_id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO research_notes (id, company_id, source_url, summary, raw_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, company_id, source_url || null, summary, JSON.stringify({ manual: true, source_url }));

    const note = db.prepare('SELECT * FROM research_notes WHERE id = ?').get(id);
    res.status(201).json({ data: note });
  } catch (err) {
    console.error('[research] POST notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/research/discover ───────────────────────────────────────────────
// Triggers web-based company discovery and returns candidates (not auto-inserted)
router.post('/discover', async (req, res) => {
  try {
    const existingNames = db.prepare('SELECT name FROM companies').all().map((r) => r.name);
    const { queries } = req.body; // optional: override queries

    // Kick off discovery
    const candidates = await discoverCompanies(existingNames, queries);

    res.json({
      data: candidates,
      total: candidates.length,
      message: `Found ${candidates.length} candidate companies. Review before inserting.`,
      note: 'All candidates have needs_review: true. Use POST /api/companies to insert selected ones.',
    });
  } catch (err) {
    console.error('[research] discover error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/research/notes ───────────────────────────────────────────────────
router.get('/notes', (req, res) => {
  try {
    const { company_id, limit = 20 } = req.query;

    let query = `
      SELECT rn.*, co.name as company_name
      FROM research_notes rn
      JOIN companies co ON co.id = rn.company_id
      WHERE 1=1
    `;
    const params = [];

    if (company_id) { query += ' AND rn.company_id = ?'; params.push(company_id); }
    query += ' ORDER BY rn.created_at DESC LIMIT ?';
    params.push(Number(limit));

    res.json({ data: db.prepare(query).all(...params) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
