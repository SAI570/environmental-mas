"""
consensus.py

Neighbor-Based Local Consensus Engine.
Evaluates multi-agent agreement regarding detected environmental events.
Ensures decentralized verification where no single node's anomaly report
is accepted without corroborating evidence from its local neighborhood.
"""

from typing import Dict, Any, List


class LocalConsensusEngine:
    """
    Implements a documented voting and evidence threshold rule:
    - Quorum requirement: at least 2 active nodes (deciding node + at least 1 neighbor,
      or >= 3 total nodes if neighborhood is large).
    - Threshold agreement: >= 60% of participating nodes must agree on the event type.
    - If total participating active nodes < 2, or support < 60%, the decision is INCONCLUSIVE.
    """

    SUPPORT_RATIO_THRESHOLD = 0.60  # 60% agreement required
    MINIMUM_PARTICIPATING_NODES = 2 # At least 2 active nodes must vote

    def evaluate_consensus(
        self,
        deciding_agent,
        neighbor_agents: List[Any],
        candidate_event: str
    ) -> Dict[str, Any]:
        """
        Calculates local consensus on `candidate_event` (e.g., "FIRE", "POLLUTION", "EXTREME_HEAT").

        Returns:
            {
                "deciding_agent_id": str,
                "consulted_neighbors": list[str],
                "supporting_agents": list[str],
                "disagreeing_agents": list[str],
                "consensus_event": str,
                "status": "CONFIRMED" | "INCONCLUSIVE" | "REJECTED",
                "consensus_strength": float, # Percentage (0.0 to 100.0%)
                "supporting_count": int,
                "disagreeing_count": int,
                "total_votes": int,
                "details": str
            }
        """
        # If deciding agent is failed, cannot participate or decide
        if deciding_agent.status == "FAILED":
            return {
                "deciding_agent_id": deciding_agent.agent_id,
                "consulted_neighbors": [],
                "supporting_agents": [],
                "disagreeing_agents": [],
                "consensus_event": candidate_event,
                "status": "REJECTED",
                "consensus_strength": 0.0,
                "supporting_count": 0,
                "disagreeing_count": 0,
                "total_votes": 0,
                "details": "Deciding agent is FAILED / OFFLINE."
            }

        # Filter active neighbors only
        active_neighbors = [n for n in neighbor_agents if n.status == "ACTIVE"]
        consulted_neighbors = [n.agent_id for n in active_neighbors]

        supporting_agents: List[str] = []
        disagreeing_agents: List[str] = []

        # 1. Deciding agent's own vote
        deciding_event = (
            deciding_agent.latest_event_classification.get("event_type", "NORMAL")
            if deciding_agent.latest_event_classification else "NORMAL"
        )

        if deciding_event == candidate_event:
            supporting_agents.append(deciding_agent.agent_id)
        else:
            disagreeing_agents.append(deciding_agent.agent_id)

        # 2. Collect votes from active neighbors
        for neighbor in active_neighbors:
            n_event = (
                neighbor.latest_event_classification.get("event_type", "NORMAL")
                if neighbor.latest_event_classification else "NORMAL"
            )

            if n_event == candidate_event:
                supporting_agents.append(neighbor.agent_id)
            else:
                disagreeing_agents.append(neighbor.agent_id)

        total_votes = len(supporting_agents) + len(disagreeing_agents)
        supporting_count = len(supporting_agents)
        disagreeing_count = len(disagreeing_agents)

        if total_votes == 0:
            support_ratio = 0.0
            consensus_strength = 0.0
        else:
            support_ratio = supporting_count / total_votes
            consensus_strength = round(support_ratio * 100.0, 1)

        # 3. Apply Decision Rule
        # Case A: Insufficient participating nodes (isolated agent or dead neighborhood)
        if total_votes < self.MINIMUM_PARTICIPATING_NODES:
            status = "INCONCLUSIVE"
            details = (
                f"Insufficient active neighbors (only {total_votes} node participating). "
                f"Single-node anomaly cannot be confirmed without peer corroboration."
            )
        # Case B: Strong support satisfying threshold (>= 60% agreement)
        elif support_ratio >= self.SUPPORT_RATIO_THRESHOLD and supporting_count >= 2:
            status = "CONFIRMED"
            details = (
                f"Local consensus confirmed: {supporting_count}/{total_votes} nodes ({consensus_strength}%) "
                f"agree on {candidate_event} condition."
            )
        # Case C: Conflicting or insufficient votes
        elif supporting_count > 0 and support_ratio < self.SUPPORT_RATIO_THRESHOLD:
            status = "INCONCLUSIVE"
            details = (
                f"Conflicting sensor evidence: {supporting_count} supported vs {disagreeing_count} disagreed "
                f"({consensus_strength}% < {int(self.SUPPORT_RATIO_THRESHOLD * 100)}% threshold). Decision inconclusive."
            )
        else:
            status = "REJECTED"
            details = f"Candidate event {candidate_event} rejected by local neighborhood."

        return {
            "deciding_agent_id": deciding_agent.agent_id,
            "consulted_neighbors": consulted_neighbors,
            "supporting_agents": supporting_agents,
            "disagreeing_agents": disagreeing_agents,
            "consensus_event": candidate_event,
            "status": status,
            "consensus_strength": consensus_strength,
            "supporting_count": supporting_count,
            "disagreeing_count": disagreeing_count,
            "total_votes": total_votes,
            "details": details
        }
