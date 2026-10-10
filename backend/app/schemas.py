"""
schemas.py

Pydantic Schemas for Request & Response Data Validation.
Maintains exact field name parity between Python backend and Next.js frontend.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AgentCreateSchema(BaseModel):
    agent_id: Optional[str] = None
    x: float = Field(..., ge=0.0, le=100.0)
    y: float = Field(..., ge=0.0, le=100.0)
    temperature: float = Field(24.5, ge=-20.0, le=80.0)
    humidity: float = Field(58.0, ge=0.0, le=100.0)
    smoke: float = Field(0.02, ge=0.0, le=1.0)
    co2: float = Field(415.0, ge=300.0, le=3000.0)
    aqi: float = Field(42.0, ge=0.0, le=500.0)
    soil_moisture: float = Field(48.0, ge=0.0, le=100.0)
    battery: float = Field(100.0, ge=0.0, le=100.0)
    status: str = Field("ACTIVE")
    zone: str = Field("Custom Zone")


class AgentUpdateSchema(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    smoke: Optional[float] = None
    co2: Optional[float] = None
    aqi: Optional[float] = None
    soil_moisture: Optional[float] = None
    battery: Optional[float] = None
    status: Optional[str] = None
    zone: Optional[str] = None


class ScenarioTriggerSchema(BaseModel):
    center_agent_id: Optional[str] = "A07"
    radius: Optional[float] = 26.0


class NetworkRecoverSchema(BaseModel):
    force_extended_range: Optional[bool] = False


class SystemStatusResponse(BaseModel):
    total_agents: int
    active_agents: int
    failed_agents: int
    warning_agents: int
    active_communication_links: int
    anomalies_detected: int
    network_connectivity: Dict[str, Any]
    current_incident: Optional[Dict[str, Any]]
    last_recovery_metrics: Dict[str, Any]
