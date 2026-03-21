"""
NeuroOps Unified Platform — Gateway API  v2.0
Central health aggregation, intelligence layer, and auth for all platform modules.

Phase 2 additions:
  - /auth/token + /auth/verify  (lightweight JWT auth)
  - /platform/alerts            (derived from health state)
  - /platform/anomalies         (rolling-window trend analysis)
  - /platform/intelligence      (combined rich summary for dashboard)
  - /platform/correlations      (cross-service pattern detection)
  - /metrics                    (lightweight JSON metrics endpoint)
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app import intelligence

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gateway-api")

# ---------------------------------------------------------------------------
# Service registry
# ---------------------------------------------------------------------------

SERVICE_HEALTH_ENDPOINTS: dict[str, str] = {
    "autopilot":         "http://autopilot-api:8000/health",
    "control_room":      "http://control-room-api:8000/api/health",
    "live_control":      "http://live-control-api:8000/health",
    "incident_replay":   "http://incident-replay-api:8000/health",
    "warehouse_api":     "http://warehouse-api:8000/health",
    "career_agent":      "http://career-agent:8501/healthz",
    "insight_engine":    "http://insight-engine:8501/healthz",
    "warehouse_copilot": "http://warehouse-copilot:8501/healthz",
}

# Services that expose a numeric health_score in their JSON response
SCORED_SERVICES: set[str] = {"autopilot"}

# Streamlit services whose /healthz may return non-JSON — just check HTTP status
STREAMLIT_SERVICES: set[str] = {"career_agent", "insight_engine", "warehouse_copilot"}

# Event aggregation endpoints
EVENT_ENDPOINTS: dict[str, str] = {
    "autopilot":    "http://autopilot-api:8000/api/events",
    "control_room": "http://control-room-api:8000/api/events",
    "live_control": "http://live-control-api:8000/api/events",
    "incident_replay": "http://incident-replay-api:8000/api/incidents",
}

# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------

_service_status: dict[str, dict[str, Any]] = {
    name: {
        "status": "unknown",
        "health_score": 0,
        "last_checked": None,
        "response_ms": None,
    }
    for name in SERVICE_HEALTH_ENDPOINTS
}

_platform_start_time: datetime = datetime.now(timezone.utc)
_polling_task: asyncio.Task | None = None
_poll_count: int = 0

# ---------------------------------------------------------------------------
# Health probe helpers
# ---------------------------------------------------------------------------

async def _probe_service(
    client: httpx.AsyncClient,
    name: str,
    url: str,
) -> dict[str, Any]:
    """Probe a single service health endpoint and return its status dict."""
    start = asyncio.get_event_loop().time()
    try:
        response = await client.get(url, timeout=3.0)
        elapsed_ms = round((asyncio.get_event_loop().time() - start) * 1000, 1)

        if response.status_code >= 400:
            return {
                "status": "offline",
                "health_score": 0,
                "last_checked": datetime.now(timezone.utc).isoformat(),
                "response_ms": elapsed_ms,
            }

        health_score = 100  # default for healthy service without numeric score

        if name in SCORED_SERVICES:
            try:
                data = response.json()
                if isinstance(data, dict):
                    raw = data.get("health_score") or data.get("healthScore") or data.get("score")
                    if raw is not None:
                        health_score = int(float(raw))
            except Exception:
                pass  # JSON parse failed — keep health_score = 100

        return {
            "status": "healthy",
            "health_score": min(max(health_score, 0), 100),
            "last_checked": datetime.now(timezone.utc).isoformat(),
            "response_ms": elapsed_ms,
        }

    except Exception as exc:
        elapsed_ms = round((asyncio.get_event_loop().time() - start) * 1000, 1)
        logger.debug("Health probe failed for %s (%s): %s", name, url, exc)
        return {
            "status": "offline",
            "health_score": 0,
            "last_checked": datetime.now(timezone.utc).isoformat(),
            "response_ms": elapsed_ms,
        }


async def _poll_all_services() -> None:
    """Poll every registered service concurrently and update _service_status."""
    global _poll_count
    async with httpx.AsyncClient() as client:
        tasks = {
            name: asyncio.create_task(_probe_service(client, name, url))
            for name, url in SERVICE_HEALTH_ENDPOINTS.items()
        }
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        for name, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                _service_status[name] = {
                    "status": "offline",
                    "health_score": 0,
                    "last_checked": datetime.now(timezone.utc).isoformat(),
                    "response_ms": None,
                }
            else:
                _service_status[name] = result

    # Record snapshot for intelligence layer after each poll cycle
    intelligence.record_health_snapshot(_service_status)
    _poll_count += 1


async def _background_poller() -> None:
    """Continuously poll all services every 10 seconds."""
    while True:
        try:
            await _poll_all_services()
        except Exception as exc:
            logger.warning("Background poll cycle failed: %s", exc)
        await asyncio.sleep(10)


# ---------------------------------------------------------------------------
# Platform metrics helpers
# ---------------------------------------------------------------------------

def _compute_platform_health() -> dict[str, Any]:
    scores = [v["health_score"] for v in _service_status.values()]
    platform_health = round(sum(scores) / len(scores)) if scores else 0

    if platform_health < 40:
        overall_status = "critical"
    elif platform_health < 70:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    healthy_count  = sum(1 for v in _service_status.values() if v["status"] == "healthy")
    offline_count  = sum(1 for v in _service_status.values() if v["status"] == "offline")
    degraded_count = len(_service_status) - healthy_count - offline_count

    return {
        "platform_health": platform_health,
        "overall_status":  overall_status,
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        "services":        dict(_service_status),
        "summary": {
            "total_services": len(_service_status),
            "healthy":  healthy_count,
            "degraded": degraded_count,
            "offline":  offline_count,
        },
    }


def _uptime_seconds() -> float:
    return (datetime.now(timezone.utc) - _platform_start_time).total_seconds()


def _format_uptime(seconds: float) -> str:
    days, remainder = divmod(int(seconds), 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, secs = divmod(remainder, 60)
    parts = []
    if days:    parts.append(f"{days}d")
    if hours:   parts.append(f"{hours}h")
    if minutes: parts.append(f"{minutes}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _polling_task
    logger.info("Gateway API v2.0 starting — launching background health poller")
    asyncio.create_task(_poll_all_services())
    _polling_task = asyncio.create_task(_background_poller())
    yield
    logger.info("Gateway API shutting down — cancelling poller")
    if _polling_task and not _polling_task.done():
        _polling_task.cancel()
        try:
            await _polling_task
        except asyncio.CancelledError:
            pass


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="NeuroOps Gateway API",
    description=(
        "Central health aggregation, platform intelligence, and auth layer "
        "for the NeuroOps Unified Platform. Phase 2."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register sub-routers
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Routes — core
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Gateway"])
async def gateway_health():
    """Gateway own health check — always returns 200 while the process is alive."""
    return {
        "status":         "healthy",
        "service":        "gateway-api",
        "version":        "2.0.0",
        "timestamp":      datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(_uptime_seconds(), 1),
        "poll_cycles":    _poll_count,
    }


@app.get("/platform/status", tags=["Platform"])
async def platform_status():
    """
    Aggregated health status for every registered service.

    platform_health is the mean of all service health_scores (0–100).
    overall_status: 'critical' (<40), 'degraded' (<70), or 'healthy' (>=70).
    """
    return _compute_platform_health()


@app.get("/platform/summary", tags=["Platform"])
async def platform_summary():
    """Richer summary including platform metadata, uptime, and top-level metrics."""
    health_data = _compute_platform_health()
    uptime_secs = _uptime_seconds()

    response_times = [
        v["response_ms"]
        for v in _service_status.values()
        if v.get("response_ms") is not None
    ]
    avg_response_ms = round(sum(response_times) / len(response_times), 1) if response_times else None

    return {
        "platform": {
            "name":           "NeuroOps Unified Platform",
            "version":        "2.0.0",
            "environment":    "production",
            "started_at":     _platform_start_time.isoformat(),
            "uptime_seconds": round(uptime_secs, 1),
            "uptime_human":   _format_uptime(uptime_secs),
        },
        "health": {
            "platform_health": health_data["platform_health"],
            "overall_status":  health_data["overall_status"],
            "timestamp":       health_data["timestamp"],
        },
        "services": health_data["services"],
        "summary":  health_data["summary"],
        "metrics": {
            "avg_service_response_ms": avg_response_ms,
            "services_monitored":      len(_service_status),
            "poll_interval_seconds":   10,
            "poll_cycles_completed":   _poll_count,
        },
    }


@app.get("/platform/events", tags=["Platform"])
async def platform_events():
    """
    Fetches recent events from available service event APIs, merges them,
    and returns them labelled by source service.
    """
    merged_events: list[dict[str, Any]] = []
    errors: dict[str, str] = {}

    async with httpx.AsyncClient() as client:
        fetch_tasks = {
            name: asyncio.create_task(client.get(url, timeout=5.0))
            for name, url in EVENT_ENDPOINTS.items()
        }
        results = await asyncio.gather(*fetch_tasks.values(), return_exceptions=True)

    for name, result in zip(fetch_tasks.keys(), results):
        if isinstance(result, Exception):
            errors[name] = str(result)
            continue
        try:
            if result.status_code >= 400:
                errors[name] = f"HTTP {result.status_code}"
                continue
            data = result.json()
            if isinstance(data, list):
                events = data
            elif isinstance(data, dict):
                events = (
                    data.get("events") or data.get("data")
                    or data.get("items") or data.get("incidents") or []
                )
            else:
                events = []

            for event in events:
                if isinstance(event, dict):
                    event["_source"] = name
                    merged_events.append(event)
        except Exception as exc:
            errors[name] = f"Parse error: {exc}"

    def _sort_key(e: dict) -> str:
        return (
            e.get("timestamp") or e.get("created_at")
            or e.get("time") or e.get("started_at") or ""
        )

    merged_events.sort(key=_sort_key, reverse=True)

    return {
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "total_events": len(merged_events),
        "events":       merged_events[:50],  # cap at 50 for dashboard
        "sources":      list(EVENT_ENDPOINTS.keys()),
        "errors":       errors if errors else None,
    }


# ---------------------------------------------------------------------------
# Routes — intelligence layer (Phase 2)
# ---------------------------------------------------------------------------

@app.get("/platform/alerts", tags=["Intelligence"])
async def platform_alerts():
    """
    Derived platform alerts based on current service health state.
    Returns a list of active alerts ranked by severity.
    """
    alerts = intelligence.derive_alerts(_service_status)
    critical = sum(1 for a in alerts if a["level"] == "critical")
    warning  = sum(1 for a in alerts if a["level"] == "warning")
    return {
        "timestamp":     datetime.now(timezone.utc).isoformat(),
        "total":         len(alerts),
        "critical":      critical,
        "warning":       warning,
        "alerts":        alerts,
    }


@app.get("/platform/anomalies", tags=["Intelligence"])
async def platform_anomalies():
    """
    Anomaly detection based on rolling health history.
    Detects sudden drops and gradual declines across all services.
    """
    anomalies = intelligence.detect_anomalies(_service_status)
    return {
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        "total_anomalies": len(anomalies),
        "anomalies":       anomalies,
        "history_window":  f"{intelligence.HISTORY_SIZE} samples (~{intelligence.HISTORY_SIZE * 10}s)",
    }


@app.get("/platform/correlations", tags=["Intelligence"])
async def platform_correlations():
    """
    Cross-service correlation analysis.
    Identifies cluster-level degradation patterns and provides recommendations.
    """
    correlations = intelligence.compute_correlations(_service_status)
    return {
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "correlations": correlations,
        "clusters": {
            "operations": ["autopilot", "control_room", "live_control", "incident_replay"],
            "ai_services": ["career_agent", "insight_engine", "warehouse_api", "warehouse_copilot"],
        },
    }


@app.get("/platform/intelligence", tags=["Intelligence"])
async def platform_intelligence():
    """
    Combined intelligence summary for the unified dashboard.
    Aggregates health, alerts, anomalies, correlations, and module activity
    into a single payload — optimised to minimise frontend round-trips.
    """
    health_data  = _compute_platform_health()
    uptime_secs  = _uptime_seconds()
    alerts       = intelligence.derive_alerts(_service_status)
    anomalies    = intelligence.detect_anomalies(_service_status)
    correlations = intelligence.compute_correlations(_service_status)
    modules      = intelligence.module_activity_summary(_service_status)

    response_times = [
        v["response_ms"] for v in _service_status.values()
        if v.get("response_ms") is not None
    ]
    avg_rt = round(sum(response_times) / len(response_times), 1) if response_times else None

    return {
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "platform": {
            "name":         "NeuroOps Unified Platform",
            "version":      "2.0.0",
            "uptime_human": _format_uptime(uptime_secs),
            "uptime_seconds": round(uptime_secs, 1),
        },
        "health": {
            "platform_health":      health_data["platform_health"],
            "overall_status":       health_data["overall_status"],
            "total_services":       health_data["summary"]["total_services"],
            "healthy_services":     health_data["summary"]["healthy"],
            "degraded_services":    health_data["summary"]["degraded"],
            "offline_services":     health_data["summary"]["offline"],
            "avg_response_ms":      avg_rt,
        },
        "alerts": {
            "total":    len(alerts),
            "critical": sum(1 for a in alerts if a["level"] == "critical"),
            "warning":  sum(1 for a in alerts if a["level"] == "warning"),
            "items":    alerts[:8],  # top 8 for dashboard card
        },
        "anomalies": {
            "total": len(anomalies),
            "items": anomalies[:5],
        },
        "correlations": {
            "total": len([c for c in correlations if c.get("type") != "nominal"]),
            "items": correlations,
        },
        "modules":      modules,
        "services":     health_data["services"],
    }


# ---------------------------------------------------------------------------
# Routes — metrics (lightweight observability)
# ---------------------------------------------------------------------------

@app.get("/metrics", tags=["Observability"])
async def metrics():
    """
    Lightweight JSON metrics endpoint.

    Exposes key platform metrics suitable for:
    - Simple health monitoring scripts
    - Future Prometheus scraping (use a Prometheus exporter adapter)
    - Dashboards that need a simple JSON feed

    For full Prometheus integration, see docs/architecture/PHASE2_PLATFORM_HARDENING.md
    """
    health_data = _compute_platform_health()
    uptime_secs = _uptime_seconds()

    service_metrics = {}
    for name, info in _service_status.items():
        service_metrics[name] = {
            "health_score": info.get("health_score", 0),
            "status":       info.get("status", "unknown"),
            "response_ms":  info.get("response_ms"),
        }

    return {
        "timestamp":            datetime.now(timezone.utc).isoformat(),
        "platform_health":      health_data["platform_health"],
        "overall_status":       health_data["overall_status"],
        "uptime_seconds":       round(uptime_secs, 1),
        "total_services":       health_data["summary"]["total_services"],
        "healthy_services":     health_data["summary"]["healthy"],
        "offline_services":     health_data["summary"]["offline"],
        "degraded_services":    health_data["summary"]["degraded"],
        "poll_cycles":          _poll_count,
        "poll_interval_seconds": 10,
        "services":             service_metrics,
    }
