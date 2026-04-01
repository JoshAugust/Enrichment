'use strict';

/**
 * template-engine.js — Email template system for Corgi Outreach
 *
 * Loads Handlebars templates from the templates/ directory.
 * Handles subject line A/B variants, HTML + plain-text rendering.
 */

const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');

// ── Template metadata ─────────────────────────────────────────────────────────
// Defines every template: slug, subject variants, sequence day, and target audience.
const TEMPLATE_REGISTRY = {
  cold_intro_operator: {
    name: 'Cold Intro — Operator',
    file: 'cold_intro_operator.hbs',
    subjects: {
      a: 'GPU financing — a quick thought',
      b: 'Cheaper debt on GPU clusters — worth 20 mins?',
    },
    audienceTypes: ['operator'],
    sequenceDay: 0,
    isInitial: true,
  },
  cold_intro_lender: {
    name: 'Cold Intro — Lender',
    file: 'cold_intro_lender.hbs',
    subjects: {
      a: 'GPU-backed credit — the residual value question',
      b: 'More GPU loans, better downside protection',
    },
    audienceTypes: ['lender'],
    sequenceDay: 0,
    isInitial: true,
  },
  cold_intro_arranger: {
    name: 'Cold Intro — Arranger',
    file: 'cold_intro_arranger.hbs',
    subjects: {
      a: 'GPU debt placement — one piece that helps',
      b: 'Faster GPU debt structuring — quick question',
    },
    audienceTypes: ['arranger'],
    sequenceDay: 0,
    isInitial: true,
  },
  follow_up_1: {
    name: 'Follow-up #1 — Checking In',
    file: 'follow_up_1.hbs',
    subjects: {
      a: 'Re: {{{previousSubject}}}',
      b: 'Quick follow-up — {{companyName}}',
    },
    audienceTypes: ['operator', 'lender', 'arranger'],
    sequenceDay: 3,
    isInitial: false,
  },
  follow_up_2: {
    name: 'Follow-up #2 — Value Add',
    file: 'follow_up_2.hbs',
    subjects: {
      a: 'One thing I noticed about GPU financing',
      b: 'Relevant to {{companyName}} — GPU residual value',
    },
    audienceTypes: ['operator', 'lender', 'arranger'],
    sequenceDay: 7,
    isInitial: false,
  },
  follow_up_3: {
    name: 'Follow-up #3 — Closing the Loop',
    file: 'follow_up_3.hbs',
    subjects: {
      a: 'Closing the loop — {{companyName}}',
      b: 'Last note from Corgi',
    },
    audienceTypes: ['operator', 'lender', 'arranger'],
    sequenceDay: 14,
    isInitial: false,
  },
  warm_intro: {
    name: 'Warm Intro — Referral / Mutual Connection',
    file: 'warm_intro.hbs',
    subjects: {
      a: 'Introduction via {{referrerName}}',
      b: '{{referrerName}} suggested I reach out',
    },
    audienceTypes: ['operator', 'lender', 'arranger'],
    sequenceDay: 0,
    isInitial: true,
  },
  meeting_confirmation: {
    name: 'Meeting Confirmation — Post-Call',
    file: 'meeting_confirmation.hbs',
    subjects: {
      a: 'Corgi Insurance Services — Meeting Confirmed',
      b: 'Corgi Insurance Services — Meeting Confirmed',
    },
    audienceTypes: ['operator', 'lender', 'arranger'],
    sequenceDay: 0,
    isInitial: false,
  },
};

// ── Compiled template cache ───────────────────────────────────────────────────
const _cache = {};

/**
 * Load and compile a Handlebars template by slug.
 * Results are cached after first load.
 * @param {string} slug — key in TEMPLATE_REGISTRY
 * @returns {HandlebarsTemplateDelegate}
 */
function _loadTemplate(slug) {
  if (_cache[slug]) return _cache[slug];
  const meta = TEMPLATE_REGISTRY[slug];
  if (!meta) throw new Error(`Unknown template slug: "${slug}"`);

  const filePath = path.join(TEMPLATES_DIR, meta.file);
  const source = fs.readFileSync(filePath, 'utf8');
  _cache[slug] = Handlebars.compile(source);
  return _cache[slug];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

Handlebars.registerHelper('if', function (conditional, options) {
  if (conditional) return options.fn(this);
  return options.inverse(this);
});

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * List all registered templates (for the API layer).
 * @returns {Array<Object>}
 */
function listTemplates() {
  return Object.entries(TEMPLATE_REGISTRY).map(([slug, meta]) => ({
    slug,
    name: meta.name,
    subjects: meta.subjects,
    audienceTypes: meta.audienceTypes,
    sequenceDay: meta.sequenceDay,
    isInitial: meta.isInitial,
  }));
}

/**
 * Get metadata for a single template.
 * @param {string} slug
 * @returns {Object}
 */
function getTemplateMeta(slug) {
  const meta = TEMPLATE_REGISTRY[slug];
  if (!meta) throw new Error(`Unknown template slug: "${slug}"`);
  return { slug, ...meta };
}

/**
 * Select the best template slug for a given audience type and sequence position.
 * @param {string} audienceType — 'operator' | 'lender' | 'arranger'
 * @param {number} sequenceDay  — 0 = initial, 3 / 7 / 14 = follow-ups
 * @param {boolean} [isWarm]    — true if referral / warm intro
 * @returns {string} slug
 */
function selectTemplate(audienceType, sequenceDay = 0, isWarm = false) {
  if (isWarm && sequenceDay === 0) return 'warm_intro';

  if (sequenceDay === 0) {
    const map = {
      operator: 'cold_intro_operator',
      lender: 'cold_intro_lender',
      arranger: 'cold_intro_arranger',
    };
    return map[audienceType] || 'cold_intro_operator';
  }

  if (sequenceDay <= 3) return 'follow_up_1';
  if (sequenceDay <= 7) return 'follow_up_2';
  return 'follow_up_3';
}

/**
 * Render a template into HTML and plain-text strings.
 *
 * @param {string} slug        — template key
 * @param {Object} data        — personalization tokens
 * @param {string} [abVariant] — 'a' or 'b' (default: 'a')
 * @returns {{ subject: string, html: string, text: string }}
 */
function render(slug, data = {}, abVariant = 'a') {
  const meta = getTemplateMeta(slug);
  const compiledTemplate = _loadTemplate(slug);

  // Render subject (subject lines can themselves contain tokens)
  const rawSubject = meta.subjects[abVariant] || meta.subjects.a;
  const subjectTemplate = Handlebars.compile(rawSubject);
  const subject = subjectTemplate(data).trim();

  // Render HTML body
  const html = compiledTemplate({ ...data, isHtml: true }).trim();

  // Render plain-text body
  const text = compiledTemplate({ ...data, isHtml: false }).trim();

  return { subject, html, text };
}

module.exports = {
  TEMPLATE_REGISTRY,
  listTemplates,
  getTemplateMeta,
  selectTemplate,
  render,
};
