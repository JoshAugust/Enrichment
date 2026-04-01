/**
 * api/call-scripts.js — Call script CRUD and generation endpoints
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { generateScript, generateAllVariants } = require('../crm/script-generator');

const router = express.Router();

// ── GET /api/call-scripts ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { company_id, script_version, buyer_type, limit = 50 } = req.query;

    let query = `
      SELECT cs.*, co.name as company_name, co.type as company_type, co.priority
      FROM call_scripts cs
      JOIN companies co ON co.id = cs.company_id
      WHERE 1=1
    `;
    const params = [];

    if (company_id)     { query += ' AND cs.company_id = ?';    params.push(company_id); }
    if (script_version) { query += ' AND cs.script_version = ?'; params.push(script_version.toUpperCase()); }
    if (buyer_type)     { query += ' AND cs.buyer_type = ?';    params.push(buyer_type.toLowerCase()); }

    query += ' ORDER BY cs.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const scripts = db.prepare(query).all(...params).map((s) => ({
      ...s,
      customized_script: JSON.parse(s.customized_script),
    }));

    res.json({ data: scripts, total: scripts.length });
  } catch (err) {
    console.error('[call-scripts] GET error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/call-scripts ────────────────────────────────────────────────────
// Generate and store a new script for a company
router.post('/', (req, res) => {
  try {
    const { company_id, script_version, force_regenerate = false } = req.body;

    if (!company_id) return res.status(400).json({ error: 'company_id is required' });

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(company_id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // If specific version requested, use that; otherwise auto-select
    let script;
    if (script_version) {
      const { BASE_SCRIPTS } = require('../crm/script-generator');
      const base = BASE_SCRIPTS[script_version.toUpperCase()];
      if (!base) return res.status(400).json({ error: `Invalid script version: ${script_version}` });

      // Generate with the forced version
      const allVariants = generateAllVariants(company);
      script = allVariants.find((v) => v.version === script_version.toUpperCase()) || generateScript(company);
    } else {
      script = generateScript(company);
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO call_scripts (id, company_id, script_version, customized_script, buyer_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, company_id, script.version, JSON.stringify(script), script.buyer_type);

    const stored = db.prepare('SELECT * FROM call_scripts WHERE id = ?').get(id);
    res.status(201).json({
      data: { ...stored, customized_script: JSON.parse(stored.customized_script) },
    });
  } catch (err) {
    console.error('[call-scripts] POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/call-scripts/company/:company_id/all ─────────────────────────────
// Get all script variants for a company (without storing)
router.get('/company/:company_id/variants', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.company_id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const variants = generateAllVariants(company);
    res.json({ data: variants, company_name: company.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
