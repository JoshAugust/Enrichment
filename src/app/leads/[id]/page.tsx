"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ALL_STATUSES,
  getStatusColor,
  getScoreColor,
} from "@/lib/constants";
import { IndustryBadge } from "@/components/industry-badge";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { EnrichmentPanel } from "@/components/enrichment-panel";
import { ContactsTable } from "@/components/contacts-table";
import { NewsFeed } from "@/components/news-feed";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Save,
  Loader2,
  Linkedin,
  Twitter,
  Github,
  DollarSign,
  Briefcase,
  FileText,
  Bot,
} from "lucide-react";
import type { Lead } from "@/db/schema";

type Props = {
  params: Promise<{ id: string }>;
};

interface EnrichmentLogEntry {
  id: string;
  date: string;
  source: string;
  success: boolean;
  fields_updated: number;
  duration_ms?: number;
}

function getCompletenessColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function getCompletenessTextColor(pct: number): string {
  if (pct >= 80) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

export default function LeadDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [enrichmentLog, setEnrichmentLog] = useState<EnrichmentLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`/api/leads/${id}`, {
          headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
        });
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setLead(data);
        setEditData(data);
      } catch {
        router.push("/leads");
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id, router]);

  const fetchEnrichmentLog = async () => {
    setLogLoading(true);
    try {
      const res = await fetch(`/api/enrichment/log/${id}`, {
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEnrichmentLog(Array.isArray(data) ? data : data.log ?? []);
    } catch {
      // API not ready yet
    } finally {
      setLogLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
          "x-human-edit": "true",
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setLead(updated);
      setEditData(updated);
      showToast("Lead saved successfully");
    } catch {
      showToast("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof Lead, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) return null;

  const enrichmentData =
    editData.enrichment_data && typeof editData.enrichment_data === "object"
      ? (editData.enrichment_data as Record<string, unknown>)
      : {};

  const carrierPartners = editData.carrier_partners
    ? editData.carrier_partners.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // V2 extended fields (may not be in schema yet — graceful fallback)
  const extData = enrichmentData as Record<string, unknown>;
  const industry = (extData.industry ?? (lead as unknown as Record<string, unknown>).industry) as string | null;
  const enrichmentCompleteness = (extData.enrichment_completeness ?? (lead as unknown as Record<string, unknown>).enrichment_completeness ?? 0) as number;
  const lastEnrichedAt = (extData.last_enriched_at ?? (lead as unknown as Record<string, unknown>).last_enriched_at) as string | null;
  const scoreBreakdown = extData.score_breakdown as Record<string, number> | null;
  const recentNews = extData.recent_news as Array<{ title: string; url?: string; sentiment?: string; published_at?: string; summary?: string }> | null;
  const hiringData = extData.hiring_signals as Record<string, unknown> | null;
  const financialData = extData.financial_signals as Record<string, unknown> | null;
  const socialData = extData.social_presence as Record<string, unknown> | null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.company_name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`text-xs border ${getStatusColor(editData.status)}`}>
                {editData.status ?? "New"}
              </Badge>
              {lead.verified ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
              {lead.quality_score !== null && lead.quality_score !== undefined && (
                <Badge className={`text-xs border ${getScoreColor(lead.quality_score)}`}>
                  Score: {lead.quality_score}
                </Badge>
              )}
              {industry && <IndustryBadge industry={industry} />}
              {enrichmentCompleteness > 0 && (
                <span className={`text-xs font-medium ${getCompletenessTextColor(enrichmentCompleteness)}`}>
                  {enrichmentCompleteness}% complete
                </span>
              )}
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" onValueChange={(v) => v === "enrichment" && fetchEnrichmentLog()}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
          <TabsTrigger value="news">News & Signals</TabsTrigger>
          <TabsTrigger value="agent-notes">Agent Notes</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6 mt-4">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Your Fields */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                    Your Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={editData.status ?? "New"}
                      onValueChange={(v) => set("status", v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <span className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                  getStatusColor(s).includes("green")
                                    ? "bg-green-400"
                                    : getStatusColor(s).includes("blue")
                                    ? "bg-blue-400"
                                    : getStatusColor(s).includes("red")
                                    ? "bg-red-400"
                                    : getStatusColor(s).includes("orange")
                                    ? "bg-orange-400"
                                    : getStatusColor(s).includes("purple")
                                    ? "bg-purple-400"
                                    : getStatusColor(s).includes("yellow")
                                    ? "bg-yellow-400"
                                    : "bg-gray-400"
                                }`}
                              />
                              {s}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Your Notes</Label>
                    <Textarea
                      value={editData.human_notes ?? ""}
                      onChange={(e) => set("human_notes", e.target.value)}
                      placeholder="Add your notes here..."
                      className="mt-1 min-h-24"
                    />
                  </div>

                  <div>
                    <Label>Last Touch Date</Label>
                    <Input
                      type="date"
                      value={editData.last_touch_date ?? ""}
                      onChange={(e) => set("last_touch_date", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                    Company Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Company Name</Label>
                    <Input
                      value={editData.company_name ?? ""}
                      onChange={(e) => set("company_name", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Website</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={editData.website ?? ""}
                        onChange={(e) => set("website", e.target.value)}
                        className="flex-1"
                      />
                      {editData.website && (
                        <Button variant="outline" size="icon" asChild>
                          <a
                            href={
                              editData.website.startsWith("http")
                                ? editData.website
                                : `https://${editData.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>City</Label>
                    <Input
                      value={editData.city ?? ""}
                      onChange={(e) => set("city", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>State</Label>
                    <Input
                      value={editData.state ?? ""}
                      onChange={(e) => set("state", e.target.value)}
                      className="mt-1"
                      maxLength={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>States Served (comma-separated)</Label>
                    <Input
                      value={editData.states_served ?? ""}
                      onChange={(e) => set("states_served", e.target.value)}
                      className="mt-1"
                      placeholder="TX, LA, MS, AR"
                    />
                  </div>

                  <div>
                    <Label>Specialization</Label>
                    <Input
                      value={editData.specialization ?? ""}
                      onChange={(e) => set("specialization", e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Estimated Size</Label>
                    <Select
                      value={editData.estimated_size ?? ""}
                      onValueChange={(v) => set("estimated_size", v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select size..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="small">Small (2-10)</SelectItem>
                        <SelectItem value="mid">Mid (10-50)</SelectItem>
                        <SelectItem value="large">Large (50+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                    Contact Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={editData.contact_name ?? ""}
                      onChange={(e) => set("contact_name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={editData.contact_title ?? ""}
                      onChange={(e) => set("contact_title", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Mobile Phone</Label>
                    <Input
                      value={editData.mobile_phone ?? ""}
                      onChange={(e) => set("mobile_phone", e.target.value)}
                      className="mt-1"
                      type="tel"
                    />
                  </div>
                  <div>
                    <Label>HQ Phone</Label>
                    <Input
                      value={editData.phone_hq ?? ""}
                      onChange={(e) => set("phone_hq", e.target.value)}
                      className="mt-1"
                      type="tel"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Email</Label>
                    <Input
                      value={editData.email ?? ""}
                      onChange={(e) => set("email", e.target.value)}
                      className="mt-1"
                      type="email"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quality */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                    Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score</span>
                    {lead.quality_score !== null && lead.quality_score !== undefined ? (
                      <Badge className={`border ${getScoreColor(lead.quality_score)}`}>
                        {lead.quality_score}/100
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unscored</span>
                    )}
                  </div>

                  {/* Score breakdown bar */}
                  {scoreBreakdown && (
                    <div className="pt-1">
                      <ScoreBreakdown breakdown={scoreBreakdown} maxScore={100} />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Verified</span>
                    {lead.verified ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Independent</span>
                    <span className="text-sm">{lead.is_independent ? "Yes" : "No"}</span>
                  </div>

                  {industry && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Industry</span>
                      <IndustryBadge industry={industry} />
                    </div>
                  )}

                  {/* Enrichment completeness */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Enrichment</span>
                      <span className={`font-semibold ${getCompletenessTextColor(enrichmentCompleteness)}`}>
                        {enrichmentCompleteness}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full transition-all rounded-full ${getCompletenessColor(enrichmentCompleteness)}`}
                        style={{ width: `${enrichmentCompleteness}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provenance */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                    Provenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Source</p>
                    <p>{lead.source ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Discovered By</p>
                    <p>{lead.discovered_by ?? "—"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs">Verified By</p>
                    <p>{lead.verified_by ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Verified At</p>
                    <p>
                      {lead.verified_at
                        ? new Date(lead.verified_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p>
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Domain</p>
                    <p className="font-mono text-xs">{lead.domain ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Carrier Partners */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                    Carrier Partners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carrierPartners.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {carrierPartners.map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">None recorded</p>
                  )}
                  <div className="mt-3">
                    <Label className="text-xs">Edit (comma-separated)</Label>
                    <Input
                      value={editData.carrier_partners ?? ""}
                      onChange={(e) => set("carrier_partners", e.target.value)}
                      className="mt-1 text-xs"
                      placeholder="Northland, Progressive, Canal"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── CONTACTS TAB ── */}
        <TabsContent value="contacts">
          <div className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactsTable leadId={id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ENRICHMENT TAB ── */}
        <TabsContent value="enrichment">
          <div className="mt-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Enrichment</CardTitle>
              </CardHeader>
              <CardContent>
                <EnrichmentPanel
                  entityType="lead"
                  entityId={id}
                  lastEnrichedAt={typeof lastEnrichedAt === "string" ? lastEnrichedAt : null}
                  completeness={enrichmentCompleteness}
                  onEnriched={() => {
                    fetchEnrichmentLog();
                  }}
                />
              </CardContent>
            </Card>

            {/* Enrichment History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Enrichment History</CardTitle>
              </CardHeader>
              <CardContent>
                {logLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : enrichmentLog.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No enrichment history yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Run enrichment to see a history of past runs.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                          <th className="p-3 text-left font-medium text-muted-foreground">Source</th>
                          <th className="p-3 text-left font-medium text-muted-foreground">Success</th>
                          <th className="p-3 text-left font-medium text-muted-foreground">Fields</th>
                          <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {enrichmentLog.map((entry) => (
                          <tr key={entry.id} className="hover:bg-muted/20">
                            <td className="p-3 text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleString()}
                            </td>
                            <td className="p-3">{entry.source}</td>
                            <td className="p-3">
                              {entry.success ? (
                                <Badge className="text-xs border bg-green-500/20 text-green-300 border-green-500/30">
                                  Success
                                </Badge>
                              ) : (
                                <Badge className="text-xs border bg-red-500/20 text-red-300 border-red-500/30">
                                  Failed
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-sm">{entry.fields_updated}</td>
                            <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                              {entry.duration_ms ? `${entry.duration_ms}ms` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── NEWS & SIGNALS TAB ── */}
        <TabsContent value="news">
          <div className="mt-4 grid lg:grid-cols-2 gap-6">
            {/* News */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Recent News
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NewsFeed items={recentNews} />
              </CardContent>
            </Card>

            {/* Hiring Signals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Hiring Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hiringData ? (
                  <>
                    {hiringData.open_roles !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Open Roles</span>
                        <span className="font-medium">{String(hiringData.open_roles)}</span>
                      </div>
                    )}
                    {hiringData.departments && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Departments</span>
                        <span className="font-medium">{String(hiringData.departments)}</span>
                      </div>
                    )}
                    {hiringData.status && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          className={`text-xs border ${
                            String(hiringData.status).toLowerCase() === "actively hiring"
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                          }`}
                        >
                          {String(hiringData.status)}
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hiring data available. Run enrichment to discover signals.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Financial Signals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financial Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {financialData ? (
                  <>
                    {financialData.total_raised !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Raised</span>
                        <span className="font-medium">{String(financialData.total_raised)}</span>
                      </div>
                    )}
                    {financialData.last_round && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Round</span>
                        <span className="font-medium">{String(financialData.last_round)}</span>
                      </div>
                    )}
                    {financialData.investors && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Investors</span>
                        <p className="mt-1 text-xs text-foreground">{String(financialData.investors)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No financial data available. Run enrichment to discover signals.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Social Presence */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Social Presence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {socialData?.linkedin_url ? (
                    <a
                      href={String(socialData.linkedin_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors text-sm text-muted-foreground hover:text-blue-300"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  ) : null}
                  {socialData?.twitter_url ? (
                    <a
                      href={String(socialData.twitter_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-sky-500/50 hover:bg-sky-500/10 transition-colors text-sm text-muted-foreground hover:text-sky-300"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter/X
                    </a>
                  ) : null}
                  {socialData?.github_url ? (
                    <a
                      href={String(socialData.github_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-gray-400/50 hover:bg-gray-500/10 transition-colors text-sm text-muted-foreground hover:text-gray-300"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  ) : null}
                  {!socialData?.linkedin_url && !socialData?.twitter_url && !socialData?.github_url && (
                    <p className="text-sm text-muted-foreground">
                      No social profiles found. Run enrichment to discover social presence.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── AGENT NOTES TAB ── */}
        <TabsContent value="agent-notes">
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Agent Notes
                  <Badge variant="outline" className="text-xs">Read-only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.agent_notes ? (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{lead.agent_notes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No agent notes recorded yet.
                  </p>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Source URL</p>
                    {lead.source_url ? (
                      <a
                        href={lead.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs break-all"
                      >
                        {lead.source_url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground">—</p>
                    )}
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Discovered By</p>
                    <p>{lead.discovered_by ?? "—"}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Verification Status</p>
                    <div className="flex items-center gap-2">
                      {lead.verified ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 text-sm">Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">Unverified</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Verified At</p>
                    <p>
                      {lead.verified_at
                        ? new Date(lead.verified_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
