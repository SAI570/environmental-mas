"""
routes.py

FastAPI Routes for Environmental Multi-Agent System.
Implements all required REST endpoints for agents, network topology, scenarios,
consensus records, audit history, and analytics.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.connection import get_db
from app.database.models import (
    IncidentRecord,
    SensorReadingRecord,
    ConsensusRecord,
    AgentFailureRecord,
    SystemActivityRecord
)
from app.core.simulation import simulation
from app.schemas import (
    AgentCreateSchema,
    AgentUpdateSchema,
    ScenarioTriggerSchema,
    SystemStatusResponse
)

router = APIRouter(prefix="/api", tags=["MAS Environmental Monitoring"])


# =============================================================================
# 1. System Status
# =============================================================================

@router.get("/status", response_model=SystemStatusResponse)
def get_status():
    """
    Returns real-time high-level status of the multi-agent system.
    """
    return simulation.get_system_status()


# =============================================================================
# 2. Agents Management & Diagnostics
# =============================================================================

@router.get("/agents")
def list_agents():
    """
    Returns all monitoring agents with current telemetry and diagnostic state.
    """
    return simulation.list_agents()


@router.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    """
    Retrieves full state for a specific agent.
    """
    agent = simulation.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return agent.to_dict()


@router.post("/agents", status_code=201)
def create_agent(payload: AgentCreateSchema):
    """
    Deploys a new autonomous agent into the environment.
    """
    return simulation.add_agent(payload.model_dump())


@router.patch("/agents/{agent_id}")
def update_agent(agent_id: str, payload: AgentUpdateSchema):
    """
    Updates agent sensor values, operational status, or grid position.
    """
    updates = payload.model_dump(exclude_unset=True)
    res = simulation.update_agent(agent_id, updates)
    if not res:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return res


@router.delete("/agents/{agent_id}")
def delete_agent(agent_id: str):
    """
    Removes an agent from the multi-agent system.
    """
    success = simulation.delete_agent(agent_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return {"message": f"Agent {agent_id} deleted successfully"}


@router.post("/agents/{agent_id}/analyze")
def analyze_agent(agent_id: str):
    """
    Executes on-demand AI anomaly detection and event classification on an agent.
    """
    res = simulation.analyze_agent(agent_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return res


@router.post("/agents/{agent_id}/fail")
def fail_agent(agent_id: str):
    """
    Simulates node failure: drops connections and triggers self-organization recovery.
    """
    res = simulation.fail_agent(agent_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return res


@router.post("/agents/{agent_id}/restore")
def restore_agent(agent_id: str):
    """
    Restores a failed agent back to active status and recalculates network links.
    """
    res = simulation.restore_agent(agent_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return res


# =============================================================================
# 3. Network Topology & Self-Organization
# =============================================================================

@router.get("/network")
def get_network_topology():
    """
    Returns full NetworkX graph topology, nodes, edges, and connectivity state.
    """
    return simulation.network_manager.get_topology()


@router.post("/network/recover")
def trigger_network_recovery():
    """
    Manually triggers self-organization network reorganization protocol.
    """
    res = simulation.network_manager.reorganize_network(list(simulation.agents.values()))
    return res


# =============================================================================
# 4. Environmental Scenarios & Incidents
# =============================================================================

@router.get("/events")
def list_incidents(db: Session = Depends(get_db)):
    """
    Returns historical list of environmental incidents recorded in the database.
    """
    incidents = db.query(IncidentRecord).order_by(desc(IncidentRecord.created_at)).limit(50).all()
    return [inc.to_dict() for inc in incidents]


@router.post("/events/fire")
def trigger_fire(payload: ScenarioTriggerSchema = ScenarioTriggerSchema(center_agent_id="A07")):
    """
    Executes wildfire simulation scenario near target agent node.
    """
    return simulation.trigger_environmental_scenario(
        event_type="FIRE",
        center_agent_id=payload.center_agent_id or "A07",
        radius=payload.radius or 26.0
    )


@router.post("/events/pollution")
def trigger_pollution(payload: ScenarioTriggerSchema = ScenarioTriggerSchema(center_agent_id="A15")):
    """
    Executes industrial pollution spike scenario near target agent node.
    """
    return simulation.trigger_environmental_scenario(
        event_type="POLLUTION",
        center_agent_id=payload.center_agent_id or "A15",
        radius=payload.radius or 26.0
    )


@router.post("/events/extreme-heat")
def trigger_extreme_heat(payload: ScenarioTriggerSchema = ScenarioTriggerSchema(center_agent_id="A03")):
    """
    Executes extreme heatwave scenario near target agent node.
    """
    return simulation.trigger_environmental_scenario(
        event_type="EXTREME_HEAT",
        center_agent_id=payload.center_agent_id or "A03",
        radius=payload.radius or 26.0
    )


@router.post("/events/reset")
def reset_simulation():
    """
    Resets all 20 agents and the network back to baseline normal state.
    """
    return simulation.reset_simulation()


# =============================================================================
# 5. System History Audit Log
# =============================================================================

@router.get("/history")
def get_system_history(
    category: Optional[str] = Query(None, description="Filter by category (ANOMALY, CONSENSUS, INCIDENT, FAILURE, RECOVERY, AGENT)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological system activity history from database.
    """
    query = db.query(SystemActivityRecord)
    if category:
        query = query.filter(SystemActivityRecord.category == category.upper())
    records = query.order_by(desc(SystemActivityRecord.timestamp)).limit(limit).all()
    return [rec.to_dict() for rec in records]


# =============================================================================
# 6. Environmental & Operational Analytics
# =============================================================================

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """
    Aggregates historical time-series and system telemetry metrics for analytics charts.
    """
    # 1. Telemetry time series
    readings = (
        db.query(SensorReadingRecord)
        .order_by(SensorReadingRecord.timestamp.asc())
        .limit(100)
        .all()
    )

    timeseries_data = [
        {
            "timestamp": r.timestamp.strftime("%H:%M:%S") if r.timestamp else "",
            "agent_id": r.agent_id,
            "temperature": r.temperature,
            "smoke": r.smoke,
            "co2": r.co2,
            "aqi": r.aqi,
            "humidity": r.humidity,
            "is_anomaly": r.is_anomaly
        }
        for r in readings
    ]

    # 2. Total anomaly count vs normal count in recorded telemetry
    total_anomalies = db.query(SensorReadingRecord).filter(SensorReadingRecord.is_anomaly == True).count()
    total_normal = db.query(SensorReadingRecord).filter(SensorReadingRecord.is_anomaly == False).count()

    # 3. Incidents grouped by type
    incident_groups = (
        db.query(IncidentRecord.incident_type, func.count(IncidentRecord.id))
        .group_by(IncidentRecord.incident_type)
        .all()
    )
    incidents_by_type = [{"type": inc_type, "count": count} for inc_type, count in incident_groups]

    # 4. Failures & Recovery Durations
    failure_records = (
        db.query(AgentFailureRecord)
        .order_by(desc(AgentFailureRecord.created_at))
        .limit(10)
        .all()
    )
    recovery_times = [
        {
            "agent_id": f.agent_id,
            "duration_ms": f.recovery_duration_ms,
            "links_lost": f.links_lost,
            "links_added": f.links_added,
            "is_connected": f.is_connected,
            "timestamp": f.created_at.strftime("%H:%M:%S") if f.created_at else ""
        }
        for f in failure_records
    ]

    # 5. Current agent status breakdown
    active_agents = sum(1 for a in simulation.agents.values() if a.status == "ACTIVE")
    failed_agents = sum(1 for a in simulation.agents.values() if a.status == "FAILED")

    return {
        "telemetry_timeseries": timeseries_data,
        "anomaly_distribution": {
            "anomalies": total_anomalies,
            "normal": total_normal
        },
        "incidents_by_type": incidents_by_type,
        "recovery_benchmarks": recovery_times,
        "agent_status_breakdown": {
            "active": active_agents,
            "failed": failed_agents,
            "total": len(simulation.agents)
        }
    }
