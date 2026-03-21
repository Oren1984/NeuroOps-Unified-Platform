# NeuroOps Unified Platform — Architecture Summary

> For the full detailed architecture document, see `NEUROOPS_UNIFIED_PLATFORM_ARCHITECTURE.md` in this directory.

---

## Overview

The NeuroOps Unified Platform is a containerized, Nginx-routed application that aggregates seven independent AI-powered operations systems into a single browser interface. Four React-based modules are integrated directly into a shared frontend shell, providing native navigation and a unified design system. Three Streamlit-based modules are embedded via iframe, preserving their full functionality without rewriting any application logic. A new Gateway API provides health aggregation and platform-wide status. All original source projects remain untouched.

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (port 80)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    NGINX REVERSE PROXY                          │
│  /              /api/*             /embed/*                     │
└───┬─────────────────┬──────────────────────┬────────────────────┘
    │                 │                      │
┌───▼────────┐  ┌─────▼──────────────┐  ┌───▼────────────────────┐
│  UNIFIED   │  │   FASTAPI LAYER    │  │   STREAMLIT LAYER      │
│  FRONTEND  │  │                    │  │                         │
│            │  │  Gateway API :8000 │  │  Career Agent    :8501  │
│  React 18  │  │  Autopilot   :8001 │  │  Insight Engine  :8502  │
│  + Vite    │  │  Control Room:8002 │  │  Warehouse       :8503  │
│  :5173     │  │  Live Control:8003 │  │                         │
│            │  │  Incident    :8004 │  │                         │
│            │  │  Replay            │  │                         │
└────────────┘  └────────┬───────────┘  └────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │     DATA LAYER      │
              │                     │
              │  PostgreSQL  :5432   │
              │  (Autopilot +        │
              │   Control Room)      │
              │                     │
              │  SQLite (per-service │
              │  volumes)            │
              │                     │
              │  ChromaDB (Warehouse │
              │  vector store)       │
              │                     │
              │  JSON flat files     │
              │  (Incident Replay)   │
              └─────────────────────┘
```

---

## Key Architectural Decisions

- **Path-based routing over subdomains** — all services are accessible under a single origin (`/api/*`, `/embed/*`), eliminating cross-origin browser enforcement and simplifying SSL certificate management.
- **Direct React integration for FastAPI modules** — Autopilot, Control Room, Live Control, and Incident Replay are wired directly into the unified shell's component tree and router, providing seamless navigation.
- **iframe embedding for Streamlit modules** — Career Agent, Insight Engine, and Warehouse Copilot are embedded via iframe rather than rewritten, preserving 100% of their application logic at zero migration risk.
- **Gateway API for health aggregation** — a dedicated FastAPI service fans out concurrent health checks to all services and provides a single status endpoint for the dashboard, decoupling health monitoring from individual services.
- **Multi-database strategy** — PostgreSQL is shared by the two services that already used it (with schema isolation); all other services retain their original storage solutions (SQLite, ChromaDB, JSON).
- **Original projects untouched** — no files in any `NeuroOps-*` source directory were modified, allowing independent development to continue in each project without merge conflicts.
- **Design token system** — all visual styling flows from CSS custom properties defined in `tokens.css`; no hardcoded color or spacing values exist in component files, enabling future theme changes with a single file edit.
- **n8n as an optional profile** — the n8n automation engine for Insight Engine is isolated behind a Docker Compose profile flag to avoid consuming memory on deployments that don't need it.
- **Demo mode by default** — all LLM-dependent features degrade gracefully to rule-based or keyword-based fallbacks when no API keys are configured, allowing the platform to run fully functional out of the box.
- **No shared authentication layer (deliberate deferral)** — auth was not implemented to avoid coupling service lifecycles during the integration phase; it is identified as the top priority for a follow-up phase.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend shell | React 18, Vite, TypeScript | Unified UI, routing, shared layout |
| API gateway | FastAPI (Python) | Health aggregation, service registry |
| Ops APIs | FastAPI (Python) | Autopilot, Control Room, Live Control, Incident Replay backends |
| AI/analytics UIs | Streamlit (Python) | Career Agent, Insight Engine, Warehouse Copilot |
| Automation | n8n | Workflow automation for Insight Engine (optional) |
| Reverse proxy | Nginx | Routing, static file serving, WebSocket proxying |
| Primary database | PostgreSQL 15 | Autopilot and Control Room persistent storage |
| Lightweight database | SQLite | Career Agent, Insight Engine, Warehouse Copilot storage |
| Vector store | ChromaDB | Warehouse Copilot product similarity search |
| Containerization | Docker, Docker Compose v2 | Service isolation, orchestration, networking |
| CSS architecture | CSS custom properties (tokens) | Design system, theming |

---

## Port Map

| Service | Container Port | Host Port (dev) | Access Path |
|---|---|---|---|
| Nginx | 80 | 80 | `http://localhost/` |
| Unified Frontend | 5173 | 5173 | Direct (dev only) |
| Gateway API | 8000 | 8010 | `/api/gateway/` |
| Autopilot API | 8001 | 8001 | `/api/autopilot/` |
| Control Room API | 8002 | 8002 | `/api/control-room/` |
| Live Control API | 8003 | 8003 | `/api/live-control/` |
| Incident Replay API | 8004 | 8004 | `/api/incident-replay/` |
| Career Agent | 8501 | 8501 | `/embed/career-agent/` |
| Insight Engine | 8502 | 8502 | `/embed/insight-engine/` |
| Warehouse Copilot | 8503 | 8503 | `/embed/warehouse/` |
| PostgreSQL | 5432 | 5432 | Internal only (prod) |
| n8n (optional) | 5678 | 5678 | Direct |

---

## File Structure

```
NeuroOps-Unified-Platform/
│
├── docker-compose.yml          # Orchestrates all services
├── .env.example                # Environment template
├── nginx/
│   └── nginx.conf              # Reverse proxy + routing rules
│
├── apps/
│   └── unified-frontend/       # React 18 + Vite shell
│       └── src/
│           ├── components/     # Shared UI (StatusBadge, MetricCard, EmbedFrame...)
│           ├── modules/        # Integrated React modules (autopilot, control-room...)
│           ├── pages/          # Route-level pages (Dashboard, Settings...)
│           └── styles/         # tokens.css, global.css
│
├── services/
│   └── gateway-api/            # New FastAPI gateway service
│
├── docs/
│   ├── deployment/DEPLOYMENT_GUIDE.md
│   ├── integration/INTEGRATION_REPORT.md
│   └── architecture/           # This file + full architecture document
│
├── NeuroOps-Autopilot-System/          (untouched)
├── NeuroOps-Control-Room-System/       (untouched)
├── NeuroOps-live-Control-System/       (untouched)
├── NeuroOps-Incident-Replay-System/    (untouched)
├── NeuroOps-Career-Agent-System/       (untouched)
├── NeuroOps-Insight-Engine-System/     (untouched)
└── NeuroOps-Warehouse-Copilot-System/  (untouched)
```

---

## Phase 2 Architecture Changes (v2.0.0)

### New Components

- `services/gateway-api/app/auth.py` — JWT auth module (token issue + verify)
- `services/gateway-api/app/intelligence.py` — Rolling health history, alert derivation, anomaly detection, correlation analysis
- `apps/unified-frontend/src/auth/AuthContext.jsx` — React auth context + token lifecycle
- `apps/unified-frontend/src/modules/login/LoginPage.jsx` — Unified login page
- `Makefile` — Deployment shortcuts for all profiles

### Architectural Pattern: Gateway Intelligence Layer

```
[Services] → health probe (10s) → [Gateway in-memory state]
                                          ↓
                            rolling history (30 samples)
                                    ↓         ↓         ↓
                                 alerts   anomalies  correlations
                                          ↓
                            /platform/intelligence
                                          ↓
                              [React Dashboard] (10s poll)
```

The gateway acts as a stateful intelligence aggregator. No external database or message broker is required for platform-level insights.

### Deployment Profile Architecture

```
docker compose up -d              → core (default)
  └─ postgres + gateway + frontend + nginx + 4 ops APIs

docker compose --profile heavy up -d  → + AI services
  └─ + warehouse-api + warehouse-copilot + career-agent + insight-engine

docker compose --profile n8n up -d    → + automation
  └─ + n8n

make lite → postgres + gateway + frontend + nginx only
```

### Auth Flow

```
Browser → GET /  → Nginx → Frontend
                              ↓
                       ProtectedRoute → AuthContext
                              ↓
                  [no token] → /login → POST /api/gateway/auth/token
                  [token]    → AppShell → modules
```

### Current Platform Version

- Gateway API: v2.0.0
- Frontend: v2.0.0
- Docker Compose: profiles (lite/core/heavy/full/n8n)
- Auth: JWT (HS256, env-configured credentials)
- Intelligence: in-memory rolling window (30 samples, ~5-minute window)
