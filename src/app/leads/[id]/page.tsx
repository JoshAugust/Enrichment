"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  Save,
  Loader2,
} from "lucide-react";
import type { Lead } from "@/db/schema";

type Props = {
  params: Promise<{ id: string }>;
};

export default function LeadDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taskLoading, setTaskLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Lead>>({});

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

  const queueTask = async (taskType: string) => {
    if (!lead) return;
    setTaskLoading(taskType);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        },
        body: JSON.stringify({
          task_type: taskType,
          payload: { lead_id: lead.id, company_name: lead.company_name },
          priority: 2,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(
        `${taskType === "verify" ? "Re-verify" : "Enrich"} task queued!`
      );
    } catch {
      showToast("Failed to queue task");
    } finally {
      setTaskLoading(null);
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/leads")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.company_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                className={`text-xs border ${getStatusColor(editData.status)}`}
              >
                {editData.status ?? "New"}
              </Badge>
              {lead.verified ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
              {lead.quality_score !== null && lead.quality_score !== undefined && (
                <Badge
                  className={`text-xs border ${getScoreColor(lead.quality_score)}`}
                >
                  Score: {lead.quality_score}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queueTask("verify")}
            disabled={taskLoading !== null}
          >
            {taskLoading === "verify" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Re-verify
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queueTask("enrich")}
            disabled={taskLoading !== null}
          >
            {taskLoading === "enrich" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Enrich
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Paul's Fields */}
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
                        {s}
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

          {/* Agent Notes (read-only) */}
          {lead.agent_notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                  Agent Notes (read-only)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {lead.agent_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Enrichment Data */}
          {Object.keys(enrichmentData).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                  Enrichment Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
                  {Object.entries(enrichmentData).map(([key, val]) => (
                    <div key={key} className="flex gap-4 p-2.5 text-sm">
                      <span className="font-medium text-muted-foreground w-40 shrink-0">
                        {key}
                      </span>
                      <span className="text-foreground break-all">
                        {typeof val === "object"
                          ? JSON.stringify(val)
                          : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* Quality Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
                Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                {lead.quality_score !== null && lead.quality_score !== undefined ? (
                  <Badge
                    className={`border ${getScoreColor(lead.quality_score)}`}
                  >
                    {lead.quality_score}/100
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Unscored</span>
                )}
              </div>
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
                <span className="text-sm">
                  {lead.is_independent ? "Yes" : "No"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
