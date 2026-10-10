"""
agent.py

Autonomous Environmental Monitoring Agent.
Represents an intelligent environmental sensor node or conceptual drone.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.anomaly_detector import AnomalyDetector
from app.core.event_classifier import EventClassifier


class Agent:
    """
    Autonomous node capable of sensing, self-diagnostics, anomaly detection,
    event classification, and neighbor communication.
    """

    def __init__(
        self,
        agent_id: str,
        x: float,
        y: float,
        temperature: float = 24.5,
        humidity: float = 58.0,
        smoke: float = 0.02,
        co2: float = 415.0,
        aqi: float = 42.0,
        soil_moisture: float = 48.0,
        battery: float = 98.0,
        status: str = "ACTIVE",
        zone: str = "Central Forest"
    ):
        self.agent_id = agent_id
        self.x = float(x)
        self.y = float(y)
        self.zone = zone

        # Environmental Sensor Telemetry
        self.temperature = float(temperature)
        self.humidity = float(humidity)
        self.smoke = float(smoke)
        self.co2 = float(co2)
        self.aqi = float(aqi)
        self.soil_moisture = float(soil_moisture)

        # Operational State
        self.battery = max(0.0, min(100.0, float(battery)))
        self.status = status.upper()  # "ACTIVE", "FAILED", "WARNING"

        # Topological & Social State
        self.neighbor_ids: List[str] = []
        self.received_messages: List[Dict[str, Any]] = []

        # Latest AI/Heuristic Diagnostic Results
        self.latest_anomaly_result: Optional[Dict[str, Any]] = None
        self.latest_event_classification: Optional[Dict[str, Any]] = None
        self.last_updated: str = datetime.now(timezone.utc).isoformat()

    def get_readings(self) -> Dict[str, float]:
        """
        Returns dictionary of the 6 environmental sensor values.
        """
        return {
            "temperature": round(self.temperature, 2),
            "humidity": round(self.humidity, 2),
            "smoke": round(self.smoke, 4),
            "co2": round(self.co2, 1),
            "aqi": round(self.aqi, 1),
            "soil_moisture": round(self.soil_moisture, 2)
        }

    def update_readings(self, readings: Dict[str, Any]) -> None:
        """
        Updates sensor readings. Validates numeric boundaries.
        """
        if "temperature" in readings:
            self.temperature = float(readings["temperature"])
        if "humidity" in readings:
            self.humidity = float(readings["humidity"])
        if "smoke" in readings:
            self.smoke = float(readings["smoke"])
        if "co2" in readings:
            self.co2 = float(readings["co2"])
        if "aqi" in readings:
            self.aqi = float(readings["aqi"])
        if "soil_moisture" in readings:
            self.soil_moisture = float(readings["soil_moisture"])
        if "battery" in readings:
            self.battery = max(0.0, min(100.0, float(readings["battery"])))
        if "status" in readings:
            self.status = str(readings["status"]).upper()
        if "zone" in readings:
            self.zone = str(readings["zone"])

        self.last_updated = datetime.now(timezone.utc).isoformat()

    def update_position(self, x: float, y: float) -> None:
        """
        Updates the 2D spatial coordinate of this agent.
        """
        self.x = float(x)
        self.y = float(y)
        self.last_updated = datetime.now(timezone.utc).isoformat()

    def run_anomaly_detection(self, detector: AnomalyDetector) -> Dict[str, Any]:
        """
        Executes local AI anomaly detection using the provided detector.
        Failed agents cannot perform active detection.
        """
        if self.status == "FAILED":
            self.latest_anomaly_result = {
                "is_anomaly": False,
                "decision": "OFFLINE",
                "raw_decision_score": 0.0,
                "anomaly_score": 0.0,
                "status": "AGENT_FAILED"
            }
            return self.latest_anomaly_result

        readings = self.get_readings()
        result = detector.detect(readings)
        self.latest_anomaly_result = result
        return result

    def classify_event(self, classifier: EventClassifier) -> Dict[str, Any]:
        """
        Executes explainable event classification based on sensor readings
        and the latest anomaly detection result.
        """
        if self.status == "FAILED":
            self.latest_event_classification = {
                "event_type": "OFFLINE",
                "severity": "NORMAL",
                "confidence": 0.0,
                "reasons": ["Agent is offline / failed"],
                "evidence": self.get_readings()
            }
            return self.latest_event_classification

        is_anomaly = False
        if self.latest_anomaly_result:
            is_anomaly = self.latest_anomaly_result.get("is_anomaly", False)

        result = classifier.classify(self.get_readings(), is_anomaly=is_anomaly)
        self.latest_event_classification = result
        return result

    def receive_message(self, message: Dict[str, Any]) -> bool:
        """
        Receives and buffers an incoming message from a peer node.
        Failed agents reject incoming communications.
        """
        if self.status == "FAILED":
            return False

        self.received_messages.append(message)
        # Keep recent message buffer manageable
        if len(self.received_messages) > 50:
            self.received_messages.pop(0)
        return True

    def fail(self) -> None:
        """
        Marks agent as failed. Simulates hardware fault, battery exhaustion, or node crash.
        """
        self.status = "FAILED"
        self.neighbor_ids = []
        self.last_updated = datetime.now(timezone.utc).isoformat()

    def restore(self) -> None:
        """
        Restores agent to active status with operational battery.
        """
        self.status = "ACTIVE"
        if self.battery < 20.0:
            self.battery = 85.0
        self.last_updated = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes agent state for API responses and persistence.
        """
        return {
            "agent_id": self.agent_id,
            "x": self.x,
            "y": self.y,
            "zone": self.zone,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "smoke": self.smoke,
            "co2": self.co2,
            "aqi": self.aqi,
            "soil_moisture": self.soil_moisture,
            "battery": self.battery,
            "status": self.status,
            "neighbor_ids": list(self.neighbor_ids),
            "neighbor_count": len(self.neighbor_ids),
            "latest_anomaly_result": self.latest_anomaly_result,
            "latest_event_classification": self.latest_event_classification,
            "current_event": (
                self.latest_event_classification.get("event_type", "NORMAL")
                if self.latest_event_classification else "NORMAL"
            ),
            "last_updated": self.last_updated
        }
