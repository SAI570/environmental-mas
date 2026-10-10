/**
 * lib/api.ts
 * Type-safe API client connecting the Next.js frontend to the FastAPI backend.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface AgentData {
  agent_id: string;
  x: number;
  y: number;
  zone: string;
  temperature: number;
  humidity: number;
  smoke: number;
  co2: number;
  aqi: number;
  soil_moisture: number;
  battery: number;
  status: "ACTIVE" | "FAILED" | "WARNING";
  neighbor_ids: string[];
  neighbor_count: number;
  latest_anomaly_result?: {
    is_anomaly: boolean;
    decision: string;
    raw_decision_score: number;
    anomaly_score: number;
    model_status?: string;
  } | null;
  latest_event_classification?: {
    event_type: "FIRE" | "POLLUTION" | "EXTREME_HEAT" | "OTHER_ANOMALY" | "NORMAL" | "OFFLINE";
    severity: string;
    confidence: number;
    reasons: string[];
    evidence: Record<string, number>;
  } | null;
  current_event: string;
  last_updated: string;
}

export interface NetworkTopology {
  nodes: {
    id: string;
    x: number;
    y: number;
    status: string;
    zone: string;
    battery: number;
    degree: number;
  }[];
  edges: {
    source: string;
    target: string;
    distance: number;
    link_type: string;
  }[];
  total_nodes: number;
  active_nodes_count: number;
  failed_nodes_count: number;
  active_links_count: number;
  is_connected: boolean;
  connected_components_count: number;
  comm_range: number;
  adaptive_range: number;
}

export interface SystemStatus {
  total_agents: number;
  active_agents: number;
  failed_agents: number;
  warning_agents: number;
  active_communication_links: number;
  anomalies_detected: number;
  network_connectivity: {
    is_connected: boolean;
    connected_components: number;
  };
  current_incident?: {
    id?: number;
    incident_type: string;
    severity: string;
    status: string;
    consensus_status: string;
    consensus_strength: number;
    affected_agents: string[];
    detecting_agents: string[];
    center_agent_id: string;
    evidence: Record<string, number>;
    consensus: {
      deciding_agent_id: string;
      consulted_neighbors: string[];
      supporting_agents: string[];
      disagreeing_agents: string[];
      consensus_event: string;
      status: string;
      consensus_strength: number;
      details: string;
    };
    messages_dispatched_count: number;
    timestamp: string;
  } | null;
  last_recovery_metrics: {
    failed_agent: string | null;
    removed_links: string[][];
    added_links: string[][];
    recovery_duration_ms: number;
    active_agent_count: number;
    is_connected: boolean;
    connected_components_count: number;
    components: string[][];
  };
}

export interface HistoryItem {
  id: number;
  category: string;
  related_id: string;
  description: string;
  outcome: string;
  timestamp: string;
}

export interface AnalyticsData {
  telemetry_timeseries: {
    timestamp: string;
    agent_id: string;
    temperature: number;
    smoke: number;
    co2: number;
    aqi: number;
    humidity: number;
    is_anomaly: boolean;
  }[];
  anomaly_distribution: {
    anomalies: number;
    normal: number;
  };
  incidents_by_type: {
    type: string;
    count: number;
  }[];
  recovery_benchmarks: {
    agent_id: string;
    duration_ms: number;
    links_lost: number;
    links_added: number;
    is_connected: boolean;
    timestamp: string;
  }[];
  agent_status_breakdown: {
    active: number;
    failed: number;
    total: number;
  };
}

// Request Helper
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(`API Error [${response.status}]: ${errorDetail}`);
  }

  return response.json();
}

export const api = {
  getStatus: () => fetchAPI<SystemStatus>("/api/status"),
  getAgents: () => fetchAPI<AgentData[]>("/api/agents"),
  getAgent: (id: string) => fetchAPI<AgentData>(`/api/agents/${id}`),
  createAgent: (data: Partial<AgentData>) =>
    fetchAPI<AgentData>("/api/agents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAgent: (id: string, data: Partial<AgentData>) =>
    fetchAPI<AgentData>(`/api/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAgent: (id: string) =>
    fetchAPI<{ message: string }>(`/api/agents/${id}`, {
      method: "DELETE",
    }),
  analyzeAgent: (id: string) =>
    fetchAPI<{
      agent_id: string;
      anomaly_result: any;
      classification_result: any;
      readings: Record<string, number>;
    }>(`/api/agents/${id}/analyze`, { method: "POST" }),
  failAgent: (id: string) =>
    fetchAPI<{
      agent: AgentData;
      removed_links: string[][];
      recovery_summary: any;
    }>(`/api/agents/${id}/fail`, { method: "POST" }),
  restoreAgent: (id: string) =>
    fetchAPI<{
      agent: AgentData;
      restored_links: string[][];
      topology: NetworkTopology;
    }>(`/api/agents/${id}/restore`, { method: "POST" }),
  getNetwork: () => fetchAPI<NetworkTopology>("/api/network"),
  recoverNetwork: () => fetchAPI<any>("/api/network/recover", { method: "POST" }),
  getEvents: () => fetchAPI<any[]>("/api/events"),
  triggerFire: (centerAgentId = "A07", radius = 26.0) =>
    fetchAPI<any>("/api/events/fire", {
      method: "POST",
      body: JSON.stringify({ center_agent_id: centerAgentId, radius }),
    }),
  triggerPollution: (centerAgentId = "A15", radius = 26.0) =>
    fetchAPI<any>("/api/events/pollution", {
      method: "POST",
      body: JSON.stringify({ center_agent_id: centerAgentId, radius }),
    }),
  triggerExtremeHeat: (centerAgentId = "A03", radius = 26.0) =>
    fetchAPI<any>("/api/events/extreme-heat", {
      method: "POST",
      body: JSON.stringify({ center_agent_id: centerAgentId, radius }),
    }),
  resetSimulation: () =>
    fetchAPI<{ message: string; total_agents: number; status: string }>(
      "/api/events/reset",
      { method: "POST" }
    ),
  getHistory: (category?: string, limit = 50) => {
    const q = new URLSearchParams();
    if (category && category !== "ALL") q.append("category", category);
    q.append("limit", limit.toString());
    return fetchAPI<HistoryItem[]>(`/api/history?${q.toString()}`);
  },
  getAnalytics: () => fetchAPI<AnalyticsData>("/api/analytics"),
};
