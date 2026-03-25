"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MinusCircle,
  RefreshCw,
  Activity,
  Zap,
} from "lucide-react";

interface SourceCard {
  name: string;
  status: "ok" | "stale" | "error" | "not_run";
  success_rate?: number;
  last_run?: string | null;
  avg_duration_ms?: number | null;
  total_runs?: number;
}

interface EnrichmentLogEntry {
  id: string;
  created_at: string;
  lead_name: string;
  source: string;
  success: boolean;
  fields_found: number;
}

interface QueueInfo {
  pending: number;
}

const DEFAULT_SOURCES: SourceCard[] = [
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

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    ok: {
      label: "OK",
      className: "bg-green-500/20 text-green-300 border-green-500/30",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    stale: {
      label: "Stale",
      className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      icon: <Clock className="w-3 h-3" />,
    },
    error: {
      label: "Error",
      className: "bg-red-500/20 text-red-300 border-red-500/30",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    not_run: {
      label: "Not Run",
      className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      icon: <MinusCircle className="w-3 h-3" />,
    },
  };
  const config = configs[status] ?? configs.not_run;
  return (
    <Badge className={`text-xs border flex items-center gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function EnrichmentPage() {
  const [sources, setSources] = useState<SourceCard[]>(DEFAULT_SOURCES);
  const [log, setLog] = useState<EnrichmentLogEntry[]>([]);
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [logLoading, setLogLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  const fetchData = useCallback(async () => {
    // Try to fetch source health
    try {
      const res = await fetch("/api/enrichment/sources", {
        
      });
      if (res.ok) {
        const data = await res.json();
        setSources(Array.isArray(data) ? data : DEFAULT_SOURCES);
        setApiAvailable(true);
      } else {
        setApiAvailable(false);
      }
    } catch {
      setApiAvailable(false);
    }

    // Fetch queue depth
    try {
      const res = await fetch("/api/tasks?status=pending&task_type=enrich", {
        
      });
      if (res.ok) {
        const data = await res.json();
        setQueue({ pending: data.total ?? data.count ?? (Array.isArray(data) ? data.length : 0) });
      }
    } catch {
      // ignore
    }

    // Fetch recent enrichment log
    setLogLoading(true);
    try {
      const res = await fetch("/api/enrichment/log?limit=50", {
        
      });
      if (res.ok) {
        const data = await res.json();
        setLog(Array.isArray(data) ? data : data.log ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBatchEnrich = async () => {
    setBatchLoading(true);
    setBatchResult(null);
    try {
      const res = await fetch("/api/enrichment/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        },
        body: JSON.stringify({ limit: 20 }),
      });
      if (!res.ok) throw new Error("API not available");
      const data = await res.json();
      setBatchResult(
        `✓ Batch enrichment started for ${data.count ?? 20} leads`
      );
      setTimeout(() => fetchData(), 2000);
    } catch {
      setBatchResult("Batch enrichment API not available yet. Tasks queued locally.");
      // Queue tasks as fallback
      try {
        await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
          },
          body: JSON.stringify({
            task_type: "batch_enrich",
            payload: { limit: 20 },
            priority: 3,
          }),
        });
      } catch {
        // ignore
      }
    } finally {
      setBatchLoading(false);
    }
  };

  const allOk = sources.every((s) => s.status === "ok" || s.status === "not_run");
  const hasErrors = sources.some((s) => s.status === "error");
  const pipelineStatus = hasErrors ? "Degraded" : allOk ? "Operational" : "Partial";
  const pipelineColor = hasErrors
    ? "bg-red-500/20 text-red-300 border-red-500/30"
    : allOk
    ? "bg-green-500/20 text-green-300 border-green-500/30"
    : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary" />
            Enrichment
          </h1>
          <p className="text-muted-foreground mt-1">
            Pipeline status, source health, and enrichment management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={handleBatchEnrich} disabled={batchLoading}>
            {batchLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Zap className="w-4 h-4 mr-1" />
            )}
            Batch Enrich (20)
          </Button>
        </div>
      </div>

      {batchResult && (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-sm text-primary">
          {batchResult}
        </div>
      )}

      {apiAvailable === false && (
        <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-sm text-yellow-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Enrichment API routes are not yet available. This page will populate when the enrichment backend is deployed.
        </div>
      )}

      {/* Pipeline Status + Queue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Status</p>
                <div className="mt-1">
                  <Badge className={`border ${pipelineColor}`}>{pipelineStatus}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Queue Depth</p>
                <p className="text-2xl font-bold">
                  {queue !== null ? queue.pending : "—"}
                </p>
                <p className="text-xs text-muted-foreground">pending tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sources Online</p>
                <p className="text-2xl font-bold">
                  {sources.filter((s) => s.status === "ok").length}
                  <span className="text-muted-foreground text-lg font-normal">
                    /{sources.length}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Health Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Source Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {sources.map((src) => (
              <div
                key={src.name}
                className="p-3 rounded-lg border border-border bg-card/50 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{src.name}</span>
                  <StatusBadge status={src.status} />
                </div>

                {src.success_rate !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Success:{" "}
                    <span
                      className={`font-medium ${
                        src.success_rate >= 80
                          ? "text-green-400"
                          : src.success_rate >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {src.success_rate}%
                    </span>
                  </div>
                )}

                {src.last_run && (
                  <div className="text-xs text-muted-foreground">
                    Last: {timeAgo(src.last_run)}
                  </div>
                )}

                {src.avg_duration_ms !== null && src.avg_duration_ms !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Avg: {src.avg_duration_ms}ms
                  </div>
                )}

                {src.total_runs !== undefined && src.total_runs > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {src.total_runs} runs
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Enrichment Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Enrichment Activity
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (last 50 results)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : log.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No enrichment activity yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Use &quot;Batch Enrich&quot; above or enrich individual leads from their detail page.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-3 text-left font-medium text-muted-foreground">Time</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Lead</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Source</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Success</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Fields Found</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {log.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {timeAgo(entry.created_at)}
                        </td>
                        <td className="p-3 font-medium">{entry.lead_name}</td>
                        <td className="p-3 text-muted-foreground">{entry.source}</td>
                        <td className="p-3">
                          {entry.success ? (
                            <Badge className="text-xs border bg-green-500/20 text-green-300 border-green-500/30">
                              ✓ Success
                            </Badge>
                          ) : (
                            <Badge className="text-xs border bg-red-500/20 text-red-300 border-red-500/30">
                              ✗ Failed
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {entry.fields_found > 0 ? (
                            <span className="text-green-400 font-medium">+{entry.fields_found}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
