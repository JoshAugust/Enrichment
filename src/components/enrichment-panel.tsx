"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MinusCircle,
  Database,
} from "lucide-react";

export interface SourceStatus {
  name: string;
  status: "ok" | "stale" | "error" | "not_run";
  last_checked?: string | null;
  fields_found?: number;
}

interface EnrichmentPanelProps {
  entityType: "lead" | "contact";
  entityId: string;
  lastEnrichedAt?: string | null;
  completeness?: number | null;
  sourceStatuses?: SourceStatus[];
  onEnriched?: () => void;
}

const DEFAULT_SOURCES: SourceStatus[] = [
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

function getCompletenessColor(pct: number): string {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function EnrichmentPanel({
  entityType,
  entityId,
  lastEnrichedAt,
  completeness,
  sourceStatuses,
  onEnriched,
}: EnrichmentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ newFields: number; fields: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sources = sourceStatuses && sourceStatuses.length > 0 ? sourceStatuses : DEFAULT_SOURCES;
  const pct = completeness ?? 0;

  const handleEnrich = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const endpoint =
        entityType === "lead"
          ? `/api/enrichment/lead/${entityId}`
          : `/api/enrichment/contact/${entityId}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult({
        newFields: data.new_fields ?? data.fields_found ?? 0,
        fields: data.fields ?? [],
      });
      onEnriched?.();
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "HTTP 404"
          ? "Enrichment API not available yet"
          : "Enrichment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            Enrichment Status
          </h3>
          {lastEnrichedAt ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last enriched: {new Date(lastEnrichedAt).toLocaleString()}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">Never enriched</p>
          )}
        </div>
        <Button
          onClick={handleEnrich}
          disabled={loading}
          size="sm"
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? "Enriching..." : "Enrich Now"}
        </Button>
      </div>

      {/* Completeness meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Data Completeness</span>
          <span
            className={`font-semibold ${
              pct >= 80
                ? "text-green-400"
                : pct >= 50
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full transition-all rounded-full ${getCompletenessColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Result preview */}
      {result && (
        <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
          <p className="text-sm text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            ✓ {result.newFields} new data points found
          </p>
          {result.fields.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {result.fields.map((f, i) => (
                <li key={i} className="text-xs text-green-300/80">
                  • {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <p className="text-sm text-yellow-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {/* Source status grid */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Source Status
        </h4>
        <div className="grid gap-2">
          {sources.map((src) => (
            <div
              key={src.name}
              className="flex items-center justify-between p-2 rounded-md border border-border bg-card/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{src.name}</span>
                {src.fields_found !== undefined && src.fields_found > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({src.fields_found} fields)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {src.last_checked && (
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(src.last_checked).toLocaleDateString()}
                  </span>
                )}
                <StatusBadge status={src.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
