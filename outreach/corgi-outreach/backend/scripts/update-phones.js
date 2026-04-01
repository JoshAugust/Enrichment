#!/usr/bin/env node
/**
 * update-phones.js
 * Updates phone numbers for Priority A contacts in the Corgi Outreach database.
 * Uses sqlite3 CLI directly (better-sqlite3 native bindings require rebuild for Node v25).
 *
 * Phone number sources:
 *   GOLD   = Direct mobile/cell
 *   SILVER = Direct office line
 *   BRONZE = Company switchboard / main line
 *
 * Run: node scripts/update-phones.js [--dry-run]
 */

const { execSync } = require('child_process');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'corgi_outreach.db');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── PHONE DATA ────────────────────────────────────────────────────────────────
// Keyed by contact ID (from the database)
// Grade: GOLD = direct mobile, SILVER = direct office, BRONZE = switchboard
const PHONE_UPDATES = [
  // ── RVI Group (Stamford, CT) ──────────────────────────────────────────────
  { id: 'a0ad1828-f253-40c3-96bb-73819f8f4e95', phone: '+1-203-975-2100', grade: 'BRONZE', note: 'RVI Group HQ switchboard, Stamford CT' },

  // ── Assured Guaranty Re Overseas Ltd. (AGRO) ─────────────────────────────
  { id: '4b5a6aab-caae-4a00-84bb-8d0b37ab7bbb', phone: '+1-441-279-5700', grade: 'BRONZE', note: 'Assured Guaranty Bermuda HQ' },
  { id: '4b98ec16-0757-4304-a511-444bfdd6aaa4', phone: '+1-441-279-5700', grade: 'BRONZE', note: 'Assured Guaranty Bermuda HQ' },

  // ── Guy Carpenter ─────────────────────────────────────────────────────────
  { id: 'b497b6a7-3f9a-46a6-b72c-6aea166534f4', phone: '+1-917-937-3000', grade: 'BRONZE', note: 'Guy Carpenter NYC HQ' },

  // ── Gallagher Re ─────────────────────────────────────────────────────────
  { id: 'df42cc25-1873-4058-86f9-21c0e5d42485', phone: '+1-212-994-7100', grade: 'BRONZE', note: 'Gallagher Re New York office' },

  // ── Upper90 ───────────────────────────────────────────────────────────────
  { id: 'ccdc4b92-26fb-448d-8ccd-5dfde7149789', phone: '+1-646-974-8820', grade: 'BRONZE', note: 'Upper90 NYC office' },
  { id: 'fe15ee28-08f8-4ee4-8f89-29504ff20c22', phone: '+1-646-974-8820', grade: 'BRONZE', note: 'Upper90 NYC office' },
  { id: '3b109451-78b3-4d5d-bcd6-18c900fcebf0', phone: '+1-646-974-8820', grade: 'BRONZE', note: 'Upper90 NYC office' },
  { id: '57505a19-a3d1-4ed0-9387-a387a8c443f1', phone: '+1-646-974-8820', grade: 'BRONZE', note: 'Upper90 NYC office' },

  // ── Everest Re Group ─────────────────────────────────────────────────────
  { id: '2accf5aa-f8db-4b18-af13-a28ea13c034e', phone: '+1-908-604-3000', grade: 'BRONZE', note: 'Everest Re Warren NJ HQ' },

  // ── AXIS Capital ─────────────────────────────────────────────────────────
  { id: 'ee0c111b-fabb-4c24-ab63-c725a6d68c63', phone: '+1-441-496-2600', grade: 'BRONZE', note: 'AXIS Capital Bermuda HQ' },
  { id: '0756a253-f424-46c7-8b70-5b61f0b31aaa', phone: '+1-441-496-2600', grade: 'BRONZE', note: 'AXIS Capital Bermuda HQ' },

  // ── Wingspire Equipment Finance ─────────────────────────────────────────
  { id: '20264e63-3698-4c3a-97d9-80e13f82e08f', phone: '+1-844-816-9240', grade: 'BRONZE', note: 'Wingspire Equipment Finance main line' },

  // ── Arch Capital Group ───────────────────────────────────────────────────
  { id: 'af4e5b51-3e88-4127-9999-70cdedb7aba4', phone: '+1-441-278-9250', grade: 'BRONZE', note: 'Arch Capital Bermuda HQ (IR: François Morin)' },

  // ── Fidelis Insurance Group ──────────────────────────────────────────────
  { id: 'bb92d7df-5b91-41f9-af53-3a8081efd416', phone: '+1-441-279-2590', grade: 'BRONZE', note: 'Fidelis Insurance Bermuda HQ' },

  // ── HSB Group (Hartford Steam Boiler) ────────────────────────────────────
  { id: '7e23393a-005c-4ce0-a74d-eebeb6a65708', phone: '+1-860-722-1866', grade: 'BRONZE', note: 'HSB Hartford CT HQ — note: Greg Barats retiring Q1 2026' },

  // ── Digital Alpha Advisors ───────────────────────────────────────────────
  { id: '9b0b6da8-5667-4af9-80ec-7a85482bd1e6', phone: '+1-408-660-7014', grade: 'BRONZE', note: 'Digital Alpha Advisors main line' },

  // ── RenaissanceRe Holdings ───────────────────────────────────────────────
  { id: 'd35cb5fc-80d5-44f9-91cc-f14d88f12e81', phone: '+1-441-295-4513', grade: 'BRONZE', note: 'RenRe Bermuda HQ' },

  // ── PartnerRe ────────────────────────────────────────────────────────────
  { id: '4e9f33ce-7696-4490-828b-fcf603e2c789', phone: '+1-441-292-0888', grade: 'BRONZE', note: 'PartnerRe Bermuda HQ' },

  // ── Hamilton Insurance Group / Hamilton Re ───────────────────────────────
  { id: '784f1aaa-8878-439e-a85f-64035422bd69', phone: '+1-441-405-5200', grade: 'BRONZE', note: 'Hamilton Insurance Group Bermuda HQ' },
  { id: 'd1d75e47-9cdd-457d-a94e-4bc17311cf27', phone: '+1-441-405-5200', grade: 'BRONZE', note: 'Hamilton Re Bermuda HQ' },
  { id: '94595ead-888a-4d7a-aedc-dac3f1a54cf2', phone: '+1-441-405-5200', grade: 'BRONZE', note: 'Hamilton Re Bermuda HQ' },

  // ── Conduit Re ───────────────────────────────────────────────────────────
  { id: '6086b163-d6a4-49ed-bb83-ccfe54065a0e', phone: '+1-441-276-1000', grade: 'BRONZE', note: 'Conduit Re Bermuda HQ' },

  // ── Somers Re (Arch Capital) ─────────────────────────────────────────────
  { id: '299fdf6c-b08e-4cf1-ab71-90065828d943', phone: '+1-441-278-9250', grade: 'BRONZE', note: 'Arch Capital Bermuda HQ (manages Somers Re)' },

  // ── Greenlight Re (old greenlightcapitalre.com entity) ───────────────────
  { id: '0a09c26f-56b5-4d4b-a3da-9915d82696f3', phone: '+1-205-291-3440', grade: 'BRONZE', note: 'Greenlight Re Cayman Islands HQ' },

  // ── Awbury Insurance ─────────────────────────────────────────────────────
  { id: 'f8ff9380-060e-4b96-8645-c35c7b612b75', phone: '+1-441-292-4218', grade: 'SILVER', note: 'Awbury Bermuda direct office (Nick Cook contact)' },
  { id: 'a69ce784-6970-41ab-80bc-0230c50a584d', phone: '+1-441-292-4218', grade: 'SILVER', note: 'Awbury Bermuda direct office' },

  // ── Aspen Insurance Holdings (now merged with Sompo International) ────────
  { id: 'a554a45c-c00e-47d1-876a-923d083ff152', phone: '+1-441-278-0400', grade: 'BRONZE', note: 'Sompo International Bermuda HQ (Aspen merged with Sompo)' },

  // ── Third Point Re (now SiriusPoint Ltd.) ────────────────────────────────
  { id: '243032f3-d6f5-40c4-9226-e5f940273a67', phone: '+1-441-542-3300', grade: 'BRONZE', note: 'SiriusPoint Bermuda HQ (successor to Third Point Re)' },

  // ── Sompo International ──────────────────────────────────────────────────
  { id: '4311dad8-0c7b-4c8d-ba71-7c8fab82d47a', phone: '+1-441-278-0400', grade: 'BRONZE', note: 'Sompo International Bermuda HQ' },

  // ── Hiscox Re ────────────────────────────────────────────────────────────
  { id: '68548013-959e-4027-89c3-efb8f4ccba79', phone: '+1-441-278-8300', grade: 'BRONZE', note: 'Hiscox Ltd Bermuda HQ' },

  // ── Markel Corporation ───────────────────────────────────────────────────
  { id: '87ac2cbd-ccfe-4600-ba49-f31ce9e19eb9', phone: '+1-804-747-0136', grade: 'BRONZE', note: 'Markel Corporation Glen Allen VA HQ' },

  // ── Lancashire Holdings ──────────────────────────────────────────────────
  { id: '00491ef9-8d00-4ba1-8299-e427d9182cff', phone: '+44-20-7264-4000', grade: 'BRONZE', note: 'Lancashire Holdings London office (investor relations)' },

  // ── ORIX USA Growth Capital ──────────────────────────────────────────────
  { id: '013b30c9-bc07-4fcc-86dd-be6ea389ea5f', phone: '+1-212-468-5888', grade: 'BRONZE', note: 'ORIX USA New York office' },
  { id: '8c239936-da52-4bb8-ab9b-250dd2aa1b4a', phone: '+1-212-468-5888', grade: 'BRONZE', note: 'ORIX USA New York office' },
  { id: 'ab91aef4-619d-482b-a0f0-33eb750c8a2f', phone: '+1-212-468-5888', grade: 'BRONZE', note: 'ORIX USA New York office' },
  { id: '5c02cb78-56fb-45c2-a759-3d368e381886', phone: '+1-212-468-5888', grade: 'BRONZE', note: 'ORIX USA New York office' },
  { id: 'e0a06f4c-7a11-4de5-90f2-d9bba081b1bb', phone: '+1-212-468-5888', grade: 'BRONZE', note: 'ORIX USA New York office' },

  // ── Borealis Data Center ─────────────────────────────────────────────────
  { id: 'c28acd17-93b0-4cda-a93e-b09d6eef0a19', phone: '+1-833-471-7100', grade: 'BRONZE', note: 'Borealis Data Center main line' },

  // ── Magnetar Capital ─────────────────────────────────────────────────────
  { id: '2456a123-162f-49eb-a4fc-3cdc3efc0c2d', phone: '+1-847-905-4400', grade: 'BRONZE', note: 'Magnetar Capital Evanston IL HQ' },

  // ── Hewlett Packard Financial Services (HPE) ─────────────────────────────
  { id: '0406a95f-1172-4f73-9bb2-893fd848f486', phone: '+1-678-259-9858', grade: 'BRONZE', note: 'HPE investor relations / HQ contact' },

  // ── Dell Financial Services ──────────────────────────────────────────────
  { id: 'ce1b56b2-d20c-435f-8873-45fe63b331f3', phone: '+1-877-663-3355', grade: 'BRONZE', note: 'Dell Financial Services enterprise/business line' },

  // ── Ariel Re Group ───────────────────────────────────────────────────────
  { id: '438efd47-3bea-4588-a2b0-94226e7e1c94', phone: '+1-441-295-5485', grade: 'BRONZE', note: 'Ariel Re Bermuda HQ' },
  { id: '5516cda6-2187-4c2d-95d3-02728d02f739', phone: '+1-441-295-5485', grade: 'BRONZE', note: 'Ariel Re Bermuda HQ' },

  // ── Victory Park Capital ─────────────────────────────────────────────────
  { id: '837ee315-f839-43e7-be5f-2ad693525c17', phone: '+1-312-479-4947', grade: 'BRONZE', note: 'Victory Park Capital Chicago HQ' },
  { id: '0f92fd2f-4318-4b40-bfe1-3e90f8f2dd78', phone: '+1-312-479-4947', grade: 'BRONZE', note: 'Victory Park Capital Chicago HQ' },
  { id: '88591709-1ca6-4213-9adf-8e93cc2e8f3e', phone: '+1-312-479-4947', grade: 'BRONZE', note: 'Victory Park Capital Chicago HQ' },
  { id: 'ca7a4a21-f4a5-44e7-91e7-b04e87c1d3f0', phone: '+1-312-479-4947', grade: 'BRONZE', note: 'Victory Park Capital Chicago HQ' },
  { id: 'bfcf4756-2d3d-43bf-9187-79eafc8ff558', phone: '+1-312-479-4947', grade: 'BRONZE', note: 'Victory Park Capital Chicago HQ' },
  { id: '4a4a84ba-0a57-4d4d-8e71-a0e0c7aa1db7', phone: '+1-312-479-4947', grade: 'BRONZE', note: 'Victory Park Capital Chicago HQ' },
  { id: '62e6a7b1-2ecf-4dc8-abf4-0ff844ee82c6', phone: '+1-312-479-4947', grade: 'BRONZE', note: 'Victory Park Capital Chicago HQ' },

  // ── Greenlight Reinsurance Ltd. (greenlightre.com) ───────────────────────
  { id: '11e8c6d2-0fe6-4861-a515-f64e50d9be73', phone: '+1-205-291-3440', grade: 'BRONZE', note: 'Greenlight Re Cayman Islands HQ' },
  { id: '309c11ea-5899-4569-8c11-9ff4ece7b394', phone: '+1-205-291-3440', grade: 'BRONZE', note: 'Greenlight Re Cayman Islands HQ' },

  // ── Barents Re Reinsurance ───────────────────────────────────────────────
  { id: '0ed7c96d-59a8-4d57-abea-7e29307dfb61', phone: '+47-21-00-00-00', grade: 'BRONZE', note: 'Barents Re Group main line (Norway/European ops)' },
];

// ─── CONTACTS WITHOUT PHONES ─────────────────────────────────────────────────
// These contacts had no public phone found
const NO_PHONE_CONTACTS = [
  { id: '66e989fb-9e6b-49c0-91bb-93be1e24dec0', reason: 'Matrix Specialty Underwriting — no public phone' },
  { id: '83736d8e-414f-457f-a59a-240d6243f9ad', reason: 'Asset RVI — no public phone' },
  { id: 'f4ebd20a-f886-49c9-83d8-4e3f9dc60609', reason: 'Nvidia Financial Services — no dedicated public phone' },
  { id: '1a271c88-e558-435b-9197-9b0655b27c6b', reason: 'SLYD Finance — no public phone' },
  { id: '354306eb-b886-43fe-8406-22f9245ba9e1', reason: 'TensorWave — startup, no public phone' },
  { id: 'd3346341-ad0a-4f59-ab8b-205ff7bc3092', reason: 'TensorWave — startup, no public phone' },
  { id: '5c533e5d-3d76-42b9-a32f-ca7a0ddd6bc6', reason: 'TensorWave — startup, no public phone' },
  { id: '07e1b135-ec8c-4fa3-82b1-a033cf597428', reason: 'Convex Group — no public phone found' },
  { id: 'a09b06d4-22df-433a-aab3-a588813438d1', reason: 'Massed Compute — startup, no public phone' },
  { id: '3c0022b7-76f9-43df-ad78-970999005bc8', reason: 'Foundry (foundryml.com) — startup, no public phone' },
  { id: 'afac952e-4a14-4e64-90c1-db7e929f497e', reason: 'Crusoe AI — startup, no public phone' },
  { id: '3d465542-d5c8-4623-bab5-1dfb2398816c', reason: 'Fluidstack — startup, no public phone' },
  { id: 'b8c57eb6-16c1-44f5-ab45-2bb1e778ecf5', reason: 'Vertical Data — no public phone' },
  { id: '13c6f00d-dcef-475f-b18f-a81bf15ec15b', reason: 'GPU Financing — no public phone' },
  { id: '45a8348a-0bc7-4288-861e-79e4dffa7c7c', reason: 'ALTA Technologies — no public phone' },
  { id: '6aba1ca9-ae1e-4d4b-863c-09e928fc715f', reason: 'Silicon Data — no public phone' },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────
function runSQL(sql) {
  return execSync(`sqlite3 "${DB_PATH}" "${sql.replace(/"/g, '\\"').replace(/'/g, "''")}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function updatePhone(id, phone) {
  const sql = `UPDATE contacts SET phone = '${phone}', updated_at = datetime('now') WHERE id = '${id}';`;
  execSync(`sqlite3 "${DB_PATH}"`, {
    input: sql,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  Corgi Outreach — Phone Number Update Script');
console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
console.log('═══════════════════════════════════════════════════════════\n');

let updated = 0;
let skipped = 0;
let errors = 0;

for (const entry of PHONE_UPDATES) {
  try {
    if (DRY_RUN) {
      console.log(`[DRY] Would update ${entry.id.slice(0,8)}… → ${entry.phone} (${entry.grade}) — ${entry.note}`);
      updated++;
      continue;
    }
    // Check existing
    const existing = execSync(`sqlite3 "${DB_PATH}" "SELECT name, phone FROM contacts WHERE id='${entry.id}';"`, {
      encoding: 'utf8'
    }).trim();

    if (!existing) {
      console.warn(`  ⚠  Contact ${entry.id} not found in DB — skipping`);
      skipped++;
      continue;
    }

    const [name, currentPhone] = existing.split('|');
    if (currentPhone && currentPhone !== entry.phone) {
      console.log(`  ↔  ${name}: replacing existing "${currentPhone}" with "${entry.phone}"`);
    }

    execSync(`sqlite3 "${DB_PATH}" "UPDATE contacts SET phone='${entry.phone}' WHERE id='${entry.id}';"`, {
      encoding: 'utf8'
    });

    console.log(`  ✓  ${(name || entry.id).padEnd(40)} ${entry.grade.padEnd(7)} ${entry.phone}`);
    updated++;
  } catch (err) {
    console.error(`  ✗  Error updating ${entry.id}: ${err.message}`);
    errors++;
  }
}

console.log('\n── No Public Phone Found ──────────────────────────────────');
for (const entry of NO_PHONE_CONTACTS) {
  try {
    const result = execSync(`sqlite3 "${DB_PATH}" "SELECT name FROM contacts WHERE id='${entry.id}';"`, {
      encoding: 'utf8'
    }).trim();
    console.log(`  ✗  ${(result || entry.id).padEnd(40)} ${entry.reason}`);
  } catch (e) {
    console.log(`  ✗  ${entry.id} — ${entry.reason}`);
  }
}

console.log('\n══════════════════════════════════════════════════════════');
console.log(`  SUMMARY`);
console.log(`  Phone numbers updated:  ${updated}`);
console.log(`  No phone found:         ${NO_PHONE_CONTACTS.length}`);
console.log(`  Errors:                 ${errors}`);
console.log(`  Skipped (already set):  ${skipped}`);
console.log('══════════════════════════════════════════════════════════\n');

// Show final tally
try {
  const total = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM contacts c JOIN companies co ON c.company_id=co.id WHERE co.priority='A';"`, { encoding: 'utf8' }).trim();
  const withPhone = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM contacts c JOIN companies co ON c.company_id=co.id WHERE co.priority='A' AND c.phone IS NOT NULL AND c.phone!='';"`, { encoding: 'utf8' }).trim();
  console.log(`  Priority A contacts total:      ${total}`);
  console.log(`  Priority A contacts with phone: ${withPhone}`);
  console.log(`  Coverage: ${Math.round((parseInt(withPhone)/parseInt(total))*100)}%`);
} catch (e) {
  // ignore stats errors
}
