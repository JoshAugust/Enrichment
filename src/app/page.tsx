import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, ALL_STATUSES } from "@/lib/constants";
import { INDUSTRY_LABELS } from "@/components/industry-badge";
import {
  Users,
  CheckCircle,
  TrendingUp,
  Activity,
  BarChart3,
  Clock,
  Sparkles,
  AlertTriangle,
  Building2,
} from "lucide-react";

const API_KEY = process.env.API_KEY ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byState: Record<string, number>;
  verified: number;
  unverified: number;
  avgScore: number | null;
  addedToday: number;
  addedThisWeek: number;
  // V2 enrichment stats (may not exist yet)
  avgEnrichmentCompleteness?: number | null;
  awaitingEnrichment?: number | null;
  byIndustry?: Record<string, number>;
  enrichedToday?: number | null;
  avgEnrichmentTime?: number | null;
}

interface AgentLog {
  id: string;
  agent_name: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface SourceHealth {
  name: string;
  status: "ok" | "stale" | "error" | "not_run";
}

async function getStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${APP_URL}/api/leads/stats`, {
      headers: { "x-api-key": API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getAgentLog(): Promise<AgentLog[]> {
  try {
    const res = await fetch(`${APP_URL}/api/agent-log?limit=20`, {
      headers: { "x-api-key": API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getEnrichmentSourceHealth(): Promise<SourceHealth[]> {
  try {
    const res = await fetch(`${APP_URL}/api/enrichment/sources`, {
      headers: { "x-api-key": API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const DEFAULT_SOURCES: SourceHealth[] = [
  { name: "LinkedIn", status: "not_run" },
  { name: "Clearbit", status: "not_run" },
  { name: "Hunter.io", status: "not_run" },
  { name: "Apollo", status: "not_run" },
  { name: "ZoomInfo", status: "not_run" },
  { name: "Crunchbase", status: "not_run" },
  { name: "Website Scraper", status: "not_run" },
  { name: "Google Maps", status: "not_run" },
  { name: "FMCSA", status: "not_run" },
  { name: "News API", status: "not_run" },
];

function SourceDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ok: "bg-green-500",
    stale: "bg-yellow-500",
    error: "bg-red-500",
    not_run: "bg-gray-500",
  };
  return (
    <div
      className={`w-2.5 h-2.5 rounded-full ${colors[status] ?? colors.not_run}`}
      title={status}
    />
  );
}

function getCompletenessColor(pct: number): string {
  if (pct >= 80) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

export default async function DashboardPage() {
  const [stats, logs, sourceHealth] = await Promise.all([
    getStats(),
    getAgentLog(),
    getEnrichmentSourceHealth(),
  ]);

  const topStates = stats?.byState
    ? Object.entries(stats.byState)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];
  const maxStateCount = topStates[0]?.[1] ?? 1;

  const sources = sourceHealth.length > 0 ? sourceHealth : DEFAULT_SOURCES;
  const allOk = sources.every((s) => s.status === "ok" || s.status === "not_run");

  const byIndustry = stats?.byIndustry ?? {};
  const industryEntries = Object.entries(byIndustry).filter(([, v]) => v > 0);

  const avgCompleteness = stats?.avgEnrichmentCompleteness ?? null;
  const awaitingEnrichment = stats?.awaitingEnrichment ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Lead enrichment overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats?.total ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{stats?.verified ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">
                  {stats?.avgScore !== null && stats?.avgScore !== undefined
                    ? stats.avgScore
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats?.addedThisWeek ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrichment Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Enrichment Coverage */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Sparkles className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrichment Coverage</p>
                {avgCompleteness !== null ? (
                  <p className={`text-2xl font-bold ${getCompletenessColor(avgCompleteness)}`}>
                    {avgCompleteness}%
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Enrichment */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Enrichment</p>
                <p className="text-2xl font-bold">
                  {awaitingEnrichment !== null ? awaitingEnrichment : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">&lt;30% complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Industries */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Industries</p>
                {industryEntries.length > 0 ? (
                  <div className="mt-1 space-y-0.5">
                    {industryEntries.slice(0, 3).map(([ind, count]) => (
                      <div key={ind} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {INDUSTRY_LABELS[ind] ?? ind}
                        </span>
                        <span className="text-xs font-medium text-foreground shrink-0">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrichment Pipeline Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Enrichment Pipeline Status
            <Badge
              className={`text-xs border ml-2 ${
                allOk
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
              }`}
            >
              {allOk ? "Operational" : "Degraded"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Source dots grid */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Source Health</p>
              <div className="flex flex-wrap gap-3">
                {sources.map((src) => (
                  <div key={src.name} className="flex items-center gap-1.5">
                    <SourceDot status={src.status} />
                    <span className="text-xs text-muted-foreground">{src.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> OK
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" /> Stale
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> Error
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500" /> Not Run
                </span>
              </div>
            </div>

            {/* Enrichment metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Enriched Today</p>
                <p className="text-lg font-semibold mt-0.5">
                  {stats?.enrichedToday !== null && stats?.enrichedToday !== undefined
                    ? stats.enrichedToday
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Enrichment Time</p>
                <p className="text-lg font-semibold mt-0.5">
                  {stats?.avgEnrichmentTime !== null && stats?.avgEnrichmentTime !== undefined
                    ? `${stats.avgEnrichmentTime}s`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats
              ? ALL_STATUSES.map((status) => {
                  const count = stats.byStatus[status] ?? 0;
                  const pct =
                    stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <Badge
                        className={`text-xs w-28 justify-center border ${getStatusColor(status)}`}
                      >
                        {status}
                      </Badge>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })
              : <p className="text-muted-foreground text-sm">Loading stats...</p>
            }
          </CardContent>
        </Card>

        {/* State Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Top States
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topStates.length > 0
              ? topStates.map(([state, count]) => {
                  const pct = Math.round((count / maxStateCount) * 100);
                  return (
                    <div key={state} className="flex items-center gap-3">
                      <span className="text-sm font-mono font-medium w-8">{state}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })
              : <p className="text-muted-foreground text-sm">No state data yet.</p>
            }
          </CardContent>
        </Card>
      </div>

      {/* Agent Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Agent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-2 divide-y divide-border">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-4 pt-2 first:pt-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <span className="text-primary">{log.agent_name}</span>{" "}
                        <span className="text-muted-foreground">→</span> {log.action}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {JSON.stringify(log.details).slice(0, 100)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No agent activity yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Agents will log their actions here as they run.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-400">{stats?.addedToday ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Added Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-400">{stats?.unverified ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Unverified</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
