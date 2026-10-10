"""
test_network_and_recovery.py

Tests NetworkX topology management, proximity rule link construction,
node failure handling, edge removal, self-organization reorganization, and restoration.
"""

import pytest
from app.core.agent import Agent
from app.core.network_manager import NetworkManager


def test_network_build_and_proximity_rule():
    """Verify edges are formed strictly within communication range (28.0 units)."""
    nm = NetworkManager(comm_range=28.0)

    # Agents within 20 units
    a1 = Agent("A01", x=10.0, y=10.0)
    a2 = Agent("A02", x=25.0, y=10.0)  # dist = 15.0 <= 28.0 -> connected
    # Agent outside 28 units
    a3 = Agent("A03", x=60.0, y=10.0)  # dist from a1 = 50.0 > 28.0 -> disconnected

    nm.build_network([a1, a2, a3])
    topology = nm.get_topology()

    assert topology["total_nodes"] == 3
    assert topology["active_links_count"] == 1
    assert nm.graph.has_edge("A01", "A02") is True
    assert nm.graph.has_edge("A01", "A3") is False


def test_node_failure_removes_edges():
    """Verify that failing an agent removes all incident links."""
    nm = NetworkManager(comm_range=28.0)

    a1 = Agent("A01", x=10.0, y=10.0)
    a2 = Agent("A02", x=20.0, y=10.0)
    a3 = Agent("A03", x=15.0, y=20.0)

    agents = [a1, a2, a3]
    nm.build_network(agents)
    assert nm.graph.number_of_edges() == 3

    # Fail a2
    a2.fail()
    res = nm.remove_failed_agent("A02", agents)

    # A02 had 2 incident edges: (A01, A02) and (A02, A03)
    assert len(res["removed_links"]) == 2
    assert nm.graph.has_edge("A01", "A02") is False
    assert nm.graph.has_edge("A03", "A02") is False
    # Link between A01 and A03 remains intact
    assert nm.graph.has_edge("A01", "A03") is True


def test_network_self_organization_reorganization():
    """Verify adaptive reorganization restores connectivity between sub-components."""
    nm = NetworkManager(comm_range=25.0)

    # Bridge setup: A01 <-> A02(bridge) <-> A03
    # A01 at (10, 10), A02 at (30, 10), A03 at (50, 10)
    # Dist(A01, A02) = 20, Dist(A02, A03) = 20. Dist(A01, A03) = 40 (outside 25, within adaptive 38)
    # If A02 fails, A01 and A03 would be partitioned.
    # Reorganize checks if adaptive relay can reconnect or measures recovery.
    a1 = Agent("A01", x=10.0, y=10.0)
    a2 = Agent("A02", x=25.0, y=10.0)
    a3 = Agent("A03", x=40.0, y=10.0) # dist from a1 = 30 <= adaptive range 38.0

    agents = [a1, a2, a3]
    nm.build_network(agents)

    # Fail bridge node A02
    a2.fail()
    nm.remove_failed_agent("A02", agents)

    recovery = nm.reorganize_network(agents, failed_agent_id="A02")

    assert recovery["failed_agent"] == "A02"
    assert recovery["recovery_duration_ms"] >= 0.0
    assert recovery["active_agent_count"] == 2
    # Adaptive link between A01 and A03 created
    assert len(recovery["added_links"]) >= 1
    assert recovery["is_connected"] is True


def test_agent_restoration_reconnects_links():
    """Verify restoring a failed agent brings it back into active topology."""
    nm = NetworkManager(comm_range=28.0)

    a1 = Agent("A01", x=10.0, y=10.0)
    a2 = Agent("A02", x=20.0, y=10.0)

    agents = [a1, a2]
    nm.build_network(agents)

    a2.fail()
    nm.remove_failed_agent("A02", agents)
    assert nm.graph.number_of_edges() == 0

    # Restore A02
    a2.restore()
    restore_res = nm.restore_agent("A02", agents)

    assert len(restore_res["added_links"]) == 1
    assert nm.graph.has_edge("A01", "A02") is True
    assert a2.status == "ACTIVE"
