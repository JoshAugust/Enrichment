/**
 * scorer.ts — Quality scoring engine for leads
 *
 * Scores leads 0-100 based on industry-specific criteria.
 * Reads scoring weights from industry_config table.
 * Analyzes enrichment data, website content, and contact quality.
 *
 * Score categories per vertical are defined in industry_config.scoring_weights.
 * Each category has a max point value. The scorer evaluates signals and assigns
 * points within each category.
 */

import { getDb } from "@/db";
import { leads, contacts, industry_config } from "@/db/schema";
import { eq } from "drizzle-orm";

// ── Signal detection helpers ──────────────────────────────────────────────────

function textContains(text: string | null | undefined, keywords: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return keywords.filter(k => lower.includes(k.toLowerCase())).length;
}

function hasValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  return true;
}

// ── Scoring functions per category ────────────────────────────────────────────

interface LeadData {
  company_name: string;
  website: string | null;
  specialization: string | null;
  is_independent: boolean | null;
  carrier_partners: string | null;
  contact_name: string | null;
  contact_title: string | null;
  email: string | null;
  email_confidence: number | null;
  phone_hq: string | null;
  mobile_phone: string | null;
  estimated_size: string | null;
  employee_count: string | null;
  state: string | null;
  states_served: string | null;
  verified: boolean | null;
  company_type: string | null;
  total_raised: string | null;
  last_funding_round: string | null;
  hiring_signals: string | null;
  open_roles_count: number | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  founded_year: number | null;
  enrichment_completeness: number | null;
  agent_notes: string | null;
  enrichment_data: Record<string, unknown> | null;
  industry: string | null;
}

interface ContactData {
  name: string;
  title: string | null;
  email: string | null;
  email_confidence: number | null;
  phone: string | null;
  verified: boolean | null;
}

// Licensed states for trucking insurance
const LICENSED_STATES = ['AL','AR','AZ','CO','FL','GA','IA','ID','IL','IN','KS','KY','LA','MI','MN','MO','MS','NC','NM','OH','OK','PA','SC','TN','TX','VA'];

// Industry-specific good_signals for the 11 new tech verticals
const TECH_VERTICAL_KEYWORDS: Record<string, string[]> = {
  healthcare_tech: ['HIPAA compliant', 'FDA', 'digital health', 'telemedicine', 'patient data', 'EHR', 'health AI', 'clinical'],
  fintech: ['payments', 'banking', 'lending', 'crypto', 'DeFi', 'financial services', 'PCI', 'SOC2'],
  cybersecurity: ['security', 'pentest', 'SOC', 'threat detection', 'vulnerability', 'SIEM', 'zero trust', 'endpoint'],
  climate_tech: ['carbon', 'solar', 'renewable', 'sustainability', 'clean energy', 'climate', 'EV', 'battery'],
  devtools: ['API', 'SDK', 'developer', 'infrastructure', 'cloud', 'DevOps', 'CI/CD', 'open source'],
  legal_tech: ['legal', 'law', 'compliance', 'contract', 'litigation', 'court', 'attorney'],
  robotics_hardware: ['robotics', 'hardware', 'manufacturing', 'IoT', 'sensor', 'autonomous', 'drone', '3D printing'],
  marketing_tech: ['marketing', 'sales', 'CRM', 'lead gen', 'advertising', 'analytics', 'SEO', 'content'],
  web3_crypto: ['blockchain', 'crypto', 'DeFi', 'NFT', 'web3', 'smart contract', 'token', 'decentralized'],
  edtech: ['education', 'learning', 'tutoring', 'EdTech', 'school', 'university', 'student', 'training'],
  hr_workforce: ['HR', 'hiring', 'workforce', 'payroll', 'recruiting', 'talent', 'employee', 'staffing'],
};

function scoreSpecialization(lead: LeadData, maxPoints: number): number {
  const industry = lead.industry || 'trucking_insurance';
  const combined = [lead.specialization, lead.agent_notes, lead.company_type]
    .filter(Boolean).join(' ').toLowerCase();

  if (industry === 'trucking_insurance') {
    const truckingKeywords = ['trucking', 'truck', 'commercial auto', 'fleet', 'motor carrier', 'transportation', 'freight', 'logistics insurance', 'commercial vehicle'];
    const hits = textContains(combined, truckingKeywords);
    if (hits >= 3) return maxPoints;        // Trucking-first
    if (hits >= 2) return maxPoints * 0.8;
    if (hits >= 1) return maxPoints * 0.5;
    return maxPoints * 0.15;                // Generalist
  }

  if (industry === 'insurance_brokers') {
    const brokerKeywords = ['commercial', 'specialty', 'wholesale', 'surplus', 'E&S', 'professional liability', 'workers comp'];
    const hits = textContains(combined, brokerKeywords);
    if (hits >= 2) return maxPoints;
    if (hits >= 1) return maxPoints * 0.6;
    return maxPoints * 0.2;
  }

  if (industry === 'tech_startups') {
    const techKeywords = ['SaaS', 'B2B', 'platform', 'AI', 'machine learning', 'cloud', 'fintech', 'healthtech', 'enterprise'];
    const hits = textContains(combined, techKeywords);
    if (hits >= 2) return maxPoints;
    if (hits >= 1) return maxPoints * 0.6;
    return maxPoints * 0.2;
  }

  if (industry === 'property_management') {
    const pmKeywords = ['commercial property', 'multi-family', 'residential portfolio', 'apartment', 'retail space', 'office management', 'HOA'];
    const hits = textContains(combined, pmKeywords);
    if (hits >= 2) return maxPoints;
    if (hits >= 1) return maxPoints * 0.6;
    return maxPoints * 0.2;
  }

  // Handle all 11 new tech verticals using their industry-specific keywords
  if (TECH_VERTICAL_KEYWORDS[industry]) {
    const keywords = TECH_VERTICAL_KEYWORDS[industry];
    const hits = textContains(combined, keywords);
    if (hits >= 2) return maxPoints;
    if (hits >= 1) return maxPoints * 0.6;
    return maxPoints * 0.2;
  }

  return maxPoints * 0.3; // Unknown industry, partial credit
}

const ACCELERATOR_SIGNALS = ['YC', 'Y Combinator', 'a16z', 'Andreessen', 'Sequoia', 'Techstars', '500 Startups'];

function scoreAcceleratorAffiliation(lead: LeadData, maxPoints: number): number {
  const combined = [
    lead.agent_notes,
    lead.company_name,
    lead.enrichment_data ? JSON.stringify(lead.enrichment_data) : '',
  ].filter(Boolean).join(' ');

  for (const signal of ACCELERATOR_SIGNALS) {
    if (combined.includes(signal)) return maxPoints;
  }
  return 0;
}

function scoreIndependence(lead: LeadData, maxPoints: number): number {
  const partners = lead.carrier_partners || '';
  const partnerCount = partners.split(',').filter(p => p.trim()).length;

  if (lead.is_independent === false) return 0;

  if (partnerCount >= 4) return maxPoints;
  if (partnerCount >= 3) return maxPoints * 0.85;
  if (partnerCount >= 2) return maxPoints * 0.7;
  if (partnerCount >= 1) return maxPoints * 0.5;

  // No carrier info but marked independent
  if (lead.is_independent === true) return maxPoints * 0.4;
  return maxPoints * 0.3;
}

function scoreContactQuality(lead: LeadData, contactList: ContactData[], maxPoints: number): number {
  let score = 0;

  // Check primary contact
  if (hasValue(lead.contact_name)) score += maxPoints * 0.25;
  if (hasValue(lead.contact_title)) score += maxPoints * 0.1;
  if (hasValue(lead.email) && (lead.email_confidence || 0) >= 0.5) score += maxPoints * 0.2;
  else if (hasValue(lead.email)) score += maxPoints * 0.1;
  if (hasValue(lead.phone_hq) || hasValue(lead.mobile_phone)) score += maxPoints * 0.15;

  // Bonus for multiple contacts
  const verifiedContacts = contactList.filter(c => c.verified);
  const contactsWithEmail = contactList.filter(c => hasValue(c.email));
  const contactsWithPhone = contactList.filter(c => hasValue(c.phone));

  if (verifiedContacts.length >= 2) score += maxPoints * 0.15;
  else if (contactList.length >= 2) score += maxPoints * 0.1;

  if (contactsWithEmail.length >= 2) score += maxPoints * 0.1;
  if (contactsWithPhone.length >= 1) score += maxPoints * 0.05;

  return Math.min(score, maxPoints);
}

function scoreSizeFit(lead: LeadData, maxPoints: number): number {
  const size = (lead.estimated_size || '').toLowerCase();
  const empCount = lead.employee_count ? parseInt(lead.employee_count) : null;

  // Mid-size is the sweet spot
  if (size === 'mid' || (empCount && empCount >= 10 && empCount <= 50)) return maxPoints;
  if (size === 'small' || (empCount && empCount >= 3 && empCount < 10)) return maxPoints * 0.7;
  if (size === 'large' || (empCount && empCount > 50 && empCount <= 200)) return maxPoints * 0.5;
  if (size === 'solo' || (empCount && empCount <= 2)) return maxPoints * 0.2;
  if (empCount && empCount > 200) return maxPoints * 0.2; // National powerhouse

  return maxPoints * 0.4; // Unknown size, partial credit
}

function scoreLicensedState(lead: LeadData, maxPoints: number): number {
  const state = (lead.state || '').toUpperCase();
  if (LICENSED_STATES.includes(state)) return maxPoints;

  // Check if any served states are licensed
  const served = (lead.states_served || '').split(',').map(s => s.trim().toUpperCase());
  const licensedServed = served.filter(s => LICENSED_STATES.includes(s));
  if (licensedServed.length > 0) return maxPoints * 0.7;

  return maxPoints * 0.2; // Unlicensed state
}

function scoreDataCompleteness(lead: LeadData, maxPoints: number): number {
  const completeness = lead.enrichment_completeness || 0;
  return maxPoints * (completeness / 100);
}

function scoreFundingStage(lead: LeadData, maxPoints: number): number {
  const raised = (lead.total_raised || '').toLowerCase();
  const round = (lead.last_funding_round || '').toLowerCase();

  if (raised.includes('billion') || round.includes('series d') || round.includes('series e')) return maxPoints * 0.6;
  if (round.includes('series c')) return maxPoints * 0.8;
  if (round.includes('series b')) return maxPoints;
  if (round.includes('series a')) return maxPoints * 0.9;
  if (round.includes('seed')) return maxPoints * 0.5;
  if (raised) return maxPoints * 0.6;
  return maxPoints * 0.1;
}

function scoreGrowthSignals(lead: LeadData, maxPoints: number): number {
  let score = 0;
  if (lead.hiring_signals && lead.hiring_signals !== 'not clearly hiring') score += maxPoints * 0.4;
  if (lead.open_roles_count && lead.open_roles_count > 5) score += maxPoints * 0.3;
  else if (lead.open_roles_count && lead.open_roles_count > 0) score += maxPoints * 0.15;
  if (hasValue(lead.linkedin_url)) score += maxPoints * 0.1;
  if (hasValue(lead.twitter_url)) score += maxPoints * 0.1;
  if (hasValue(lead.github_url)) score += maxPoints * 0.1;
  return Math.min(score, maxPoints);
}

function scoreGeographicReach(lead: LeadData, maxPoints: number): number {
  const served = (lead.states_served || '').split(',').filter(s => s.trim()).length;
  if (served >= 10) return maxPoints;
  if (served >= 5) return maxPoints * 0.8;
  if (served >= 3) return maxPoints * 0.6;
  if (served >= 1) return maxPoints * 0.4;
  return maxPoints * 0.2;
}

function scorePortfolioSize(lead: LeadData, maxPoints: number): number {
  const combined = [lead.agent_notes, lead.specialization, lead.enrichment_data ? JSON.stringify(lead.enrichment_data) : '']
    .filter(Boolean).join(' ').toLowerCase();

  const bigSignals = ['portfolio', 'properties', 'units', 'multi-family', 'commercial'];
  const hits = textContains(combined, bigSignals);
  if (hits >= 3) return maxPoints;
  if (hits >= 2) return maxPoints * 0.7;
  if (hits >= 1) return maxPoints * 0.4;
  return maxPoints * 0.2;
}

function scoreBookSize(lead: LeadData, maxPoints: number): number {
  // Proxy: employee count, multiple carriers, geographic reach
  const empCount = lead.employee_count ? parseInt(lead.employee_count) : null;
  let score = 0;
  if (empCount && empCount >= 50) score += maxPoints * 0.4;
  else if (empCount && empCount >= 20) score += maxPoints * 0.3;
  else if (empCount && empCount >= 5) score += maxPoints * 0.2;

  const partners = (lead.carrier_partners || '').split(',').filter(p => p.trim()).length;
  if (partners >= 5) score += maxPoints * 0.3;
  else if (partners >= 3) score += maxPoints * 0.2;

  const served = (lead.states_served || '').split(',').filter(s => s.trim()).length;
  if (served >= 5) score += maxPoints * 0.3;
  else if (served >= 2) score += maxPoints * 0.15;

  return Math.min(score, maxPoints);
}

function scoreTeamQuality(lead: LeadData, contactList: ContactData[], maxPoints: number): number {
  let score = 0;
  const leadershipTitles = ['ceo', 'cto', 'cfo', 'founder', 'co-founder', 'president', 'vp', 'director', 'head of'];
  
  for (const contact of contactList) {
    if (contact.title && leadershipTitles.some(t => contact.title!.toLowerCase().includes(t))) {
      score += maxPoints * 0.3;
    }
  }

  if (lead.founded_year && lead.founded_year >= 2020) score += maxPoints * 0.2;
  if (contactList.length >= 3) score += maxPoints * 0.2;
  
  return Math.min(score, maxPoints);
}

function scoreMarketFit(lead: LeadData, maxPoints: number): number {
  const combined = [lead.specialization, lead.agent_notes, lead.company_type]
    .filter(Boolean).join(' ').toLowerCase();
  
  const b2bSignals = ['b2b', 'enterprise', 'saas', 'platform', 'api', 'business'];
  const hits = textContains(combined, b2bSignals);
  if (hits >= 2) return maxPoints;
  if (hits >= 1) return maxPoints * 0.6;
  return maxPoints * 0.2;
}

function scorePropertyTypes(lead: LeadData, maxPoints: number): number {
  const combined = [lead.specialization, lead.agent_notes]
    .filter(Boolean).join(' ').toLowerCase();
  
  const commercialSignals = ['commercial', 'office', 'retail', 'industrial', 'warehouse'];
  const residentialSignals = ['residential', 'apartment', 'multi-family', 'condo', 'townhome'];
  
  const commercial = textContains(combined, commercialSignals);
  const residential = textContains(combined, residentialSignals);
  
  if (commercial > 0 && residential > 0) return maxPoints; // Both = diversified
  if (commercial >= 2) return maxPoints * 0.9;
  if (residential >= 2) return maxPoints * 0.7;
  if (commercial > 0 || residential > 0) return maxPoints * 0.5;
  return maxPoints * 0.2;
}

// ── Main scoring function ─────────────────────────────────────────────────────

const SCORING_FUNCTIONS: Record<string, (lead: LeadData, contacts: ContactData[], maxPoints: number) => number> = {
  specialization: (l, _, mp) => scoreSpecialization(l, mp),
  independence: (l, _, mp) => scoreIndependence(l, mp),
  contact_quality: (l, c, mp) => scoreContactQuality(l, c, mp),
  size_fit: (l, _, mp) => scoreSizeFit(l, mp),
  licensed_state: (l, _, mp) => scoreLicensedState(l, mp),
  data_completeness: (l, _, mp) => scoreDataCompleteness(l, mp),
  funding_stage: (l, _, mp) => scoreFundingStage(l, mp),
  growth_signals: (l, _, mp) => scoreGrowthSignals(l, mp),
  team_quality: (l, c, mp) => scoreTeamQuality(l, c, mp),
  market_fit: (l, _, mp) => scoreMarketFit(l, mp),
  geographic_reach: (l, _, mp) => scoreGeographicReach(l, mp),
  book_size: (l, _, mp) => scoreBookSize(l, mp),
  portfolio_size: (l, _, mp) => scorePortfolioSize(l, mp),
  property_types: (l, _, mp) => scorePropertyTypes(l, mp),
  accelerator_affiliation: (l, _, mp) => scoreAcceleratorAffiliation(l, mp),
};

export interface ScoreResult {
  score: number;
  breakdown: Record<string, number>;
  maxScore: number;
}

/**
 * Score a single lead based on its industry config.
 */
export async function scoreLead(leadId: string): Promise<ScoreResult> {
  const db = getDb();

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const leadContacts = await db.select().from(contacts).where(eq(contacts.lead_id, leadId));

  const industry = lead.industry || 'trucking_insurance';
  const [config] = await db.select().from(industry_config)
    .where(eq(industry_config.industry_key, industry)).limit(1);

  const weights: Record<string, number> = config?.scoring_weights
    ? (config.scoring_weights as Record<string, number>)
    : { specialization: 25, independence: 20, contact_quality: 20, size_fit: 15, licensed_state: 10, data_completeness: 10 };

  const breakdown: Record<string, number> = {};
  let totalScore = 0;

  for (const [category, maxPoints] of Object.entries(weights)) {
    const fn = SCORING_FUNCTIONS[category];
    if (fn) {
      const points = Math.round(fn(lead as LeadData, leadContacts as ContactData[], maxPoints));
      breakdown[category] = points;
      totalScore += points;
    } else {
      breakdown[category] = 0;
    }
  }

  const score = Math.min(Math.max(Math.round(totalScore), 0), 100);

  // Persist score
  await db.update(leads)
    .set({ quality_score: score, score_breakdown: breakdown, updated_at: new Date() })
    .where(eq(leads.id, leadId));

  return { score, breakdown, maxScore: 100 };
}

/**
 * Score all unscored leads or all leads in a given industry.
 */
export async function scoreAllLeads(industry?: string): Promise<{ scored: number; avgScore: number }> {
  const db = getDb();

  // Score all leads (re-score everything for consistency)
  const allLeads = industry
    ? await db.select({ id: leads.id }).from(leads).where(eq(leads.industry, industry))
    : await db.select({ id: leads.id }).from(leads);

  let totalScore = 0;
  let scored = 0;

  for (const lead of allLeads) {
    try {
      const result = await scoreLead(lead.id);
      totalScore += result.score;
      scored++;
    } catch (e) {
      console.error(`Failed to score lead ${lead.id}:`, e);
    }
  }

  return {
    scored,
    avgScore: scored > 0 ? Math.round(totalScore / scored) : 0,
  };
}
