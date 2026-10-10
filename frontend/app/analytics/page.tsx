"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import { api, AnalyticsData } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Flame,
  Wind,
  Thermometer,
  Timer,
  AlertTriangle,
  Users
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 5000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const timeseries = data?.telemetry_timeseries || [];
  const hasTimeseries = timeseries.length > 0;

  // Max calculations for chart scaling
  const maxTemp = Math.max(...timeseries.map((t) => t.temperature), 50);
  const maxSmoke = Math.max(...timeseries.map((t) => t.smoke), 0.5);
  const maxCo2 = Math.max(...timeseries.map((t) => t.co2), 1000);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Environmental Analytics & System Trends"
        subtitle="Historical sensor telemetry trends, anomaly distributions, and self-organization recovery benchmarks"
        onRefresh={loadAnalytics}
      />

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="panel-card rounded-xl p-4 border-slate-800">
            <span className="text-slate-400 text-xs uppercase font-semibold">
              Telemetry Records Logged
            </span>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-1">
              {timeseries.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Time-series data points</p>
          </div>

          <div className="panel-card rounded-xl p-4 border-slate-800">
            <span className="text-slate-400 text-xs uppercase font-semibold">
              Total Anomalies Detected
            </span>
            <div className="text-2xl font-bold text-red-400 font-mono mt-1">
              {data?.anomaly_distribution.anomalies || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Isolation Forest outliers</p>
          </div>

          <div className="panel-card rounded-xl p-4 border-slate-800">
            <span className="text-slate-400 text-xs uppercase font-semibold">
              Swarm Health Ratio
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {data
                ? `${(
                    (data.agent_status_breakdown.active /
                      (data.agent_status_breakdown.total || 1)) *
                    100
                  ).toFixed(0)}%`
                : "100%"}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data?.agent_status_breakdown.active} Active /{" "}
              {data?.agent_status_breakdown.failed} Failed
            </p>
          </div>

          <div className="panel-card rounded-xl p-4 border-slate-800">
            <span className="text-slate-400 text-xs uppercase font-semibold">
              Self-Reorganization Events
            </span>
            <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
              {data?.recovery_benchmarks.length || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Topological recovery runs</p>
          </div>
        </div>

        {/* Time-Series Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Time Series Chart */}
          <div className="panel-card rounded-xl p-5 border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Temperature Over Time (°C)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Max: {maxTemp.toFixed(1)}°C</span>
            </div>

            {hasTimeseries ? (
              <div className="h-56 w-full pt-4">
                <svg viewBox="0 0 500 180" className="w-full h-full">
                  <line x1="40" y1="20" x2="490" y2="20" stroke="#1e293b" strokeDasharray="2,2" />
                  <line x1="40" y1="90" x2="490" y2="90" stroke="#1e293b" strokeDasharray="2,2" />
                  <line x1="40" y1="160" x2="490" y2="160" stroke="#334155" />
                  <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                  {/* Y Axis Labels */}
                  <text x="32" y="24" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    {maxTemp.toFixed(0)}
                  </text>
                  <text x="32" y="94" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    {(maxTemp / 2).toFixed(0)}
                  </text>
                  <text x="32" y="164" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    0
                  </text>

                  {/* Line Plot */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    points={timeseries
                      .map((t, idx) => {
                        const x = 40 + (idx / Math.max(1, timeseries.length - 1)) * 450;
                        const y = 160 - (t.temperature / maxTemp) * 140;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* Anomaly Highlight Points */}
                  {timeseries.map((t, idx) => {
                    const x = 40 + (idx / Math.max(1, timeseries.length - 1)) * 450;
                    const y = 160 - (t.temperature / maxTemp) * 140;
                    return t.is_anomaly ? (
                      <circle
                        key={`t-${idx}`}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    ) : null;
                  })}
                </svg>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
                No telemetry time-series points recorded yet.
              </div>
            )}
          </div>

          {/* Smoke Index Time Series Chart */}
          <div className="panel-card rounded-xl p-5 border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Smoke Level Over Time (Normalized 0-1)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Max: {maxSmoke.toFixed(2)}</span>
            </div>

            {hasTimeseries ? (
              <div className="h-56 w-full pt-4">
                <svg viewBox="0 0 500 180" className="w-full h-full">
                  <line x1="40" y1="20" x2="490" y2="20" stroke="#1e293b" strokeDasharray="2,2" />
                  <line x1="40" y1="90" x2="490" y2="90" stroke="#1e293b" strokeDasharray="2,2" />
                  <line x1="40" y1="160" x2="490" y2="160" stroke="#334155" />
                  <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" />

                  {/* Y Axis */}
                  <text x="32" y="24" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    {maxSmoke.toFixed(2)}
                  </text>
                  <text x="32" y="94" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    {(maxSmoke / 2).toFixed(2)}
                  </text>
                  <text x="32" y="164" textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                    0
                  </text>

                  {/* Line Plot */}
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    points={timeseries
                      .map((t, idx) => {
                        const x = 40 + (idx / Math.max(1, timeseries.length - 1)) * 450;
                        const y = 160 - (t.smoke / maxSmoke) * 140;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                </svg>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
                No smoke telemetry data points recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Categorical Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Anomaly Distribution */}
          <div className="panel-card rounded-xl p-5 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
              <span>Anomaly vs Baseline Ratio</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-sans">
                  <span className="text-slate-400">Normal Readings</span>
                  <span className="text-emerald-400">
                    {data?.anomaly_distribution.normal || 0}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${
                        ((data?.anomaly_distribution.normal || 0) /
                          Math.max(
                            1,
                            (data?.anomaly_distribution.normal || 0) +
                              (data?.anomaly_distribution.anomalies || 0)
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-sans">
                  <span className="text-slate-400">Detected Anomalies</span>
                  <span className="text-red-400">
                    {data?.anomaly_distribution.anomalies || 0}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${
                        ((data?.anomaly_distribution.anomalies || 0) /
                          Math.max(
                            1,
                            (data?.anomaly_distribution.normal || 0) +
                              (data?.anomaly_distribution.anomalies || 0)
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Incidents by Type */}
          <div className="panel-card rounded-xl p-5 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <span>Incidents by Classification</span>
            </h3>

            {data?.incidents_by_type && data.incidents_by_type.length > 0 ? (
              <div className="space-y-2.5 font-mono text-xs">
                {data.incidents_by_type.map((inc) => (
                  <div key={inc.type} className="flex justify-between items-center py-1">
                    <span className="text-slate-300 font-sans">{inc.type}</span>
                    <span className="font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {inc.count} events
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No incidents triggered yet.
              </div>
            )}
          </div>

          {/* Network Recovery Benchmarks */}
          <div className="panel-card rounded-xl p-5 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Timer className="w-4 h-4 text-cyan-400" />
              <span>Self-Organization Duration (ms)</span>
            </h3>

            {data?.recovery_benchmarks && data.recovery_benchmarks.length > 0 ? (
              <div className="space-y-2 font-mono text-xs max-h-40 overflow-y-auto pr-1">
                {data.recovery_benchmarks.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-900/80 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-200">Fault {rec.agent_id}</span>
                      <span className="text-[10px] text-slate-500 block">
                        Lost {rec.links_lost} / Added {rec.links_added} links
                      </span>
                    </div>
                    <span className="font-bold text-cyan-400">
                      {rec.duration_ms.toFixed(2)} ms
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                No recovery benchmarks recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
