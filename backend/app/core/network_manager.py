"""
network_manager.py

NetworkX-based Topology and Self-Organization Engine for MAS.
Manages decentralized peer communication links, link failures, dynamic reorganization,
and topological connectivity metrics.
"""

import math
import time
from typing import Dict, Any, List, Tuple, Set, Optional
import networkx as nx


class NetworkManager:
    """
    Maintains an authoritative NetworkX Graph representing agents and physical communication edges.
    Adheres strictly to documented Euclidean proximity rules:
    Two active nodes u and v have a direct communication link if:
        EuclideanDistance(u, v) <= DEFAULT_COMMUNICATION_RANGE
    """

    DEFAULT_RANGE: float = 28.0          # Base radio transmission radius (grid units)
    ADAPTIVE_REORGANIZATION_RANGE: float = 38.0 # Extended adaptive relay range during failure recovery

    def __init__(self, comm_range: float = DEFAULT_RANGE):
        self.comm_range = comm_range
        self.graph = nx.Graph()
        # Track last reorganization metrics
        self.last_recovery_metrics: Dict[str, Any] = {
            "failed_agent": None,
            "removed_links": [],
            "added_links": [],
            "recovery_duration_ms": 0.0,
            "active_agent_count": 0,
            "is_connected": True,
            "connected_components_count": 1,
            "components": []
        }

    def euclidean_distance(self, x1: float, y1: float, x2: float, y2: float) -> float:
        """
        Calculates 2D Euclidean distance between two spatial coordinates.
        """
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

    def build_network(self, agents: List[Any]) -> None:
        """
        Constructs the complete network topology from a list of Agent objects.
        """
        self.graph.clear()

        # 1. Add all nodes
        for agent in agents:
            self.graph.add_node(
                agent.agent_id,
                x=agent.x,
                y=agent.y,
                status=agent.status,
                zone=agent.zone,
                battery=agent.battery
            )

        # 2. Add edges between ACTIVE agents within base communication range
        active_agents = [a for a in agents if a.status == "ACTIVE"]
        for i in range(len(active_agents)):
            a1 = active_agents[i]
            for j in range(i + 1, len(active_agents)):
                a2 = active_agents[j]
                dist = self.euclidean_distance(a1.x, a1.y, a2.x, a2.y)
                if dist <= self.comm_range:
                    self.graph.add_edge(a1.agent_id, a2.agent_id, distance=round(dist, 2), link_type="STANDARD")

        # 3. Synchronize neighbor lists onto Agent objects
        self._sync_agent_neighbors(agents)

    def _sync_agent_neighbors(self, agents: List[Any]) -> None:
        """
        Updates each Agent's `neighbor_ids` property based on current active graph edges.
        """
        agent_map = {a.agent_id: a for a in agents}
        for agent_id, agent in agent_map.items():
            if agent.status == "ACTIVE" and self.graph.has_node(agent_id):
                neighbors = [
                    nbr for nbr in self.graph.neighbors(agent_id)
                    if self.graph.nodes[nbr].get("status") == "ACTIVE"
                ]
                agent.neighbor_ids = sorted(neighbors)
            else:
                agent.neighbor_ids = []

    def find_neighbors(self, agent_id: str) -> List[str]:
        """
        Returns list of active neighbor node IDs connected to `agent_id`.
        """
        if not self.graph.has_node(agent_id):
            return []
        if self.graph.nodes[agent_id].get("status") != "ACTIVE":
            return []

        return [
            nbr for nbr in self.graph.neighbors(agent_id)
            if self.graph.nodes[nbr].get("status") == "ACTIVE"
        ]

    def remove_failed_agent(self, agent_id: str, agents: List[Any]) -> Dict[str, Any]:
        """
        Marks an agent as FAILED, drops its active links, and updates graph.
        """
        if not self.graph.has_node(agent_id):
            return {"removed_links": []}

        # Find existing links touching this agent
        existing_edges = list(self.graph.edges(agent_id))
        removed_links = [sorted([u, v]) for u, v in existing_edges]

        # Update node status in graph
        self.graph.nodes[agent_id]["status"] = "FAILED"

        # Remove edges
        self.graph.remove_edges_from(existing_edges)

        # Synchronize
        self._sync_agent_neighbors(agents)

        return {"removed_links": removed_links}

    def restore_agent(self, agent_id: str, agents: List[Any]) -> Dict[str, Any]:
        """
        Restores a previously failed agent, re-evaluating proximity links.
        """
        if not self.graph.has_node(agent_id):
            return {"added_links": []}

        self.graph.nodes[agent_id]["status"] = "ACTIVE"
        target_agent = next((a for a in agents if a.agent_id == agent_id), None)
        if not target_agent:
            return {"added_links": []}

        added_links = []
        for other in agents:
            if other.agent_id != agent_id and other.status == "ACTIVE":
                dist = self.euclidean_distance(target_agent.x, target_agent.y, other.x, other.y)
                if dist <= self.comm_range:
                    self.graph.add_edge(agent_id, other.agent_id, distance=round(dist, 2), link_type="RESTORED")
                    added_links.append(sorted([agent_id, other.agent_id]))

        self._sync_agent_neighbors(agents)
        return {"added_links": added_links}

    def reorganize_network(self, agents: List[Any], failed_agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes self-organization recovery protocol.
        When a node fails and isolates or weakens sub-clusters, remaining active agents
        adaptively boost relay power (up to ADAPTIVE_REORGANIZATION_RANGE) between boundary nodes
        to restore topological connectivity where physically reachable.
        Measures real execution time using a high-precision timer.
        """
        start_time = time.perf_counter()

        added_links = []
        active_nodes = [
            n for n, data in self.graph.nodes(data=True)
            if data.get("status") == "ACTIVE"
        ]

        # Check sub-graph of active nodes
        active_subgraph = self.graph.subgraph(active_nodes)
        components = list(nx.connected_components(active_subgraph))

        # If disconnected into >= 2 components, attempt adaptive multi-agent bridge rerouting
        if len(components) > 1:
            agent_map = {a.agent_id: a for a in agents}

            # Find pairs between distinct components within adaptive range
            for i in range(len(components)):
                for j in range(i + 1, len(components)):
                    comp_a = list(components[i])
                    comp_b = list(components[j])

                    best_pair = None
                    min_dist = float("inf")

                    for u in comp_a:
                        for v in comp_b:
                            ag_u = agent_map.get(u)
                            ag_v = agent_map.get(v)
                            if ag_u and ag_v:
                                d = self.euclidean_distance(ag_u.x, ag_u.y, ag_v.x, ag_v.y)
                                if d <= self.ADAPTIVE_REORGANIZATION_RANGE and d < min_dist:
                                    min_dist = d
                                    best_pair = (u, v, d)

                    if best_pair:
                        u, v, d = best_pair
                        if not self.graph.has_edge(u, v):
                            self.graph.add_edge(u, v, distance=round(d, 2), link_type="ADAPTIVE_REORGANIZED")
                            added_links.append(sorted([u, v]))

        # Re-evaluate final active connectivity
        active_subgraph = self.graph.subgraph(active_nodes)
        final_components = list(nx.connected_components(active_subgraph))
        is_connected = len(final_components) <= 1 and len(active_nodes) > 0

        # Calculate exact duration
        duration_ms = round((time.perf_counter() - start_time) * 1000.0, 3)

        # Synchronize
        self._sync_agent_neighbors(agents)

        recovery_summary = {
            "failed_agent": failed_agent_id,
            "removed_links": self.last_recovery_metrics.get("removed_links", []) if failed_agent_id else [],
            "added_links": added_links,
            "recovery_duration_ms": duration_ms,
            "active_agent_count": len(active_nodes),
            "is_connected": is_connected,
            "connected_components_count": len(final_components),
            "components": [sorted(list(c)) for c in final_components]
        }

        self.last_recovery_metrics = recovery_summary
        return recovery_summary

    def get_topology(self) -> Dict[str, Any]:
        """
        Returns full graph topology data for visualization and metrics.
        """
        nodes_list = []
        for node_id, data in self.graph.nodes(data=True):
            nodes_list.append({
                "id": node_id,
                "x": data.get("x", 0.0),
                "y": data.get("y", 0.0),
                "status": data.get("status", "ACTIVE"),
                "zone": data.get("zone", "Zone"),
                "battery": data.get("battery", 100.0),
                "degree": self.graph.degree(node_id)
            })

        edges_list = []
        for u, v, data in self.graph.edges(data=True):
            edges_list.append({
                "source": u,
                "target": v,
                "distance": data.get("distance", 0.0),
                "link_type": data.get("link_type", "STANDARD")
            })

        active_nodes = [n for n, data in self.graph.nodes(data=True) if data.get("status") == "ACTIVE"]
        active_subgraph = self.graph.subgraph(active_nodes) if active_nodes else nx.Graph()

        is_connected = nx.is_connected(active_subgraph) if len(active_nodes) > 1 else True
        comp_count = nx.number_connected_components(active_subgraph) if len(active_nodes) > 0 else 0

        return {
            "nodes": nodes_list,
            "edges": edges_list,
            "total_nodes": len(nodes_list),
            "active_nodes_count": len(active_nodes),
            "failed_nodes_count": len(nodes_list) - len(active_nodes),
            "active_links_count": len(edges_list),
            "is_connected": is_connected,
            "connected_components_count": comp_count,
            "comm_range": self.comm_range,
            "adaptive_range": self.ADAPTIVE_REORGANIZATION_RANGE
        }
