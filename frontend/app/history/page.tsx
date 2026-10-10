"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import { api, HistoryItem } from "@/lib/api";
import {
  History as HistoryIcon,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Radio,
  ShieldAlert,
  Zap,
  RotateCcw
} from "lucide-react";

const CATEGORIES = [
  "ALL",
  "INCIDENT",
  "CONSENSUS",
  "ANOMALY",
  "FAILURE",
  "RECOVERY",
  "AGENT",
];

export default function SystemHistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(
        selectedCategory === "ALL" ? undefined : selectedCategory,
        100
      );
      setHistoryItems(data);
    } catch (e) {
      console.error("Error loading system history:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [loadHistory]);

  const filteredItems = historyItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.description.toLowerCase().includes(q) ||
      item.related_id.toLowerCase().includes(q) ||
      item.outcome.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="System History & Audit Trails"
        subtitle="Chronological audit records of anomaly alarms, consensus votes, failures, and network recoveries"
        onRefresh={loadHistory}
      />

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Filters and Search Bar */}
        <div className="panel-card rounded-xl p-4 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  selectedCategory === cat
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description or node ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>

        {/* History Log Table */}
        <div className="panel-card rounded-xl p-5 border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Audited System Activities ({filteredItems.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">Persisted in SQLite database</span>
          </div>

          <div className="overflow-x-auto max-h-[580px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Target Node / ID</th>
                  <th className="py-2.5 px-3">Operational Description</th>
                  <th className="py-2.5 px-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500 font-sans">
                      {loading
                        ? "Loading audit records..."
                        : "No history records matching current filter."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isFailure = item.category === "FAILURE";
                    const isIncident = item.category === "INCIDENT";
                    const isRecovery = item.category === "RECOVERY";
                    const isConsensus = item.category === "CONSENSUS";

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isFailure
                                ? "bg-red-500/20 text-red-300 border-red-500/30"
                                : isIncident
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : isRecovery
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                                : isConsensus
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            }`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-200 whitespace-nowrap">
                          {item.related_id || "SYSTEM"}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-300 max-w-lg leading-snug">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold uppercase font-sans ${
                              item.outcome === "CONFIRMED" || item.outcome === "SUCCESS"
                                ? "text-emerald-400"
                                : item.outcome === "INCONCLUSIVE"
                                ? "text-amber-400"
                                : item.outcome === "FAIL_DETECTED"
                                ? "text-red-400"
                                : "text-slate-400"
                            }`}
                          >
                            {item.outcome}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
