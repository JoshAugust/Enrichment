/**
 * gmail-transport.js — Free email sending via Gmail SMTP + Nodemailer
 *
 * No paid API needed. Uses Google App Password (free, takes 2 min to set up).
 * Limit: ~500 emails/day on free Gmail, which is more than enough for outreach.
 *
 * Setup:
 *   1. Enable 2FA on your Google account (if not already)
 *   2. Go to: https://myaccount.google.com/apppasswords
 *   3. Generate an App Password for "Mail"
 *   4. Set GMAIL_APP_PASSWORD in your .env
 *
 * Environment variables:
 *   GMAIL_USER          — your Gmail address (defaults to FROM_EMAIL)
 *   GMAIL_APP_PASSWORD  — 16-character app password from Google
 */

'use strict';

const nodemailer = require('nodemailer');

let _transport = null;

/**
 * Check if Gmail SMTP is configured.
 * @returns {boolean}
 */
function isConfigured() {
  return !!(process.env.GMAIL_APP_PASSWORD);
}

/**
 * Get or create the Gmail SMTP transport.
 * @param {string} [user] - Gmail address (defaults to GMAIL_USER or FROM_EMAIL env)
 * @returns {import('nodemailer').Transporter}
 */
function getTransport(user) {
  if (_transport) return _transport;

  const gmailUser = user || process.env.GMAIL_USER || process.env.FROM_EMAIL;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!appPassword) {
    throw new Error(
      'GMAIL_APP_PASSWORD not set. Generate one at https://myaccount.google.com/apppasswords'
    );
  }

  _transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: appPassword,
    },
  });

  console.log(`[gmail-transport] SMTP transport ready for ${gmailUser}`);
  return _transport;
}

/**
 * Send an email via Gmail SMTP.
 *
 * @param {Object} opts
 * @param {string} opts.from    - "Name <email>" format
 * @param {string|string[]} opts.to - Recipient(s)
 * @param {string} opts.subject
 * @param {string} [opts.html]  - HTML body
 * @param {string} [opts.text]  - Plain text body
 * @returns {Promise<{id: string, accepted: string[]}>}
 */
async function send({ from, to, subject, html, text }) {
  const transport = getTransport();

  const result = await transport.sendMail({
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text,
  });

  console.log(`[gmail-transport] Sent to ${to} — messageId: ${result.messageId}`);

  return {
    id: result.messageId,
    accepted: result.accepted || [],
  };
}

/**
 * Verify the SMTP connection is working.
 * @returns {Promise<boolean>}
 */
async function verify() {
  try {
    const transport = getTransport();
    await transport.verify();
    return true;
  } catch (err) {
    console.error(`[gmail-transport] Verification failed: ${err.message}`);
    return false;
  }
}

module.exports = {
  isConfigured,
  getTransport,
  send,
  verify,
};
