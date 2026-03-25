import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    company_name: text("company_name").notNull(),
    website: text("website"),
    // computed in app code before insert/update
    domain: text("domain"),
    name_normalized: text("name_normalized"),
    contact_name: text("contact_name"),
    contact_title: text("contact_title"),
    mobile_phone: text("mobile_phone"),
    phone_hq: text("phone_hq"),
    email: text("email"),
    city: text("city"),
    state: text("state"),
    states_served: text("states_served"), // comma-separated state codes
    specialization: text("specialization"),
    is_independent: boolean("is_independent").default(true),
    carrier_partners: text("carrier_partners"), // comma-separated
    estimated_size: text("estimated_size"), // solo/small/mid/large
    quality_score: integer("quality_score"),
    source: text("source"),
    source_url: text("source_url"),
    discovered_by: text("discovered_by"),
    verified: boolean("verified").default(false),
    verified_at: timestamp("verified_at"),
    verified_by: text("verified_by"),
    status: text("status").default("New"),
    human_notes: text("human_notes"),
    last_touch_date: text("last_touch_date"),
    agent_notes: text("agent_notes"),
    enrichment_data: jsonb("enrichment_data").default(sql`'{}'::jsonb`),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),

    // --- V2 enrichment columns ---
    email_confidence: real("email_confidence").default(0),
    email_pattern: text("email_pattern"),
    headquarters: text("headquarters"),
    company_type: text("company_type"),
    employee_count: text("employee_count"),
    founded_year: integer("founded_year"),
    total_raised: text("total_raised"),
    last_funding_round: text("last_funding_round"),
    investors: text("investors"),
    financing_status: text("financing_status"),
    linkedin_url: text("linkedin_url"),
    twitter_url: text("twitter_url"),
    github_url: text("github_url"),
    recent_news: jsonb("recent_news"),
    hiring_signals: text("hiring_signals"),
    open_roles_count: integer("open_roles_count"),
    key_hires: text("key_hires"),
    score_breakdown: jsonb("score_breakdown"),
    last_enriched_at: timestamp("last_enriched_at"),
    enrichment_completeness: integer("enrichment_completeness").default(0),
    data_sources_hit: text("data_sources_hit"),
    industry: text("industry").default("trucking_insurance"),
  },
  (t) => [
    index("idx_leads_enriched").on(t.last_enriched_at),
    index("idx_leads_completeness").on(t.enrichment_completeness),
    index("idx_leads_industry").on(t.industry),
  ]
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lead_id: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    email_confidence: real("email_confidence").default(0),
    email_pattern: text("email_pattern"),
    phone: text("phone"),
    linkedin_url: text("linkedin_url"),
    twitter_url: text("twitter_url"),
    bio: text("bio"),
    tenure: text("tenure"),
    source: text("source"),
    verified: boolean("verified").default(false),
    last_enriched_at: timestamp("last_enriched_at"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [index("idx_contacts_lead").on(t.lead_id)]
);

export const enrichment_log = pgTable(
  "enrichment_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entity_type: text("entity_type").notNull(), // 'lead' | 'contact'
    entity_id: uuid("entity_id").notNull(),
    source: text("source").notNull(),
    success: boolean("success").default(true),
    skipped: boolean("skipped").default(false),
    data_found: jsonb("data_found"),
    fields_updated: text("fields_updated"), // comma-separated
    error: text("error"),
    duration_ms: integer("duration_ms"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("idx_enrichment_log_entity").on(t.entity_type, t.entity_id),
    index("idx_enrichment_log_source").on(t.source),
  ]
);

export const industry_config = pgTable("industry_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  industry_key: text("industry_key").unique().notNull(),
  display_name: text("display_name").notNull(),
  scoring_weights: jsonb("scoring_weights").notNull(),
  lead_criteria: jsonb("lead_criteria").notNull(),
  search_strategies: jsonb("search_strategies"),
  custom_fields: jsonb("custom_fields"),
  created_at: timestamp("created_at").defaultNow(),
});

export const search_runs = pgTable("search_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agent_name: text("agent_name").notNull(),
  strategy: text("strategy").notNull(),
  query: text("query"),
  source_type: text("source_type"),
  state_target: text("state_target"),
  leads_found: integer("leads_found").default(0),
  leads_added: integer("leads_added").default(0),
  leads_duplicate: integer("leads_duplicate").default(0),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

export const agent_log = pgTable("agent_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  agent_name: text("agent_name").notNull(),
  action: text("action").notNull(),
  details: jsonb("details").default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at").defaultNow(),
});

export const task_queue = pgTable("task_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  task_type: text("task_type").notNull(),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  priority: integer("priority").default(5),
  status: text("status").default("pending"),
  claimed_by: text("claimed_by"),
  claimed_at: timestamp("claimed_at"),
  completed_at: timestamp("completed_at"),
  result: jsonb("result"),
  created_at: timestamp("created_at").defaultNow(),
});

export const exports = pgTable("exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  export_type: text("export_type").notNull(),
  row_count: integer("row_count"),
  destination: text("destination"),
  created_at: timestamp("created_at").defaultNow(),
});

// ── Type exports ──────────────────────────────────────────────────────────────

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type EnrichmentLog = typeof enrichment_log.$inferSelect;
export type NewEnrichmentLog = typeof enrichment_log.$inferInsert;
export type IndustryConfig = typeof industry_config.$inferSelect;
export type NewIndustryConfig = typeof industry_config.$inferInsert;
export type SearchRun = typeof search_runs.$inferSelect;
export type NewSearchRun = typeof search_runs.$inferInsert;
export type AgentLog = typeof agent_log.$inferSelect;
export type NewAgentLog = typeof agent_log.$inferInsert;
export type TaskQueue = typeof task_queue.$inferSelect;
export type NewTask = typeof task_queue.$inferInsert;
export type Export = typeof exports.$inferSelect;
