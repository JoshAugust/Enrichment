/**
 * voicemail-handler.js — Voicemail drop message templates
 *
 * Provides pre-scripted voicemail messages for each company type.
 * Messages are ~20 seconds when read aloud at a natural pace.
 * All messages end with an email follow-up — no callback number
 * (the AI agent cannot receive inbound calls).
 */

'use strict';

// ── Message templates by company type ────────────────────────────────────────

const VOICEMAIL_TEMPLATES = {
  /**
   * GPU operators — data centers, cloud HPC, GPU rental platforms.
   * Angle: lower cost of capital on GPU-backed financing.
   */
  operator: (companyName, contactName) =>
    `Hi ${contactName}, this is calling from Corgi Insurance Services regarding your GPU infrastructure at ${companyName}. ` +
    `We've developed a residual value guaranty product that's helping operators like you lower their cost of capital on GPU-backed financing. ` +
    `It works by insuring the floor value of your GPU fleet, which gives lenders the confidence to offer better terms. ` +
    `I'll follow up with an email with the details. Looking forward to connecting.`,

  /**
   * Lenders — banks, credit funds, ABL lenders with GPU collateral exposure.
   * Angle: collateral quality, effective LTV, reserve relief.
   */
  lender: (companyName, contactName) =>
    `Hi ${contactName}, this is from Corgi Insurance Services. ` +
    `We're reaching out to lenders like ${companyName} who are active in GPU-backed credit facilities. ` +
    `We've developed a residual value guaranty product that improves effective LTV on GPU collateral and can reduce reserve requirements on your book. ` +
    `It's a straightforward insurance wrapper — similar in concept to auto and equipment residual value coverage. ` +
    `I'll follow up with an email outlining the structure. Thank you for your time.`,

  /**
   * Arrangers and reinsurers — investment banks, specialty re/insurers.
   * Angle: novel reinsurance capacity opportunity, structured like auto RV.
   */
  arranger: (companyName, contactName) =>
    `Hi ${contactName}, this is from Corgi Insurance Services. ` +
    `We're placing reinsurance capacity for a GPU residual value guaranty program — similar structure to auto and equipment RV insurance, but covering high-performance compute hardware. ` +
    `Institutional demand for this coverage is strong and growing, and we're looking for the right reinsurance partners to help us scale capacity. ` +
    `I'll follow up with our program brief. Thank you.`,

  /**
   * Fallback for unrecognised type — generic Corgi intro.
   */
  default: (companyName, contactName) =>
    `Hi ${contactName}, this is from Corgi Insurance Services. ` +
    `We've developed a GPU residual value guaranty product for infrastructure operators, lenders, and reinsurers active in the GPU financing space. ` +
    `I believe there may be a relevant fit for ${companyName} and I'd love to explore that briefly. ` +
    `I'll follow up with an email with more context. Thank you.`,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a voicemail drop message string for the given company type.
 *
 * @param {string} companyType  - 'operator' | 'lender' | 'arranger' | 'reinsurer'
 * @param {string} companyName  - Display name of the target company
 * @param {string} contactName  - First (or full) name of the contact
 * @returns {string}            - Rendered message ready for TTS / Vapi injection
 */
function getVoicemailMessage(companyType, companyName, contactName) {
  const name = contactName || 'there';
  const company = companyName || 'your organization';

  // Normalise type — 'reinsurer' maps to 'arranger' template
  const normalised = companyType === 'reinsurer' ? 'arranger' : (companyType || 'default');
  const templateFn = VOICEMAIL_TEMPLATES[normalised] || VOICEMAIL_TEMPLATES.default;

  return templateFn(company, name);
}

/**
 * Returns all available voicemail templates rendered with placeholder labels,
 * useful for preview/testing endpoints.
 *
 * @returns {Object} Map of type → rendered message
 */
function getAllVoicemailPreviews() {
  return Object.fromEntries(
    Object.keys(VOICEMAIL_TEMPLATES).map(type => [
      type,
      VOICEMAIL_TEMPLATES[type]('{company}', '{contact_name}'),
    ])
  );
}

module.exports = { getVoicemailMessage, getAllVoicemailPreviews };
