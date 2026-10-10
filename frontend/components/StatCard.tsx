import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: "emerald" | "amber" | "red" | "blue" | "slate";
}

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "slate",
}: StatCardProps) {
  const variantStyles = {
    emerald: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    amber: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    red: "border-red-500/30 text-red-400 bg-red-500/10",
    blue: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    slate: "border-slate-800 text-slate-400 bg-slate-800/40",
  };

  return (
    <div className="panel-card rounded-xl p-4 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-lg border ${variantStyles[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-100 tracking-tight">{value}</div>
      {subtext && <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}
