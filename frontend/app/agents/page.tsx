"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import { api, AgentData } from "@/lib/api";
import {
  Cpu,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Flame,
  Battery,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Play,
  RotateCcw,
  Trash2,
  Plus,
  Move,
  Edit3
} from "lucide-react";

export default function AgentOperationsPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("A07");
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Move modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    temperature: 25.0,
    humidity: 55.0,
    smoke: 0.02,
    co2: 415.0,
    aqi: 45.0,
    soil_moisture: 48.0,
    x: 28.0,
    y: 62.0,
  });

  // New Agent modal
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({
    x: 50.0,
    y: 50.0,
    zone: "Central Sector",
    temperature: 24.5,
    humidity: 58.0,
    smoke: 0.02,
    co2: 415.0,
    aqi: 42.0,
    soil_moisture: 48.0,
  });

  const loadAgents = useCallback(async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
      if (data.length > 0) {
        const found = data.find((a) => a.agent_id === selectedAgentId) || data[0];
        setSelectedAgent(found);
        setSelectedAgentId(found.agent_id);
        setEditForm({
          temperature: found.temperature,
          humidity: found.humidity,
          smoke: found.smoke,
          co2: found.co2,
          aqi: found.aqi,
          soil_moisture: found.soil_moisture,
          x: found.x,
          y: found.y,
        });
      }
    } catch (e: any) {
      console.error("Error loading agents:", e);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSelectAgent = (agent: AgentData) => {
    setSelectedAgent(agent);
    setSelectedAgentId(agent.agent_id);
    setEditForm({
      temperature: agent.temperature,
      humidity: agent.humidity,
      smoke: agent.smoke,
      co2: agent.co2,
      aqi: agent.aqi,
      soil_moisture: agent.soil_moisture,
      x: agent.x,
      y: agent.y,
    });
    setIsEditing(false);
  };

  const handleAnalyze = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const res = await api.analyzeAgent(selectedAgent.agent_id);
      showFeedback(`Agent ${selectedAgent.agent_id} analyzed: ${res.anomaly_result?.decision} (${res.classification_result?.event_type})`);
      await loadAgents();
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFail = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      await api.failAgent(selectedAgent.agent_id);
      showFeedback(`Agent ${selectedAgent.agent_id} failed. Active links removed and network self-reorganized.`);
      await loadAgents();
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      await api.restoreAgent(selectedAgent.agent_id);
      showFeedback(`Agent ${selectedAgent.agent_id} restored to ACTIVE. Links recalculated.`);
      await loadAgents();
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    if (!confirm(`Are you sure you want to decommission Agent ${selectedAgent.agent_id}?`)) return;
    setLoading(true);
    try {
      await api.deleteAgent(selectedAgent.agent_id);
      showFeedback(`Agent ${selectedAgent.agent_id} decommissioned.`);
      await loadAgents();
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      await api.updateAgent(selectedAgent.agent_id, editForm);
      showFeedback(`Agent ${selectedAgent.agent_id} parameters updated.`);
      setIsEditing(false);
      await loadAgents();
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    setLoading(true);
    try {
      const created = await api.createAgent(newAgentForm);
      showFeedback(`Agent ${created.agent_id} successfully deployed into ${created.zone}.`);
      setIsAddingAgent(false);
      await loadAgents();
    } catch (e: any) {
      showFeedback(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Agent Operations Console"
        subtitle="Inspect, calibrate, diagnose, fail, and restore individual autonomous monitoring nodes"
        onRefresh={loadAgents}
      />

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Action feedback banner */}
        {actionMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
              actionMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                : "bg-red-950/80 border-red-800 text-red-200"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Table: Swarm Agent Directory */}
          <div className="lg:col-span-7 panel-card rounded-xl p-4 border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Swarm Nodes Directory ({agents.length})
                </h3>
              </div>

              <button
                onClick={() => setIsAddingAgent(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy Node</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[560px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Node ID</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Pos (X, Y)</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Neighbors</th>
                    <th className="py-2.5 px-3">Battery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {agents.map((agent) => {
                    const isSelected = agent.agent_id === selectedAgentId;
                    const isFailed = agent.status === "FAILED";
                    const isAnomaly =
                      agent.latest_anomaly_result?.is_anomaly ||
                      agent.current_event === "FIRE" ||
                      agent.current_event === "POLLUTION";

                    return (
                      <tr
                        key={agent.agent_id}
                        onClick={() => handleSelectAgent(agent)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-slate-800/90 text-sky-300"
                            : "hover:bg-slate-900/50 text-slate-300"
                        }`}
                      >
                        <td className="py-2 px-3 font-bold flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isFailed
                                ? "bg-slate-500"
                                : isAnomaly
                                ? "bg-red-500 animate-pulse"
                                : "bg-emerald-500"
                            }`}
                          />
                          {agent.agent_id}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-400 font-sans">
                          {agent.zone}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold uppercase ${
                              isFailed
                                ? "bg-slate-800 text-slate-400 border border-slate-700"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {agent.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          ({agent.x.toFixed(0)}, {agent.y.toFixed(0)})
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[10px] font-sans font-semibold ${
                              agent.current_event === "FIRE"
                                ? "text-red-400"
                                : agent.current_event === "POLLUTION"
                                ? "text-amber-400"
                                : agent.current_event === "EXTREME_HEAT"
                                ? "text-orange-400"
                                : "text-slate-400"
                            }`}
                          >
                            {agent.current_event}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{agent.neighbor_count}</td>
                        <td className="py-2 px-3 text-slate-400">{agent.battery.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Selected Agent Telemetry & Diagnostics */}
          <div className="lg:col-span-5 space-y-4">
            {selectedAgent ? (
              <div className="panel-card rounded-xl p-5 border-slate-800 space-y-4">
                {/* Agent Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100 font-mono">
                        Node {selectedAgent.agent_id}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          selectedAgent.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {selectedAgent.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Zone: {selectedAgent.zone} | Position: ({selectedAgent.x.toFixed(1)},{" "}
                      {selectedAgent.y.toFixed(1)})
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-slate-200">
                      {selectedAgent.battery.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 6 Sensor Telemetry Grid */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Environmental Telemetry</span>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-normal flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? "Cancel Edit" : "Edit Readings"}</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-[10px]">Temp (°C)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.temperature}
                            onChange={(e) =>
                              setEditForm({ ...editForm, temperature: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">Humidity (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.humidity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, humidity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">Smoke (0.0-1.0)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.smoke}
                            onChange={(e) =>
                              setEditForm({ ...editForm, smoke: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">CO2 (ppm)</label>
                          <input
                            type="number"
                            step="1"
                            value={editForm.co2}
                            onChange={(e) =>
                              setEditForm({ ...editForm, co2: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">AQI</label>
                          <input
                            type="number"
                            step="1"
                            value={editForm.aqi}
                            onChange={(e) =>
                              setEditForm({ ...editForm, aqi: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">Soil Moisture (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.soil_moisture}
                            onChange={(e) =>
                              setEditForm({ ...editForm, soil_moisture: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-slate-100 text-xs font-semibold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Temperature</span>
                        </div>
                        <div className="text-sm font-bold text-slate-100 font-mono mt-1">
                          {selectedAgent.temperature.toFixed(1)}°C
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Droplets className="w-3.5 h-3.5 text-blue-400" />
                          <span>Humidity</span>
                        </div>
                        <div className="text-sm font-bold text-slate-100 font-mono mt-1">
                          {selectedAgent.humidity.toFixed(1)}%
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Flame className="w-3.5 h-3.5 text-red-400" />
                          <span>Smoke Index</span>
                        </div>
                        <div className="text-sm font-bold text-slate-100 font-mono mt-1">
                          {selectedAgent.smoke.toFixed(3)}
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Wind className="w-3.5 h-3.5 text-purple-400" />
                          <span>CO2 Gas</span>
                        </div>
                        <div className="text-sm font-bold text-slate-100 font-mono mt-1">
                          {selectedAgent.co2.toFixed(0)} ppm
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Air Quality</span>
                        </div>
                        <div className="text-sm font-bold text-slate-100 font-mono mt-1">
                          AQI {selectedAgent.aqi.toFixed(0)}
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Droplets className="w-3.5 h-3.5 text-teal-400" />
                          <span>Soil Moisture</span>
                        </div>
                        <div className="text-sm font-bold text-slate-100 font-mono mt-1">
                          {selectedAgent.soil_moisture.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Anomaly & Classification Intelligence Box */}
                <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="text-[10px] uppercase font-sans font-bold text-slate-400 tracking-wider">
                    Edge AI Diagnostics
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Isolation Forest:</span>
                    <span
                      className={`font-bold ${
                        selectedAgent.latest_anomaly_result?.is_anomaly
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedAgent.latest_anomaly_result?.decision ?? "NORMAL"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Anomaly Severity:</span>
                    <span className="text-slate-200">
                      {((selectedAgent.latest_anomaly_result?.anomaly_score ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Event Signature:</span>
                    <span className="font-bold text-amber-400">
                      {selectedAgent.latest_event_classification?.event_type ?? "NORMAL"}
                    </span>
                  </div>
                  {selectedAgent.latest_event_classification?.reasons && (
                    <div className="pt-1 text-[11px] text-slate-400 font-sans border-t border-slate-800">
                      Reasons:{" "}
                      {selectedAgent.latest_event_classification.reasons.join("; ")}
                    </div>
                  )}
                </div>

                {/* Active Mesh Neighbors */}
                <div className="text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Connected Neighbors ({selectedAgent.neighbor_count})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.neighbor_ids.length > 0 ? (
                      selectedAgent.neighbor_ids.map((nbr) => (
                        <button
                          key={nbr}
                          onClick={() => {
                            const found = agents.find((a) => a.agent_id === nbr);
                            if (found) handleSelectAgent(found);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[11px]"
                        >
                          {nbr}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-xs">
                        No active neighbors within 28m range
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Node Controls */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run AI Analysis</span>
                  </button>

                  {selectedAgent.status === "ACTIVE" ? (
                    <button
                      onClick={handleFail}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-semibold transition"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Simulate Failure</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleRestore}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Node</span>
                    </button>
                  )}

                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-red-400 text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Decommission Agent</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel-card rounded-xl p-8 text-center text-slate-500 text-xs">
                Select an agent from the swarm table to inspect.
              </div>
            )}
          </div>
        </div>

        {/* Deploy New Agent Modal */}
        {isAddingAgent && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="panel-card rounded-2xl p-6 border-slate-700 max-w-md w-full space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Deploy Autonomous Swarm Node
                </h3>
                <button onClick={() => setIsAddingAgent(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-[10px]">Position X (0-100)</label>
                    <input
                      type="number"
                      value={newAgentForm.x}
                      onChange={(e) =>
                        setNewAgentForm({ ...newAgentForm, x: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px]">Position Y (0-100)</label>
                    <input
                      type="number"
                      value={newAgentForm.y}
                      onChange={(e) =>
                        setNewAgentForm({ ...newAgentForm, y: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px]">Deployment Zone</label>
                  <input
                    type="text"
                    value={newAgentForm.zone}
                    onChange={(e) => setNewAgentForm({ ...newAgentForm, zone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-[10px]">Temp (°C)</label>
                    <input
                      type="number"
                      value={newAgentForm.temperature}
                      onChange={(e) =>
                        setNewAgentForm({ ...newAgentForm, temperature: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px]">Humidity (%)</label>
                    <input
                      type="number"
                      value={newAgentForm.humidity}
                      onChange={(e) =>
                        setNewAgentForm({ ...newAgentForm, humidity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setIsAddingAgent(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAgent}
                  disabled={loading}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-xs font-semibold"
                >
                  Confirm Deployment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
