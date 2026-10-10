"""
models.py

SQLAlchemy Models for Environmental MAS.
Stores historical records for incidents, telemetry snapshots, consensus decisions,
node failures, and system activity logs.
"""

from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from app.database.connection import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class IncidentRecord(Base):
    """
    Persisted environmental incident events (e.g., FIRE, POLLUTION, EXTREME_HEAT).
    """
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_type = Column(String(50), nullable=False)   # "FIRE", "POLLUTION", "EXTREME_HEAT"
    severity = Column(String(20), default="CRITICAL")     # "CRITICAL", "HIGH", "MEDIUM"
    status = Column(String(20), default="ACTIVE")         # "ACTIVE", "RESOLVED"
    consensus_status = Column(String(20), nullable=False) # "CONFIRMED", "INCONCLUSIVE", "REJECTED"
    consensus_strength = Column(Float, default=0.0)      # e.g., 85.5%
    affected_agents_json = Column(Text, default="[]")     # JSON list of agent IDs
    detecting_agents_json = Column(Text, default="[]")    # JSON list of agent IDs
    evidence_json = Column(Text, default="{}")            # Summary sensor evidence
    details = Column(Text, default="")
    created_at = Column(DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "incident_type": self.incident_type,
            "severity": self.severity,
            "status": self.status,
            "consensus_status": self.consensus_status,
            "consensus_strength": self.consensus_strength,
            "affected_agents": json.loads(self.affected_agents_json) if self.affected_agents_json else [],
            "detecting_agents": json.loads(self.detecting_agents_json) if self.detecting_agents_json else [],
            "evidence": json.loads(self.evidence_json) if self.evidence_json else {},
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SensorReadingRecord(Base):
    """
    Historical sensor telemetry snapshot from monitoring agents.
    """
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(String(50), index=True, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    smoke = Column(Float, nullable=False)
    co2 = Column(Float, nullable=False)
    aqi = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    battery = Column(Float, default=100.0)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    event_type = Column(String(50), default="NORMAL")
    timestamp = Column(DateTime, default=get_utc_now, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "smoke": self.smoke,
            "co2": self.co2,
            "aqi": self.aqi,
            "soil_moisture": self.soil_moisture,
            "battery": self.battery,
            "is_anomaly": self.is_anomaly,
            "anomaly_score": self.anomaly_score,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class ConsensusRecord(Base):
    """
    Audit record of decentralized local consensus evaluations.
    """
    __tablename__ = "consensus_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    deciding_agent_id = Column(String(50), index=True, nullable=False)
    consensus_event = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)          # "CONFIRMED", "INCONCLUSIVE", "REJECTED"
    consensus_strength = Column(Float, default=0.0)
    supporting_agents_json = Column(Text, default="[]")
    disagreeing_agents_json = Column(Text, default="[]")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "deciding_agent_id": self.deciding_agent_id,
            "consensus_event": self.consensus_event,
            "status": self.status,
            "consensus_strength": self.consensus_strength,
            "supporting_agents": json.loads(self.supporting_agents_json) if self.supporting_agents_json else [],
            "disagreeing_agents": json.loads(self.disagreeing_agents_json) if self.disagreeing_agents_json else [],
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AgentFailureRecord(Base):
    """
    Historical log of agent failures and network self-organization recoveries.
    """
    __tablename__ = "agent_failures"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(String(50), index=True, nullable=False)
    failure_type = Column(String(50), default="MANUAL_FAULT") # "BATTERY_EXHAUSTION", "MANUAL_FAULT", "RADIO_FAILURE"
    links_lost = Column(Integer, default=0)
    links_added = Column(Integer, default=0)
    recovery_duration_ms = Column(Float, default=0.0)
    is_connected = Column(Boolean, default=True)
    details = Column(Text, default="")
    created_at = Column(DateTime, default=get_utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "failure_type": self.failure_type,
            "links_lost": self.links_lost,
            "links_added": self.links_added,
            "recovery_duration_ms": self.recovery_duration_ms,
            "is_connected": self.is_connected,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SystemActivityRecord(Base):
    """
    Comprehensive system activity log for operational auditing and viva demonstration.
    """
    __tablename__ = "system_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), nullable=False)  # "ANOMALY", "CONSENSUS", "INCIDENT", "FAILURE", "RECOVERY", "AGENT"
    related_id = Column(String(50), default="")
    description = Column(Text, nullable=False)
    outcome = Column(String(50), default="SUCCESS")
    timestamp = Column(DateTime, default=get_utc_now, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "related_id": self.related_id,
            "description": self.description,
            "outcome": self.outcome,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }
