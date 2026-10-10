"""
communication.py

Agent-to-Agent Simulated Communication Module.
Allows autonomous environmental nodes to broadcast alerts, request evidence,
and transmit diagnostic payloads to active neighbors.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid


class Message:
    """
    Standard message payload exchanged between environmental monitoring agents.
    """

    def __init__(
        self,
        sender_id: str,
        receiver_id: str,
        message_type: str,  # "ALERT", "EVIDENCE_REQUEST", "EVIDENCE_RESPONSE", "HEARTBEAT"
        event_type: str = "NORMAL",
        evidence: Optional[Dict[str, Any]] = None,
        severity: str = "NORMAL"
    ):
        self.message_id = str(uuid.uuid4())[:8]
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.message_type = message_type
        self.event_type = event_type
        self.severity = severity
        self.evidence = evidence or {}
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "message_id": self.message_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "message_type": self.message_type,
            "event_type": self.event_type,
            "severity": self.severity,
            "evidence": self.evidence,
            "timestamp": self.timestamp
        }


class CommunicationBus:
    """
    Simulated localized communication bus for peer-to-peer message dispatching.
    Note: This is an in-memory simulation of decentralized wireless telemetry.
    """

    def __init__(self):
        self.message_history: List[Dict[str, Any]] = []

    def broadcast_alert(
        self,
        sender_agent,
        neighbor_agents: List[Any],
        event_type: str,
        severity: str,
        evidence: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Sends an ALERT message from a detecting agent to all of its active neighbors.
        Failed senders or failed receivers are strictly blocked from transmitting/receiving.
        """
        if sender_agent.status == "FAILED":
            return []

        dispatched_messages: List[Dict[str, Any]] = []

        for neighbor in neighbor_agents:
            if neighbor.status != "ACTIVE":
                continue  # Failed nodes do not receive or process alerts

            msg = Message(
                sender_id=sender_agent.agent_id,
                receiver_id=neighbor.agent_id,
                message_type="ALERT",
                event_type=event_type,
                severity=severity,
                evidence=evidence
            )

            msg_dict = msg.to_dict()
            # Agent receives message into its local inbox
            neighbor.receive_message(msg_dict)

            # Store in communication bus history
            self.message_history.append(msg_dict)
            dispatched_messages.append(msg_dict)

        # Cap memory of recent messages to 200
        if len(self.message_history) > 200:
            self.message_history = self.message_history[-200:]

        return dispatched_messages

    def get_recent_messages(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(reversed(self.message_history[-limit:]))
