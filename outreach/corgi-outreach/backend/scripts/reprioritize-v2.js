const Database = require('better-sqlite3');
const db = new Database('data/corgi_outreach.db');

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

function parseGPUs(g) {
  if (!g) return null;
  const m = g.match(/([\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''));
}

const MEGA_OPERATORS = [
  'coreweave', 'lambda', 'nebius', 'crusoe', 'equinix', 'digital realty',
  'vantage', 'aligned', 'switch', 'ntt global', 'qts', 'compass',
  'stack infra', 'humain', 'g42', 'cerebras', 'sambanova', 'groq',
  'modal labs', 'northern data', 'bitdeer', 'voltage park', 'nscale',
  'together ai', 'ovhcloud', 'nextdc', 'datavolt', 'jicloud'
];

const MEGA_LENDERS = [
  'nvidia capital', 'dell financial', 'hewlett packard', 'hpfs',
  'orix', 'magnetar', 'victory park', 'digital alpha',
  'blackstone', 'kkr', 'apollo global', 'ares management', 'pimco',
  'blackrock', 'carlyle', 'goldman sachs', 'jp morgan', 'oaktree',
  'hps investment', 'blue owl', 'fortress', 'stonepeak', 'golub',
  'sixth street', 'benefit street', 'churchill asset', 'monroe capital',
  'pollen street', 'basalt', 'owl rock'
];

const MEGA_ARRANGERS = [
  'everest re', 'axis capital', 'arch capital', 'renaissance', 'partnerre',
  'sompo', 'markel', 'lancashire', 'hiscox', 'convex', 'fidelis',
  'hamilton insurance', 'aspen insurance', 'guy carpenter', 'gallagher re',
  'willis towers', 'aon', 'marsh', 'swiss re', 'munich re', 'scor'
];

function isMega(name, type) {
  const n = name.toLowerCase();
  const list = type === 'operator' ? MEGA_OPERATORS : type === 'lender' ? MEGA_LENDERS : MEGA_ARRANGERS;
  return list.some(m => n.includes(m));
}

// Decentralized/marketplace operators = poor fit
function isDecentralized(name, desc, gpuScale) {
  const combined = (name + ' ' + (desc || '') + ' ' + (gpuScale || '')).toLowerCase();
  return /decentrali|marketplace|aggregat|distributed|consumer gpu|idle gpu|peer.to.peer/.test(combined);
}

const all = db.prepare(`SELECT id, name, type, priority, total_raised, estimated_gpu_scale, 
  employee_count, qualification_score, description, industry_segment, phone FROM companies`).all();

const update = db.prepare('UPDATE companies SET priority = ? WHERE id = ?');
let promoted = [], demoted = [];

db.transaction(() => {
  for (const c of all) {
    const raisedM = parseRaisedM(c.total_raised);
    const gpus = parseGPUs(c.estimated_gpu_scale);
    const mega = isMega(c.name, c.type);
    const decentralized = isDecentralized(c.name, c.description, c.estimated_gpu_scale);
    let newP;

    if (c.type === 'operator') {
      if (mega || decentralized) {
        newP = 'C';
      } else if (raisedM !== null && raisedM >= 500) {
        newP = 'C'; // Too big
      } else if (gpus !== null && gpus >= 20000) {
        newP = 'C'; // Massive fleet
      } else if (raisedM !== null && raisedM >= 100 && raisedM < 500) {
        newP = 'B'; // Mid-range
      } else if (gpus !== null && gpus >= 5000 && gpus < 20000) {
        newP = 'B'; // Significant fleet
      } else if (raisedM !== null && raisedM < 100) {
        // Small operator — sweet spot! But only A if they have some traction
        newP = raisedM >= 10 ? 'A' : 'B'; // Need at least $10M to be serious
      } else if (gpus !== null && gpus < 5000 && gpus >= 500) {
        newP = 'A'; // Small-mid GPU fleet
      } else if (gpus !== null && gpus < 500) {
        newP = 'C'; // Too tiny to be worth it
      } else {
        // Unknown size
        newP = 'C'; // Don't waste time on unknowns
      }
    } else if (c.type === 'lender') {
      if (mega) {
        newP = 'C';
      } else {
        const n = c.name.toLowerCase();
        // Niche GPU/equipment/tech finance = A
        const niche = /gpu|equipment|tech|innovation|venture|wingspire|slyd|upper90|tacora|triplepoint|trinity|horizon|hercules|structural|runway growth|greatamerica|wintrust|sqn capital/.test(n);
        if (niche) {
          newP = 'A';
        } else if (raisedM !== null && raisedM >= 5000) {
          newP = 'C'; // Too big
        } else if (raisedM !== null && raisedM < 5000) {
          newP = 'B';
        } else {
          newP = 'B';
        }
      }
    } else {
      // Arrangers
      if (mega) {
        newP = 'C';
      } else {
        const n = c.name.toLowerCase();
        // Specialty/niche reinsurers = A
        const specialty = /rvi|residual|awbury|greenlight|conduit|barents|ariel|third point|matrix specialty|assured guaranty|asset rvi/.test(n);
        if (specialty) {
          newP = 'A';
        } else {
          newP = 'B'; // Most arrangers = B (useful but not primary targets)
        }
      }
    }

    if (newP !== c.priority) {
      if (newP < c.priority) promoted.push(`${c.name} (${c.type}): ${c.priority}→${newP}`);
      if (newP > c.priority) demoted.push(`${c.name} (${c.type}): ${c.priority}→${newP}`);
      update.run(newP, c.id);
    }
  }
})();

// Final counts
const dist = db.prepare('SELECT priority, COUNT(*) as cnt FROM companies GROUP BY priority ORDER BY priority').all();
console.log('\n=== FINAL DISTRIBUTION ===');
dist.forEach(d => console.log(`  ${d.priority}: ${d.cnt}`));

console.log(`\n--- PROMOTED (${promoted.length}) ---`);
promoted.forEach(p => console.log(`  ✅ ${p}`));
console.log(`\n--- DEMOTED (${demoted.length}) ---`);
demoted.forEach(d => console.log(`  ⬇️  ${d}`));

// Show A-list
const aList = db.prepare("SELECT name, type, total_raised, estimated_gpu_scale, phone FROM companies WHERE priority = 'A' ORDER BY type, name").all();
console.log(`\n--- A-LIST (${aList.length}) ---`);
aList.forEach(c => {
  const phone = c.phone ? '📞' : '';
  console.log(`  ${phone} [${c.type}] ${c.name} — raised: ${(c.total_raised||'?').substring(0,50)}`);
});
