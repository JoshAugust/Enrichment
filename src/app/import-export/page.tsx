"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Upload,
  History,
  FileDown,
  FileUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  X,
  ArrowRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ExportRecord {
  id: string;
  export_type: string;
  row_count: number | null;
  destination: string | null;
  created_at: string;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: string[];
}

// ── Column mapping config ──────────────────────────────────────────────────

const LEAD_FIELDS: { key: string; label: string }[] = [
  { key: "company_name", label: "Company Name" },
  { key: "website", label: "Website" },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_title", label: "Contact Title" },
  { key: "phone_hq", label: "Phone (HQ)" },
  { key: "mobile_phone", label: "Mobile Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "industry", label: "Industry" },
  { key: "specialization", label: "Specialization" },
  { key: "employee_count", label: "Employee Count" },
  { key: "estimated_size", label: "Estimated Size" },
  { key: "total_raised", label: "Total Raised" },
  { key: "source", label: "Source" },
  { key: "agent_notes", label: "Notes" },
  { key: "states_served", label: "States Served" },
  { key: "carrier_partners", label: "Carrier Partners" },
  { key: "", label: "— Skip —" },
];

// Smart column auto-mapping
function autoMapColumns(csvColumns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const patterns: Record<string, RegExp> = {
    company_name: /company|business|org|name|agency/i,
    website: /website|url|site|web/i,
    contact_name: /contact|person|rep|agent|owner/i,
    contact_title: /title|position|role/i,
    phone_hq: /phone|tel|call|number|hq/i,
    mobile_phone: /mobile|cell/i,
    email: /email|mail/i,
    city: /city|town/i,
    state: /state|province|region/i,
    industry: /industry|sector|vertical/i,
    specialization: /specializ|specialty|focus|niche/i,
    employee_count: /employee|team|staff|headcount|size/i,
    estimated_size: /revenue|size|annual|revenue/i,
    total_raised: /raised|funding|capital/i,
    source: /source|origin|channel|from/i,
    agent_notes: /note|comment|description|memo/i,
    states_served: /states.?served|coverage|territory/i,
    carrier_partners: /carrier|partner|underwriter/i,
  };

  for (const col of csvColumns) {
    for (const [field, regex] of Object.entries(patterns)) {
      if (regex.test(col) && !Object.values(mapping).includes(field)) {
        mapping[col] = field;
        break;
      }
    }
    if (!mapping[col]) {
      mapping[col] = "";
    }
  }
  return mapping;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

// ── CSV Parser (client-side) ───────────────────────────────────────────────

function parseCSV(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { columns: [], rows: [] };

  // Simple CSV parser handling quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const columns = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      row[col] = values[i] ?? "";
    });
    return row;
  });

  return { columns, rows };
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ImportExportPage() {
  // Export state
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Import state
  const [importStep, setImportStep] = useState<"upload" | "map" | "preview" | "importing" | "done">("upload");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<{ columns: string[]; rows: Record<string, string>[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export ──────────────────────────────────────────────────────────────

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/export/history");
      if (res.ok) setHistory(await res.json());
    } catch { /* ignore */ } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export/csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `corgi-leads-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      await fetchHistory();
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── Import ──────────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.columns.length === 0) {
        setImportError("Could not parse CSV — no columns found.");
        return;
      }
      setCsvData(parsed);
      const autoMap = autoMapColumns(parsed.columns);
      setColumnMapping(autoMap);
      setImportStep("map");
    } catch {
      setImportError("Failed to read file.");
    }
  };

  const handleStartImport = async () => {
    if (!csvData) return;
    setImportStep("importing");
    setImportError(null);

    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? "";
    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      const lead: Record<string, string> = {};

      // Map CSV columns to lead fields
      for (const [csvCol, leadField] of Object.entries(columnMapping)) {
        if (leadField && row[csvCol]) {
          lead[leadField] = row[csvCol];
        }
      }

      // Must have company_name
      if (!lead.company_name) {
        errors.push(`Row ${i + 2}: Missing company name`);
        continue;
      }

      // Auto-set source if not mapped
      if (!lead.source) {
        lead.source = `csv-import:${csvFile?.name ?? "unknown"}`;
      }

      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(lead),
        });

        if (res.status === 201) {
          imported++;
        } else if (res.status === 409) {
          duplicates++;
        } else {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          errors.push(`Row ${i + 2} (${lead.company_name}): ${err.error}`);
        }
      } catch {
        errors.push(`Row ${i + 2} (${lead.company_name}): Network error`);
      }

      // Small delay to avoid hammering the API
      if (i % 10 === 0 && i > 0) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    setImportResult({ imported, duplicates, errors: errors.slice(0, 50) });
    setImportStep("done");
  };

  const resetImport = () => {
    setImportStep("upload");
    setCsvFile(null);
    setCsvData(null);
    setColumnMapping({});
    setImportResult(null);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const mappedFieldCount = Object.values(columnMapping).filter((v) => v).length;
  const hasCompanyName = Object.values(columnMapping).includes("company_name");

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Import & Export</h1>
        <p className="text-muted-foreground mt-1">
          Upload CSVs to import leads or download your data
        </p>
      </div>

      {/* ── Import Section ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import
        </h2>

        {importStep === "upload" && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <FileUp className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Upload a CSV</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Drop a CSV file with lead data. We&apos;ll auto-detect columns and let you map them before importing.
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button size="lg" onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Choose CSV File
                </Button>
              </div>
              {importError && (
                <p className="text-sm text-red-400 flex items-center gap-1 justify-center">
                  <AlertCircle className="w-4 h-4" /> {importError}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {importStep === "map" && csvData && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Map Columns</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {csvFile?.name} — {csvData.rows.length.toLocaleString()} rows, {csvData.columns.length} columns
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetImport}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Column mapping grid */}
              <div className="space-y-2">
                {csvData.columns.map((col) => (
                  <div key={col} className="flex items-center gap-3">
                    <div className="w-48 shrink-0">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">
                        {col}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Select
                      value={columnMapping[col] ?? ""}
                      onValueChange={(v) =>
                        setColumnMapping((prev) => ({ ...prev, [col]: v }))
                      }
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Skip" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_FIELDS.map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {columnMapping[col] && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        Mapped
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Sample data preview */}
              {csvData.rows.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Sample data (first 3 rows)
                  </h4>
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          {csvData.columns.filter((c) => columnMapping[c]).map((col) => (
                            <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                              {LEAD_FIELDS.find((f) => f.key === columnMapping[col])?.label ?? col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {csvData.rows.slice(0, 3).map((row, i) => (
                          <tr key={i}>
                            {csvData!.columns.filter((c) => columnMapping[c]).map((col) => (
                              <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">
                                {row[col] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  {mappedFieldCount} columns mapped
                  {!hasCompanyName && (
                    <span className="text-red-400 ml-2">⚠ Company Name is required</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetImport}>Cancel</Button>
                  <Button
                    onClick={handleStartImport}
                    disabled={!hasCompanyName}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import {csvData.rows.length.toLocaleString()} Leads
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {importStep === "importing" && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Importing leads...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Processing {csvData?.rows.length.toLocaleString()} rows. This may take a minute.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {importStep === "done" && importResult && (
          <Card>
            <CardContent className="p-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Import Complete</h3>
                  <div className="flex gap-4 mt-3">
                    <div className="text-center px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-2xl font-bold text-green-400">{importResult.imported}</p>
                      <p className="text-xs text-muted-foreground">Imported</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-2xl font-bold text-yellow-400">{importResult.duplicates}</p>
                      <p className="text-xs text-muted-foreground">Duplicates</p>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="text-center px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-2xl font-bold text-red-400">{importResult.errors.length}</p>
                        <p className="text-xs text-muted-foreground">Errors</p>
                      </div>
                    )}
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-4 max-h-40 overflow-y-auto rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-red-400">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={resetImport}>Import Another File</Button>
                <Button variant="outline" onClick={() => window.location.href = "/leads"}>
                  View Leads
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Export Section ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-dashed">
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileDown className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">CSV Download</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Export all leads to a CSV file
                </p>
              </div>
              <Button onClick={handleExportCSV} disabled={exporting} className="w-full">
                {exporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Exporting...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Download CSV</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed opacity-60">
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-green-500/10">
                  <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Google Sheets Sync</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Two-way sync with Google Sheets
                </p>
              </div>
              <Button className="w-full" disabled variant="outline">Coming Soon</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── History ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
          ) : history.length > 0 ? (
            <div className="divide-y divide-border">
              {history.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-muted">
                      <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{record.export_type.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{record.destination ?? "local download"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{record.row_count?.toLocaleString() ?? "?"} rows</p>
                    <p className="text-xs text-muted-foreground">{formatDate(record.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No history yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
