"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, Search, CheckSquare, ListTodo } from "lucide-react";

interface SearchRun {
  id: string;
  agent_name: string;
  strategy: string;
  query: string | null;
  source_type: string | null;
  state_target: string | null;
  leads_found: number | null;
  leads_added: number | null;
  leads_duplicate: number | null;
  notes: string | null;
  created_at: string;
}

interface Task {
  id: string;
  task_type: string;
  priority: number | null;
  status: string | null;
  claimed_by: string | null;
  created_at: string;
}

interface AgentSummary {
  name: string;
  lastActive: string | null;
  totalFound: number;
  totalAdded: number;
  runCount: number;
  recentStrategies: string[];
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const TASK_TYPE_COLORS: Record<string, string> = {
  verify: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  enrich: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  score: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  deep_search: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  dedup_scan: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  export: "bg-green-500/20 text-green-300 border-green-500/30",
};

export default function AgentsPage() {
  const [searchRuns, setSearchRuns] = useState<SearchRun[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [runsRes, tasksRes] = await Promise.all([
          fetch("/api/search-runs?limit=200", {
            
          }),
          fetch("/api/tasks?limit=100", {
            
          }),
        ]);

        if (runsRes.ok) setSearchRuns(await runsRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build agent summaries
  const agentMap = new Map<string, AgentSummary>();
  for (const run of searchRuns) {
    const existing = agentMap.get(run.agent_name) ?? {
      name: run.agent_name,
      lastActive: null,
      totalFound: 0,
      totalAdded: 0,
      runCount: 0,
      recentStrategies: [],
    };

    existing.runCount++;
    existing.totalFound += run.leads_found ?? 0;
    existing.totalAdded += run.leads_added ?? 0;

    if (!existing.lastActive || run.created_at > existing.lastActive) {
      existing.lastActive = run.created_at;
    }

    if (
      run.strategy &&
      !existing.recentStrategies.includes(run.strategy) &&
      existing.recentStrategies.length < 3
    ) {
      existing.recentStrategies.push(run.strategy);
    }

    agentMap.set(run.agent_name, existing);
  }

  const agents = Array.from(agentMap.values()).sort((a, b) =>
    (b.lastActive ?? "") > (a.lastActive ?? "") ? 1 : -1
  );

  // Task stats by type and status
  const tasksByType: Record<string, Record<string, number>> = {};
  for (const task of tasks) {
    const type = task.task_type;
    const status = task.status ?? "unknown";
    if (!tasksByType[type]) tasksByType[type] = {};
    tasksByType[type][status] = (tasksByType[type][status] ?? 0) + 1;
  }

  const pendingByType: Record<string, number> = {};
  for (const task of tasks) {
    if (task.status === "pending") {
      pendingByType[task.task_type] = (pendingByType[task.task_type] ?? 0) + 1;
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-1">Loading agent data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Agents</h1>
        <p className="text-muted-foreground mt-1">
          Agent activity and task queue status
        </p>
      </div>

      {/* Task Queue Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          Task Queue
        </h2>

        {Object.keys(pendingByType).length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {Object.entries(pendingByType).map(([type, count]) => (
              <div
                key={type}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
                  TASK_TYPE_COLORS[type] ?? "bg-secondary/20 text-secondary border-secondary/30"
                }`}
              >
                <span className="font-medium">{type}</span>
                <Badge variant="outline" className="ml-1">
                  {count} pending
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No pending tasks in the queue.</p>
            </CardContent>
          </Card>
        )}

        {/* Task Breakdown Table */}
        {Object.keys(tasksByType).length > 0 && (
          <div className="mt-4 rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Task Type</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Pending</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Claimed</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Done</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(tasksByType).map(([type, counts]) => (
                  <tr key={type} className="hover:bg-muted/30">
                    <td className="p-3">
                      <Badge
                        className={`text-xs border ${
                          TASK_TYPE_COLORS[type] ?? "bg-secondary/20 text-secondary border-secondary/30"
                        }`}
                      >
                        {type}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{counts["pending"] ?? 0}</td>
                    <td className="p-3 text-muted-foreground">{counts["claimed"] ?? 0}</td>
                    <td className="p-3 text-green-400">{counts["done"] ?? 0}</td>
                    <td className="p-3 text-red-400">{counts["failed"] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Active Agents
        </h2>

        {agents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    {agent.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    Last active:{" "}
                    {agent.lastActive ? timeAgo(agent.lastActive) : "never"}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-lg font-bold">{agent.runCount}</p>
                      <p className="text-xs text-muted-foreground">Runs</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-lg font-bold">{agent.totalFound}</p>
                      <p className="text-xs text-muted-foreground">Found</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-lg font-bold text-green-400">{agent.totalAdded}</p>
                      <p className="text-xs text-muted-foreground">Added</p>
                    </div>
                  </div>

                  {agent.recentStrategies.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Search className="w-3 h-3" />
                        Recent strategies
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {agent.recentStrategies.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">No agents have run yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Agent activity will appear here once the enrichment system starts.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Search Runs */}
      {searchRuns.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Search Runs</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Agent</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Strategy</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">State</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Found</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Added</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {searchRuns.slice(0, 25).map((run) => (
                  <tr key={run.id} className="hover:bg-muted/30">
                    <td className="p-3 text-primary text-xs">{run.agent_name}</td>
                    <td className="p-3 text-xs">{run.strategy}</td>
                    <td className="p-3 text-xs font-mono">{run.state_target ?? "—"}</td>
                    <td className="p-3 text-xs">{run.leads_found ?? 0}</td>
                    <td className="p-3 text-xs text-green-400">{run.leads_added ?? 0}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {run.created_at ? timeAgo(run.created_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
