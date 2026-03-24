import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const leads = pgTable("leads", {
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

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type SearchRun = typeof search_runs.$inferSelect;
export type NewSearchRun = typeof search_runs.$inferInsert;
export type AgentLog = typeof agent_log.$inferSelect;
export type NewAgentLog = typeof agent_log.$inferInsert;
export type TaskQueue = typeof task_queue.$inferSelect;
export type NewTask = typeof task_queue.$inferInsert;
export type Export = typeof exports.$inferSelect;
