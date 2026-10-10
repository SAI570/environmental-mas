"use client";

import React, { useState } from "react";
import { NetworkTopology } from "@/lib/api";

interface NetworkGraphProps {
  topology: NetworkTopology | null;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  height?: number;
  highlightEventAgentId?: string | null;
}

export default function NetworkGraph({
  topology,
  selectedAgentId,
  onSelectAgent,
  height = 540,
  highlightEventAgentId,
}: NetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);

  if (!topology || topology.nodes.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center panel-card rounded-xl text-slate-500 text-xs"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2" />
        Synchronizing NetworkX graph topology...
      </div>
    );
  }

  // Coordinate mapping from simulation [0, 100] grid to SVG [0, 800] x [0, 560]
  const svgWidth = 840;
  const svgHeight = 560;
  const padding = 50;

  const scaleX = (x: number) => padding + (x / 100) * (svgWidth - 2 * padding);
  const scaleY = (y: number) => padding + (y / 100) * (svgHeight - 2 * padding);

  const nodeMap = new Map<string, any>();
  topology.nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div className="relative w-full panel-card rounded-xl overflow-hidden border border-slate-800 bg-slate-950/70 select-none">
      {/* Topology Meta Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
        <span className="font-semibold text-emerald-400">
          {topology.active_nodes_count} Active Nodes
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">{topology.active_links_count} Mesh Edges</span>
        <span className="text-slate-600">•</span>
        <span className={topology.is_connected ? "text-emerald-400" : "text-amber-400"}>
          {topology.is_connected ? "Graph Connected" : `Partitioned (${topology.connected_components_count} Comp.)`}
        </span>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-500 inline-block" />
          <span>Standard Link</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-cyan-400 border-b border-dashed inline-block" />
          <span>Adaptive Reorganized</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto cursor-crosshair"
        style={{ maxHeight: height }}
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(51, 65, 85, 0.15)"
              strokeWidth="1"
            />
          </pattern>
          {/* Radio range pulse animation */}
          <radialGradient id="pulse-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Background Grid */}
        <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

        {/* Render Graph Edges */}
        <g className="edges">
          {topology.edges.map((edge, idx) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;

            const isAdaptive = edge.link_type === "ADAPTIVE_REORGANIZED";
            const isRestored = edge.link_type === "RESTORED";

            const isIncidentToSelected =
              selectedAgentId &&
              (edge.source === selectedAgentId || edge.target === selectedAgentId);

            return (
              <line
                key={`edge-${edge.source}-${edge.target}-${idx}`}
                x1={scaleX(source.x)}
                y1={scaleY(source.y)}
                x2={scaleX(target.x)}
                y2={scaleY(target.y)}
                stroke={
                  isIncidentToSelected
                    ? "#38bdf8"
                    : isAdaptive
                    ? "#06b6d4"
                    : isRestored
                    ? "#10b981"
                    : "#334155"
                }
                strokeWidth={isIncidentToSelected ? 2.5 : isAdaptive ? 2 : 1.2}
                strokeDasharray={isAdaptive ? "4,4" : undefined}
                strokeOpacity={isIncidentToSelected ? 0.95 : 0.6}
              />
            );
          })}
        </g>

        {/* Render Graph Nodes */}
        <g className="nodes">
          {topology.nodes.map((node) => {
            const cx = scaleX(node.x);
            const cy = scaleY(node.y);
            const isSelected = selectedAgentId === node.id;
            const isFailed = node.status === "FAILED";
            const isHighlighted = highlightEventAgentId === node.id;

            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => onSelectAgent && onSelectAgent(node.id)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Highlight Circle if Incident Center */}
                {isHighlighted && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={32}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Selected Node Ring */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={22}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isFailed ? 12 : 14}
                  fill={isFailed ? "#334155" : isSelected ? "#0284c7" : "#0f172a"}
                  stroke={
                    isFailed
                      ? "#64748b"
                      : isSelected
                      ? "#38bdf8"
                      : isHighlighted
                      ? "#ef4444"
                      : "#10b981"
                  }
                  strokeWidth={isFailed ? 1.5 : 2.5}
                />

                {/* Status Indicator Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={isFailed ? "#94a3b8" : isHighlighted ? "#ef4444" : "#10b981"}
                />

                {/* Node Label */}
                <text
                  x={cx}
                  y={cy + 26}
                  textAnchor="middle"
                  className={`text-[11px] font-bold tracking-wider select-none ${
                    isFailed
                      ? "fill-slate-500"
                      : isSelected
                      ? "fill-sky-400 font-extrabold"
                      : "fill-slate-300"
                  }`}
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover Tooltip Popup */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700/80 px-3 py-2 rounded-lg text-xs shadow-xl text-slate-200"
          style={{
            left: Math.min(scaleX(hoveredNode.x) + 15, svgWidth - 180),
            top: Math.max(10, scaleY(hoveredNode.y) - 60),
          }}
        >
          <div className="font-bold text-emerald-400 flex items-center justify-between gap-4">
            <span>Agent {hoveredNode.id}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                hoveredNode.status === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {hoveredNode.status}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Zone: {hoveredNode.zone}</div>
          <div className="text-[10px] text-slate-400">
            Coordinates: ({hoveredNode.x.toFixed(1)}, {hoveredNode.y.toFixed(1)})
          </div>
          <div className="text-[10px] text-slate-400">
            Battery: {hoveredNode.battery?.toFixed(1)}% | Degree: {hoveredNode.degree} links
          </div>
        </div>
      )}
    </div>
  );
}
