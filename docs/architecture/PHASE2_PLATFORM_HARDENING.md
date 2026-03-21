# Phase 2 — Platform Hardening, System Intelligence & Deployment Optimization

> **Status:** Implemented
> **Date:** 2026-03-21
> **Base:** NeuroOps Unified Platform v1.0.0 → v2.0.0

---

## 1. What Was Improved

### 1.1 Docker Compose Profiles (Deployment Modes)
The single monolithic compose file now supports **deployment profiles**:

| Mode | Command | Services included | Est. RAM |
|------|---------|-------------------|----------|
| **core** (default) | `docker compose up -d` | postgres, gateway, frontend, nginx, autopilot, control-room, live-control, incident-replay | ~1.5 GB |
| **lite** | `make lite` | postgres, gateway, frontend, nginx only | ~350 MB |
| **heavy** | `docker compose --profile heavy up -d` | core + warehouse-api, warehouse-copilot, career-agent, insight-engine | ~4–5 GB |
| **full** | `make full` | heavy + n8n | ~5+ GB |
| **n8n** | `docker compose --profile n8n up -d` | core + n8n | ~1.8 GB |

The `lite` profile is designed for:
- Resource-constrained VMs / small cloud instances (1–2 GB RAM)
- CI/CD health check environments
- Gateway/UI development without operational modules

The `heavy` profile is designed for:
- Full demo deployments with AI/LLM features
- Servers with 8+ GB RAM
- Production deployments requiring warehouse and career agent functionality

### 1.2 Gateway API Intelligence Layer
The Gateway API was upgraded from a basic health aggregator to a **platform intelligence layer**:

| New Endpoint | Purpose |
|-------------|---------|
| `GET /platform/alerts` | Derives alerts from current service health state |
| `GET /platform/anomalies` | Rolling-window anomaly detection (30-sample history) |
| `GET /platform/correlations` | Cross-service cluster pattern detection |
| `GET /platform/intelligence` | Combined rich summary (single round-trip for dashboard) |
| `GET /metrics` | Lightweight JSON metrics endpoint |

Health history is maintained in-memory with a 30-sample rolling window (~5 minutes at 10s poll interval). No persistent storage required.

### 1.3 Minimal Auth Layer
A lightweight JWT-based auth layer was added to the platform:

- `POST /auth/token` — authenticates with username/password, returns JWT
- `GET /auth/verify` — validates a token
- Frontend **LoginPage** with credential form
- **AuthContext** (React context) manages token lifecycle
- **ProtectedRoute** wraps all AppShell routes
- **TopBar** shows current user + logout dropdown
- Token stored in `localStorage`, auto-expires after configurable duration
- Credentials configured via `PLATFORM_USER` / `PLATFORM_PASSWORD` env vars

This is an **internal platform auth layer** — not a production SSO system. It is appropriate for demo deployments, internal staging, and experimental platform use.

### 1.4 Smarter Dashboard
The unified dashboard was upgraded from a static status page to a live intelligence view:

- **Alerts panel** — real alerts derived from gateway health state
- **Anomaly detection panel** — flags sudden drops or gradual declines
- **Cross-service correlations** — identifies cluster-level degradation patterns
- **Module Activity Overview** — bar chart with health score, trend indicator, response time
- **Service status dots** in Quick Access bar
- All data sourced from the new `/platform/intelligence` endpoint (single poll)

### 1.5 Docker Hardening
- All services now have `healthcheck` with `start_period` to reduce false health failures during startup
- All services have `depends_on: condition: service_healthy` for postgres-dependent modules
- Resource limits (`deploy.resources.limits.memory`) added to all services
- `restart: unless-stopped` confirmed on all services
- PostgreSQL external port now configurable via `POSTGRES_EXPOSE_PORT` env var (can be disabled in production)

### 1.6 Observability Baseline
- `GET /metrics` endpoint on gateway-api exposes JSON metrics for all services
- Suitable for lightweight monitoring scripts, dashboards, or future Prometheus adapter
- Centralized health polling (every 10s) with history tracking
- All gateway logs structured via Python logging (stdout → container logs → `docker compose logs`)
- Poll cycle counter exposed in `/health` response

### 1.7 Cross-Module Integration
Implemented via gateway-level aggregation (no event bus required):

- `/platform/intelligence` aggregates health state, alerts, anomalies, and module activity
- Event endpoints expanded to include live-control and incident-replay in addition to autopilot and control-room
- Module trend tracking (improving / stable / declining) visible in dashboard
- Cross-cluster correlation detection: operations cluster + AI/ML cluster
- All cross-service data visible in one unified dashboard view

---

## 2. What Was Added (New Files)

```
services/gateway-api/app/auth.py              — JWT auth module
services/gateway-api/app/intelligence.py      — Platform intelligence layer
apps/unified-frontend/src/auth/AuthContext.jsx — React auth context
apps/unified-frontend/src/modules/login/LoginPage.jsx — Login UI
docs/architecture/PHASE2_PLATFORM_HARDENING.md — This document
Makefile                                       — Deployment shortcuts
```

**Updated files:**
```
services/gateway-api/app/main.py              — Auth + intelligence routes + /metrics
services/gateway-api/requirements.txt         — Added PyJWT
apps/unified-frontend/src/App.jsx             — AuthProvider wrapper
apps/unified-frontend/src/router/index.jsx    — ProtectedRoute + login route
apps/unified-frontend/src/modules/dashboard/Dashboard.jsx — Smart dashboard
apps/unified-frontend/src/modules/dashboard/useGatewayData.js — Intelligence hook
apps/unified-frontend/src/components/layout/TopBar.jsx — User display + logout
apps/unified-frontend/src/components/layout/Sidebar.jsx — v2.0.0 label
docker-compose.yml                             — Profiles + health checks + resource limits
.env.example                                   — Auth vars + postgres port config
```

---

## 3. What Was Intentionally Deferred

| Item | Reason | Recommended Phase |
|------|--------|-------------------|
| Full Prometheus + Grafana stack | Adds ~500 MB RAM + complexity; `GET /metrics` provides a clear integration point | Phase 3 |
| Per-service auth middleware | Would require modifying source projects (not allowed in Phase 2) | Phase 3 |
| Real-time WebSocket event streaming | Requires event bus or SSE server; polling is sufficient for Phase 2 | Phase 3 |
| Database migration (SQLite → PostgreSQL) for remaining services | No clear cross-module benefit yet; would risk breaking working services | Phase 3 if justified |
| Full RBAC / role-based access | Over-engineering for current use case | Phase 4 |
| TLS/HTTPS setup | Requires domain + cert; well-documented nginx pattern | Deployment config task |
| Streamlit → React rewrites | Out of scope per decision rules | Future if needed |

---

## 4. Current Limitations

1. **Auth is client-side validated only** — the gateway issues and verifies tokens, but individual service APIs (autopilot, control-room, etc.) do not validate the platform JWT. An operator with direct API port access (8001-8007) can bypass the auth layer.

2. **Intelligence data is best-effort** — the gateway derives alerts/anomalies from health scores only. It does not have access to application-level logs or business metrics unless services expose them via their event APIs.

3. **Health history is in-memory** — restarting the gateway clears all rolling history. Anomaly detection requires a brief warm-up period (~5 minutes) after restart.

4. **Event aggregation is opportunistic** — the gateway attempts to fetch events from `/api/events` and `/api/incidents` on each service. Services that do not expose these endpoints will simply return no events without error.

5. **Lite mode leaves operational modules offline** — in lite mode, the gateway will correctly report autopilot/control-room/etc. as "offline" (they simply aren't running). This is expected behaviour, not a failure.

6. **Memory limits are advisory** — `deploy.resources.limits.memory` is enforced by Docker only when running in Swarm mode. In Compose mode it requires `--compatibility` flag.

---

## 5. Recommended Next Phase (Phase 3)

### High Value / Low Risk
- **Prometheus + Grafana** — add as an optional `--profile monitoring` stack. The `/metrics` endpoint is already JSON-structured for easy adapter writing.
- **Log aggregation** — Loki + Grafana, or a simple log shipper to a central stdout aggregator.
- **Health trend persistence** — write health snapshots to PostgreSQL for longer-term trend analysis.

### Medium Value / Medium Risk
- **Per-service auth propagation** — add `Authorization: Bearer <token>` forwarding in nginx for service-level request validation.
- **Cross-module event stream** — lightweight internal SSE or Redis pub/sub for real-time incident events from incident-replay → control-room dashboard.
- **Incident Replay ↔ Control Room integration** — surface recent replay sessions inside the Control Room module sidebar.

### Lower Priority
- **Live Control ↔ Autopilot correlation** — autopilot state/decisions surfaced as overlay in Live Control dashboard.
- **Platform-level audit log** — record all auth events, service state changes, and operator actions to a dedicated log table.
- **HTTPS + Let's Encrypt** — add certbot container with nginx TLS configuration.

---

## 6. Resource Guide by Deployment Mode

### Lite (~350 MB RAM)
Use when: developing on a laptop, running gateway health checks, testing frontend changes.
Services: postgres (50 MB), gateway (80 MB), frontend (10 MB), nginx (10 MB).

### Core / Default (~1.5 GB RAM)
Use when: demonstrating the full operational platform, deploying to a 2–4 GB VPS.
Adds: autopilot (256 MB), control-room (256 MB), live-control (256 MB), incident-replay (256 MB).

### Heavy (~4–5 GB RAM)
Use when: running AI features (warehouse copilot, career agent, insight engine) in a full demo.
Requires: 8+ GB server RAM. LLM features require additional API keys or local Ollama.

### Full (~5+ GB RAM)
Use when: complete platform demonstration with workflow automation.
Add n8n to heavy: additional ~300 MB.
