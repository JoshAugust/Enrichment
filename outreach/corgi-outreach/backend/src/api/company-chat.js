/**
 * api/company-chat.js — AI chat endpoint for company context Q&A
 *
 * POST /api/companies/:id/chat
 * Streams a response from Anthropic Claude using full company context.
 */

'use strict';

const express = require('express');
const { db } = require('../db');

const router = express.Router();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

// ── Build system prompt from company data ─────────────────────────────────────
function buildSystemPrompt(company, contacts, researchNotes, callScripts, emailDrafts, outreachLog) {
  const lines = [];

  lines.push(
    'You are an AI sales assistant for Corgi Outreach. You help analyze companies that might be ' +
    'prospects for GPU Residual Value Guaranty (RVG) insurance — a policy that guarantees a floor ' +
    'on GPU hardware value at the end of a financing term, protecting lenders and enabling operators ' +
    'to secure better financing terms.\n'
  );

  lines.push('Here is the full context for this company:\n');

  // ── Core fields ──
  lines.push(`[Company Name]: ${company.name || '(unknown)'}`);
  lines.push(`[Type]: ${company.type || '(unknown)'} | [Priority]: ${company.priority || '(unknown)'} | [Score]: ${company.qualification_score ?? 'N/A'}/100`);
  if (company.website)             lines.push(`[Website]: ${company.website}`);
  if (company.description)         lines.push(`[Description]: ${company.description}`);
  if (company.industry_segment)    lines.push(`[Industry Segment]: ${company.industry_segment}`);
  if (company.estimated_gpu_scale) lines.push(`[GPU Scale]: ${company.estimated_gpu_scale}`);
  if (company.financing_status)    lines.push(`[Financing Status]: ${company.financing_status}`);
  if (company.employee_count)      lines.push(`[Employee Count]: ${company.employee_count}`);
  if (company.hq_location)         lines.push(`[HQ]: ${company.hq_location}`);
  if (company.founded_year)        lines.push(`[Founded]: ${company.founded_year}`);
  if (company.total_raised)        lines.push(`[Total Raised]: ${company.total_raised}`);
  if (company.last_funding_round)  lines.push(`[Last Funding Round]: ${company.last_funding_round}`);
  if (company.investors)           lines.push(`[Investors]: ${company.investors}`);
  if (company.outreach_status)     lines.push(`[Outreach Status]: ${company.outreach_status}`);
  if (company.manual_call_made !== undefined && company.manual_call_made !== null) {
    lines.push(`[Manual Call Made]: ${company.manual_call_made ? 'Yes' : 'No'}`);
  }
  if (company.notes)               lines.push(`[Notes]: ${company.notes}`);

  lines.push('');

  // ── Contacts ──
  if (contacts && contacts.length > 0) {
    lines.push('[Contacts]:');
    for (const c of contacts) {
      const parts = [c.name || '(unnamed)'];
      if (c.title) parts.push(c.title);
      if (c.email) parts.push(c.email);
      if (c.phone) parts.push(`📞 ${c.phone}`);
      if (c.linkedin_url) parts.push(`LinkedIn: ${c.linkedin_url}`);
      const verified = c.verified ? ' ✓' : '';
      lines.push(`  - ${parts.join(' — ')}${verified}`);
    }
    lines.push('');
  } else {
    lines.push('[Contacts]: None on file\n');
  }

  // ── Research notes ──
  if (researchNotes && researchNotes.length > 0) {
    lines.push('[Research Notes]:');
    for (const note of researchNotes) {
      if (note.summary) lines.push(`  [${note.created_at || 'unknown date'}] ${note.summary}`);
    }
    lines.push('');
  } else {
    lines.push('[Research Notes]: None\n');
  }

  // ── Call scripts ──
  if (callScripts && callScripts.length > 0) {
    lines.push('[Call Scripts]:');
    for (const script of callScripts) {
      lines.push(`  [Version ${script.script_version || '?'} | Type: ${script.buyer_type || '?'}]`);
      if (script.customized_script) {
        try {
          const parsed = JSON.parse(script.customized_script);
          // Flatten meaningful text fields from the script object
          const extractText = (obj, depth = 0) => {
            if (depth > 3) return;
            if (typeof obj === 'string') {
              lines.push(`    ${obj.slice(0, 500)}`);
            } else if (Array.isArray(obj)) {
              obj.forEach(item => extractText(item, depth + 1));
            } else if (obj && typeof obj === 'object') {
              for (const [key, val] of Object.entries(obj)) {
                if (['id', 'version', 'buyer_type', 'company_id'].includes(key)) continue;
                if (typeof val === 'string' && val.length > 0) {
                  lines.push(`    ${key}: ${val.slice(0, 300)}`);
                } else if (typeof val === 'object' && val !== null) {
                  extractText(val, depth + 1);
                }
              }
            }
          };
          extractText(parsed);
        } catch {
          lines.push(`    ${String(script.customized_script).slice(0, 600)}`);
        }
      }
    }
    lines.push('');
  } else {
    lines.push('[Call Scripts]: None generated yet\n');
  }

  // ── Email drafts ──
  if (emailDrafts && emailDrafts.length > 0) {
    lines.push('[Email Drafts]:');
    for (const draft of emailDrafts) {
      if (draft.subject) lines.push(`  Subject: ${draft.subject}`);
      if (draft.body_text || draft.body_html) {
        const body = draft.body_text || draft.body_html || '';
        lines.push(`  Body: ${body.slice(0, 400)}`);
      }
      if (draft.status) lines.push(`  Status: ${draft.status}`);
      lines.push('');
    }
  } else {
    lines.push('[Email Drafts]: None\n');
  }

  // ── Outreach log ──
  if (outreachLog && outreachLog.length > 0) {
    lines.push('[Outreach Log]:');
    for (const entry of outreachLog) {
      const contactName = entry.contact_name || entry.contact_email || 'unknown';
      lines.push(`  [${entry.created_at || '?'}] ${entry.channel || '?'} → ${contactName}: ${entry.status || '?'}`);
      if (entry.notes) lines.push(`    Notes: ${entry.notes}`);
    }
    lines.push('');
  } else {
    lines.push('[Outreach Log]: No outreach recorded\n');
  }

  lines.push(
    'Answer questions about this company helpfully. You can suggest pitch angles, analyze their fit, ' +
    'identify red flags, suggest talking points, draft messages, or provide any analysis the user asks for. ' +
    'Be concise, specific, and actionable.'
  );

  return lines.join('\n');
}

// ── POST /api/companies/:id/chat ──────────────────────────────────────────────
router.post('/:id/chat', async (req, res) => {
  // Check API key first
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'ANTHROPIC_API_KEY is not configured. Set it in your .env file.',
    });
  }

  try {
    // ── Fetch company data ──
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const contacts = db
      .prepare('SELECT * FROM contacts WHERE company_id = ? ORDER BY verified DESC')
      .all(company.id);
    const researchNotes = db
      .prepare('SELECT * FROM research_notes WHERE company_id = ? ORDER BY created_at DESC LIMIT 5')
      .all(company.id);
    const callScripts = db
      .prepare('SELECT * FROM call_scripts WHERE company_id = ? ORDER BY created_at DESC')
      .all(company.id);
    const emailDrafts = db
      .prepare(`
        SELECT ed.* FROM email_drafts ed
        JOIN contacts c ON c.id = ed.contact_id
        WHERE c.company_id = ?
        ORDER BY ed.created_at DESC
      `)
      .all(company.id);
    const outreachLog = db
      .prepare(`
        SELECT ol.*, c.name as contact_name, c.email as contact_email
        FROM outreach_log ol
        JOIN contacts c ON c.id = ol.contact_id
        WHERE c.company_id = ?
        ORDER BY ol.created_at DESC
        LIMIT 20
      `)
      .all(company.id);

    // ── Parse request body ──
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: '"message" is required and must be a non-empty string' });
    }

    // ── Build system prompt ──
    const systemPrompt = buildSystemPrompt(
      company, contacts, researchNotes, callScripts, emailDrafts, outreachLog
    );

    // ── Assemble messages array ──
    // history should be [{role, content}, ...] already in Anthropic format
    const messages = [
      ...history.filter(m => m && m.role && m.content),
      { role: 'user', content: message.trim() },
    ];

    // ── Set up SSE headers ──
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if present
    res.flushHeaders();

    // ── Call Anthropic API (streaming) ──
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('[company-chat] Anthropic API error:', anthropicRes.status, errBody);
      res.write(`data: ${JSON.stringify({ error: `Anthropic API error: ${anthropicRes.status}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // ── Stream SSE events ──
    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete chunk

        for (const part of parts) {
          const lines = part.split('\n');
          let eventType = null;
          let eventData = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (eventType === 'content_block_delta' && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              const text = parsed?.delta?.text;
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
            } catch {
              // ignore malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[company-chat] Error:', err);
    // If headers already sent (streaming started), send error as SSE event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
