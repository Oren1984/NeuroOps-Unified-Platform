"""
NeuroOps Unified Platform — Gateway API  v3.0
Central health aggregation, intelligence layer, auth, and platform events.

Phase 3 additions:
  - platform_events PostgreSQL table integration
  - /platform/events now merges DB events + live service events
  - /platform/alerts now enriched with DB-sourced alert events
  - Service health transitions published to platform_events on state change
  - Gateway startup/shutdown events published to platform_events
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
from app import events as platform_events

import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gateway-api")

# Phase 4A: events retention configuration
_EVENTS_RETENTION_DAYS: int = int(os.environ.get("EVENTS_RETENTION_DAYS", "30"))

# ---------------------------------------------------------------------------
# Service registry
# ---------------------------------------------------------------------------

SERVICE_HEALTH_ENDPOINTS: dict[str, str] = {
    "autopilot":         "http://autopilot-api:8000/health",
    "control_room":      "http://control-room-api:8000/api/health",
    "live_control":      "http://live-control-api:8000/api/health",
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

# Event aggregation endpoints (live service events)
EVENT_ENDPOINTS: dict[str, str] = {
    "autopilot":      "http://autopilot-api:8000/api/events",
    "control_room":   "http://control-room-api:8000/api/events",
    "live_control":   "http://live-control-api:8000/api/events",
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
_cleanup_task: asyncio.Task | None = None
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

        health_score = 100

        if name in SCORED_SERVICES:
            try:
                data = response.json()
                if isinstance(data, dict):
                    raw = data.get("health_score") or data.get("healthScore") or data.get("score")
                    if raw is not None:
                        health_score = int(float(raw))
            except Exception:
                pass

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

    # Phase 3C: publish service state transition events to platform_events DB
    await platform_events.publish_health_transitions(_service_status)

    _poll_count += 1


async def _background_poller() -> None:
    """Continuously poll all services every 10 seconds."""
    while True:
        try:
            await _poll_all_services()
        except Exception as exc:
            logger.warning("Background poll cycle failed: %s", exc)
        await asyncio.sleep(10)


async def _background_events_cleanup() -> None:
    """Phase 4A: Hourly background task to prune old platform_events rows."""
    # Initial delay — let the platform start cleanly before first cleanup
    await asyncio.sleep(60)
    while True:
        try:
            result = await platform_events.cleanup_old_events(_EVENTS_RETENTION_DAYS)
            if result.get("deleted", 0) > 0:
                logger.info(
                    "Events cleanup: removed %d rows older than %d days",
                    result["deleted"], _EVENTS_RETENTION_DAYS,
                )
        except Exception as exc:
            logger.warning("Events cleanup cycle failed: %s", exc)
        await asyncio.sleep(3600)  # run every hour


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
    global _polling_task, _cleanup_task
    logger.info("Gateway API v4.0 starting — launching background tasks")

    # Phase 3C: publish startup event
    await platform_events.publish_event(
        source_service="gateway-api",
        event_type="platform_startup",
        severity="info",
        payload={
            "message": "NeuroOps Gateway API started",
            "version": "4.0.0",
            "events_retention_days": _EVENTS_RETENTION_DAYS,
        },
    )

    asyncio.create_task(_poll_all_services())
    _polling_task = asyncio.create_task(_background_poller())
    # Phase 4A: hourly events retention cleanup
    _cleanup_task = asyncio.create_task(_background_events_cleanup())
    yield

    logger.info("Gateway API shutting down — cancelling background tasks")

    # Phase 3C: publish shutdown event
    await platform_events.publish_event(
        source_service="gateway-api",
        event_type="platform_shutdown",
        severity="info",
        payload={"message": "NeuroOps Gateway API shutting down"},
    )

    for task in (_polling_task, _cleanup_task):
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="NeuroOps Gateway API",
    description=(
        "Central health aggregation, platform intelligence, auth, and event layer "
        "for the NeuroOps Unified Platform. Phase 4."
    ),
    version="4.0.0",
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
        "version":        "4.0.0",
        "timestamp":      datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(_uptime_seconds(), 1),
        "poll_cycles":    _poll_count,
        "events_db":      platform_events._DB_AVAILABLE,
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
            "version":        "4.0.0",
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
async def platform_events_endpoint():
    """
    Unified event stream combining:
      1. Recent events from the platform_events PostgreSQL table (Phase 3C)
      2. Live events fetched from individual service APIs

    Events are merged, deduplicated by source, sorted by timestamp.
    """
    # Fetch from DB and live service APIs concurrently
    db_events_task = asyncio.create_task(platform_events.get_recent_events(limit=50))

    merged_live: list[dict[str, Any]] = []
    errors: dict[str, str] = {}

    async with httpx.AsyncClient() as client:
        fetch_tasks = {
            name: asyncio.create_task(client.get(url, timeout=5.0))
            for name, url in EVENT_ENDPOINTS.items()
        }
        live_results = await asyncio.gather(*fetch_tasks.values(), return_exceptions=True)

    for name, result in zip(fetch_tasks.keys(), live_results):
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
                    merged_live.append(event)
        except Exception as exc:
            errors[name] = f"Parse error: {exc}"

    # Await DB events
    db_events = await db_events_task

    # Merge: DB events first (most reliable), then live service events
    all_events = db_events + merged_live

    def _sort_key(e: dict) -> str:
        return (
            e.get("occurred_at") or e.get("timestamp") or e.get("created_at")
            or e.get("time") or e.get("started_at") or ""
        )

    all_events.sort(key=_sort_key, reverse=True)

    return {
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "total_events": len(all_events),
        "events":       all_events[:50],
        "sources":      list(EVENT_ENDPOINTS.keys()),
        "db_events":    len(db_events),
        "live_events":  len(merged_live),
        "errors":       errors if errors else None,
    }


# ---------------------------------------------------------------------------
# Routes — events management (Phase 4A)
# ---------------------------------------------------------------------------

@app.post("/platform/events/cleanup", tags=["Platform"])
async def events_cleanup(retention_days: int | None = None):
    """
    Phase 4A: Manually trigger a platform_events retention cleanup.

    Deletes all events older than `retention_days` (defaults to EVENTS_RETENTION_DAYS env var, 30 days).
    Safe to call at any time — does not affect events within the retention window.

    Query params:
        retention_days: Override the retention window for this run only.
    """
    days = retention_days if retention_days is not None else _EVENTS_RETENTION_DAYS
    result = await platform_events.cleanup_old_events(days)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "ok",
        **result,
    }


# ---------------------------------------------------------------------------
# Routes — intelligence layer (Phase 2 + Phase 3 enhancements)
# ---------------------------------------------------------------------------

@app.get("/platform/alerts", tags=["Intelligence"])
async def platform_alerts():
    """
    Derived platform alerts based on current service health state (Phase 2)
    enriched with DB-sourced alert events from platform_events (Phase 3C).
    Returns a merged list of active alerts ranked by severity.
    """
    # Phase 2: derived alerts from health state
    derived_alerts = intelligence.derive_alerts(_service_status)

    # Phase 3C: DB-backed alert events (warning/critical)
    db_alerts = await platform_events.get_db_alerts(limit=20)

    # Merge: derived first (current state), DB events appended (history context)
    all_alerts = derived_alerts + db_alerts

    critical = sum(1 for a in all_alerts if a.get("level") in ("critical", "error"))
    warning  = sum(1 for a in all_alerts if a.get("level") == "warning")

    return {
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "total":      len(all_alerts),
        "critical":   critical,
        "warning":    warning,
        "alerts":     all_alerts,
        "derived":    len(derived_alerts),
        "from_db":    len(db_alerts),
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
    Phase 3: Includes DB event count for richer platform picture.
    """
    health_data  = _compute_platform_health()
    uptime_secs  = _uptime_seconds()
    derived_alerts   = intelligence.derive_alerts(_service_status)
    anomalies    = intelligence.detect_anomalies(_service_status)
    correlations = intelligence.compute_correlations(_service_status)
    modules      = intelligence.module_activity_summary(_service_status)
    db_alerts    = await platform_events.get_db_alerts(limit=5)

    all_alerts = derived_alerts + db_alerts

    response_times = [
        v["response_ms"] for v in _service_status.values()
        if v.get("response_ms") is not None
    ]
    avg_rt = round(sum(response_times) / len(response_times), 1) if response_times else None

    return {
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "platform": {
            "name":         "NeuroOps Unified Platform",
            "version":      "4.0.0",
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
            "total":    len(all_alerts),
            "critical": sum(1 for a in all_alerts if a.get("level") in ("critical", "error")),
            "warning":  sum(1 for a in all_alerts if a.get("level") == "warning"),
            "items":    all_alerts[:8],
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
        "events_db_enabled": platform_events._DB_AVAILABLE,
    }


# ---------------------------------------------------------------------------
# Routes — metrics (lightweight observability)
# ---------------------------------------------------------------------------

@app.get("/metrics/prometheus", tags=["Observability"], response_class=None)
async def metrics_prometheus():
    """
    Phase 4F: Prometheus text-format exposition endpoint.
    Scrape this at /api/gateway/metrics/prometheus with Prometheus.
    """
    from fastapi.responses import PlainTextResponse

    health_data = _compute_platform_health()
    uptime_secs = _uptime_seconds()
    # Fetch event count concurrently (non-blocking; returns -1 if DB unavailable)
    event_count = await platform_events.get_event_count()
    lines = []

    def gauge(name, value, labels=None, help_text=None):
        full_name = f"neuroops_{name}"
        if help_text:
            lines.append(f"# HELP {full_name} {help_text}")
        lines.append(f"# TYPE {full_name} gauge")
        lbl_str = ""
        if labels:
            pairs = ",".join(f'{k}="{v}"' for k, v in labels.items())
            lbl_str = f"{{{pairs}}}"
        lines.append(f"{full_name}{lbl_str} {value}")

    # Platform-wide
    gauge("platform_health_score",    health_data["platform_health"],              help_text="Overall platform health score (0-100)")
    gauge("platform_uptime_seconds",  round(uptime_secs, 1),                      help_text="Gateway API uptime in seconds")
    gauge("platform_poll_cycles",     _poll_count,                                 help_text="Total health poll cycles completed")
    gauge("platform_services_total",  health_data["summary"]["total_services"],    help_text="Total registered services")
    gauge("platform_services_healthy",health_data["summary"]["healthy"],           help_text="Services currently healthy")
    gauge("platform_services_offline",health_data["summary"]["offline"],           help_text="Services currently offline")
    gauge("platform_services_degraded",health_data["summary"]["degraded"],         help_text="Services currently degraded")
    gauge("events_db_available",      int(platform_events._DB_AVAILABLE),          help_text="Whether platform_events DB is reachable (1=yes)")
    # Event volume + retention (Hardening pass)
    if event_count >= 0:
        gauge("platform_events_total",    event_count,                             help_text="Current row count in public.platform_events table")
    gauge("events_retention_days",    _EVENTS_RETENTION_DAYS,                      help_text="Configured platform_events retention window in days")

    # Per-service
    lines.append("# HELP neuroops_service_health_score Health score per service (0-100)")
    lines.append("# TYPE neuroops_service_health_score gauge")
    lines.append("# HELP neuroops_service_response_ms Response latency per service in milliseconds")
    lines.append("# TYPE neuroops_service_response_ms gauge")
    lines.append("# HELP neuroops_service_status Service status as numeric (1=healthy, 0.5=degraded, 0=offline)")
    lines.append("# TYPE neuroops_service_status gauge")

    for svc, info in _service_status.items():
        lbl = f'{{service="{svc}"}}'
        lines.append(f"neuroops_service_health_score{lbl} {info.get('health_score', 0)}")
        rt = info.get("response_ms")
        lines.append(f"neuroops_service_response_ms{lbl} {rt if rt is not None else 'NaN'}")
        status_num = {"healthy": 1, "degraded": 0.5, "offline": 0}.get(info.get("status", "offline"), 0)
        lines.append(f"neuroops_service_status{lbl} {status_num}")

    return PlainTextResponse("\n".join(lines) + "\n", media_type="text/plain; version=0.0.4; charset=utf-8")


@app.get("/metrics", tags=["Observability"])
async def metrics():
    """Lightweight JSON metrics endpoint for monitoring and dashboards."""
    health_data = _compute_platform_health()
    uptime_secs = _uptime_seconds()
    event_count = await platform_events.get_event_count()

    service_metrics = {}
    for name, info in _service_status.items():
        service_metrics[name] = {
            "health_score": info.get("health_score", 0),
            "status":       info.get("status", "unknown"),
            "response_ms":  info.get("response_ms"),
        }

    return {
        "timestamp":              datetime.now(timezone.utc).isoformat(),
        "platform_health":        health_data["platform_health"],
        "overall_status":         health_data["overall_status"],
        "uptime_seconds":         round(uptime_secs, 1),
        "total_services":         health_data["summary"]["total_services"],
        "healthy_services":       health_data["summary"]["healthy"],
        "offline_services":       health_data["summary"]["offline"],
        "degraded_services":      health_data["summary"]["degraded"],
        "poll_cycles":            _poll_count,
        "poll_interval_seconds":  10,
        "events_db_available":    platform_events._DB_AVAILABLE,
        "platform_events_total":  event_count,
        "events_retention_days":  _EVENTS_RETENTION_DAYS,
        "services":               service_metrics,
    }
