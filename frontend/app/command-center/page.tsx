"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import NetworkGraph from "@/components/NetworkGraph";
import {
  api,
  SystemStatus,
  NetworkTopology,
  HistoryItem
} from "@/lib/api";
import {
  Users,
  Activity,
  AlertTriangle,
  Radio,
  Network,
  ShieldCheck,
  Flame,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function CommandCenterPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [recentActivities, setRecentActivities] = useState<HistoryItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("A07");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, topologyRes, historyRes] = await Promise.all([
        api.getStatus(),
        api.getNetwork(),
        api.getHistory("ALL", 8),
      ]);
      setStatus(statusRes);
      setTopology(topologyRes);
      setRecentActivities(historyRes);
    } catch (e) {
      console.error("Failed to load command center data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const hasIncident =
    status?.current_incident && status.current_incident.status === "ACTIVE";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Operations Command Center"
        subtitle="Real-time multi-agent environmental swarm state, network mesh, and incident alerts"
        onRefresh={loadData}
      />

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Agents"
            value={status?.total_agents ?? 20}
            subtext="Swarm deployment"
            icon={Users}
            variant="slate"
          />
          <StatCard
            label="Active Nodes"
            value={status?.active_agents ?? 20}
            subtext={`${status?.failed_agents ?? 0} Offline / Failed`}
            icon={Activity}
            variant={status && status.failed_agents > 0 ? "amber" : "emerald"}
          />
          <StatCard
            label="Mesh Edges"
            value={status?.active_communication_links ?? 0}
            subtext="Proximity links (R=28m)"
            icon={Network}
            variant="blue"
          />
          <StatCard
            label="AI Anomalies"
            value={status?.anomalies_detected ?? 0}
            subtext="Isolation Forest tags"
            icon={AlertTriangle}
            variant={status && status.anomalies_detected > 0 ? "red" : "emerald"}
          />
          <StatCard
            label="Mesh Health"
            value={status?.network_connectivity.is_connected ? "Connected" : "Partitioned"}
            subtext={
              status?.network_connectivity.is_connected
                ? "1 Component"
                : `${status?.network_connectivity.connected_components} Partitions`
            }
            icon={Radio}
            variant={status?.network_connectivity.is_connected ? "emerald" : "amber"}
          />
          <StatCard
            label="Incident Level"
            value={hasIncident ? status?.current_incident?.incident_type ?? "ALERT" : "Nominal"}
            subtext={
              hasIncident
                ? `${status?.current_incident?.consensus_status} (${status?.current_incident?.consensus_strength}%)`
                : "Continuous scan"
            }
            icon={Flame}
            variant={hasIncident ? "red" : "emerald"}
          />
        </div>

        {/* Main Grid: Interactive Map + Live Intelligence Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Large Network Visualization */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Geospatial Mesh Topology</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    100m x 100m Grid
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Interactive NetworkX graph. Click any agent node to inspect telemetry.
                </p>
              </div>

              <Link
                href="/network"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
              >
                <span>Full Network Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <NetworkGraph
              topology={topology}
              selectedAgentId={selectedAgentId}
              onSelectAgent={(id) => setSelectedAgentId(id)}
              highlightEventAgentId={status?.current_incident?.center_agent_id}
              height={500}
            />
          </div>

          {/* Right Column: Active Incident Card & Recent Live Events Feed */}
          <div className="space-y-6">
            {/* Active Incident Summary Card */}
            {hasIncident ? (
              <div className="panel-card rounded-xl p-4 border-red-500/40 glow-red">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                      <Flame className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                        Active {status?.current_incident?.incident_type} Incident
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Epicenter near node {status?.current_incident?.center_agent_id}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                    {status?.current_incident?.severity}
                  </span>
                </div>

                <div className="space-y-2 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consensus Status:</span>
                    <span className="text-emerald-400 font-bold">
                      {status?.current_incident?.consensus_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consensus Strength:</span>
                    <span className="text-slate-200">
                      {status?.current_incident?.consensus_strength}% agreement
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Affected Swarm Nodes:</span>
                    <span className="text-slate-200">
                      {status?.current_incident?.affected_agents.join(", ")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    href="/incidents"
                    className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                  >
                    <span>View Consensus Evidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="panel-card rounded-xl p-4 border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Swarm Health Nominal
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All 20 agents reporting baseline readings within calibrated Isolation Forest bounds. No critical alerts.
                </p>
              </div>
            )}

            {/* Live Activity Feed */}
            <div className="panel-card rounded-xl p-4 border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Recent Swarm Actions
                  </h4>
                </div>
                <Link
                  href="/history"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No recent activity records.
                  </div>
                ) : (
                  recentActivities.map((act) => {
                    const isFailure = act.category === "FAILURE";
                    const isIncident = act.category === "INCIDENT";
                    const isRecovery = act.category === "RECOVERY";

                    return (
                      <div
                        key={act.id}
                        className="text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                              isFailure
                                ? "bg-red-500/20 text-red-300 border-red-500/30"
                                : isIncident
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : isRecovery
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {act.category}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(act.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-tight">
                          {act.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
