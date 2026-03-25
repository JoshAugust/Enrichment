"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, History, FileDown, Loader2 } from "lucide-react";

interface ExportRecord {
  id: string;
  export_type: string;
  row_count: number | null;
  destination: string | null;
  created_at: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/export/history", {
        
      });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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
      a.download =
        `corgi-leads-${new Date().toISOString().split("T")[0]}.csv`;
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

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Export</h1>
        <p className="text-muted-foreground mt-1">
          Download leads as CSV or sync to Google Sheets
        </p>
      </div>

      {/* Export Actions */}
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
                Export all leads to a CSV file. Downloads immediately.
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              disabled={exporting}
              className="w-full"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed opacity-60">
          <CardContent className="p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-green-500/10">
                <svg
                  className="w-6 h-6 text-green-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Google Sheets Sync</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sync to Google Sheets via the Export Sync Agent.
              </p>
            </div>
            <Button className="w-full" disabled variant="outline">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Export History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Loading history...
            </div>
          ) : history.length > 0 ? (
            <div className="divide-y divide-border">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-muted">
                      <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {record.export_type.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.destination ?? "local download"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {record.row_count?.toLocaleString() ?? "?"} rows
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(record.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No exports yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
