"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { IndustryBadge, ALL_INDUSTRIES, INDUSTRY_LABELS } from "@/components/industry-badge";
import { ALL_STATUSES, US_STATES } from "@/lib/constants";
import {
  PhoneCall,
  Phone,
  Mail,
  Plus,
  RefreshCw,
  Users,
  CheckCircle,
  Circle,
  Target,
  TrendingUp,
  Loader2,
  Shield,
  UserCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CallSheetUser {
  id: string;
  name: string;
  role: "admin" | "caller";
  active: boolean;
  created_at: string;
}

interface CallSheetLead {
  assignment_id: string;
  called: boolean;
  called_at: string | null;
  assignment_notes: string | null;
  assigned_date: string;
  id: string;
  company_name: string;
  phone_hq: string | null;
  mobile_phone: string | null;
  email: string | null;
  state: string | null;
  city: string | null;
  industry: string | null;
  quality_score: number | null;
  enrichment_completeness: number | null;
  status: string | null;
  contact_name: string | null;
  contact_title: string | null;
  website: string | null;
  domain: string | null;
  total_raised: string | null;
  last_funding_round: string | null;
  agent_notes: string | null;
  enrichment_data: Record<string, unknown> | null;
}

interface UserStat {
  userId: string;
  name: string;
  total: number;
  called: number;
  remaining: number;
}

interface AssignFilters {
  industry: string;
  state: string;
  minScore: number;
  hasPhone: boolean;
  status: string;
}

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "corgi-enrichment-2026";
const STORAGE_KEY = "callsheet_selected_user_id";

// ── Utility helpers ────────────────────────────────────────────────────────────

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

function getDealPotential(lead: CallSheetLead): { emoji: string; label: string } {
  const score = lead.quality_score ?? 0;
  const hasPhone = !!(lead.mobile_phone || lead.phone_hq);
  const hasFunding = !!(lead.total_raised || lead.last_funding_round);

  if (score >= 70 && hasPhone && hasFunding) return { emoji: "🔥", label: "Hot" };
  if (score >= 50 && hasPhone) return { emoji: "⭐", label: "Warm" };
  return { emoji: "❄️", label: "Cold" };
}

function getProgressColor(pct: number): string {
  if (pct >= 50) return "bg-green-500";
  if (pct >= 25) return "bg-yellow-500";
  return "bg-red-500";
}

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Progress Bar component ────────────────────────────────────────────────────

function ColoredProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`relative h-2 w-full rounded-full bg-muted overflow-hidden ${className ?? ""}`}>
      <div
        className={`h-full rounded-full transition-all ${getProgressColor(value)}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: UserStat }) {
  const pct = stat.total > 0 ? Math.round((stat.called / stat.total) * 100) : 0;
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-foreground">{stat.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stat.called} / {stat.total} called
            </p>
          </div>
          <Badge
            className={`text-sm font-bold border ${getGradeColor(pct)}`}
          >
            {pct}%
          </Badge>
        </div>
        <ColoredProgress value={pct} />
        <p className="text-xs text-muted-foreground mt-2">
          <span className="text-foreground font-medium">{stat.remaining}</span> remaining
        </p>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CallSheetPage() {
  const [users, setUsers] = useState<CallSheetUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [leads, setLeads] = useState<CallSheetLead[]>([]);
  const [sheetStats, setSheetStats] = useState<{ total: number; called: number; remaining: number } | null>(null);
  const [allStats, setAllStats] = useState<UserStat[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [date] = useState(todayDate());

  // Admin: Assignment panel
  const [assignFilters, setAssignFilters] = useState<AssignFilters>({
    industry: "",
    state: "",
    minScore: 0,
    hasPhone: true,
    status: "",
  });
  const [assignCount, setAssignCount] = useState(600);
  const [selectedCallerIds, setSelectedCallerIds] = useState<Set<string>>(new Set());
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<{ assigned: number; perUser: { userId: string; name: string; count: number }[] } | null>(null);

  // Admin: Add user dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"caller" | "admin">("caller");
  const [addingUser, setAddingUser] = useState(false);

  // Preview debounce
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/call-sheets/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/call-sheets/stats?date=${date}`);
      const data = await res.json();
      setAllStats(data.stats ?? []);
    } catch (err) {
      console.error(err);
    }
  }, [date]);

  const fetchSheet = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoadingLeads(true);
    try {
      const res = await fetch(`/api/call-sheets/my-sheet?userId=${userId}&date=${date}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setSheetStats(data.stats ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  }, [date]);

  const fetchPreview = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("date", date);
    if (assignFilters.industry) params.set("industry", assignFilters.industry);
    if (assignFilters.state) params.set("state", assignFilters.state);
    if (assignFilters.minScore > 0) params.set("minScore", String(assignFilters.minScore));
    if (assignFilters.hasPhone) params.set("hasPhone", "true");
    if (assignFilters.status) params.set("status", assignFilters.status);

    try {
      const res = await fetch(`/api/call-sheets/assign?${params}`);
      const data = await res.json();
      setAvailableCount(data.available ?? 0);
    } catch (err) {
      console.error(err);
    }
  }, [assignFilters, date]);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Restore selected user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSelectedUserId(stored);
  }, []);

  // Fetch sheet when user changes
  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem(STORAGE_KEY, selectedUserId);
      fetchSheet(selectedUserId);
    }
  }, [selectedUserId, fetchSheet]);

  // Debounce preview fetch
  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(fetchPreview, 400);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [fetchPreview]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleMarkCalled = async (assignmentId: string, called: boolean) => {
    // Optimistic update
    setLeads((prev) => {
      const updated = prev.map((l) =>
        l.assignment_id === assignmentId ? { ...l, called } : l
      );
      // Re-sort: uncalled first
      return [...updated].sort((a, b) => {
        if (a.called === b.called) {
          return (b.quality_score ?? 0) - (a.quality_score ?? 0);
        }
        return a.called ? 1 : -1;
      });
    });

    // Update stats optimistically
    setSheetStats((prev) => {
      if (!prev) return prev;
      const delta = called ? 1 : -1;
      return {
        ...prev,
        called: prev.called + delta,
        remaining: prev.remaining - delta,
      };
    });

    try {
      await fetch("/api/call-sheets/mark-called", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ assignmentId, called }),
      });
      // Refresh stats in background
      fetchStats();
    } catch (err) {
      console.error(err);
      // Revert on error
      fetchSheet(selectedUserId);
    }
  };

  const handleAssign = async () => {
    if (selectedCallerIds.size === 0) return;
    setAssigning(true);
    setAssignResult(null);
    try {
      const res = await fetch("/api/call-sheets/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          userIds: Array.from(selectedCallerIds),
          count: assignCount,
          date,
          filters: {
            ...(assignFilters.industry && { industry: assignFilters.industry }),
            ...(assignFilters.state && { state: assignFilters.state }),
            ...(assignFilters.minScore > 0 && { minScore: assignFilters.minScore }),
            hasPhone: assignFilters.hasPhone,
            ...(assignFilters.status && { status: assignFilters.status }),
          },
        }),
      });
      const data = await res.json();
      setAssignResult(data);
      fetchStats();
      fetchPreview();
      // If current user is in assignees, refresh their sheet
      if (selectedCallerIds.has(selectedUserId)) {
        fetchSheet(selectedUserId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    setAddingUser(true);
    try {
      const res = await fetch("/api/call-sheets/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ name: newUserName.trim(), role: newUserRole }),
      });
      const data = await res.json();
      if (data.user) {
        setUsers((prev) => [...prev, data.user]);
        setNewUserName("");
        setAddUserOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingUser(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const isAdmin = selectedUser?.role === "admin";
  const callers = users.filter((u) => u.role === "caller");

  const progressPct = sheetStats && sheetStats.total > 0
    ? Math.round((sheetStats.called / sheetStats.total) * 100)
    : 0;

  const perUserPreview = selectedCallerIds.size > 0 && availableCount !== null
    ? Math.min(assignCount, Math.floor(availableCount / selectedCallerIds.size))
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PhoneCall className="w-7 h-7 text-primary" />
            Call Sheet
          </h1>
          <p className="text-muted-foreground mt-1">
            Daily lead assignments · {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* User Switcher */}
        <div className="flex items-center gap-3">
          {loadingUsers ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-52">
                <div className="flex items-center gap-2">
                  {selectedUser?.role === "admin" ? (
                    <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <UserCircle className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <SelectValue placeholder="Select user…" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      {u.role === "admin" ? (
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <UserCircle className="w-3.5 h-3.5 text-primary" />
                      )}
                      {u.name}
                      {u.role === "admin" && (
                        <span className="text-xs text-muted-foreground">(admin)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── ADMIN VIEW ─────────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="space-y-6">
          {/* Today's Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Today&apos;s Progress
              </h2>
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
            {allStats.filter((s) => s.total > 0).length === 0 ? (
              <p className="text-muted-foreground text-sm">No assignments yet for today.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allStats.filter((s) => s.total > 0).map((stat) => (
                  <StatCard key={stat.userId} stat={stat} />
                ))}
              </div>
            )}
          </div>

          {/* Assignment Panel */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-5 h-5 text-primary" />
                Assign Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Filters */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Targeting Filters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  <Select
                    value={assignFilters.industry || "all"}
                    onValueChange={(v) => setAssignFilters((f) => ({ ...f, industry: v === "all" ? "" : v }))}
                  >
                    <SelectTrigger>
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
                    value={assignFilters.state || "all"}
                    onValueChange={(v) => setAssignFilters((f) => ({ ...f, state: v === "all" ? "" : v }))}
                  >
                    <SelectTrigger>
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
                    value={assignFilters.status || "all"}
                    onValueChange={(v) => setAssignFilters((f) => ({ ...f, status: v === "all" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">Min Score:</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={assignFilters.minScore}
                      onChange={(e) => setAssignFilters((f) => ({ ...f, minScore: Number(e.target.value) }))}
                      className="w-20"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hasPhone"
                      checked={assignFilters.hasPhone}
                      onCheckedChange={(v) => setAssignFilters((f) => ({ ...f, hasPhone: !!v }))}
                    />
                    <label htmlFor="hasPhone" className="text-sm text-muted-foreground cursor-pointer">
                      Has Phone
                    </label>
                  </div>
                </div>

                {/* Live preview count */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Available leads:{" "}
                    <span className="text-foreground font-semibold">
                      {availableCount === null ? "…" : availableCount.toLocaleString()}
                    </span>
                  </div>
                  {selectedCallerIds.size > 0 && availableCount !== null && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm text-primary font-semibold">
                        {Math.min(assignCount, Math.floor(availableCount / selectedCallerIds.size)).toLocaleString()} per caller
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Callers + Count */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Select callers */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Select Callers</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {callers.map((caller) => (
                      <label
                        key={caller.id}
                        className="flex items-center gap-3 p-2.5 rounded-md border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedCallerIds.has(caller.id)}
                          onCheckedChange={(checked) => {
                            setSelectedCallerIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(caller.id);
                              else next.delete(caller.id);
                              return next;
                            });
                          }}
                        />
                        <UserCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{caller.name}</span>
                        {allStats.find((s) => s.userId === caller.id && s.total > 0) && (
                          <Badge className="ml-auto text-xs border bg-muted text-muted-foreground border-border">
                            {allStats.find((s) => s.userId === caller.id)?.total} assigned
                          </Badge>
                        )}
                      </label>
                    ))}
                    {callers.length === 0 && (
                      <p className="text-sm text-muted-foreground">No callers yet. Add one below.</p>
                    )}
                  </div>
                </div>

                {/* Count per user */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Leads per Caller</p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={2000}
                      value={assignCount}
                      onChange={(e) => setAssignCount(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">leads/caller</span>
                  </div>

                  {selectedCallerIds.size > 0 && (
                    <div className="mt-3 p-3 rounded-md bg-muted/30 border border-border text-sm space-y-1">
                      <p className="text-muted-foreground">
                        Callers selected: <span className="text-foreground font-semibold">{selectedCallerIds.size}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Total to assign: <span className="text-foreground font-semibold">
                          {Math.min(assignCount * selectedCallerIds.size, availableCount ?? 0).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}

                  <Button
                    className="mt-4 w-full"
                    onClick={handleAssign}
                    disabled={assigning || selectedCallerIds.size === 0}
                  >
                    {assigning ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning…</>
                    ) : (
                      <><Target className="w-4 h-4 mr-2" /> Assign {perUserPreview > 0 ? `~${perUserPreview.toLocaleString()} leads` : "Leads"}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Result summary */}
              {assignResult && (
                <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
                  <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Assigned {assignResult.assigned.toLocaleString()} leads
                  </p>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {assignResult.perUser.map((u) => (
                      <div key={u.userId} className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{u.name}:</span> {u.count.toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-primary" />
                  Team
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setAddUserOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Caller
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      {u.role === "admin" ? (
                        <Shield className="w-4 h-4 text-amber-400" />
                      ) : (
                        <UserCircle className="w-4 h-4 text-primary" />
                      )}
                      <span className="text-sm font-medium">{u.name}</span>
                    </div>
                    <Badge
                      className={`text-xs border ${u.role === "admin" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-primary/20 text-primary border-primary/30"}`}
                    >
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── CALLER VIEW ────────────────────────────────────────────────────── */}
      {!isAdmin && selectedUser && (
        <div className="space-y-4">
          {/* Progress header */}
          {sheetStats && (
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedUser.name}&apos;s Sheet</h2>
                    <p className="text-sm text-muted-foreground">
                      {sheetStats.called} called · {sheetStats.remaining} remaining
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-base font-bold border px-3 py-1 ${getGradeColor(progressPct)}`}>
                      {sheetStats.called} / {sheetStats.total}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => fetchSheet(selectedUserId)}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <ColoredProgress value={progressPct} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1.5">{progressPct}% complete</p>
              </CardContent>
            </Card>
          )}

          {/* No leads state */}
          {!loadingLeads && leads.length === 0 && (
            <Card className="border-border">
              <CardContent className="p-12 text-center">
                <PhoneCall className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No leads assigned for today</p>
                <p className="text-sm text-muted-foreground/60 mt-1">An admin needs to run the assignment for today.</p>
              </CardContent>
            </Card>
          )}

          {/* Leads table */}
          {(loadingLeads || leads.length > 0) && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-3 w-10 text-left">
                        <span className="sr-only">Called</span>
                      </th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Company</th>
                      <th className="p-3 text-left font-medium text-muted-foreground min-w-[160px]">Phone</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="p-3 w-12 text-left font-medium text-muted-foreground">St</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Industry</th>
                      <th className="p-3 w-20 text-left font-medium text-muted-foreground">Score</th>
                      <th className="p-3 w-20 text-left font-medium text-muted-foreground hidden sm:table-cell">Deal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingLeads ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading your call sheet…
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => {
                        const deal = getDealPotential(lead);
                        const primaryPhone = lead.mobile_phone || lead.phone_hq;
                        const secondaryPhone = lead.mobile_phone && lead.phone_hq && lead.mobile_phone !== lead.phone_hq
                          ? lead.phone_hq
                          : null;

                        return (
                          <tr
                            key={lead.assignment_id}
                            className={`transition-colors group ${
                              lead.called
                                ? "opacity-40 bg-muted/20"
                                : "hover:bg-muted/30"
                            }`}
                          >
                            {/* Called checkbox */}
                            <td className="p-3">
                              <button
                                onClick={() => handleMarkCalled(lead.assignment_id, !lead.called)}
                                className="flex items-center justify-center w-6 h-6 transition-colors"
                                title={lead.called ? "Mark as uncalled" : "Mark as called"}
                              >
                                {lead.called ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                                )}
                              </button>
                            </td>

                            {/* Company */}
                            <td className="p-3 max-w-[200px]">
                              <p className={`font-medium truncate ${lead.called ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {lead.company_name}
                              </p>
                              {lead.contact_name && (
                                <p className="text-xs text-muted-foreground truncate">{lead.contact_name}</p>
                              )}
                              {lead.city && !lead.contact_name && (
                                <p className="text-xs text-muted-foreground truncate">{lead.city}</p>
                              )}
                            </td>

                            {/* Phone — CRITICAL, prominent */}
                            <td className="p-3 min-w-[160px]">
                              {primaryPhone ? (
                                <div className="space-y-0.5">
                                  <a
                                    href={`tel:${primaryPhone}`}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="w-3.5 h-3.5 shrink-0" />
                                    <span className="font-mono tabular-nums">{formatPhone(primaryPhone)}</span>
                                    {lead.mobile_phone === primaryPhone && (
                                      <span className="text-xs text-muted-foreground font-sans">m</span>
                                    )}
                                  </a>
                                  {secondaryPhone && (
                                    <a
                                      href={`tel:${secondaryPhone}`}
                                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <PhoneCall className="w-3 h-3 shrink-0" />
                                      <span className="font-mono tabular-nums">{formatPhone(secondaryPhone)}</span>
                                      <span className="text-xs">hq</span>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">No phone</span>
                              )}
                            </td>

                            {/* Email */}
                            <td className="p-3 hidden md:table-cell max-w-[180px]">
                              {lead.email ? (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail className="w-3 h-3 shrink-0" />
                                  {lead.email}
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>

                            {/* State */}
                            <td className="p-3">
                              <span className="text-sm font-mono">{lead.state ?? "—"}</span>
                            </td>

                            {/* Industry */}
                            <td className="p-3 hidden lg:table-cell">
                              <IndustryBadge industry={lead.industry} />
                            </td>

                            {/* Score */}
                            <td className="p-3">
                              {lead.quality_score !== null && lead.quality_score !== undefined ? (
                                <Badge className={`text-xs border font-bold ${getGradeColor(lead.quality_score)}`}>
                                  {scoreToGrade(lead.quality_score)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>

                            {/* Deal potential */}
                            <td className="p-3 hidden sm:table-cell">
                              <span className="text-base" title={deal.label}>{deal.emoji}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No user selected */}
      {!selectedUserId && !loadingUsers && (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Select a user to get started</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Use the dropdown in the top right.</p>
          </CardContent>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Full name"
                onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "caller" | "admin")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caller">Caller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={handleAddUser} disabled={addingUser || !newUserName.trim()}>
              {addingUser ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Adding…</> : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
