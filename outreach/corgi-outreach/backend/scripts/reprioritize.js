const Database = require('better-sqlite3');
const db = new Database('data/corgi_outreach.db');

// ── Parse funding amounts → millions ──
function parseRaisedM(r) {
  if (!r) return null;
  const s = r.toLowerCase();
  if (/n\/a|undisclosed|public|self-fund|subsidiary|bootstrapped|sovereign|telco|reliance|macquarie|edf|ntt/.test(s)) return null;
  const m = s.match(/([\d.]+)\s*(b|m|k)?/);
  if (!m) return null;
  let val = parseFloat(m[1]);
  if (m[2] === 'b') val *= 1000;
  else if (m[2] === 'k') val *= 0.001;
  return val;
}

// ── Parse GPU count ──
function parseGPUs(g) {
  if (!g) return null;
  const m = g.match(/([\d,]+)\+?\s*(gpu|h100|h200|lpu|rdu)?/i);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''));
}

// ── Detect mega-companies by name ──
const MEGA_COMPANIES = [
  'coreweave', 'lambda', 'nebius', 'crusoe', 'equinix', 'digital realty',
  'vantage', 'aligned', 'switch', 'ntt', 'qts', 'compass', 'stack infra',
  'humain', 'g42', 'cerebras', 'sambanova', 'groq', 'modal',
  // Mega lenders/banks
  'nvidia capital', 'dell financial', 'hewlett packard', 'hpfs',
  'orix', 'magnetar', 'victory park', 'digital alpha',
  'blackstone', 'kkr', 'apollo global', 'ares management', 'pimco',
  'blackrock', 'carlyle', 'goldman sachs', 'jp morgan', 'oaktree',
  'hps investment', 'blue owl', 'fortress', 'stonepeak', 'golub',
  'sixth street',
  // Mega reinsurers
  'everest re', 'axis capital', 'arch capital', 'renaissance', 'partnerre',
  'sompo', 'markel', 'lancashire', 'hiscox', 'convex', 'fidelis',
  'hamilton insurance', 'aspen insurance',
];

function isMega(name) {
  const n = name.toLowerCase();
  return MEGA_COMPANIES.some(m => n.includes(m));
}

// ── Niche/specialty indicators (these are GOOD for us) ──
const NICHE_KEYWORDS = [
  'gpu financ', 'equipment finance', 'tech lend', 'venture debt',
  'specialty', 'residual value', 'rvi', 'innovation bank',
  'vertical data', 'slyd', 'upper90', 'wingspire', 'tacora',
  'gpu', 'ai infra', 'compute'
];

function isNiche(name, desc) {
  const combined = (name + ' ' + (desc || '')).toLowerCase();
  return NICHE_KEYWORDS.some(k => combined.includes(k));
}

const all = db.prepare(`SELECT id, name, type, priority, total_raised, estimated_gpu_scale, 
  employee_count, qualification_score, description, industry_segment FROM companies`).all();

let changes = { A: 0, B: 0, C: 0, unchanged: 0 };
let promoted = [], demoted = [];

const update = db.prepare('UPDATE companies SET priority = ? WHERE id = ?');

db.transaction(() => {
  for (const c of all) {
    const raisedM = parseRaisedM(c.total_raised);
    const gpus = parseGPUs(c.estimated_gpu_scale);
    const mega = isMega(c.name);
    const niche = isNiche(c.name, c.description);
    let newPriority;

    if (c.type === 'operator') {
      // OPERATORS: We want small-to-mid GPU companies
      // A: raised < $200M OR GPUs < 10,000 (and not mega), or niche/unknown startups
      // B: raised $200M-$1B or GPUs 10K-30K, or mid-sized known players
      // C: mega-scale ($1B+, 30K+ GPUs), decentralized/marketplace, or too big to care

      if (mega) {
        newPriority = 'C'; // CoreWeave, Lambda, etc. — unreachable
      } else if (raisedM !== null && raisedM >= 1000) {
        newPriority = 'C'; // Billion+ raised = too big
      } else if (gpus !== null && gpus >= 30000) {
        newPriority = 'C'; // Massive fleet
      } else if (raisedM !== null && raisedM >= 200) {
        newPriority = 'B'; // Mid-large
      } else if (gpus !== null && gpus >= 10000) {
        newPriority = 'B'; // Big fleet
      } else if (raisedM !== null && raisedM < 200) {
        newPriority = 'A'; // Small-mid operators — our sweet spot
      } else if (gpus !== null && gpus < 10000) {
        newPriority = 'A'; // Manageable fleet size
      } else {
        // Unknown size — check name for clues
        const n = c.name.toLowerCase();
        if (/decentrali|marketplace|aggregat|distributed/.test(c.estimated_gpu_scale || '')) {
          newPriority = 'C'; // Decentralized = not direct customers
        } else if (c.qualification_score >= 70) {
          newPriority = 'B'; // Decent score, unknown size — medium priority
        } else {
          newPriority = 'C';
        }
      }
    } else if (c.type === 'lender') {
      // LENDERS: We want niche equipment/tech finance, not mega PE/credit funds
      if (mega) {
        newPriority = 'C';
      } else if (niche) {
        newPriority = 'A'; // Specialty finance = great fit
      } else if (raisedM !== null && raisedM >= 10000) {
        newPriority = 'C'; // $10B+ AUM = won't take our calls
      } else if (raisedM !== null && raisedM >= 3000) {
        newPriority = 'B'; // $3-10B = maybe
      } else if (raisedM !== null && raisedM < 3000) {
        newPriority = 'A'; // < $3B AUM = reachable
      } else {
        // No AUM data — use name heuristics
        const n = c.name.toLowerCase();
        if (/bank|capital corp|growth finance|equipment|venture/.test(n)) {
          newPriority = 'B'; // Could be approachable
        } else {
          newPriority = 'B';
        }
      }
    } else {
      // ARRANGERS (reinsurers/brokers): We want specialty/niche, not mega-reinsurers
      if (mega) {
        newPriority = 'C';
      } else if (niche || /rvi|residual|specialty|awbury|greenlight|conduit|barents|somers|ariel|third point/i.test(c.name)) {
        newPriority = 'A'; // Specialty/niche reinsurers — good fit
      } else if (/guy carpenter|gallagher|matrix/i.test(c.name)) {
        newPriority = 'B'; // Big brokers but potentially useful as arrangers
      } else {
        newPriority = 'B';
      }
    }

    if (newPriority !== c.priority) {
      if (newPriority === 'A' && c.priority !== 'A') promoted.push(`${c.name} (${c.type}): ${c.priority}→A`);
      if (c.priority === 'A' && newPriority !== 'A') demoted.push(`${c.name} (${c.type}): A→${newPriority}`);
      update.run(newPriority, c.id);
    }
    changes[newPriority]++;
  }
})();

console.log('\n=== RE-PRIORITIZATION COMPLETE ===\n');
console.log(`New distribution: A=${changes.A}, B=${changes.B}, C=${changes.C}`);
console.log(`\n--- PROMOTED TO A (${promoted.length}) ---`);
promoted.forEach(p => console.log(`  ✅ ${p}`));
console.log(`\n--- DEMOTED FROM A (${demoted.length}) ---`);
demoted.forEach(d => console.log(`  ⬇️  ${d}`));

// Verify
const verify = db.prepare('SELECT priority, COUNT(*) as cnt FROM companies GROUP BY priority ORDER BY priority').all();
console.log('\nVerified:', verify);
