"""
NeuroOps Gateway API — Platform Intelligence Layer
Derives alerts, detects anomalies, and computes cross-service correlations
from continuously-updated health state.

All analysis is in-memory using a rolling window — no external storage required.
"""

import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("gateway-api.intelligence")

# ---------------------------------------------------------------------------
# Rolling health history (30 samples × 10s poll = ~5-minute window)
# ---------------------------------------------------------------------------

_health_history: dict[str, deque] = {}
HISTORY_SIZE = 30


def record_health_snapshot(service_status: dict[str, dict]) -> None:
    """Record a health snapshot after each background poll cycle."""
    ts = datetime.now(timezone.utc).isoformat()
    for name, info in service_status.items():
        if name not in _health_history:
            _health_history[name] = deque(maxlen=HISTORY_SIZE)
        _health_history[name].append({
            "ts": ts,
            "score": info.get("health_score", 0),
            "status": info.get("status", "unknown"),
        })


# ---------------------------------------------------------------------------
# Alerts — derived from current health state
# ---------------------------------------------------------------------------

def derive_alerts(service_status: dict[str, dict]) -> list[dict[str, Any]]:
    """Derive platform-level alerts from current service health state."""
    alerts: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()

    offline  = [n for n, v in service_status.items() if v.get("status") == "offline"]
    degraded = [
        n for n, v in service_status.items()
        if v.get("status") not in ("offline", "unknown") and v.get("health_score", 100) < 60
    ]

    if len(offline) > 3:
        alerts.append({
            "id": "critical_mass_offline",
            "level": "critical",
            "title": "Multiple services offline",
            "message": f"{len(offline)} services unreachable: {', '.join(offline[:3])}{'...' if len(offline) > 3 else ''}",
            "time": now,
            "category": "availability",
        })
    else:
        for svc in offline:
            alerts.append({
                "id": f"offline_{svc}",
                "level": "warning",
                "title": f"{_fmt(svc)} unreachable",
                "message": f"Service '{svc}' is not responding to health checks",
                "time": now,
                "category": "availability",
            })

    for svc in degraded:
        score = service_status[svc].get("health_score", 0)
        alerts.append({
            "id": f"degraded_{svc}",
            "level": "warning",
            "title": f"{_fmt(svc)} degraded",
            "message": f"Health score at {score}% — below acceptable threshold (60%)",
            "time": now,
            "category": "performance",
        })

    if not alerts:
        alerts.append({
            "id": "all_nominal",
            "level": "info",
            "title": "All systems nominal",
            "message": "No active service alerts detected",
            "time": now,
            "category": "status",
        })

    return alerts


# ---------------------------------------------------------------------------
# Anomaly detection — trends over rolling history window
# ---------------------------------------------------------------------------

def detect_anomalies(service_status: dict[str, dict]) -> list[dict[str, Any]]:
    """Detect anomalies by comparing current health against recent history."""
    anomalies: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()

    for name, history in _health_history.items():
        if len(history) < 3:
            continue

        current      = service_status.get(name, {}).get("health_score", 0)
        recent_list  = list(history)
        recent5      = [h["score"] for h in recent_list[-5:]]
        avg_recent   = sum(recent5) / len(recent5)

        # Sudden drop: was healthy, now critical
        if avg_recent > 75 and current < 40:
            anomalies.append({
                "id": f"sudden_drop_{name}",
                "type": "sudden_degradation",
                "service": name,
                "description": f"{_fmt(name)} dropped from ~{avg_recent:.0f}% to {current}%",
                "severity": "high",
                "detected_at": now,
            })
        # Gradual decline: older average much higher than current
        elif len(recent_list) >= 8:
            older3     = [h["score"] for h in recent_list[:3]]
            older_avg  = sum(older3) / len(older3)
            if older_avg - current > 30 and current < 60:
                anomalies.append({
                    "id": f"gradual_decline_{name}",
                    "type": "gradual_decline",
                    "service": name,
                    "description": f"{_fmt(name)} shows gradual decline: {older_avg:.0f}% → {current}%",
                    "severity": "medium",
                    "detected_at": now,
                })

    return anomalies


# ---------------------------------------------------------------------------
# Cross-service correlations
# ---------------------------------------------------------------------------

def compute_correlations(service_status: dict[str, dict]) -> list[dict[str, Any]]:
    """Identify cross-service degradation patterns and generate insight notes."""
    correlations: list[dict] = []

    offline  = {n for n, v in service_status.items() if v.get("status") == "offline"}
    degraded = {n for n, v in service_status.items()
                if v.get("status") not in ("offline", "unknown") and v.get("health_score", 100) < 70}
    affected = offline | degraded

    # Operations cluster
    ops_cluster = {"autopilot", "control_room", "live_control", "incident_replay"}
    ops_affected = ops_cluster & affected
    if len(ops_affected) >= 2:
        correlations.append({
            "id": "ops_cluster_degraded",
            "type": "cluster_degradation",
            "services": sorted(ops_affected),
            "insight": (
                f"Operations cluster partially affected ({', '.join(sorted(ops_affected))}). "
                "Multiple ops modules degrading together often indicates a shared infrastructure issue."
            ),
            "recommendation": "Check PostgreSQL connectivity and inter-service network routes.",
        })

    # AI/ML cluster
    ai_cluster = {"career_agent", "insight_engine", "warehouse_api", "warehouse_copilot"}
    ai_affected = ai_cluster & affected
    if len(ai_affected) >= 2:
        correlations.append({
            "id": "ai_cluster_degraded",
            "type": "cluster_degradation",
            "services": sorted(ai_affected),
            "insight": (
                f"AI services cluster affected ({', '.join(sorted(ai_affected))}). "
                "Concurrent degradation may indicate LLM provider issues or memory pressure."
            ),
            "recommendation": "Check LLM_PROVIDER config and container memory limits.",
        })

    # Gateway-only degradation
    if not affected - {"gateway"}:
        correlations.append({
            "id": "all_healthy_correlation",
            "type": "nominal",
            "services": [],
            "insight": "All service clusters operating normally. No cross-service degradation detected.",
            "recommendation": "No action required.",
        })

    return correlations


# ---------------------------------------------------------------------------
# Module activity summary
# ---------------------------------------------------------------------------

_MODULE_META: dict[str, dict] = {
    "autopilot":         {"label": "AI Autopilot",       "role": "Autonomous operations agent"},
    "control_room":      {"label": "Control Room",        "role": "Incident intelligence hub"},
    "live_control":      {"label": "Live Control",        "role": "Real-time ops dashboard"},
    "incident_replay":   {"label": "Incident Replay",     "role": "Post-incident analysis"},
    "career_agent":      {"label": "Career Agent",        "role": "AI job discovery"},
    "insight_engine":    {"label": "Insight Engine",      "role": "Business intelligence"},
    "warehouse_api":     {"label": "Warehouse API",       "role": "Warehouse backend service"},
    "warehouse_copilot": {"label": "Warehouse Copilot",   "role": "Warehouse AI frontend"},
}


def module_activity_summary(service_status: dict[str, dict]) -> list[dict[str, Any]]:
    """Generate per-module activity summaries enriched with metadata."""
    summary = []
    for key, meta in _MODULE_META.items():
        sd = service_status.get(key, {})
        score   = sd.get("health_score", 0)
        status  = sd.get("status", "unknown")
        history = list(_health_history.get(key, []))

        # Simple trend: compare first and last 3 samples if enough data
        trend = "stable"
        if len(history) >= 6:
            early = sum(h["score"] for h in history[:3]) / 3
            late  = sum(h["score"] for h in history[-3:]) / 3
            if late - early > 10:
                trend = "improving"
            elif early - late > 10:
                trend = "declining"

        summary.append({
            "key":          key,
            "label":        meta["label"],
            "role":         meta["role"],
            "status":       status,
            "health_score": score,
            "response_ms":  sd.get("response_ms"),
            "last_checked": sd.get("last_checked"),
            "trend":        trend,
        })
    return summary


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fmt(name: str) -> str:
    return name.replace("_", " ").title()
