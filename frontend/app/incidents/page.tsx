"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import { api, SystemStatus } from "@/lib/api";
import {
  Flame,
  CloudFog,
  Sun,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react";

export default function IncidentManagementPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statRes, evRes] = await Promise.all([
        api.getStatus(),
        api.getEvents(),
      ]);
      setStatus(statRes);
      setIncidentsList(evRes);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTrigger = async (type: "fire" | "pollution" | "heat") => {
    setLoadingAction(type);
    try {
      let res;
      if (type === "fire") {
        res = await api.triggerFire("A07", 26.0);
        setFeedback(`Wildfire scenario initiated. Consensus status: ${res.consensus_status} (${res.consensus_strength}%).`);
      } else if (type === "pollution") {
        res = await api.triggerPollution("A15", 26.0);
        setFeedback(`Pollution scenario initiated. Consensus status: ${res.consensus_status} (${res.consensus_strength}%).`);
      } else {
        res = await api.triggerExtremeHeat("A03", 26.0);
        setFeedback(`Extreme heat scenario initiated. Consensus status: ${res.consensus_status} (${res.consensus_strength}%).`);
      }
      await loadData();
    } catch (e: any) {
      setFeedback(`Error triggering scenario: ${e.message}`);
    } finally {
      setLoadingAction(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleReset = async () => {
    setLoadingAction("reset");
    try {
      await api.resetSimulation();
      setFeedback("Simulation reset. All nodes returned to nominal baseline.");
      await loadData();
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setLoadingAction(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const activeInc = status?.current_incident;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Incident Management & Local Consensus"
        subtitle="Autonomous anomaly verification through multi-agent evidence collection and consensus voting"
        onRefresh={loadData}
      />

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {feedback && (
          <div className="p-3 rounded-lg text-xs font-medium bg-emerald-950/80 border border-emerald-800 text-emerald-200 flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)}>×</button>
          </div>
        )}

        {/* Environmental Scenario Simulation Control Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="panel-card rounded-xl p-4 border-slate-800 flex flex-col justify-between hover:border-red-500/40 transition">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 uppercase">Wildfire Scenario</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Elevates temperature &gt;50°C, smoke &gt;0.5, drops humidity &lt;25% around node A07.
              </p>
            </div>
            <button
              onClick={() => handleTrigger("fire")}
              disabled={loadingAction === "fire"}
              className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-semibold transition disabled:opacity-50"
            >
              {loadingAction === "fire" ? "Simulating..." : "Trigger Wildfire"}
            </button>
          </div>

          <div className="panel-card rounded-xl p-4 border-slate-800 flex flex-col justify-between hover:border-amber-500/40 transition">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <CloudFog className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 uppercase">Pollution Spike</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Spikes AQI &gt;200, CO2 &gt;900 ppm, smoke particles around Industrial node A15.
              </p>
            </div>
            <button
              onClick={() => handleTrigger("pollution")}
              disabled={loadingAction === "pollution"}
              className="w-full py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition disabled:opacity-50"
            >
              {loadingAction === "pollution" ? "Simulating..." : "Trigger Pollution"}
            </button>
          </div>

          <div className="panel-card rounded-xl p-4 border-slate-800 flex flex-col justify-between hover:border-orange-500/40 transition">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
                  <Sun className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 uppercase">Extreme Heatwave</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Induces thermal peak &gt;42°C with clean atmospheric smoke profile near node A03.
              </p>
            </div>
            <button
              onClick={() => handleTrigger("heat")}
              disabled={loadingAction === "heat"}
              className="w-full py-2 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 text-xs font-semibold transition disabled:opacity-50"
            >
              {loadingAction === "heat" ? "Simulating..." : "Trigger Heatwave"}
            </button>
          </div>

          <div className="panel-card rounded-xl p-4 border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 uppercase">Reset Environment</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Restores all agents to baseline temperatures and clears active emergency states.
              </p>
            </div>
            <button
              onClick={handleReset}
              disabled={loadingAction === "reset"}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition disabled:opacity-50"
            >
              {loadingAction === "reset" ? "Resetting..." : "Reset Baseline"}
            </button>
          </div>
        </div>

        {/* Current Incident Deep-Dive Panel */}
        {activeInc ? (
          <div className="panel-card rounded-xl p-6 border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-100 tracking-tight">
                      Active Event: {activeInc.incident_type}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                      {activeInc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Detection center: Node {activeInc.center_agent_id} • Dispatched{" "}
                    {activeInc.messages_dispatched_count} neighbor alerts
                  </p>
                </div>
              </div>

              {/* Consensus Result Pill */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Consensus Verdict
                  </div>
                  <div
                    className={`text-sm font-bold flex items-center justify-end gap-1.5 ${
                      activeInc.consensus_status === "CONFIRMED"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {activeInc.consensus_status === "CONFIRMED" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{activeInc.consensus_status}</span>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-100 font-mono px-3 py-1 bg-slate-900 rounded-lg border border-slate-800">
                  {activeInc.consensus_strength}%
                </div>
              </div>
            </div>

            {/* Voting Details & Sensor Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Evidence Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Physical Sensor Evidence (Primary Detector)
                </h4>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Temperature</span>
                    <span className="font-bold text-red-400">
                      {activeInc.evidence?.temperature?.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Humidity</span>
                    <span className="font-bold text-blue-400">
                      {activeInc.evidence?.humidity?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Smoke Index</span>
                    <span className="font-bold text-amber-400">
                      {activeInc.evidence?.smoke?.toFixed(3)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">CO2 Gas</span>
                    <span className="font-bold text-slate-200">
                      {activeInc.evidence?.co2?.toFixed(0)} ppm
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">AQI Index</span>
                    <span className="font-bold text-slate-200">
                      {activeInc.evidence?.aqi?.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Soil Moisture</span>
                    <span className="font-bold text-slate-200">
                      {activeInc.evidence?.soil_moisture?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Consensus Voting breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Neighbor Consensus Voting Breakdown
                </h4>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deciding Node:</span>
                    <span className="text-slate-200 font-bold">
                      {activeInc.consensus?.deciding_agent_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supporting Agents:</span>
                    <span className="text-emerald-400 font-bold">
                      {activeInc.consensus?.supporting_agents?.join(", ") || "None"} (
                      {activeInc.consensus?.supporting_agents?.length || 0})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disagreeing Agents:</span>
                    <span className="text-slate-400">
                      {activeInc.consensus?.disagreeing_agents?.join(", ") || "None"} (
                      {activeInc.consensus?.disagreeing_agents?.length || 0})
                    </span>
                  </div>
                  <div className="pt-2 text-slate-400 text-[11px] font-sans border-t border-slate-800">
                    Rationale: {activeInc.consensus?.details}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel-card rounded-xl p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200">No Active Incident</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The environmental monitoring swarm is operating nominally. Click one of the scenario buttons above to trigger a localized event.
            </p>
          </div>
        )}

        {/* Historical Incidents Table */}
        <div className="panel-card rounded-xl p-5 border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Incident Audit History</span>
            </h3>
            <span className="text-[11px] text-slate-400">Persisted in SQLite database</span>
          </div>

          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Consensus Status</th>
                  <th className="py-2.5 px-3">Strength</th>
                  <th className="py-2.5 px-3">Affected Swarm</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {incidentsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500 font-sans">
                      No past incidents recorded in the database.
                    </td>
                  </tr>
                ) : (
                  incidentsList.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-900/40 text-slate-300">
                      <td className="py-2 px-3 font-bold text-slate-400">#{inc.id}</td>
                      <td className="py-2 px-3 font-bold text-amber-400">{inc.incident_type}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-red-950 text-red-300 border border-red-800">
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-semibold ${
                            inc.consensus_status === "CONFIRMED"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {inc.consensus_status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-200">{inc.consensus_strength}%</td>
                      <td className="py-2 px-3 text-slate-400">
                        {inc.affected_agents?.join(", ") || "—"}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {new Date(inc.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
