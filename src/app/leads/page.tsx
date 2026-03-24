"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dropdown-menu";
import {
  ALL_STATUSES,
  US_STATES,
  getStatusColor,
  getScoreColor,
} from "@/lib/constants";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import type { Lead } from "@/db/schema";

const PAGE_SIZE = 50;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");

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

      const res = await fetch(`/api/leads?${params}`, {
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, stateFilter, verifiedFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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
        body: JSON.stringify({ status: newStatus }),
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) => handleStatusChange(id, bulkStatus))
    );
    setSelectedIds(new Set());
    setBulkStatus("");
  };

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

  const totalPages = Math.ceil(total / PAGE_SIZE);

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

            {(statusFilter || stateFilter || verifiedFilter || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("");
                  setStateFilter("");
                  setVerifiedFilter("");
                  setSearch("");
                  setSearchInput("");
                  setPage(0);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Set status..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkStatusChange}
                disabled={!bulkStatus}
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Deselect
              </Button>
            </div>
          )}
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
                    checked={
                      leads.length > 0 && selectedIds.size === leads.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Company
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  Website
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Contact
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  Phone
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  State
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">
                  Score
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                  ✓
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    No leads found.
                    {(statusFilter || stateFilter || search) && (
                      <span> Try adjusting your filters.</span>
                    )}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                      />
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1">
                            <Badge
                              className={`text-xs border cursor-pointer hover:opacity-80 ${getStatusColor(lead.status)}`}
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
                    <td className="p-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {lead.company_name}
                      </Link>
                      {lead.city && (
                        <p className="text-xs text-muted-foreground">
                          {lead.city}
                        </p>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {lead.website ? (
                        <a
                          href={
                            lead.website.startsWith("http")
                              ? lead.website
                              : `https://${lead.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.domain ?? lead.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div>
                        <p className="text-sm">{lead.contact_name ?? "—"}</p>
                        {lead.contact_title && (
                          <p className="text-xs text-muted-foreground">
                            {lead.contact_title}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">
                      {lead.mobile_phone ?? lead.phone_hq ?? "—"}
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-mono">{lead.state ?? "—"}</span>
                    </td>
                    <td className="p-3">
                      {lead.quality_score !== null &&
                      lead.quality_score !== undefined ? (
                        <Badge
                          className={`text-xs border ${getScoreColor(lead.quality_score)}`}
                        >
                          {lead.quality_score}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {lead.verified ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden xl:table-cell text-xs text-muted-foreground">
                      {lead.source ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
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
    </div>
  );
}
