/**
 * Seed default industry configurations.
 * Run: npx tsx src/db/seed-industries.ts
 * Or called programmatically during first-run setup.
 */

import { getDb } from "./index";
import { industry_config } from "./schema";
import { eq } from "drizzle-orm";

const INDUSTRY_SEEDS = [
  {
    industry_key: "trucking_insurance",
    display_name: "Trucking Insurance Agencies",
    scoring_weights: {
      specialization: 25,
      independence: 20,
      contact_quality: 20,
      size_fit: 15,
      licensed_state: 10,
      data_completeness: 10,
    },
    lead_criteria: {
      good_signals: [
        "trucking-only",
        "trucking-first",
        "multi-carrier",
        "independent",
        "regional specialist",
        "dedicated trucking contact",
      ],
      bad_signals: [
        "captive agent",
        "generalist",
        "wholesale broker",
        "MGA",
        "owner-operator only",
        "single carrier",
      ],
    },
  },
  {
    industry_key: "insurance_brokers",
    display_name: "Insurance Brokers",
    scoring_weights: {
      specialization: 20,
      book_size: 25,
      independence: 15,
      contact_quality: 20,
      geographic_reach: 10,
      data_completeness: 10,
    },
    lead_criteria: {
      good_signals: [
        "independent",
        "multi-line",
        "commercial specialty",
        "regional",
        "growing book",
      ],
      bad_signals: ["captive", "personal lines only", "too small", "acquired"],
    },
  },
  {
    industry_key: "tech_startups",
    display_name: "Tech Startups",
    scoring_weights: {
      funding_stage: 25,
      growth_signals: 20,
      team_quality: 20,
      market_fit: 15,
      contact_quality: 10,
      data_completeness: 10,
    },
    lead_criteria: {
      good_signals: [
        "funded",
        "growing team",
        "hiring",
        "product-market fit",
        "B2B",
        "SaaS",
      ],
      bad_signals: [
        "pre-revenue zombie",
        "no funding",
        "pivot mode",
        "shutting down",
      ],
    },
  },
  {
    industry_key: "property_management",
    display_name: "Property Management",
    scoring_weights: {
      portfolio_size: 25,
      property_types: 20,
      geographic_coverage: 15,
      contact_quality: 20,
      independence: 10,
      data_completeness: 10,
    },
    lead_criteria: {
      good_signals: [
        "multi-property",
        "commercial",
        "residential portfolio",
        "growing",
        "independent",
      ],
      bad_signals: [
        "single property",
        "HOA only",
        "too small",
        "franchise captive",
      ],
    },
  },
];

export async function seedIndustries() {
  const db = getDb();
  let seeded = 0;
  let skipped = 0;

  for (const config of INDUSTRY_SEEDS) {
    const [existing] = await db
      .select({ id: industry_config.id })
      .from(industry_config)
      .where(eq(industry_config.industry_key, config.industry_key))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(industry_config).values(config);
    seeded++;
    console.log(`[seed-industries] Seeded: ${config.industry_key}`);
  }

  console.log(`[seed-industries] Done: ${seeded} seeded, ${skipped} skipped`);
  return { seeded, skipped };
}

// Run directly if called as script
if (require.main === module) {
  seedIndustries()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
