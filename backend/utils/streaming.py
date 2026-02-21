"""
SSE (Server-Sent Events) formatting helpers.

The SSE format is:
    data: <json payload>\n\n

Each event is a single JSON object on the data line.
"""
import json
from typing import Any


def format_sse(event: dict[str, Any]) -> str:
    """
    Serialize an event dict to the SSE wire format.
    Returns a string like:  data: {...}\n\n
    """
    return f"data: {json.dumps(event)}\n\n"


def sse_error(message: str) -> str:
    """Convenience: format an error event."""
    return format_sse({"type": "error", "message": message})


def sse_heartbeat() -> str:
    """Heartbeat comment to keep the connection alive during long pauses."""
    return ": heartbeat\n\n"
