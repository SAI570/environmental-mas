"""
test_api_and_database.py

Tests FastAPI REST endpoints, request validation, simulation scenario execution,
and database persistence.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.init_db import init_db
from app.database.connection import SessionLocal
from app.database.models import IncidentRecord, SystemActivityRecord


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database tables exist before testing API."""
    init_db()


@pytest.fixture
def client():
    return TestClient(app)


def test_api_status(client):
    """Verify GET /api/status returns 20 agents and connectivity metrics."""
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["total_agents"] >= 20
    assert data["active_agents"] >= 1
    assert "network_connectivity" in data


def test_api_list_and_get_agent(client):
    """Verify GET /api/agents and GET /api/agents/{agent_id}."""
    res = client.get("/api/agents")
    assert res.status_code == 200
    agents = res.json()
    assert len(agents) >= 20

    first_id = agents[0]["agent_id"]
    res_one = client.get(f"/api/agents/{first_id}")
    assert res_one.status_code == 200
    assert res_one.json()["agent_id"] == first_id


def test_api_agent_analyze(client):
    """Verify POST /api/agents/{agent_id}/analyze runs AI detection."""
    res = client.post("/api/agents/A01/analyze")
    assert res.status_code == 200
    data = res.json()
    assert "anomaly_result" in data
    assert "classification_result" in data


def test_api_agent_fail_and_restore(client):
    """Verify POST /api/agents/{agent_id}/fail and restore flow."""
    # Fail agent A05
    res_fail = client.post("/api/agents/A05/fail")
    assert res_fail.status_code == 200
    fail_data = res_fail.json()
    assert fail_data["agent"]["status"] == "FAILED"
    assert "recovery_summary" in fail_data

    # Restore agent A05
    res_restore = client.post("/api/agents/A05/restore")
    assert res_restore.status_code == 200
    restore_data = res_restore.json()
    assert restore_data["agent"]["status"] == "ACTIVE"


def test_api_network_topology(client):
    """Verify GET /api/network returns valid nodes and edges."""
    res = client.get("/api/network")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert data["active_links_count"] >= 0


def test_api_fire_scenario(client):
    """Verify POST /api/events/fire triggers wildfire simulation and consensus."""
    payload = {"center_agent_id": "A07", "radius": 26.0}
    res = client.post("/api/events/fire", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["incident_type"] == "FIRE"
    assert len(data["affected_agents"]) >= 1
    assert "consensus" in data
    assert data["consensus"]["status"] in ["CONFIRMED", "INCONCLUSIVE"]


def test_api_history_and_persistence(client):
    """Verify GET /api/history returns persisted system events."""
    res = client.get("/api/history")
    assert res.status_code == 200
    history = res.json()
    assert len(history) > 0
    assert "category" in history[0]
    assert "description" in history[0]


def test_api_analytics(client):
    """Verify GET /api/analytics returns timeseries and breakdown stats."""
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "telemetry_timeseries" in data
    assert "anomaly_distribution" in data
    assert "incidents_by_type" in data
    assert "agent_status_breakdown" in data
