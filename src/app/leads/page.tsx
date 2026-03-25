"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ALL_STATUSES,
  US_STATES,
  getStatusColor,
} from "@/lib/constants";
import { IndustryBadge, ALL_INDUSTRIES, INDUSTRY_LABELS } from "@/components/industry-badge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  ChevronRight as ChevronExpand,
  MoreHorizontal,
  Phone,
  PhoneCall,
  CheckCheck,
  XCircle,
  StickyNote,
  Zap,
  Download,
  X,
  Layers,
  Linkedin,
  Twitter,
  Github,
  Building2,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Newspaper,
  Briefcase,
  Lightbulb,
  Mail,
} from "lucide-react";
import type { Lead, Contact } from "@/db/schema";

const PAGE_SIZE = 50;

const ENRICH_SOURCES = [
  { id: "apollo", label: "Apollo.io" },
  { id: "company-website", label: "Company Website" },
  { id: "web-search", label: "Web Search" },
  { id: "wappalyzer", label: "Wappalyzer (Tech Stack)" },
  { id: "phone-validation", label: "Phone Validation" },
];

// Extended lead type with V2 fields and top_contact
type LeadWithV2 = Lead & {
  industry?: string | null;
  enrichment_completeness?: number | null;
  contacts_count?: number | null;
  top_contact?: (Partial<Contact> & { lead_id?: string }) | null;
};

// ── Utility helpers ──────────────────────────────────────────────────────────

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function scoreToGrade(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  if (score >= 75) return "A";
  if (score >= 50) return "B";
  if (score >= 25) return "C";
  return "D";
}

function getGradeColor(score: number | null | undefined): string {
  if (score === null || score === undefined)
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  if (score >= 75) return "bg-green-500/20 text-green-300 border-green-500/30";
  if (score >= 50) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  if (score >= 25) return "bg-orange-500/20 text-orange-300 border-orange-500/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

function getCompletenessBarColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

const ACCELERATOR_SIGNALS = ["YC", "Y Combinator", "a16z", "Andreessen", "Sequoia", "Techstars", "500 Startups"];

function isYCCompany(lead: LeadWithV2): boolean {
  const combined = [
    lead.agent_notes,
    lead.company_name,
    lead.enrichment_data ? JSON.stringify(lead.enrichment_data) : "",
    lead.investors ?? "",
  ].filter(Boolean).join(" ");
  return ACCELERATOR_SIGNALS.some((sig) => combined.includes(sig));
}

function getDealPotential(lead: LeadWithV2): { emoji: string; label: string } {
  const score = lead.quality_score ?? 0;
  const hasPhone = !!(lead.mobile_phone || lead.phone_hq || lead.top_contact?.phone);
  const hasFunding = !!(lead.total_raised || lead.last_funding_round);
  const isYC = isYCCompany(lead);

  if (score >= 70 && hasPhone && (hasFunding || isYC)) {
    return { emoji: "🔥", label: "Hot" };
  }
  if (score >= 50 && hasPhone) {
    return { emoji: "⭐", label: "Warm" };
  }
  return { emoji: "❄️", label: "Cold" };
}

/** Determine the best phone for the summary row + its confidence color */
function getPhoneInfo(lead: LeadWithV2): {
  phone: string | null;
  label: "Direct" | "Main Line" | "No Phone";
  colorClass: string;
} {
  const tc = lead.top_contact;
  const contactPhone = tc?.phone ?? null;
  const phoneHq = lead.phone_hq ?? null;
  const mobile = lead.mobile_phone ?? null;

  if (contactPhone && contactPhone !== phoneHq) {
    // Direct line — contact has a unique phone
    return { phone: contactPhone, label: "Direct", colorClass: "text-green-400" };
  }
  if (mobile && mobile !== phoneHq) {
    return { phone: mobile, label: "Direct", colorClass: "text-green-400" };
  }
  if (phoneHq) {
    return { phone: phoneHq, label: "Main Line", colorClass: "text-yellow-400" };
  }
  if (contactPhone) {
    // contactPhone equals phoneHq
    return { phone: contactPhone, label: "Main Line", colorClass: "text-yellow-400" };
  }
  return { phone: null, label: "No Phone", colorClass: "text-red-400/60" };
}

/** Generate talking points from available lead data */
function generateTalkingPoints(lead: LeadWithV2): string[] {
  const points: string[] = [];
  const currentYear = new Date().getFullYear();

  if (lead.total_raised && lead.last_funding_round) {
    points.push(`Recently raised ${lead.total_raised} in ${lead.last_funding_round} — likely needs D&O insurance`);
  } else if (lead.total_raised) {
    points.push(`Has raised ${lead.total_raised} in funding — board likely requires D&O`);
  }

  if (isYCCompany(lead)) {
    points.push(`YC/accelerator-backed company — high conversion rate for tech E&O`);
  } else if (lead.investors) {
    const investorPreview = lead.investors.length > 60
      ? lead.investors.slice(0, 57) + "..."
      : lead.investors;
    points.push(`Backed by ${investorPreview} — institutional investors require D&O`);
  }

  if (lead.open_roles_count && lead.open_roles_count > 0) {
    points.push(`Actively hiring (${lead.open_roles_count} open roles) — growing team means Workers Comp needs`);
  } else if (lead.hiring_signals) {
    points.push(`Showing hiring signals — Workers Comp & Benefits conversation ready`);
  }

  if (lead.employee_count) {
    points.push(`Team of ${lead.employee_count} — right size for BOP + CGL bundle`);
  }

  if (lead.founded_year && lead.founded_year >= currentYear - 3) {
    points.push(`Founded ${lead.founded_year} — early-stage company, may need first-time coverage`);
  }

  if (lead.specialization) {
    points.push(`Specializes in ${lead.specialization} — tailor coverage to niche risks`);
  }

  if (lead.key_hires) {
    points.push(`Recent key hires: ${lead.key_hires} — executive-level additions trigger D&O review`);
  }

  // Return top 5 most relevant
  return points.slice(0, 5);
}

function getCompleteness(lead: LeadWithV2): number {
  if (lead.enrichment_completeness !== null && lead.enrichment_completeness !== undefined) {
    return lead.enrichment_completeness;
  }
  const ed = lead.enrichment_data as Record<string, unknown> | null;
  return (ed?.enrichment_completeness as number) ?? 0;
}

function getIndustry(lead: LeadWithV2): string | null {
  if (lead.industry) return lead.industry;
  const ed = lead.enrichment_data as Record<string, unknown> | null;
  return (ed?.industry as string) ?? null;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EmailConfidenceBadge({ confidence }: { confidence: number | null | undefined }) {
  if (!confidence) return null;
  const pct = Math.round(confidence * 100);
  let cls = "bg-red-500/20 text-red-300 border-red-500/30";
  if (pct >= 80) cls = "bg-green-500/20 text-green-300 border-green-500/30";
  else if (pct >= 50) cls = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  return (
    <Badge className={`text-[10px] border px-1 py-0 ${cls}`} title={`Email confidence: ${pct}%`}>
      {pct}%
    </Badge>
  );
}

function EnrichmentMiniBar({ value }: { value: number | null | undefined }) {
  const pct = value ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${getCompletenessBarColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  );
}

/** Expanded row detail panel */
function ExpandedRow({ lead, onEditNote }: { lead: LeadWithV2; onEditNote: (lead: LeadWithV2) => void }) {
  const tc = lead.top_contact;
  const talkingPoints = generateTalkingPoints(lead);
  const completeness = getCompleteness(lead);

  const recentNews = (() => {
    try {
      if (!lead.recent_news) return [];
      const n = lead.recent_news as unknown;
      if (Array.isArray(n)) return n as Array<{ title?: string; url?: string; date?: string; summary?: string }>;
      return [];
    } catch { return []; }
  })();

  const bestEmail = tc?.email ?? lead.email ?? null;

  return (
    <tr className="border-b border-border/50">
      <td colSpan={12} className="p-0">
        <div className="bg-muted/10 border-t border-border/30 px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT: Company Details ── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Company Details
              </h3>

              <div className="space-y-2 text-sm">
                {/* Name + Website */}
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">{lead.company_name}</span>
                  {lead.website && (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 text-xs shrink-0 mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {lead.domain ?? "website"}
                    </a>
                  )}
                </div>

                {/* Location */}
                {(lead.city || lead.state) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{[lead.city, lead.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {lead.industry && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {getIndustry(lead) ?? lead.industry}
                    </span>
                  )}
                  {lead.company_type && (
                    <span>{lead.company_type}</span>
                  )}
                  {lead.founded_year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Est. {lead.founded_year}
                    </span>
                  )}
                </div>

                {/* Size / Employees */}
                {(lead.employee_count || lead.estimated_size) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lead.employee_count ? `${lead.employee_count} employees` : ""}
                      {lead.employee_count && lead.estimated_size ? " · " : ""}
                      {lead.estimated_size ? `${lead.estimated_size} size` : ""}
                    </span>
                  </div>
                )}

                {/* Funding */}
                {(lead.total_raised || lead.last_funding_round || lead.financing_status) && (
                  <div className="space-y-1 text-xs">
                    {lead.total_raised && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="w-3.5 h-3.5 shrink-0 text-green-400" />
                        <span className="text-foreground font-medium">{lead.total_raised}</span>
                        {lead.last_funding_round && (
                          <span className="text-muted-foreground">· {lead.last_funding_round}</span>
                        )}
                      </div>
                    )}
                    {lead.investors && (
                      <div className="text-muted-foreground pl-5 leading-relaxed">
                        Investors: <span className="text-foreground">{lead.investors}</span>
                      </div>
                    )}
                    {lead.financing_status && (
                      <div className="text-muted-foreground pl-5">
                        Status: <span className="text-foreground">{lead.financing_status}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Social links */}
                <div className="flex gap-2 pt-1">
                  {lead.linkedin_url && (
                    <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {lead.twitter_url && (
                    <a href={lead.twitter_url} target="_blank" rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300" onClick={(e) => e.stopPropagation()}>
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {lead.github_url && (
                    <a href={lead.github_url} target="_blank" rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300" onClick={(e) => e.stopPropagation()}>
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Quality / Enrichment */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 border-t border-border/30">
                  {lead.quality_score !== null && lead.quality_score !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Score:</span>
                      <Badge className={`text-xs border font-bold ${getGradeColor(lead.quality_score)}`}>
                        {scoreToGrade(lead.quality_score)} ({lead.quality_score})
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Enriched:</span>
                    <EnrichmentMiniBar value={completeness} />
                  </div>
                  {lead.data_sources_hit && (
                    <div className="text-xs text-muted-foreground">
                      Sources: {lead.data_sources_hit}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── MIDDLE: Contacts ── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Contacts
              </h3>

              {tc ? (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{tc.name ?? "—"}</p>
                    {tc.title && <p className="text-xs text-muted-foreground">{tc.title}</p>}
                  </div>

                  {/* Email */}
                  {tc.email && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <a href={`mailto:${tc.email}`}
                        className="text-xs text-blue-400 hover:text-blue-300 truncate"
                        onClick={(e) => e.stopPropagation()}>
                        {tc.email}
                      </a>
                      <EmailConfidenceBadge confidence={tc.email_confidence} />
                      {tc.email_pattern && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({tc.email_pattern})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Phone */}
                  {tc.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className={`text-xs font-mono tabular-nums ${
                        tc.phone !== lead.phone_hq ? "text-green-400" : "text-yellow-400"
                      }`}>
                        {formatPhone(tc.phone)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {tc.phone !== lead.phone_hq ? "direct" : "main"}
                      </span>
                    </div>
                  )}

                  {/* LinkedIn */}
                  {tc.linkedin_url && (
                    <a href={tc.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      onClick={(e) => e.stopPropagation()}>
                      <Linkedin className="w-3 h-3" />
                      LinkedIn Profile
                    </a>
                  )}

                  {/* Bio */}
                  {tc.bio && (
                    <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-2">
                      {tc.bio}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-border/30 p-3 text-center text-xs text-muted-foreground">
                  No verified contacts yet
                </div>
              )}

              {/* Lead-level fallback contact fields */}
              {!tc && (lead.contact_name || lead.email) && (
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 space-y-1.5 text-xs">
                  <p className="text-muted-foreground font-medium">From lead record:</p>
                  {lead.contact_name && (
                    <p className="text-foreground">
                      {lead.contact_name}
                      {lead.contact_title && (
                        <span className="text-muted-foreground"> · {lead.contact_title}</span>
                      )}
                    </p>
                  )}
                  {bestEmail && (
                    <a href={`mailto:${bestEmail}`}
                      className="text-blue-400 hover:text-blue-300 block truncate"
                      onClick={(e) => e.stopPropagation()}>
                      {bestEmail}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: Signals, Talking Points, Notes ── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Signals & Talking Points
              </h3>

              {/* Talking Points */}
              {talkingPoints.length > 0 && (
                <div className="rounded-lg border border-border/50 bg-primary/5 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Quick Talking Points
                  </p>
                  <ul className="space-y-1.5">
                    {talkingPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-primary shrink-0 mt-0.5">•</span>
                        <span className="text-foreground leading-snug">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hiring signals */}
              {(lead.hiring_signals || lead.open_roles_count || lead.key_hires) && (
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Hiring Activity
                  </p>
                  {lead.open_roles_count !== null && lead.open_roles_count !== undefined && (
                    <p className="pl-5 text-foreground">{lead.open_roles_count} open roles</p>
                  )}
                  {lead.hiring_signals && (
                    <p className="pl-5 text-muted-foreground">{lead.hiring_signals}</p>
                  )}
                  {lead.key_hires && (
                    <p className="pl-5 text-muted-foreground">Key hires: {lead.key_hires}</p>
                  )}
                </div>
              )}

              {/* Recent news */}
              {recentNews.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <p className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Newspaper className="w-3.5 h-3.5" />
                    Recent News
                  </p>
                  {recentNews.slice(0, 3).map((item, i) => (
                    <div key={i} className="pl-5 space-y-0.5">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 line-clamp-1"
                          onClick={(e) => e.stopPropagation()}>
                          {item.title ?? "News item"}
                        </a>
                      ) : (
                        <p className="text-foreground line-clamp-1">{item.title ?? "News item"}</p>
                      )}
                      {item.date && (
                        <p className="text-muted-foreground/60 text-[10px]">{item.date}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Agent notes */}
              {lead.agent_notes && (
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Agent Notes</p>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-line pl-2 border-l border-border/50">
                    {lead.agent_notes}
                  </p>
                </div>
              )}

              {/* Human notes */}
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground font-medium">Your Notes</p>
                  <button
                    className="text-primary hover:text-primary/80 text-[10px] underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditNote(lead);
                    }}
                  >
                    Edit
                  </button>
                </div>
                {lead.human_notes ? (
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-line pl-2 border-l border-primary/30">
                    {lead.human_notes}
                  </p>
                ) : (
                  <button
                    className="text-muted-foreground italic hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditNote(lead);
                    }}
                  >
                    + Add a note...
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithV2[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<"enrichment_completeness" | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Expanded rows
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Note dialog
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteLeadId, setNoteLeadId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // Bulk enrich
  const [bulkEnrichSources, setBulkEnrichSources] = useState<Set<string>>(new Set());
  const [bulkEnrichOpen, setBulkEnrichOpen] = useState(false);
  const [bulkEnriching, setBulkEnriching] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (stateFilter) params.set("state", stateFilter);
      if (verifiedFilter) params.set("verified", verifiedFilter);
      if (industryFilter) params.set("industry", industryFilter);
      if (sortBy) {
        params.set("sort_by", sortBy);
        params.set("sort_dir", sortDir);
      }

      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, stateFilter, verifiedFilter, industryFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
          "x-human-edit": "true",
        },
        body: JSON.stringify({
          status: newStatus,
          last_touch_date: new Date().toISOString().split("T")[0],
        }),
      });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, status: newStatus, last_touch_date: new Date().toISOString().split("T")[0] }
            : l
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReenrich = async (leadId: string, sources: string[]) => {
    try {
      await fetch(`/api/enrichment/lead/${leadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        },
        body: JSON.stringify({ sources }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const openNoteDialog = (lead: LeadWithV2) => {
    setNoteLeadId(lead.id);
    setNoteText(lead.human_notes ?? "");
    setNoteOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteLeadId) return;
    setNoteSaving(true);
    try {
      await fetch(`/api/leads/${noteLeadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
          "x-human-edit": "true",
        },
        body: JSON.stringify({ human_notes: noteText }),
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === noteLeadId ? { ...l, human_notes: noteText } : l))
      );
      setNoteOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => handleStatusChange(id, status)));
    setSelectedIds(new Set());
  };

  const handleBulkEnrich = async () => {
    if (bulkEnrichSources.size === 0 || selectedIds.size === 0) return;
    setBulkEnriching(true);
    try {
      await fetch("/api/enrichment/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        },
        body: JSON.stringify({
          leadIds: Array.from(selectedIds),
          sources: Array.from(bulkEnrichSources),
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setBulkEnriching(false);
      setBulkEnrichOpen(false);
      setBulkEnrichSources(new Set());
    }
  };

  const handleExportSelected = () => {
    const selectedLeads = leads.filter((l) => selectedIds.has(l.id));
    const rows = [
      [
        "Company", "Contact", "Title", "Phone HQ", "Mobile", "Email",
        "City", "State", "Score", "Status", "Website", "Industry", "Source",
      ].join(","),
      ...selectedLeads.map((l) =>
        [
          `"${(l.company_name ?? "").replace(/"/g, '""')}"`,
          `"${(l.contact_name ?? "").replace(/"/g, '""')}"`,
          `"${(l.contact_title ?? "").replace(/"/g, '""')}"`,
          `"${formatPhone(l.phone_hq)}"`,
          `"${formatPhone(l.mobile_phone)}"`,
          `"${(l.email ?? "").replace(/"/g, '""')}"`,
          `"${(l.city ?? "").replace(/"/g, '""')}"`,
          l.state ?? "",
          l.quality_score != null ? scoreToGrade(l.quality_score) : "",
          `"${(l.status ?? "").replace(/"/g, '""')}"`,
          `"${(l.website ?? "").replace(/"/g, '""')}"`,
          `"${(l.industry ?? "").replace(/"/g, '""')}"`,
          `"${(l.source ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Selection helpers ──────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSortCompleteness = () => {
    if (sortBy === "enrichment_completeness") {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy("enrichment_completeness");
      setSortDir("desc");
    }
    setPage(0);
  };
  void handleSortCompleteness; // keep for future use

  const clearFilters = () => {
    setStatusFilter("");
    setStateFilter("");
    setVerifiedFilter("");
    setIndustryFilter("");
    setSearch("");
    setSearchInput("");
    setSortBy("");
    setPage(0);
  };

  const hasFilters = statusFilter || stateFilter || verifiedFilter || industryFilter || search;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString()} total leads
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-2 flex-1 min-w-64">
              <Input
                placeholder="Search company, contact, notes..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon" variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={industryFilter || "all"}
              onValueChange={(v) => { setIndustryFilter(v === "all" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {ALL_INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>{INDUSTRY_LABELS[ind]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stateFilter || "all"}
              onValueChange={(v) => { setStateFilter(v === "all" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={verifiedFilter || "all"}
              onValueChange={(v) => { setVerifiedFilter(v === "all" ? "" : v); setPage(0); }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-3 w-10 text-left">
                  <Checkbox
                    checked={leads.length > 0 && selectedIds.size === leads.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3 w-32 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Company</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Industry</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Top Contact</th>
                <th className="p-3 min-w-[150px] text-left font-medium text-muted-foreground">Phone</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="p-3 w-12 text-left font-medium text-muted-foreground">St</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Employees</th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden xl:table-cell">Size/Revenue</th>
                <th className="p-3 w-10 text-left font-medium text-muted-foreground">🔥</th>
                {/* Expand + Actions */}
                <th className="p-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-muted-foreground">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-muted-foreground">
                    No leads found.
                    {hasFilters && <span> Try adjusting your filters.</span>}
                  </td>
                </tr>
              ) : (
                leads.flatMap((lead) => {
                  const industry = getIndustry(lead);
                  const dealPotential = getDealPotential(lead);
                  const phoneInfo = getPhoneInfo(lead);
                  const tc = lead.top_contact;
                  const bestEmail = tc?.email ?? lead.email ?? null;
                  const isExpanded = expandedIds.has(lead.id);
                  const isSelected = selectedIds.has(lead.id);

                  const contactName = tc?.name ?? lead.contact_name ?? null;
                  const contactTitle = tc?.title ?? lead.contact_title ?? null;

                  const summaryRow = (
                    <tr
                      key={`row-${lead.id}`}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer ${
                        isSelected ? "bg-primary/5" : ""
                      } ${isExpanded ? "bg-muted/20" : ""}`}
                      onClick={() => toggleExpand(lead.id)}
                    >
                      {/* Checkbox */}
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                      </td>

                      {/* Status */}
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-0.5">
                              <Badge className={`text-xs border cursor-pointer hover:opacity-80 ${getStatusColor(lead.status)}`}>
                                {lead.status ?? "New"}
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {ALL_STATUSES.map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead.id, s)}>
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Company + City */}
                      <td className="p-3 max-w-[180px]">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.company_name}
                        </Link>
                        {lead.city && (
                          <p className="text-xs text-muted-foreground truncate">{lead.city}</p>
                        )}
                      </td>

                      {/* Industry */}
                      <td className="p-3 hidden lg:table-cell">
                        <IndustryBadge industry={industry} />
                      </td>

                      {/* Top Contact */}
                      <td className="p-3 max-w-[160px]">
                        <p className="text-sm truncate">{contactName ?? "—"}</p>
                        {contactTitle && (
                          <p className="text-xs text-muted-foreground truncate">{contactTitle}</p>
                        )}
                      </td>

                      {/* Phone with confidence color */}
                      <td className="p-3 min-w-[150px]">
                        {phoneInfo.phone ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Phone className={`w-3 h-3 shrink-0 ${phoneInfo.colorClass}`} />
                              <span className={`font-mono text-xs tabular-nums ${phoneInfo.colorClass}`}>
                                {formatPhone(phoneInfo.phone)}
                              </span>
                            </div>
                            <span className={`text-[10px] ${phoneInfo.colorClass} opacity-80`}>
                              {phoneInfo.label}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground text-xs">—</span>
                            <p className={`text-[10px] ${phoneInfo.colorClass}`}>{phoneInfo.label}</p>
                          </div>
                        )}
                      </td>

                      {/* Email */}
                      <td className="p-3 hidden md:table-cell max-w-[160px]">
                        {bestEmail ? (
                          <a
                            href={`mailto:${bestEmail}`}
                            className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {bestEmail}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* State */}
                      <td className="p-3">
                        <span className="text-sm font-mono">{lead.state ?? "—"}</span>
                      </td>

                      {/* Employee Count */}
                      <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground">
                        {lead.employee_count ?? "—"}
                      </td>

                      {/* Size / Revenue */}
                      <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground">
                        {lead.total_raised ?? lead.estimated_size ?? "—"}
                      </td>

                      {/* Deal Potential */}
                      <td className="p-3">
                        <span title={dealPotential.label} className="text-sm leading-none cursor-default">
                          {dealPotential.emoji}
                        </span>
                      </td>

                      {/* Expand chevron + Kebab */}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(lead.id); }}
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            <ChevronExpand
                              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem asChild>
                                <Link href={`/leads/${lead.id}`}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Zap className="w-4 h-4 mr-2" />
                                  Re-enrich
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-52">
                                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    Run a source
                                  </DropdownMenuLabel>
                                  {ENRICH_SOURCES.map((src) => (
                                    <DropdownMenuItem
                                      key={src.id}
                                      onClick={() => handleReenrich(lead.id, [src.id])}
                                    >
                                      {src.label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleReenrich(lead.id, ENRICH_SOURCES.map((s) => s.id))}
                                  >
                                    <Layers className="w-4 h-4 mr-2" />
                                    All Sources
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, "Contacted")}>
                                <PhoneCall className="w-4 h-4 mr-2" />
                                Mark as Contacted
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, "Booked")}>
                                <CheckCheck className="w-4 h-4 mr-2" />
                                Mark as Qualified
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(lead.id, "Not Interested")}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Mark as Not Interested
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => openNoteDialog(lead)}>
                                <StickyNote className="w-4 h-4 mr-2" />
                                Add / Edit Note
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );

                  if (isExpanded) {
                    return [
                      summaryRow,
                      <ExpandedRow key={`expand-${lead.id}`} lead={lead} onEditNote={openNoteDialog} />,
                    ];
                  }
                  return [summaryRow];
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between ${selectedIds.size > 0 ? "pb-20" : ""}`}>
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
            {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Floating Bulk Actions Bar ─────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-3 shadow-2xl">
          <div className="max-w-screen-2xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-foreground shrink-0">
              {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""} selected
            </span>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange("Contacted")}>
              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
              Mark Contacted
            </Button>

            <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange("Booked")}>
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark Qualified
            </Button>

            <DropdownMenu open={bulkEnrichOpen} onOpenChange={setBulkEnrichOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Run Enrichment
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel>Select Sources</DropdownMenuLabel>
                {ENRICH_SOURCES.map((src) => (
                  <DropdownMenuCheckboxItem
                    key={src.id}
                    checked={bulkEnrichSources.has(src.id)}
                    onCheckedChange={(checked) => {
                      setBulkEnrichSources((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(src.id);
                        else next.delete(src.id);
                        return next;
                      });
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {src.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={bulkEnrichSources.size === ENRICH_SOURCES.length}
                  onCheckedChange={(checked) => {
                    if (checked) setBulkEnrichSources(new Set(ENRICH_SOURCES.map((s) => s.id)));
                    else setBulkEnrichSources(new Set());
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  All Sources
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={bulkEnrichSources.size === 0 || bulkEnriching}
                    onClick={handleBulkEnrich}
                  >
                    {bulkEnriching ? "Enriching…" : `Enrich ${selectedIds.size} leads`}
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="secondary" onClick={handleExportSelected}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>

            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Note Dialog ────────────────────────────────────────── */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add / Edit Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your notes here..."
            className="min-h-32 resize-y"
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={handleSaveNote} disabled={noteSaving}>
              {noteSaving ? "Saving…" : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
