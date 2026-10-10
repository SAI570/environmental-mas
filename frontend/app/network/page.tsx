"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import NetworkGraph from "@/components/NetworkGraph";
import { api, NetworkTopology, SystemStatus } from "@/lib/api";
import {
  Share2,
  RefreshCw,
  ShieldAlert,
  RotateCcw,
  Timer,
  GitBranch,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Zap
} from "lucide-react";

export default function NetworkIntelligencePage() {
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("A07");
  const [recovering, setRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [topRes, statRes] = await Promise.all([
        api.getNetwork(),
        api.getStatus(),
      ]);
      setTopology(topRes);
      setStatus(statRes);
      if (statRes.last_recovery_metrics && statRes.last_recovery_metrics.failed_agent) {
        setLastRecovery(statRes.last_recovery_metrics);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleManualRecover = async () => {
    setRecovering(true);
    try {
      const res = await api.recoverNetwork();
      setLastRecovery(res);
      setFeedback(`Self-organization protocol completed in ${res.recovery_duration_ms}ms.`);
      await loadData();
    } catch (e: any) {
      setFeedback(`Recovery error: ${e.message}`);
    } finally {
      setRecovering(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleQuickFail = async (agentId: string) => {
    try {
      const res = await api.failAgent(agentId);
      setLastRecovery(res.recovery_summary);
      setFeedback(`Agent ${agentId} failed. Autonomous self-reorganization triggered.`);
      await loadData();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    }
  };

  const handleQuickRestore = async (agentId: string) => {
    try {
      await api.restoreAgent(agentId);
      setFeedback(`Agent ${agentId} restored to ACTIVE. Mesh links re-established.`);
      await loadData();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Network Intelligence & Self-Organization"
        subtitle="NetworkX topological mesh management, proximity link adaptation, and dynamic fault recovery"
        onRefresh={loadData}
      />

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {feedback && (
          <div className="p-3 rounded-lg text-xs font-medium bg-blue-950/80 border border-blue-800 text-blue-200 flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)}>×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Network Canvas */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Decentralized Mesh Visualization</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Standard proximity radius: R = 28m | Adaptive bridge radius: R = 38m
                </p>
              </div>

              <button
                onClick={handleManualRecover}
                disabled={recovering}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trigger Self-Organization</span>
              </button>
            </div>

            <NetworkGraph
              topology={topology}
              selectedAgentId={selectedAgentId}
              onSelectAgent={(id) => setSelectedAgentId(id)}
              height={560}
            />
          </div>

          {/* Right Column: Self-Organization Recovery Audit & Demonstration Tools */}
          <div className="lg:col-span-4 space-y-5">
            {/* Self-Organization Benchmark Panel */}
            <div className="panel-card rounded-xl p-5 border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Self-Organization Metrics
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Live Benchmark
                </span>
              </div>

              {lastRecovery ? (
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Target Node Fault:</span>
                    <span className="font-bold text-red-400">
                      {lastRecovery.failed_agent || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Severed Mesh Edges:</span>
                    <span className="text-slate-200">
                      {lastRecovery.removed_links?.length || 0} links lost
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Adaptive Bridge Edges:</span>
                    <span className="font-bold text-cyan-400">
                      +{lastRecovery.added_links?.length || 0} reorganized links
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Measured Recovery Time:</span>
                    <span className="font-bold text-emerald-400">
                      {lastRecovery.recovery_duration_ms} ms
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Remaining Active Nodes:</span>
                    <span className="text-slate-200">{lastRecovery.active_agent_count}</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Final Topological Status:</span>
                    <span
                      className={`font-bold ${
                        lastRecovery.is_connected ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {lastRecovery.is_connected
                        ? "Restored (Connected)"
                        : `Partitioned (${lastRecovery.connected_components_count} Comp.)`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No node failures simulated yet. Click a node below to simulate fault.
                </div>
              )}
            </div>

            {/* Quick Demonstration Node Triggers */}
            <div className="panel-card rounded-xl p-5 border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Node Fault Demonstration
                  </h4>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click to intentionally fail critical bridge agents (such as A05, A08, A13) and observe automatic topological link reorganization.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                {topology?.nodes.slice(0, 8).map((node) => {
                  const isFailed = node.status === "FAILED";
                  return (
                    <div
                      key={node.id}
                      className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-200">{node.id}</span>
                      {isFailed ? (
                        <button
                          onClick={() => handleQuickRestore(node.id)}
                          className="px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-[10px] font-sans font-medium"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickFail(node.id)}
                          className="px-2 py-0.5 rounded bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-[10px] font-sans font-medium"
                        >
                          Fail Node
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
