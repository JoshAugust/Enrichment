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
  CheckCircle,
  ExternalLink,
  ChevronDown,
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
} from "lucide-react";
import type { Lead } from "@/db/schema";

const PAGE_SIZE = 50;

const ENRICH_SOURCES = [
  { id: "apollo", label: "Apollo.io" },
  { id: "company-website", label: "Company Website" },
  { id: "web-search", label: "Web Search" },
  { id: "wappalyzer", label: "Wappalyzer (Tech Stack)" },
  { id: "phone-validation", label: "Phone Validation" },
];

// Extended lead type with V2 fields that may live in enrichment_data
type LeadWithV2 = Lead & {
  industry?: string | null;
  enrichment_completeness?: number | null;
  contacts_count?: number | null;
};

// ── Utility helpers ──────────────────────────────────────────────────────────

function getCompletenessBarColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

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

// ── Sub-components ───────────────────────────────────────────────────────────

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

/** Verified badge with a hover tooltip showing enrichment sources + who/when */
function VerifiedTooltip({ lead }: { lead: LeadWithV2 }) {
  const sources = lead.data_sources_hit
    ? lead.data_sources_hit
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="relative inline-block group/verified">
      <CheckCircle className="w-4 h-4 text-green-400 cursor-help" />
      {/* Tooltip panel */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-50 hidden group-hover/verified:block w-60 p-3 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl text-xs whitespace-nowrap">
        <div className="space-y-2">
          {sources.length > 0 && (
            <div>
              <p className="text-muted-foreground font-medium mb-1">Sources run</p>
              <div className="flex flex-wrap gap-1">
                {sources.map((s) => (
                  <span
                    key={s}
                    className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {lead.verified_at && (
            <div>
              <span className="text-muted-foreground">Verified: </span>
              <span>{new Date(lead.verified_at).toLocaleDateString()}</span>
            </div>
          )}
          {lead.verified_by && (
            <div>
              <span className="text-muted-foreground">By: </span>
              <span>{lead.verified_by}</span>
            </div>
          )}
          {!sources.length && !lead.verified_at && !lead.verified_by && (
            <p className="text-muted-foreground italic">No details available</p>
          )}
        </div>
        {/* Caret */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
      </div>
    </div>
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
            ? {
                ...l,
                status: newStatus,
                last_touch_date: new Date().toISOString().split("T")[0],
              }
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
        "Company",
        "Contact",
        "Title",
        "Phone HQ",
        "Mobile",
        "Email",
        "City",
        "State",
        "Score",
        "Status",
        "Website",
        "Industry",
        "Source",
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

  const handleSortCompleteness = () => {
    if (sortBy === "enrichment_completeness") {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy("enrichment_completeness");
      setSortDir("desc");
    }
    setPage(0);
  };

  // ── Derived field helpers ──────────────────────────────────────────────────

  const getIndustry = (lead: LeadWithV2): string | null => {
    if (lead.industry) return lead.industry;
    const ed = lead.enrichment_data as Record<string, unknown> | null;
    return (ed?.industry as string) ?? null;
  };

  const getCompleteness = (lead: LeadWithV2): number => {
    if (
      lead.enrichment_completeness !== null &&
      lead.enrichment_completeness !== undefined
    ) {
      return lead.enrichment_completeness;
    }
    const ed = lead.enrichment_data as Record<string, unknown> | null;
    return (ed?.enrichment_completeness as number) ?? 0;
  };

  const getContactsCount = (lead: LeadWithV2): number | null => {
    if (lead.contacts_count !== null && lead.contacts_count !== undefined) {
      return lead.contacts_count;
    }
    const ed = lead.enrichment_data as Record<string, unknown> | null;
    return (ed?.contacts_count as number) ?? null;
  };

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

  const hasFilters =
    statusFilter || stateFilter || verifiedFilter || industryFilter || search;
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
              onValueChange={(v) => {
                setStatusFilter(v === "all" ? "" : v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={industryFilter || "all"}
              onValueChange={(v) => {
                setIndustryFilter(v === "all" ? "" : v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {ALL_INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {INDUSTRY_LABELS[ind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stateFilter || "all"}
              onValueChange={(v) => {
                setStateFilter(v === "all" ? "" : v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={verifiedFilter || "all"}
              onValueChange={(v) => {
                setVerifiedFilter(v === "all" ? "" : v);
                setPage(0);
              }}
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
                <th className="p-3 w-32 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Company
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  Industry
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  Website
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Contact
                </th>
                <th className="p-3 min-w-[140px] text-left font-medium text-muted-foreground">
                  Phone
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Email
                </th>
                <th className="p-3 w-12 text-left font-medium text-muted-foreground">
                  St
                </th>
                <th className="p-3 w-14 text-left font-medium text-muted-foreground">
                  Score
                </th>
                <th
                  className="p-3 text-left font-medium text-muted-foreground hidden xl:table-cell cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={handleSortCompleteness}
                  title="Sort by enrichment completeness"
                >
                  <span className="flex items-center gap-1">
                    Enrich
                    {sortBy === "enrichment_completeness" && (
                      <span className="text-xs">
                        {sortDir === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </span>
                </th>
                <th className="p-3 w-10 text-left font-medium text-muted-foreground hidden xl:table-cell">
                  Cts
                </th>
                <th className="p-3 w-10 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  ✓
                </th>
                <th className="p-3 w-16 text-left font-medium text-muted-foreground hidden xl:table-cell">
                  Source
                </th>
                {/* Row actions column */}
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={15}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={15}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No leads found.
                    {hasFilters && (
                      <span> Try adjusting your filters.</span>
                    )}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const industry = getIndustry(lead);
                  const completeness = getCompleteness(lead);
                  const contactsCount = getContactsCount(lead);
                  const hasPhone = !!(lead.mobile_phone || lead.phone_hq);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        selectedIds.has(lead.id) ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="p-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                      </td>

                      {/* Status badge — inline dropdown to change */}
                      <td
                        className="p-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-0.5">
                              <Badge
                                className={`text-xs border cursor-pointer hover:opacity-80 ${getStatusColor(
                                  lead.status
                                )}`}
                              >
                                {lead.status ?? "New"}
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {ALL_STATUSES.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatusChange(lead.id, s)}
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Company */}
                      <td className="p-3 max-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors truncate"
                          >
                            {lead.company_name}
                          </Link>
                          {contactsCount !== null && contactsCount > 0 && (
                            <Badge className="text-xs border bg-blue-500/20 text-blue-300 border-blue-500/30 shrink-0 tabular-nums">
                              {contactsCount}
                            </Badge>
                          )}
                        </div>
                        {lead.city && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.city}
                          </p>
                        )}
                      </td>

                      {/* Industry */}
                      <td className="p-3 hidden lg:table-cell">
                        <IndustryBadge industry={industry} />
                      </td>

                      {/* Website */}
                      <td className="p-3 hidden lg:table-cell max-w-[120px]">
                        {lead.website ? (
                          <a
                            href={
                              lead.website.startsWith("http")
                                ? lead.website
                                : `https://${lead.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.domain ?? lead.website}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="p-3 max-w-[140px]">
                        <p className="text-sm truncate">
                          {lead.contact_name ?? "—"}
                        </p>
                        {lead.contact_title && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.contact_title}
                          </p>
                        )}
                      </td>

                      {/* Phone — CRITICAL for cold calling */}
                      <td className="p-3 min-w-[140px]">
                        {hasPhone ? (
                          <div className="space-y-0.5">
                            {lead.mobile_phone && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="font-mono text-foreground tabular-nums">
                                  {formatPhone(lead.mobile_phone)}
                                </span>
                                <span className="text-muted-foreground/60 text-[10px]">
                                  m
                                </span>
                              </div>
                            )}
                            {lead.phone_hq &&
                              lead.phone_hq !== lead.mobile_phone && (
                                <div className="flex items-center gap-1 text-xs">
                                  <PhoneCall className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="font-mono text-foreground tabular-nums">
                                    {formatPhone(lead.phone_hq)}
                                  </span>
                                  <span className="text-muted-foreground/60 text-[10px]">
                                    hq
                                  </span>
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="p-3 hidden md:table-cell max-w-[160px]">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* State */}
                      <td className="p-3">
                        <span className="text-sm font-mono">
                          {lead.state ?? "—"}
                        </span>
                      </td>

                      {/* Score → letter grade */}
                      <td className="p-3">
                        {lead.quality_score !== null &&
                        lead.quality_score !== undefined ? (
                          <Badge
                            className={`text-xs border font-bold ${getGradeColor(
                              lead.quality_score
                            )}`}
                            title={`Score: ${lead.quality_score}/100`}
                          >
                            {scoreToGrade(lead.quality_score)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>

                      {/* Enrichment bar */}
                      <td className="p-3 hidden xl:table-cell">
                        <EnrichmentMiniBar value={completeness} />
                      </td>

                      {/* Contacts count */}
                      <td className="p-3 hidden xl:table-cell text-sm text-muted-foreground">
                        {contactsCount !== null ? (
                          <span className="font-medium text-foreground">
                            {contactsCount}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* Verified w/ tooltip */}
                      <td className="p-3 hidden lg:table-cell">
                        {lead.verified ? (
                          <VerifiedTooltip lead={lead} />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground max-w-[80px] truncate">
                        {lead.source ?? "—"}
                      </td>

                      {/* ── Row action kebab ── */}
                      <td
                        className="p-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                            {/* View */}
                            <DropdownMenuItem asChild>
                              <Link href={`/leads/${lead.id}`}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Re-enrich sub-menu */}
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
                                    onClick={() =>
                                      handleReenrich(lead.id, [src.id])
                                    }
                                  >
                                    {src.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleReenrich(
                                      lead.id,
                                      ENRICH_SOURCES.map((s) => s.id)
                                    )
                                  }
                                >
                                  <Layers className="w-4 h-4 mr-2" />
                                  All Sources
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator />

                            {/* Quick status changes */}
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(lead.id, "Contacted")
                              }
                            >
                              <PhoneCall className="w-4 h-4 mr-2" />
                              Mark as Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(lead.id, "Booked")
                              }
                            >
                              <CheckCheck className="w-4 h-4 mr-2" />
                              Mark as Qualified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(lead.id, "Not Interested")
                              }
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className={`flex items-center justify-between ${
            selectedIds.size > 0 ? "pb-20" : ""
          }`}
        >
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
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
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
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
              {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </span>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBulkStatusChange("Contacted")}
            >
              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
              Mark Contacted
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBulkStatusChange("Booked")}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark Qualified
            </Button>

            {/* Bulk enrich dropdown */}
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
                    if (checked) {
                      setBulkEnrichSources(
                        new Set(ENRICH_SOURCES.map((s) => s.id))
                      );
                    } else {
                      setBulkEnrichSources(new Set());
                    }
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
                    {bulkEnriching
                      ? "Enriching…"
                      : `Enrich ${selectedIds.size} leads`}
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportSelected}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
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
              <Button variant="outline" size="sm">
                Cancel
              </Button>
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
