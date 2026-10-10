"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Share2,
  AlertTriangle,
  BarChart3,
  History,
  ShieldCheck,
  Radio
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Command Center",
    href: "/command-center",
    altHref: "/",
    icon: LayoutDashboard,
    badge: "Live",
  },
  {
    name: "Agent Operations",
    href: "/agents",
    icon: Cpu,
  },
  {
    name: "Network Intelligence",
    href: "/network",
    icon: Share2,
  },
  {
    name: "Incident Management",
    href: "/incidents",
    icon: AlertTriangle,
  },
  {
    name: "Environmental Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "System History",
    href: "/history",
    icon: History,
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                ENV-MAS <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">MAS</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Decentralized Monitoring</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Operations Console
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.altHref && pathname === item.altHref);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm shadow-emerald-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-[11px]">B.Tech Final Year Viva Ready</span>
        </div>
        <div className="text-[10px] text-slate-500 leading-tight">
          Architecture: Multi-Agent Isolation Forest & NetworkX Consensus
        </div>
      </div>
    </aside>
  );
}
