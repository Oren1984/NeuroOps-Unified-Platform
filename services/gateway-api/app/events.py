"""
NeuroOps Gateway API — Platform Events Module  (Phase 3C / Phase 4A)

Provides:
  - publish_event()       async helper to write platform events to PostgreSQL
  - get_recent_events()   read recent events from platform_events table
  - cleanup_old_events()  delete events older than retention window (Phase 4A)
  - Lightweight, additive, low-risk: falls back gracefully when DB is unavailable
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("gateway-api.events")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_DB_URL = os.environ.get(
    "DATABASE_URL",
    "",   # empty = DB not configured → all publishes silently no-op
)

_DB_AVAILABLE = bool(_DB_URL and _DB_URL.startswith("postgresql"))

# Phase 4A: configurable retention (default 30 days)
_RETENTION_DAYS: int = int(os.environ.get("EVENTS_RETENTION_DAYS", "30"))

# ---------------------------------------------------------------------------
# Low-level sync helpers (run in thread executor from async context)
# ---------------------------------------------------------------------------


def _sync_publish(
    source_service: str,
    event_type: str,
    severity: str,
    payload: dict[str, Any],
    occurred_at: str,
) -> None:
    """Insert one event row into public.platform_events (sync, psycopg2)."""
    import psycopg2
    import psycopg2.extras

    try:
        conn = psycopg2.connect(_DB_URL)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.platform_events
                    (source_service, event_type, severity, payload, occurred_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    source_service,
                    event_type,
                    severity,
                    json.dumps(payload),
                    occurred_at,
                ),
            )
        conn.close()
    except Exception as exc:
        # Never let event publishing crash the gateway
        logger.debug("Event publish failed (non-critical): %s", exc)


def _sync_get_recent(limit: int = 100, severity_filter: str | None = None) -> list[dict]:
    """Read recent platform events from PostgreSQL (sync, psycopg2)."""
    import psycopg2
    import psycopg2.extras

    rows: list[dict] = []
    try:
        conn = psycopg2.connect(_DB_URL)
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if severity_filter:
                cur.execute(
                    """
                    SELECT id, source_service, event_type, severity, payload, occurred_at
                    FROM public.platform_events
                    WHERE severity = %s
                    ORDER BY occurred_at DESC
                    LIMIT %s
                    """,
                    (severity_filter, limit),
                )
            else:
                cur.execute(
                    """
                    SELECT id, source_service, event_type, severity, payload, occurred_at
                    FROM public.platform_events
                    ORDER BY occurred_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
            raw = cur.fetchall()
            for row in raw:
                rows.append({
                    "id":             row["id"],
                    "source_service": row["source_service"],
                    "event_type":     row["event_type"],
                    "severity":       row["severity"],
                    "payload":        row["payload"] if isinstance(row["payload"], dict) else json.loads(row["payload"] or "{}"),
                    "occurred_at":    row["occurred_at"].isoformat() if row["occurred_at"] else None,
                    "_source":        "platform_events_db",
                })
        conn.close()
    except Exception as exc:
        logger.debug("Event read failed (non-critical): %s", exc)

    return rows


def _sync_get_alerts(limit: int = 50) -> list[dict]:
    """Read recent warning/critical events for the alerts endpoint."""
    import psycopg2
    import psycopg2.extras

    rows: list[dict] = []
    try:
        conn = psycopg2.connect(_DB_URL)
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, source_service, event_type, severity, payload, occurred_at
                FROM public.platform_events
                WHERE severity IN ('warning', 'critical', 'error')
                ORDER BY occurred_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            raw = cur.fetchall()
            for row in raw:
                payload = row["payload"]
                if isinstance(payload, str):
                    try:
                        payload = json.loads(payload)
                    except Exception:
                        payload = {}
                rows.append({
                    "id":       f"db_{row['id']}",
                    "level":    row["severity"],
                    "title":    f"[{row['source_service']}] {row['event_type']}",
                    "message":  payload.get("message", row["event_type"]),
                    "time":     row["occurred_at"].isoformat() if row["occurred_at"] else None,
                    "category": payload.get("category", "platform_event"),
                    "source":   row["source_service"],
                })
        conn.close()
    except Exception as exc:
        logger.debug("Alert read failed (non-critical): %s", exc)

    return rows


# ---------------------------------------------------------------------------
# Phase 4A: cleanup helpers
# ---------------------------------------------------------------------------


def _sync_count_events() -> int:
    """Return the current row count of public.platform_events. Returns -1 on failure."""
    import psycopg2

    try:
        conn = psycopg2.connect(_DB_URL)
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM public.platform_events")
            result = cur.fetchone()
        conn.close()
        return int(result[0]) if result else 0
    except Exception as exc:
        logger.debug("Event count query failed: %s", exc)
        return -1


def _sync_cleanup(retention_days: int) -> dict:
    """Delete platform_events rows older than retention_days. Returns stats dict."""
    import psycopg2

    deleted = 0
    try:
        conn = psycopg2.connect(_DB_URL)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM public.platform_events
                WHERE occurred_at < NOW() - INTERVAL '%s days'
                """,
                (retention_days,),
            )
            deleted = cur.rowcount
        conn.close()
    except Exception as exc:
        logger.warning("Event cleanup failed: %s", exc)
        return {"deleted": 0, "error": str(exc)}

    if deleted:
        logger.info("Platform events cleanup: deleted %d rows older than %d days", deleted, retention_days)

    return {"deleted": deleted, "retention_days": retention_days}


# ---------------------------------------------------------------------------
# Public async API
# ---------------------------------------------------------------------------


async def publish_event(
    source_service: str,
    event_type: str,
    severity: str = "info",
    payload: dict[str, Any] | None = None,
) -> None:
    """
    Asynchronously publish one event to the platform_events table.

    Non-blocking: runs in a thread executor.
    Safe: silently no-ops if DB is unavailable or not configured.

    Args:
        source_service: Name of the originating service (e.g. "gateway-api", "career_agent")
        event_type:     Short slug describing the event (e.g. "service_offline", "startup")
        severity:       "info" | "warning" | "critical" | "error"
        payload:        Any additional structured metadata to store as JSONB
    """
    if not _DB_AVAILABLE:
        return

    occurred_at = datetime.now(timezone.utc).isoformat()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        _sync_publish,
        source_service,
        event_type,
        severity,
        payload or {},
        occurred_at,
    )


async def get_recent_events(limit: int = 100, severity_filter: str | None = None) -> list[dict]:
    """
    Read recent platform events from PostgreSQL for the /platform/events endpoint.
    Returns empty list when DB is unavailable.
    """
    if not _DB_AVAILABLE:
        return []

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _sync_get_recent, limit, severity_filter
    )


async def get_db_alerts(limit: int = 50) -> list[dict]:
    """
    Read recent warning/critical events for the /platform/alerts endpoint.
    Returns empty list when DB is unavailable.
    """
    if not _DB_AVAILABLE:
        return []

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_get_alerts, limit)


async def get_event_count() -> int:
    """
    Return the current row count of public.platform_events.
    Returns -1 when DB is unavailable.
    """
    if not _DB_AVAILABLE:
        return -1
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_count_events)


async def cleanup_old_events(retention_days: int | None = None) -> dict:
    """
    Phase 4A: Delete platform_events rows older than retention_days.

    Args:
        retention_days: Override the default retention window. If None, uses
                        EVENTS_RETENTION_DAYS env var (default 30).

    Returns dict with 'deleted' count and 'retention_days' used.
    Silently no-ops (returns zeros) when DB is unavailable.
    """
    if not _DB_AVAILABLE:
        return {"deleted": 0, "retention_days": retention_days or _RETENTION_DAYS, "db_available": False}

    days = retention_days if retention_days is not None else _RETENTION_DAYS
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync_cleanup, days)
    result["db_available"] = True
    return result


# ---------------------------------------------------------------------------
# Service transition tracking (stateful transition detection)
# ---------------------------------------------------------------------------

_prev_service_statuses: dict[str, str] = {}


async def publish_health_transitions(
    current_status: dict[str, dict[str, Any]],
) -> None:
    """
    Compare current service statuses against previous poll and publish events
    for any service that has transitioned state (online→offline, offline→online).
    Called by the background poller after each poll cycle.
    """
    global _prev_service_statuses

    tasks = []
    for svc, info in current_status.items():
        new_state = info.get("status", "unknown")
        old_state = _prev_service_statuses.get(svc, "unknown")

        if old_state == new_state:
            continue

        # State changed — publish an event
        if new_state == "offline" and old_state in ("healthy", "degraded"):
            tasks.append(publish_event(
                source_service=svc,
                event_type="service_offline",
                severity="critical",
                payload={
                    "message": f"Service '{svc}' went offline",
                    "previous_status": old_state,
                    "current_status": new_state,
                    "health_score": info.get("health_score", 0),
                    "category": "availability",
                },
            ))
        elif new_state == "healthy" and old_state == "offline":
            tasks.append(publish_event(
                source_service=svc,
                event_type="service_recovered",
                severity="info",
                payload={
                    "message": f"Service '{svc}' recovered",
                    "previous_status": old_state,
                    "current_status": new_state,
                    "health_score": info.get("health_score", 100),
                    "category": "availability",
                },
            ))
        elif new_state not in ("healthy", "offline") and old_state == "healthy":
            tasks.append(publish_event(
                source_service=svc,
                event_type="service_degraded",
                severity="warning",
                payload={
                    "message": f"Service '{svc}' is degraded",
                    "previous_status": old_state,
                    "current_status": new_state,
                    "health_score": info.get("health_score", 0),
                    "category": "performance",
                },
            ))

    # Update tracking state
    _prev_service_statuses = {svc: info.get("status", "unknown") for svc, info in current_status.items()}

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
