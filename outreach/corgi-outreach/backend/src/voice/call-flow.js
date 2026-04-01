/**
 * call-flow.js — Conversational call flow engine for Corgi Outreach
 *
 * Parses script versions A–E from the PLAYBOOK and builds decision trees
 * for dynamic, branch-aware call flows. Selects the right version based on
 * company type (operator / lender / arranger).
 *
 * Outputs a fully-structured call plan JSON ready for call-manager.js.
 */

'use strict';

// ── Script Definitions ───────────────────────────────────────────────────────
// Sourced directly from PLAYBOOK.md — Version A through E

const SCRIPTS = {
  A: {
    name: 'Cheaper Capital',
    targetTypes: ['operator'],
    lines: [
      'We help GPU owners get cheaper debt by reducing future collateral risk on the GPUs.',
      'Is financing new GPU capacity a priority for you this year?',
      'We work with structures that give lenders more comfort on residual value at maturity.',
      'That can help improve leverage, tenor, or pricing.',
      'Would it be useful to show you how this could fit into an existing or upcoming financing package?',
    ],
    cta: 'Would it be useful to show you how this could fit into an existing or upcoming financing package?',
  },
  B: {
    name: 'Better Debt Structure',
    targetTypes: ['arranger'],
    lines: [
      'We help AI infrastructure operators get a better debt structure on GPU purchases.',
      'A lot of lenders still get stuck on one question: what are the GPUs worth at maturity?',
      'We solve for that part of the underwriting problem.',
      'If this is relevant, I would like to set up 20 minutes with Isaac and Josh.',
      'Would next week work?',
    ],
    cta: 'Would next week work?',
  },
  C: {
    name: 'Lender Angle',
    targetTypes: ['lender'],
    lines: [
      'We help lenders make more GPU-backed loans with better downside protection on the hardware.',
      'Are you currently looking at AI infrastructure or GPU-backed credit opportunities?',
      'We are building a residual value solution that gives lenders a clearer floor on collateral value.',
      'It is meant to make the deal easier to underwrite, not add complexity.',
      'Open to a short call to see if it fits your credit box?',
    ],
    cta: 'Open to a short call to see if it fits your credit box?',
  },
  D: {
    name: 'Operator Pain',
    targetTypes: ['operator'],
    lines: [
      'We help data centers finance more GPUs without taking as much pricing pain from residual value uncertainty.',
      'Some lenders love the demand story but hesitate on end-of-term hardware value.',
      'We address that issue directly.',
      'If you are raising debt or expect to, this could be relevant.',
      'Can I book a short call with the founders?',
    ],
    cta: 'Can I book a short call with the founders?',
  },
  E: {
    name: 'Simple CTA',
    targetTypes: ['operator', 'lender', 'arranger', 'default'],
    lines: [
      'We help reduce the cost of capital for GPU infrastructure.',
      'The reason is simple: lenders get more comfort on future hardware value.',
      'If you are financing clusters, this may help.',
      'I am not trying to sell you a policy on this call.',
      'I just want to see whether a 20-minute discussion is worth it.',
    ],
    cta: 'I just want to see whether a 20-minute discussion is worth it.',
  },
};

// ── Follow-up Questions ──────────────────────────────────────────────────────

const FOLLOW_UP_QUESTIONS = [
  {
    id: 'financing_type',
    question: 'Are you financing owned GPUs, leased GPUs, or both?',
    triggers: ['owned', 'leased', 'both', 'finance', 'financing'],
  },
  {
    id: 'decision_maker',
    question:
      'Who usually leads those conversations: treasury, infra, CFO, or a financing partner?',
    triggers: ['who', 'person', 'lead', 'team', 'contact'],
  },
  {
    id: 'lender_friction',
    question: 'Do lenders push back more on leverage, tenor, or pricing?',
    triggers: ['lender', 'bank', 'push', 'leverage', 'tenor', 'pricing', 'cost'],
  },
  {
    id: 'current_lender_concern',
    question: 'Do you already have a lender asking about collateral value at maturity?',
    triggers: ['collateral', 'maturity', 'value', 'residual', 'concern'],
  },
  {
    id: 'scope',
    question:
      'Would you look at this for the next cluster only, or as a standard financing tool?',
    triggers: ['next', 'cluster', 'standard', 'scale', 'expand'],
  },
];

// ── Objection Handlers ───────────────────────────────────────────────────────

const OBJECTION_HANDLERS = {
  not_interested: {
    triggers: ['not interested', 'no thanks', 'don\'t need', 'pass', 'not relevant'],
    response:
      'Understood. Just to leave you with the short version: we reduce lender concern on GPU residual value, which can improve your financing terms. If that ever becomes relevant, I am happy to reconnect.',
    followUp: null,
    escalate: false,
  },
  too_early: {
    triggers: ['too early', 'not yet', 'not now', 'future', 'later'],
    response:
      'That makes sense. Most of our conversations start 6 to 12 months before a financing process. If timing shifts, I would welcome the chance to reconnect then.',
    followUp: 'Would it be okay to follow up in a few months?',
    escalate: false,
  },
  what_is_this: {
    triggers: ['what is this', 'what exactly', 'explain', 'what do you do', 'tell me more'],
    response:
      'It is a residual value solution for data-center GPUs. The simple purpose is to reduce lender downside on future hardware value. That can help make debt cheaper or easier to raise. On the next call, Isaac and Josh can walk through how it works in the financing stack.',
    followUp:
      'Does that sound like something worth a 20-minute conversation with the founders?',
    escalate: false,
  },
  send_info: {
    triggers: ['send me', 'email', 'deck', 'materials', 'information', 'brochure'],
    response:
      'Absolutely. I will send over a short overview after this call. It covers the problem we solve and how the structure works. Would it help if I set up 20 minutes with the founders alongside the email?',
    followUp: null,
    escalate: false,
  },
  who_are_you: {
    triggers: ['who are you', 'which company', 'what company', 'corgi'],
    response:
      'I am calling from Corgi. We work with GPU owners and their lenders to reduce residual value risk on hardware. That typically helps with financing terms — better leverage, longer tenor, lower spread.',
    followUp: null,
    escalate: false,
  },
  already_financed: {
    triggers: ['already financed', 'have a lender', 'sorted', 'covered'],
    response:
      'Good to hear. A lot of the conversations we have are about improving existing structures or preparing for the next facility. If you are raising again, it may be worth a quick conversation.',
    followUp:
      'Would it make sense to flag this for your next financing round?',
    escalate: false,
  },
  wrong_person: {
    triggers: ['wrong person', 'not my area', 'not me', 'someone else'],
    response:
      'No problem. Who would be the right person to speak with about financing or capital structure?',
    followUp: null,
    escalate: true,
  },
};

// ── Script Selector ──────────────────────────────────────────────────────────

/**
 * Select the best script version for a company based on its type.
 *
 * Selection logic:
 *   - operator  → A (primary) or D (alternate)
 *   - lender    → C
 *   - arranger  → B
 *   - default   → E
 *
 * @param {string} companyType  - 'operator' | 'lender' | 'arranger'
 * @param {string} [preference] - Optional override: 'A'|'B'|'C'|'D'|'E'
 * @returns {{ version: string, script: Object }}
 */
function selectScript(companyType, preference = null) {
  if (preference && SCRIPTS[preference]) {
    return { version: preference, script: SCRIPTS[preference] };
  }

  const type = (companyType || '').toLowerCase();

  let version;
  if (type === 'operator') {
    version = 'A'; // Default operator version; D is the alternate
  } else if (type === 'lender') {
    version = 'C';
  } else if (type === 'arranger') {
    version = 'B';
  } else {
    version = 'E';
  }

  return { version, script: SCRIPTS[version] };
}

// ── Decision Tree Builder ────────────────────────────────────────────────────

/**
 * Build a full decision tree for a script version.
 * The tree encodes each call stage as a node with:
 *   - id          : unique stage identifier
 *   - type        : 'speak' | 'listen' | 'branch' | 'end'
 *   - text        : what to say (for 'speak' nodes)
 *   - branches    : array of {condition, nextNodeId} (for 'branch' nodes)
 *   - defaultNext : fallback next node if no branch matches
 *
 * @param {string} version  - Script version A-E
 * @returns {Object}        - { nodes: {[id]: node}, startNode: string }
 */
function buildDecisionTree(version) {
  const script = SCRIPTS[version];
  if (!script) throw new Error(`[call-flow] Unknown script version: ${version}`);

  const nodes = {};

  // ── Stage 1: Intro greeting ──────────────────────────────────────────────
  nodes['intro'] = {
    id: 'intro',
    type: 'speak',
    text: script.lines[0],
    pauseAfterMs: 300,
    defaultNext: 'listen_interest',
  };

  // ── Stage 2: Listen for interest signal ─────────────────────────────────
  nodes['listen_interest'] = {
    id: 'listen_interest',
    type: 'listen',
    promptUser: script.lines[1] || null,
    speechTimeout: 5,
    branches: [
      {
        condition: 'positive',
        keywords: ['yes', 'interested', 'tell me more', 'sure', 'go ahead', 'okay', 'sounds good'],
        nextNodeId: 'value_prop',
      },
      {
        condition: 'objection',
        keywords: Object.values(OBJECTION_HANDLERS).flatMap((h) => h.triggers),
        nextNodeId: 'handle_objection',
      },
      {
        condition: 'what_is_this',
        keywords: OBJECTION_HANDLERS.what_is_this.triggers,
        nextNodeId: 'explain_product',
      },
    ],
    defaultNext: 'value_prop',
  };

  // ── Stage 3: Value proposition ───────────────────────────────────────────
  nodes['value_prop'] = {
    id: 'value_prop',
    type: 'speak',
    text: [script.lines[2], script.lines[3]].filter(Boolean).join(' '),
    pauseAfterMs: 500,
    defaultNext: 'cta',
  };

  // ── Stage 4: CTA ─────────────────────────────────────────────────────────
  nodes['cta'] = {
    id: 'cta',
    type: 'speak',
    text: script.cta,
    pauseAfterMs: 200,
    defaultNext: 'listen_cta',
  };

  // ── Stage 5: Listen for CTA response ────────────────────────────────────
  nodes['listen_cta'] = {
    id: 'listen_cta',
    type: 'listen',
    speechTimeout: 8,
    branches: [
      {
        condition: 'accepts',
        keywords: ['yes', 'sure', 'okay', 'sounds good', 'works', 'next week', 'book', 'schedule'],
        nextNodeId: 'book_call',
      },
      {
        condition: 'asks_question',
        keywords: ['what', 'how', 'why', 'explain', 'tell me', 'curious'],
        nextNodeId: 'handle_followup',
      },
      {
        condition: 'declines',
        keywords: ['no', 'not now', 'too busy', 'not interested', 'pass'],
        nextNodeId: 'soft_close',
      },
    ],
    defaultNext: 'soft_close',
  };

  // ── Product explanation (for "What exactly is this?") ───────────────────
  nodes['explain_product'] = {
    id: 'explain_product',
    type: 'speak',
    text: OBJECTION_HANDLERS.what_is_this.response,
    pauseAfterMs: 300,
    defaultNext: 'cta',
  };

  // ── Objection handler (dynamic — resolved at runtime) ───────────────────
  nodes['handle_objection'] = {
    id: 'handle_objection',
    type: 'branch',
    description: 'Route to appropriate objection response based on detected intent',
    // Specific objection nodes below
    branches: [
      { condition: 'not_interested', nextNodeId: 'objection_not_interested' },
      { condition: 'too_early', nextNodeId: 'objection_too_early' },
      { condition: 'send_info', nextNodeId: 'objection_send_info' },
      { condition: 'who_are_you', nextNodeId: 'objection_who_are_you' },
      { condition: 'already_financed', nextNodeId: 'objection_already_financed' },
      { condition: 'wrong_person', nextNodeId: 'objection_wrong_person' },
    ],
    defaultNext: 'objection_not_interested',
  };

  // Generate an objection response node for each handler
  for (const [key, handler] of Object.entries(OBJECTION_HANDLERS)) {
    nodes[`objection_${key}`] = {
      id: `objection_${key}`,
      type: 'speak',
      text: handler.response,
      pauseAfterMs: 400,
      defaultNext: handler.followUp
        ? `followup_${key}`
        : handler.escalate
        ? 'escalate_to_human'
        : 'end',
    };

    if (handler.followUp) {
      nodes[`followup_${key}`] = {
        id: `followup_${key}`,
        type: 'speak',
        text: handler.followUp,
        pauseAfterMs: 200,
        defaultNext: 'end',
      };
    }
  }

  // ── Follow-up questions handler ──────────────────────────────────────────
  nodes['handle_followup'] = {
    id: 'handle_followup',
    type: 'speak',
    text:
      'Great question. ' + FOLLOW_UP_QUESTIONS[0].question,
    pauseAfterMs: 300,
    defaultNext: 'cta',
  };

  // ── Book the call ─────────────────────────────────────────────────────────
  nodes['book_call'] = {
    id: 'book_call',
    type: 'speak',
    text:
      'Excellent. I will send you a calendar invite right after this call with a 20-minute slot with Isaac and Josh. Is there a preferred time — morning or afternoon?',
    pauseAfterMs: 500,
    defaultNext: 'confirm_booking',
  };

  nodes['confirm_booking'] = {
    id: 'confirm_booking',
    type: 'speak',
    text:
      'Perfect. You will receive the invite shortly. Thank you for your time, and we look forward to speaking with you.',
    pauseAfterMs: 0,
    defaultNext: 'end',
  };

  // ── Soft close ────────────────────────────────────────────────────────────
  nodes['soft_close'] = {
    id: 'soft_close',
    type: 'speak',
    text:
      'Understood. I will send you a short overview by email so you can review it on your own time. If it sparks any questions, feel free to reach out.',
    pauseAfterMs: 0,
    defaultNext: 'end',
  };

  // ── Escalate to human ─────────────────────────────────────────────────────
  nodes['escalate_to_human'] = {
    id: 'escalate_to_human',
    type: 'speak',
    text:
      'Thank you — I will make a note and have the right person from our team follow up directly.',
    pauseAfterMs: 0,
    defaultNext: 'end',
  };

  // ── End node ─────────────────────────────────────────────────────────────
  nodes['end'] = {
    id: 'end',
    type: 'end',
    text: 'Thank you for your time. Have a great day.',
  };

  return { nodes, startNode: 'intro' };
}

// ── Call Plan Generator ──────────────────────────────────────────────────────

/**
 * Generate a complete, structured call plan for a target company.
 *
 * @param {Object} opts
 * @param {string} opts.companyId       - Company UUID
 * @param {string} opts.companyName     - Display name
 * @param {string} opts.companyType     - 'operator' | 'lender' | 'arranger'
 * @param {string} [opts.contactName]   - Contact's name for personalization
 * @param {string} [opts.contactTitle]  - Contact's job title
 * @param {string} [opts.scriptVersion] - Force a specific version A-E
 * @returns {Object}                    - Full call plan JSON
 */
function generateCallPlan(opts = {}) {
  const {
    companyId,
    companyName,
    companyType,
    contactName,
    contactTitle,
    scriptVersion,
  } = opts;

  if (!companyId) throw new Error('[call-flow] generateCallPlan(): companyId is required');
  if (!companyType) throw new Error('[call-flow] generateCallPlan(): companyType is required');

  const { version, script } = selectScript(companyType, scriptVersion);
  const decisionTree = buildDecisionTree(version);

  // Personalize the intro if we have contact info
  let intro = script.lines[0];
  if (contactName) {
    intro = `Hi ${contactName}, ` + intro.charAt(0).toLowerCase() + intro.slice(1);
  }

  // Inject personalized intro into the tree
  decisionTree.nodes['intro'].text = intro;

  const plan = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    target: {
      companyId,
      companyName: companyName || 'Unknown Company',
      companyType,
      contactName: contactName || null,
      contactTitle: contactTitle || null,
    },
    script: {
      version,
      name: script.name,
      lines: script.lines,
      cta: script.cta,
    },
    decisionTree,
    followUpQuestions: FOLLOW_UP_QUESTIONS,
    objectionHandlers: OBJECTION_HANDLERS,
    metadata: {
      estimatedCallDurationSeconds: 90,
      scriptVersion: version,
      companyType,
    },
  };

  return plan;
}

// ── Runtime: Match response to branch ───────────────────────────────────────

/**
 * Given a spoken response string and a listen node, return the matching branch.
 * Used at call runtime to navigate the decision tree.
 *
 * @param {string} spokenText
 * @param {Object} listenNode   - A node of type 'listen'
 * @returns {string}            - nextNodeId for the matched branch
 */
function matchBranch(spokenText, listenNode) {
  if (!spokenText || !listenNode.branches) return listenNode.defaultNext;

  const lower = spokenText.toLowerCase();

  for (const branch of listenNode.branches) {
    const matched = branch.keywords.some((kw) => lower.includes(kw));
    if (matched) return branch.nextNodeId;
  }

  return listenNode.defaultNext;
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  SCRIPTS,
  FOLLOW_UP_QUESTIONS,
  OBJECTION_HANDLERS,
  selectScript,
  buildDecisionTree,
  generateCallPlan,
  matchBranch,
};
