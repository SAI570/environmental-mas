"""
simulation.py

Core Simulation Coordinator for Self-Organizing Multi-Agent System.
Orchestrates 20 autonomous agents, spatial layouts, environmental scenarios,
AI anomaly detection, neighbor communication, local consensus, and self-organizing recovery.
"""

from datetime import datetime, timezone
import json
import random
from typing import Dict, Any, List, Optional

from app.core.agent import Agent
from app.core.anomaly_detector import AnomalyDetector
from app.core.event_classifier import EventClassifier
from app.core.communication import CommunicationBus
from app.core.consensus import LocalConsensusEngine
from app.core.network_manager import NetworkManager
from app.database.connection import SessionLocal
from app.database.models import (
    IncidentRecord,
    SensorReadingRecord,
    ConsensusRecord,
    AgentFailureRecord,
    SystemActivityRecord
)


# Canonical 20-agent demonstration layout (100x100 grid)
DEFAULT_AGENT_LAYOUT = [
    # Forest Zone (North-West)
    {"id": "A01", "x": 15.0, "y": 20.0, "zone": "North Forest", "temp": 23.5, "hum": 62.0, "smoke": 0.02, "co2": 410.0, "aqi": 35.0, "soil": 55.0},
    {"id": "A02", "x": 28.0, "y": 18.0, "zone": "North Forest", "temp": 24.0, "hum": 60.0, "smoke": 0.02, "co2": 412.0, "aqi": 38.0, "soil": 52.0},
    {"id": "A03", "x": 38.0, "y": 25.0, "zone": "North Forest", "temp": 24.2, "hum": 58.0, "smoke": 0.03, "co2": 415.0, "aqi": 40.0, "soil": 50.0},
    {"id": "A04", "x": 20.0, "y": 35.0, "zone": "North Forest", "temp": 23.8, "hum": 61.0, "smoke": 0.02, "co2": 414.0, "aqi": 37.0, "soil": 54.0},
    {"id": "A05", "x": 32.0, "y": 38.0, "zone": "Central Canopy", "temp": 24.5, "hum": 57.0, "smoke": 0.03, "co2": 418.0, "aqi": 42.0, "soil": 48.0},

    # Fire Watch Sector (West-Central)
    {"id": "A06", "x": 18.0, "y": 55.0, "zone": "Pine Ridge", "temp": 25.0, "hum": 55.0, "smoke": 0.03, "co2": 420.0, "aqi": 45.0, "soil": 46.0},
    {"id": "A07", "x": 28.0, "y": 62.0, "zone": "Pine Ridge", "temp": 25.4, "hum": 54.0, "smoke": 0.02, "co2": 422.0, "aqi": 44.0, "soil": 45.0},
    {"id": "A08", "x": 40.0, "y": 58.0, "zone": "Pine Ridge", "temp": 25.1, "hum": 56.0, "smoke": 0.03, "co2": 419.0, "aqi": 43.0, "soil": 47.0},
    {"id": "A09", "x": 30.0, "y": 78.0, "zone": "West Valley", "temp": 24.6, "hum": 59.0, "smoke": 0.02, "co2": 416.0, "aqi": 41.0, "soil": 50.0},
    {"id": "A10", "x": 42.0, "y": 76.0, "zone": "West Valley", "temp": 24.8, "hum": 58.0, "smoke": 0.03, "co2": 418.0, "aqi": 42.0, "soil": 49.0},

    # Urban & Industrial Border (East & South-East)
    {"id": "A11", "x": 55.0, "y": 22.0, "zone": "Urban Perimeter", "temp": 26.2, "hum": 50.0, "smoke": 0.04, "co2": 435.0, "aqi": 52.0, "soil": 40.0},
    {"id": "A12", "x": 68.0, "y": 28.0, "zone": "Urban Perimeter", "temp": 26.5, "hum": 49.0, "smoke": 0.04, "co2": 440.0, "aqi": 55.0, "soil": 38.0},
    {"id": "A13", "x": 60.0, "y": 42.0, "zone": "Suburban Buffer", "temp": 25.8, "hum": 52.0, "smoke": 0.03, "co2": 430.0, "aqi": 48.0, "soil": 42.0},
    {"id": "A14", "x": 75.0, "y": 45.0, "zone": "Industrial Outpost", "temp": 27.0, "hum": 48.0, "smoke": 0.05, "co2": 455.0, "aqi": 60.0, "soil": 36.0},
    {"id": "A15", "x": 85.0, "y": 55.0, "zone": "Industrial Outpost", "temp": 27.5, "hum": 46.0, "smoke": 0.06, "co2": 465.0, "aqi": 64.0, "soil": 34.0},

    # River Basin & Highland Sanctuary (South & South-East)
    {"id": "A16", "x": 58.0, "y": 64.0, "zone": "River Basin", "temp": 24.0, "hum": 68.0, "smoke": 0.02, "co2": 415.0, "aqi": 36.0, "soil": 62.0},
    {"id": "A17", "x": 72.0, "y": 70.0, "zone": "River Basin", "temp": 24.2, "hum": 66.0, "smoke": 0.02, "co2": 418.0, "aqi": 38.0, "soil": 60.0},
    {"id": "A18", "x": 60.0, "y": 85.0, "zone": "Wetland Reserve", "temp": 23.6, "hum": 72.0, "smoke": 0.01, "co2": 410.0, "aqi": 34.0, "soil": 68.0},
    {"id": "A19", "x": 78.0, "y": 88.0, "zone": "Wetland Reserve", "temp": 23.8, "hum": 70.0, "smoke": 0.02, "co2": 412.0, "aqi": 35.0, "soil": 65.0},
    {"id": "A20", "x": 90.0, "y": 78.0, "zone": "Highland Ridge", "temp": 24.5, "hum": 60.0, "smoke": 0.03, "co2": 420.0, "aqi": 42.0, "soil": 45.0},
]


class SimulationManager:
    """
    Central operational manager holding runtime multi-agent state.
    """

    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.detector = AnomalyDetector()
        self.classifier = EventClassifier()
        self.comm_bus = CommunicationBus()
        self.consensus_engine = LocalConsensusEngine()
        self.network_manager = NetworkManager(comm_range=28.0)

        self.current_incident: Optional[Dict[str, Any]] = None
        self.initialize_default_agents()

    def initialize_default_agents(self) -> None:
        """
        Initializes the canonical 20 agents and builds initial connected topology.
        """
        self.agents.clear()
        for cfg in DEFAULT_AGENT_LAYOUT:
            agent = Agent(
                agent_id=cfg["id"],
                x=cfg["x"],
                y=cfg["y"],
                temperature=cfg["temp"],
                humidity=cfg["hum"],
                smoke=cfg["smoke"],
                co2=cfg["co2"],
                aqi=cfg["aqi"],
                soil_moisture=cfg["soil"],
                battery=95.0 + random.uniform(0.0, 5.0),
                status="ACTIVE",
                zone=cfg["zone"]
            )
            # Run baseline diagnostics
            agent.run_anomaly_detection(self.detector)
            agent.classify_event(self.classifier)
            self.agents[agent.agent_id] = agent

        # Build initial physical topology
        self.network_manager.build_network(list(self.agents.values()))

    def reset_simulation(self) -> Dict[str, Any]:
        """
        Resets all agents to nominal baseline condition.
        """
        self.initialize_default_agents()
        self.current_incident = None

        self._record_activity(
            category="SIMULATION",
            related_id="ALL",
            description="Simulation state reset to default 20 active monitoring nodes.",
            outcome="RESET"
        )

        return {
            "message": "Simulation reset successfully",
            "total_agents": len(self.agents),
            "status": "NORMAL"
        }

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        return self.agents.get(agent_id)

    def list_agents(self) -> List[Dict[str, Any]]:
        # Synchronize neighbors before returning
        self.network_manager._sync_agent_neighbors(list(self.agents.values()))
        return [a.to_dict() for a in self.agents.values()]

    def add_agent(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        agent_id = agent_data.get("agent_id")
        if not agent_id or agent_id in self.agents:
            # Generate next ID
            next_num = len(self.agents) + 1
            agent_id = f"A{next_num:02d}"

        agent = Agent(
            agent_id=agent_id,
            x=float(agent_data.get("x", 50.0)),
            y=float(agent_data.get("y", 50.0)),
            temperature=float(agent_data.get("temperature", 24.5)),
            humidity=float(agent_data.get("humidity", 58.0)),
            smoke=float(agent_data.get("smoke", 0.02)),
            co2=float(agent_data.get("co2", 415.0)),
            aqi=float(agent_data.get("aqi", 42.0)),
            soil_moisture=float(agent_data.get("soil_moisture", 48.0)),
            battery=float(agent_data.get("battery", 100.0)),
            status=str(agent_data.get("status", "ACTIVE")).upper(),
            zone=str(agent_data.get("zone", "Custom Deployment"))
        )
        agent.run_anomaly_detection(self.detector)
        agent.classify_event(self.classifier)
        self.agents[agent.agent_id] = agent

        # Rebuild graph
        self.network_manager.build_network(list(self.agents.values()))

        self._record_activity(
            category="AGENT",
            related_id=agent_id,
            description=f"New agent {agent_id} deployed at ({agent.x:.1f}, {agent.y:.1f}) in {agent.zone}.",
            outcome="DEPLOYED"
        )
        return agent.to_dict()

    def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        agent.update_readings(updates)
        if "x" in updates or "y" in updates:
            new_x = float(updates.get("x", agent.x))
            new_y = float(updates.get("y", agent.y))
            agent.update_position(new_x, new_y)
            self.network_manager.build_network(list(self.agents.values()))

        # Re-run AI analytics
        agent.run_anomaly_detection(self.detector)
        agent.classify_event(self.classifier)

        # Snapshot reading into database
        self._save_sensor_snapshot(agent)

        self._record_activity(
            category="AGENT",
            related_id=agent_id,
            description=f"Agent {agent_id} parameters updated manually.",
            outcome="UPDATED"
        )
        return agent.to_dict()

    def delete_agent(self, agent_id: str) -> bool:
        if agent_id not in self.agents:
            return False
        del self.agents[agent_id]
        self.network_manager.build_network(list(self.agents.values()))
        self._record_activity(
            category="AGENT",
            related_id=agent_id,
            description=f"Agent {agent_id} decommissioned from network.",
            outcome="DELETED"
        )
        return True

    def analyze_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        anomaly_res = agent.run_anomaly_detection(self.detector)
        class_res = agent.classify_event(self.classifier)

        self._save_sensor_snapshot(agent)

        self._record_activity(
            category="ANOMALY",
            related_id=agent_id,
            description=f"Manual analysis on {agent_id}: {anomaly_res.get('decision')} | {class_res.get('event_type')}.",
            outcome="ANALYZED"
        )

        return {
            "agent_id": agent_id,
            "anomaly_result": anomaly_res,
            "classification_result": class_res,
            "readings": agent.get_readings()
        }

    def fail_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Executes Section 11 sequence:
        1. Select active agent.
        2. Mark as FAILED.
        3. Stop active communication.
        4. Remove active connections.
        5. Record failure.
        6. Rebuild/reorganize valid links.
        7. Recalculate connectivity and record duration.
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        # Mark FAILED
        agent.fail()

        # Remove links from NetworkX
        remove_res = self.network_manager.remove_failed_agent(agent_id, list(self.agents.values()))
        removed_links = remove_res["removed_links"]

        # Run Self-Organization Reorganization Protocol
        recovery_summary = self.network_manager.reorganize_network(
            list(self.agents.values()),
            failed_agent_id=agent_id
        )

        # Record in database
        db = SessionLocal()
        try:
            fail_record = AgentFailureRecord(
                agent_id=agent_id,
                failure_type="HARDWARE_OR_LINK_FAULT",
                links_lost=len(removed_links),
                links_added=len(recovery_summary["added_links"]),
                recovery_duration_ms=recovery_summary["recovery_duration_ms"],
                is_connected=recovery_summary["is_connected"],
                details=f"Node {agent_id} failed. Dropped {len(removed_links)} edges. Network self-reorganized in {recovery_summary['recovery_duration_ms']}ms."
            )
            db.add(fail_record)

            act_record = SystemActivityRecord(
                category="FAILURE",
                related_id=agent_id,
                description=f"Node {agent_id} marked FAILED. {len(removed_links)} active links severed.",
                outcome="FAIL_DETECTED"
            )
            db.add(act_record)

            rec_act = SystemActivityRecord(
                category="RECOVERY",
                related_id=agent_id,
                description=f"Self-organization completed in {recovery_summary['recovery_duration_ms']}ms. Added {len(recovery_summary['added_links'])} adaptive links. Connected: {recovery_summary['is_connected']}.",
                outcome="RECOVERY_COMPLETED"
            )
            db.add(rec_act)

            db.commit()
        except Exception as e:
            print(f"[SimulationManager] DB error recording failure: {e}")
            db.rollback()
        finally:
            db.close()

        return {
            "agent": agent.to_dict(),
            "removed_links": removed_links,
            "recovery_summary": recovery_summary
        }

    def restore_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Restores an agent back to ACTIVE and reconnects topology.
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return None

        agent.restore()
        restore_res = self.network_manager.restore_agent(agent_id, list(self.agents.values()))

        # Re-run diagnostics
        agent.run_anomaly_detection(self.detector)
        agent.classify_event(self.classifier)

        self._record_activity(
            category="RECOVERY",
            related_id=agent_id,
            description=f"Agent {agent_id} restored to ACTIVE. Restored {len(restore_res['added_links'])} links.",
            outcome="AGENT_RESTORED"
        )

        return {
            "agent": agent.to_dict(),
            "restored_links": restore_res["added_links"],
            "topology": self.network_manager.get_topology()
        }

    # =========================================================================
    # Environmental Incident Simulation Scenarios
    # =========================================================================

    def trigger_environmental_scenario(
        self,
        event_type: str,            # "FIRE", "POLLUTION", "EXTREME_HEAT"
        center_agent_id: str,
        radius: float = 26.0
    ) -> Dict[str, Any]:
        """
        Full 10-step demonstration flow:
        Sensing -> AI Analysis -> Anomaly Detection -> Event Classification ->
        Communication -> Consensus -> Incident Confirmation -> Persistence.
        """
        center_agent = self.get_agent(center_agent_id)
        if not center_agent:
            # Default fallback center
            center_agent = self.agents.get("A07") if event_type == "FIRE" else self.agents.get("A15")

        center_x, center_y = center_agent.x, center_agent.y

        affected_agents: List[Agent] = []
        detecting_agents: List[Agent] = []
        messages_sent: List[Dict[str, Any]] = []

        # 1. Update physical telemetry for agents within scenario perimeter
        for agent in self.agents.values():
            if agent.status != "ACTIVE":
                continue

            dist = self.network_manager.euclidean_distance(center_x, center_y, agent.x, agent.y)
            if dist <= radius:
                affected_agents.append(agent)
                # Apply realistic event-specific sensor shifts based on distance decay
                decay = max(0.2, 1.0 - (dist / radius))

                if event_type == "FIRE":
                    # Severe combustion heat, thick smoke, arid drop
                    agent.temperature = round(25.0 + (32.0 * decay) + random.uniform(-1.0, 2.0), 1)
                    agent.smoke = round(min(0.95, 0.05 + (0.65 * decay) + random.uniform(-0.02, 0.05)), 3)
                    agent.humidity = round(max(14.0, 55.0 - (38.0 * decay) + random.uniform(-2.0, 2.0)), 1)
                    agent.co2 = round(415.0 + (420.0 * decay) + random.uniform(-10.0, 20.0), 1)
                    agent.aqi = round(42.0 + (190.0 * decay), 1)
                elif event_type == "POLLUTION":
                    # Hazardous particulate and gas spike, mild temperature
                    agent.aqi = round(45.0 + (220.0 * decay) + random.uniform(-10.0, 20.0), 1)
                    agent.co2 = round(415.0 + (550.0 * decay) + random.uniform(-20.0, 30.0), 1)
                    agent.smoke = round(min(0.50, 0.04 + (0.28 * decay)), 3)
                    agent.temperature = round(25.0 + (4.0 * decay), 1)
                elif event_type == "EXTREME_HEAT":
                    # Extreme ambient thermal wave without particulate smoke
                    agent.temperature = round(26.0 + (18.0 * decay) + random.uniform(-0.5, 1.5), 1)
                    agent.smoke = round(0.02 + random.uniform(0.005, 0.025), 3)
                    agent.humidity = round(max(20.0, 50.0 - (20.0 * decay)), 1)
                    agent.aqi = round(45.0 + (25.0 * decay), 1)

                # 2. Local AI Anomaly Detection
                anomaly_res = agent.run_anomaly_detection(self.detector)

                # 3. Explainable Event Classification
                class_res = agent.classify_event(self.classifier)

                # Persist reading snapshot
                self._save_sensor_snapshot(agent)

                if anomaly_res.get("is_anomaly", False):
                    detecting_agents.append(agent)

        # 4. Agent-to-Agent Communication: broadcast alerts to neighbors
        for det_agent in detecting_agents:
            neighbor_objs = [self.agents[nid] for nid in det_agent.neighbor_ids if nid in self.agents]
            class_res = det_agent.latest_event_classification or {}
            dispatched = self.comm_bus.broadcast_alert(
                sender_agent=det_agent,
                neighbor_agents=neighbor_objs,
                event_type=class_res.get("event_type", event_type),
                severity=class_res.get("severity", "CRITICAL"),
                evidence=det_agent.get_readings()
            )
            messages_sent.extend(dispatched)

        # 5. Local Consensus Evaluation by Center / Primary Detecting Agent
        primary_node = detecting_agents[0] if detecting_agents else center_agent
        primary_neighbors = [self.agents[nid] for nid in primary_node.neighbor_ids if nid in self.agents]

        consensus_result = self.consensus_engine.evaluate_consensus(
            deciding_agent=primary_node,
            neighbor_agents=primary_neighbors,
            candidate_event=event_type
        )

        # 6. Incident Record Creation
        severity = "CRITICAL" if event_type == "FIRE" else "HIGH"
        incident_summary = {
            "incident_type": event_type,
            "severity": severity,
            "status": "ACTIVE",
            "consensus_status": consensus_result["status"],
            "consensus_strength": consensus_result["consensus_strength"],
            "affected_agents": [a.agent_id for a in affected_agents],
            "detecting_agents": [a.agent_id for a in detecting_agents],
            "center_agent_id": center_agent.agent_id,
            "evidence": primary_node.get_readings(),
            "consensus": consensus_result,
            "messages_dispatched_count": len(messages_sent),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        self.current_incident = incident_summary

        # Persist Incident and Consensus in Database
        db = SessionLocal()
        try:
            inc_record = IncidentRecord(
                incident_type=event_type,
                severity=severity,
                status="ACTIVE",
                consensus_status=consensus_result["status"],
                consensus_strength=consensus_result["consensus_strength"],
                affected_agents_json=json.dumps([a.agent_id for a in affected_agents]),
                detecting_agents_json=json.dumps([a.agent_id for a in detecting_agents]),
                evidence_json=json.dumps(primary_node.get_readings()),
                details=consensus_result["details"]
            )
            db.add(inc_record)

            cons_record = ConsensusRecord(
                deciding_agent_id=primary_node.agent_id,
                consensus_event=event_type,
                status=consensus_result["status"],
                consensus_strength=consensus_result["consensus_strength"],
                supporting_agents_json=json.dumps(consensus_result["supporting_agents"]),
                disagreeing_agents_json=json.dumps(consensus_result["disagreeing_agents"]),
                details=consensus_result["details"]
            )
            db.add(cons_record)

            act_record = SystemActivityRecord(
                category="INCIDENT",
                related_id=f"INC-{event_type}",
                description=(
                    f"{event_type} scenario initiated near {center_agent.agent_id}. "
                    f"Consensus status: {consensus_result['status']} ({consensus_result['consensus_strength']}% agreement)."
                ),
                outcome=consensus_result["status"]
            )
            db.add(act_record)

            db.commit()
            incident_summary["id"] = inc_record.id
        except Exception as e:
            print(f"[SimulationManager] DB error saving incident: {e}")
            db.rollback()
        finally:
            db.close()

        return incident_summary

    def get_system_status(self) -> Dict[str, Any]:
        """
        Calculates real-time high level status metrics for Command Center.
        """
        active_count = sum(1 for a in self.agents.values() if a.status == "ACTIVE")
        failed_count = sum(1 for a in self.agents.values() if a.status == "FAILED")
        warning_count = sum(1 for a in self.agents.values() if a.status == "WARNING")

        anomaly_count = sum(
            1 for a in self.agents.values()
            if a.status == "ACTIVE" and a.latest_anomaly_result and a.latest_anomaly_result.get("is_anomaly", False)
        )

        topology = self.network_manager.get_topology()

        return {
            "total_agents": len(self.agents),
            "active_agents": active_count,
            "failed_agents": failed_count,
            "warning_agents": warning_count,
            "active_communication_links": topology["active_links_count"],
            "anomalies_detected": anomaly_count,
            "network_connectivity": {
                "is_connected": topology["is_connected"],
                "connected_components": topology["connected_components_count"]
            },
            "current_incident": self.current_incident,
            "last_recovery_metrics": self.network_manager.last_recovery_metrics
        }

    # =========================================================================
    # Helpers
    # =========================================================================

    def _save_sensor_snapshot(self, agent: Agent) -> None:
        db = SessionLocal()
        try:
            is_ano = False
            ano_score = 0.0
            if agent.latest_anomaly_result:
                is_ano = agent.latest_anomaly_result.get("is_anomaly", False)
                ano_score = agent.latest_anomaly_result.get("anomaly_score", 0.0)

            evt_type = "NORMAL"
            if agent.latest_event_classification:
                evt_type = agent.latest_event_classification.get("event_type", "NORMAL")

            rec = SensorReadingRecord(
                agent_id=agent.agent_id,
                temperature=agent.temperature,
                humidity=agent.humidity,
                smoke=agent.smoke,
                co2=agent.co2,
                aqi=agent.aqi,
                soil_moisture=agent.soil_moisture,
                battery=agent.battery,
                is_anomaly=is_ano,
                anomaly_score=ano_score,
                event_type=evt_type
            )
            db.add(rec)
            db.commit()
        except Exception as e:
            db.rollback()
        finally:
            db.close()

    def _record_activity(self, category: str, related_id: str, description: str, outcome: str = "SUCCESS") -> None:
        db = SessionLocal()
        try:
            rec = SystemActivityRecord(
                category=category,
                related_id=related_id,
                description=description,
                outcome=outcome
            )
            db.add(rec)
            db.commit()
        except Exception as e:
            db.rollback()
        finally:
            db.close()


# Global Singleton simulation instance
simulation = SimulationManager()
