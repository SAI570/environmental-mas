"use client";

import { useEffect, useState } from "react";
import { api, SystemStatus } from "@/lib/api";
import { Flame, CloudRain, RotateCcw, RefreshCw, CheckCircle2, AlertOctagon } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function Header({ title, subtitle, onRefresh }: HeaderProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch {
      // offline fallback
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickFire = async () => {
    setLoadingAction("fire");
    try {
      await api.triggerFire("A07", 26.0);
      await fetchStatus();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleQuickReset = async () => {
    setLoadingAction("reset");
    try {
      await api.resetSimulation();
      await fetchStatus();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const hasActiveIncident =
    status?.current_incident && status.current_incident.status === "ACTIVE";

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0 select-none">
      <div>
        <h2 className="text-base font-bold text-slate-100 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Incident Status Pill */}
        {hasActiveIncident ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>
              {status?.current_incident?.incident_type}: {status?.current_incident?.consensus_status} (
              {status?.current_incident?.consensus_strength}%)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nominal Monitoring</span>
          </div>
        )}

        {/* Quick Demo Scenario Controls */}
        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
          <button
            onClick={handleQuickFire}
            disabled={loadingAction === "fire"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-medium transition disabled:opacity-50"
            title="Trigger Fire Scenario Demonstration"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Fire Demo</span>
          </button>

          <button
            onClick={handleQuickReset}
            disabled={loadingAction === "reset"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition disabled:opacity-50"
            title="Reset Simulation to Initial 20 Normal Agents"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
