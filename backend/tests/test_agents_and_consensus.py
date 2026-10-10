"""
test_agents_and_consensus.py

Tests Agent lifecycle, telemetry updates, alert messaging,
and neighbor-based local consensus voting rules.
"""

import pytest
from app.core.agent import Agent
from app.core.communication import CommunicationBus, Message
from app.core.consensus import LocalConsensusEngine


def test_agent_creation_and_telemetry():
    """Verify agent initialization and reading retrieval."""
    agent = Agent(agent_id="A99", x=10.0, y=20.0, temperature=25.0, battery=100.0)
    assert agent.agent_id == "A99"
    assert agent.x == 10.0
    assert agent.status == "ACTIVE"

    readings = agent.get_readings()
    assert readings["temperature"] == 25.0
    assert "humidity" in readings
    assert "smoke" in readings


def test_agent_sensor_update_and_move():
    """Verify sensor modification and movement."""
    agent = Agent(agent_id="A99", x=10.0, y=20.0)
    agent.update_readings({"temperature": 32.5, "battery": 90.0})
    agent.update_position(15.0, 25.0)

    assert agent.temperature == 32.5
    assert agent.battery == 90.0
    assert agent.x == 15.0
    assert agent.y == 25.0


def test_agent_communication_alert_dispatch():
    """Verify communication bus dispatches messages between active neighbors."""
    bus = CommunicationBus()
    agent_src = Agent(agent_id="A01", x=10.0, y=10.0, status="ACTIVE")
    agent_nbr1 = Agent(agent_id="A02", x=15.0, y=10.0, status="ACTIVE")
    agent_nbr2 = Agent(agent_id="A03", x=12.0, y=14.0, status="FAILED") # Failed node

    msgs = bus.broadcast_alert(
        sender_agent=agent_src,
        neighbor_agents=[agent_nbr1, agent_nbr2],
        event_type="FIRE",
        severity="CRITICAL",
        evidence=agent_src.get_readings()
    )

    # Only active neighbor receives message
    assert len(msgs) == 1
    assert msgs[0]["receiver_id"] == "A02"
    assert len(agent_nbr1.received_messages) == 1
    assert len(agent_nbr2.received_messages) == 0


def test_local_consensus_confirmed():
    """Verify quorum and agreement confirms candidate incident."""
    engine = LocalConsensusEngine()

    deciding_agent = Agent(agent_id="A01", x=10.0, y=10.0)
    deciding_agent.latest_event_classification = {"event_type": "FIRE"}

    n1 = Agent(agent_id="A02", x=12.0, y=10.0)
    n1.latest_event_classification = {"event_type": "FIRE"}

    n2 = Agent(agent_id="A03", x=14.0, y=10.0)
    n2.latest_event_classification = {"event_type": "FIRE"}

    n3 = Agent(agent_id="A04", x=16.0, y=10.0)
    n3.latest_event_classification = {"event_type": "NORMAL"}

    res = engine.evaluate_consensus(deciding_agent, [n1, n2, n3], "FIRE")

    # 3 supporting (A01, A02, A03) out of 4 total -> 75% >= 60%
    assert res["status"] == "CONFIRMED"
    assert res["supporting_count"] == 3
    assert res["disagreeing_count"] == 1
    assert res["consensus_strength"] == 75.0


def test_local_consensus_inconclusive_due_to_conflicting_evidence():
    """Verify conflicting evidence results in INCONCLUSIVE status."""
    engine = LocalConsensusEngine()

    deciding_agent = Agent(agent_id="A01", x=10.0, y=10.0)
    deciding_agent.latest_event_classification = {"event_type": "FIRE"}

    n1 = Agent(agent_id="A02", x=12.0, y=10.0)
    n1.latest_event_classification = {"event_type": "NORMAL"}

    n2 = Agent(agent_id="A03", x=14.0, y=10.0)
    n2.latest_event_classification = {"event_type": "NORMAL"}

    n3 = Agent(agent_id="A04", x=16.0, y=10.0)
    n3.latest_event_classification = {"event_type": "NORMAL"}

    res = engine.evaluate_consensus(deciding_agent, [n1, n2, n3], "FIRE")

    # Only 1 supporting out of 4 (25%) -> Inconclusive
    assert res["status"] == "INCONCLUSIVE"
    assert res["supporting_count"] == 1
    assert res["disagreeing_count"] == 3


def test_local_consensus_insufficient_evidence():
    """Verify single isolated agent produces INCONCLUSIVE decision."""
    engine = LocalConsensusEngine()

    isolated_agent = Agent(agent_id="A01", x=10.0, y=10.0)
    isolated_agent.latest_event_classification = {"event_type": "FIRE"}

    # No active neighbors
    res = engine.evaluate_consensus(isolated_agent, [], "FIRE")
    assert res["status"] == "INCONCLUSIVE"
    assert "Insufficient active neighbors" in res["details"]
