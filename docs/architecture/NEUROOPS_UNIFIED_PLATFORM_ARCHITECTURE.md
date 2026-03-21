# NeuroOps Unified Platform — Architecture Analysis

**Document Type:** System Architecture & Integration Plan
**Status:** Awaiting Implementation Approval
**Scope:** Full-system merge of 7 independent NeuroOps projects into one unified platform
**Date:** 2026-03-21

---

## Introduction

This document captures the complete architecture analysis for the NeuroOps Unified Platform — a large-scale experimental integration exercise that merges seven independent AI systems projects into a single cohesive platform.

The goal is not a links portal or a showcase website. It is a **full engineering integration**: one frontend, one navigation system, one Docker runtime, one database strategy, and a consistent user experience across all modules.

Each phase below represents a discrete analysis step: scanning existing systems, deciding how to merge them, defining the target architecture, planning execution, identifying risks, and arriving at a final recommendation.

---

## Phase 1 — Folder Scan

### System Inventory

| System | Frontend | Backend | Database | Docker | Special Tech | Ports |
|--------|----------|---------|----------|--------|--------------|-------|
| **Autopilot** | React 18 + Vite | FastAPI + Python | PostgreSQL 15 | 3 services | Decision Engine, Simulation | 3000, 8008, 5432 |
| **Career Agent** | Streamlit | Streamlit + SQLAlchemy | SQLite | 1 service | Semantic scoring, LLM multi-provider, APScheduler | 8501 |
| **Control Room** | React 18 + Vite | FastAPI + Python | PostgreSQL | 2 services | Cytoscape graphs, Recharts | 5174, 8007 |
| **Incident Replay** | React 18 + Vite (TypeScript) | FastAPI + Python | JSON flat files | 2 services | ReactFlow, timeline replay | 5173, 8004 |
| **Insight Engine** | Streamlit | Streamlit + Python | SQLite + CSV | 2 services + n8n | RAG, LLM multi-provider, n8n automation | 8501, 5678 |
| **Live Control** | React 18 + Vite | FastAPI + Python | None (PSM dataset) | 2 services | Real-time streaming, PSM Kaggle dataset | 3000, 8000 |
| **Warehouse Copilot** | Streamlit | FastAPI + Streamlit | SQLite + ChromaDB + FAISS | 2 services | Vector RAG, Chroma, scikit-learn anomaly detection | 8001, 8501 |

### Framework Split

- **React/Vite stack:** Autopilot, Control Room, Incident Replay, Live Control — 4 projects
- **Streamlit stack:** Career Agent, Insight Engine, Warehouse Copilot — 3 projects

### Critical Conflicts Identified

| Conflict Type | Details |
|---------------|---------|
| **Port clashes** | Port 3000 used by Autopilot and Live Control; port 8501 used by all 3 Streamlit apps; port 5173 used by Incident Replay and Control Room dev server |
| **DB heterogeneity** | PostgreSQL (2 projects), SQLite (3 projects), JSON flat file (1 project), none (1 project) — all with different schemas |
| **Language split** | Incident Replay frontend uses TypeScript; all others use JavaScript |
| **Backend port clashes** | Live Control uses port `8000` directly; others remap internal `8000` to unique external ports |

---

## Phase 2 — Merge Recommendation

### Decision Per Project

#### Autopilot System — `MERGE DIRECTLY`

- React + FastAPI + PostgreSQL is the ideal unified stack target
- Expose as `/autopilot` route in the unified frontend
- Backend runs as a microservice at internal port `8001`
- PostgreSQL migrates to an `autopilot` schema inside the unified database

#### Control Room System — `MERGE DIRECTLY`

- Same stack as Autopilot (React + FastAPI + PostgreSQL)
- Minor adaptation: unify Cytoscape dependency, adjust port routing
- Expose as `/control-room` route
- Backend as microservice at internal port `8002`
- PostgreSQL schema: `control_room`

#### Live Control System — `MERGE DIRECTLY`

- React + FastAPI with no database (streaming only) — simplest merge candidate
- Expose as `/live-control` route
- Backend as microservice at internal port `8003`
- PSM dataset mounts as a shared Docker volume

#### Incident Replay System — `MERGE WITH ADAPTATION`

- React (TypeScript) — minor friction with JS-first projects, but Vite handles mixed TS/JS natively
- No database (JSON files only) — simplest data layer; keep JSON, no migration needed
- Expose as `/incident-replay` route
- Backend as microservice at internal port `8004`
- Note: ReactFlow is a unique dependency — include in unified `package.json`

#### Insight Engine — `EMBED AS MODULE (iframe), extract later`

- Streamlit cannot be merged into a React shell without a full rewrite
- Short-term: embed Streamlit app via `<iframe>` at the `/insight-engine` route
- Streamlit service runs as a separate container, proxied through Nginx
- n8n automation service included alongside

#### Career Agent — `EMBED AS MODULE (iframe), extract later`

- Streamlit dashboard — same reasoning as Insight Engine
- Contains complex logic (LLM multi-provider, semantic scoring, APScheduler) — not worth rewriting initially
- Expose as `/career-agent` iframe module
- Container runs independently; SQLite stays local to the container

#### Warehouse Copilot — `EMBED AS MODULE (iframe) + EXTRACT FastAPI`

- FastAPI backend has standalone value — expose at internal port `8007` and consume from the unified frontend
- Streamlit dashboard: embed as iframe at `/warehouse-copilot`
- ChromaDB + FAISS vector store remains in its own container with a persistent volume

### Conflict Resolution Plan

| Conflict | Resolution |
|----------|-----------|
| Port clashes | All internal ports remapped; Nginx reverse proxy routes by path prefix |
| Streamlit × React | Streamlit apps embedded via `<iframe>`; React shell wraps everything |
| SQLite × PostgreSQL | SQLite stays per-service (no shared state needed); PostgreSQL unified for Autopilot and Control Room |
| TypeScript × JavaScript | Vite handles both natively; Incident Replay stays TypeScript, others stay JavaScript — no forced migration |
| Multiple LLM providers | Shared `.env` with `LLM_PROVIDER` variable; each service reads its own config |

---

## Phase 3 — Unified Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEUROOPS UNIFIED PLATFORM                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Nginx Reverse Proxy (:80)                    │   │
│  │                                                                  │   │
│  │  /                      → Unified React Shell                    │   │
│  │  /api/autopilot          → FastAPI :8001                         │   │
│  │  /api/control-room       → FastAPI :8002                         │   │
│  │  /api/live-control       → FastAPI :8003                         │   │
│  │  /api/incident-replay    → FastAPI :8004                         │   │
│  │  /api/warehouse          → FastAPI :8007                         │   │
│  │  /embed/career-agent     → Streamlit :8501                       │   │
│  │  /embed/insight          → Streamlit :8501                       │   │
│  │  /embed/warehouse        → Streamlit :8501                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│  ┌───────────────────────────▼──────────────────────────────────────┐   │
│  │           Unified React Frontend (Vite, port :5173)              │   │
│  │                                                                  │   │
│  │  Shared Layout: TopBar + Sidebar Navigation                      │   │
│  │                                                                  │   │
│  │  /dashboard      → Central home, system health overview          │   │
│  │  /autopilot      → React module (direct)                         │   │
│  │  /control-room   → React module (direct)                         │   │
│  │  /live-control   → React module (direct)                         │   │
│  │  /incident-replay → React module (direct)                        │   │
│  │  /career-agent   → <iframe> embed                                │   │
│  │  /insight-engine → <iframe> embed                                │   │
│  │  /warehouse      → <iframe> embed + FastAPI widgets              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Microservice Backends                        │   │
│  │                                                                  │   │
│  │  autopilot-api       :8001  │  control-room-api     :8002        │   │
│  │  live-control-api    :8003  │  incident-replay-api  :8004        │   │
│  │  warehouse-api       :8007                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Streamlit Services                          │   │
│  │                                                                  │   │
│  │  career-agent    :8501  │  insight-engine  :8501                 │   │
│  │  warehouse-copilot :8501                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                          Data Layer                              │   │
│  │                                                                  │   │
│  │  PostgreSQL :5432                                                │   │
│  │    schema: autopilot    (events, services, decisions, agents)    │   │
│  │    schema: control_room (services, incidents, metrics)           │   │
│  │                                                                  │   │
│  │  SQLite (per-container volumes)                                  │   │
│  │    career-agent:     jobs.db                                     │   │
│  │    insight-engine:   business_intelligence.db                    │   │
│  │    warehouse:        warehouse.db                                │   │
│  │                                                                  │   │
│  │  ChromaDB :8000  (warehouse vector store)                        │   │
│  │  n8n       :5678 (insight engine automation)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Frontend Structure

```
apps/unified-frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx          ← main layout wrapper
│   │   │   ├── Sidebar.jsx           ← module navigation
│   │   │   └── TopBar.jsx            ← global header
│   │   └── shared/
│   │       ├── StatusBadge.jsx
│   │       ├── MetricCard.jsx
│   │       └── EmbedFrame.jsx        ← reusable iframe wrapper
│   ├── modules/
│   │   ├── dashboard/                ← central home
│   │   ├── autopilot/                ← migrated from NeuroOps-Autopilot
│   │   ├── control-room/             ← migrated from NeuroOps-Control-Room
│   │   ├── live-control/             ← migrated from NeuroOps-live-Control
│   │   ├── incident-replay/          ← migrated from NeuroOps-Incident-Replay
│   │   ├── career-agent/             ← iframe embed
│   │   ├── insight-engine/           ← iframe embed
│   │   └── warehouse-copilot/        ← iframe embed
│   ├── router/
│   │   └── index.jsx                 ← React Router v6
│   ├── styles/
│   │   ├── tokens.css                ← design tokens (colors, spacing)
│   │   └── global.css
│   └── main.jsx
├── package.json                      ← merged dependencies
└── vite.config.js
```

### Backend Architecture

Each service is a standalone FastAPI application. They communicate only via the frontend — no backend-to-backend calls are needed.

```
services/
├── autopilot-api/          (from NeuroOps-Autopilot-System/backend)
├── control-room-api/       (from NeuroOps-Control-Room-System/backend)
├── live-control-api/       (from NeuroOps-live-Control-System/backend)
├── incident-replay-api/    (from NeuroOps-Incident-Replay-System/backend)
└── warehouse-api/          (from NeuroOps-Warehouse-Copilot-System/src/api)
```

### Database Strategy

```
PostgreSQL (shared instance, isolated schemas):
  autopilot schema    → Autopilot-System models
  control_room schema → Control-Room-System models

SQLite (per-service volumes, not shared):
  career_agent  → jobs.db
  insight       → business_intelligence.db
  warehouse     → warehouse.db

Vector DB:
  ChromaDB → warehouse vector store (persistent volume)

Flat Files:
  incident-replay → incidents.json (unchanged)
  live-control    → PSM dataset CSV (mounted volume)
```

### Docker Compose Overview

```yaml
# 13 services total

services:
  nginx                  # reverse proxy + static frontend serving
  frontend               # React Vite (dev or built assets)

  # FastAPI backends
  autopilot-api
  control-room-api
  live-control-api
  incident-replay-api
  warehouse-api

  # Streamlit apps
  career-agent
  insight-engine
  warehouse-copilot

  # Databases and tooling
  postgres               # shared PostgreSQL
  chromadb               # vector store
  n8n                    # automation (insight engine)
```

### Design System

| Token | Value |
|-------|-------|
| Background | `#0f1117` (dark) |
| Accent | Blues and greens for status indicators |
| Alerts | Red / amber for warning and critical states |
| Typography | Inter or system-ui; monospace for metrics and logs |
| Core components | `StatusBadge`, `MetricCard`, `EventFeed`, `ServiceGrid`, `EmbedFrame` |
| Navigation | Left sidebar with module icons and labels; TopBar with system-wide health score |

---

## Phase 4 — Integration Plan

### Step-by-Step Execution Order

**Step 1 — Create base unified project structure**
- Create `apps/unified-frontend/` with React + Vite + React Router v6
- Create `docker-compose.unified.yml` at the repository root
- Create `nginx/nginx.conf` with proxy rules for all services
- Set up shared `.env` file

**Step 2 — Build frontend shell**
- Implement `AppShell`, `Sidebar`, and `TopBar` components
- Define design tokens as CSS variables
- Create the central `/dashboard` home page with module cards
- Set up React Router v6 routes for all 7 modules

**Step 3 — Integrate Live Control** *(simplest — no database)*
- Copy `NeuroOps-live-Control-System/frontend/src` into `modules/live-control/`
- Add `live-control-api` service to docker-compose
- Update API URL to use Nginx proxy path `/api/live-control`
- Verify charts and real-time streaming work inside the unified shell

**Step 4 — Integrate Incident Replay** *(no database, JSON only)*
- Copy `NeuroOps-Incident-Replay-System/frontend/src` into `modules/incident-replay/`
- Add `incident-replay-api` service to docker-compose
- Mount `incidents.json` as a Docker volume
- Confirm Vite handles TypeScript source correctly

**Step 5 — Integrate Control Room**
- Copy `NeuroOps-Control-Room-System/frontend/src` into `modules/control-room/`
- Add `control-room-api` service to docker-compose
- Configure PostgreSQL schema `control_room`
- Run seed SQL via init script

**Step 6 — Integrate Autopilot**
- Copy `NeuroOps-Autopilot-System/frontend/src` into `modules/autopilot/`
- Add `autopilot-api` service to docker-compose
- Configure PostgreSQL schema `autopilot`
- Verify simulation engine and decision engine start correctly

**Step 7 — Embed Streamlit modules** *(Career Agent, Insight Engine, Warehouse Copilot)*
- Add 3 Streamlit containers to docker-compose (each on internal port `8501`, Docker-network-only)
- Build `EmbedFrame.jsx` component with loading state and error boundary
- Create iframe module pages in unified frontend
- Configure Nginx to proxy `/embed/*` paths

**Step 8 — Warehouse FastAPI extraction**
- Extract `warehouse-api` and run as a standalone service at port `8007`
- Wire Warehouse Copilot Streamlit to consume the same API
- Add Warehouse FastAPI widgets (stock status, alerts) as native React components in the unified frontend

**Step 9 — Setup shared PostgreSQL with schemas**
- Single PostgreSQL container with per-schema init scripts
- Each FastAPI service connects to its own schema via `DATABASE_URL`
- SQLite volumes remain isolated and per-container

**Step 10 — Finalize Nginx routing and Docker health checks**
- Complete Nginx path-based routing for all services
- Add `depends_on` with health check conditions in docker-compose
- Define startup order: `postgres` → API services → `frontend` → `nginx`

**Step 11 — Stabilize and test**
- Verify all routes render correctly inside the unified shell
- Test API connectivity through Nginx proxy
- Verify Streamlit embeds load without CORS issues
- Confirm Docker networking via `neuroops-network` bridge

---

## Phase 5 — Risks & Tradeoffs

### Integration Conflicts

| Risk | Severity | Mitigation |
|------|----------|------------|
| Streamlit CORS / iframe issues | HIGH | Set `STREAMLIT_SERVER_HEADLESS=true`, disable XSRF; use Nginx same-origin proxy |
| Port collision in docker-compose | MEDIUM | Explicit port remapping for all services; all external ports unique |
| PostgreSQL schema isolation breaking | MEDIUM | Use separate `search_path` per service; no cross-schema foreign key references |
| Vite TS/JS mix in unified frontend | LOW | Vite handles both natively; no forced migration needed |
| Large docker-compose startup order | MEDIUM | `depends_on` + healthcheck conditions; PostgreSQL must be ready before API services |
| PSM dataset path missing at startup | MEDIUM | Add data volume mount and startup check in `live-control-api` |
| ChromaDB persistence across restarts | LOW | Named volume in docker-compose; test persistence on rebuild |
| n8n state loss | LOW | Add n8n data volume; document manual workflow import process |

### Framework Tradeoffs

| Decision | Chosen | Alternative | Reason |
|----------|--------|-------------|--------|
| Streamlit approach | `<iframe>` embed | Rewrite as React | Rewrite costs 3× the effort and breaks existing working logic |
| Database strategy | Multi-DB (PostgreSQL + SQLite) | Single PostgreSQL | SQLite services have no shared data need — migration adds unnecessary complexity |
| Backend strategy | Microservices | Monolith | Each service has distinct simulation logic; merging would create tight coupling |
| Frontend strategy | Module migration into shell | iframe everything | Direct React modules deliver better UX; Streamlit embed only where rewrite cost is prohibitive |
| TypeScript handling | Keep TS in Incident Replay only | Migrate everything to TS | Not worth the refactor cost across 4 projects; Vite handles mixed projects cleanly |

### Architecture Risks

- **Scale of docker-compose (13 services):** Increases startup time and memory pressure on local machines. Document a lightweight mode that disables non-essential services.
- **No shared auth/session layer:** Each module is independent with no cross-module user state. Acceptable for an experimental platform; noted for future V2 work.
- **Streamlit performance in iframe:** Streamlit apps are not optimized for embedding. Loading spinners and error boundaries are required.
- **Over-complexity creep:** Risk of adding cross-service features that were never in the original projects. Discipline required — integrate existing logic only, do not invent new integrations.

---

## Phase 6 — Final Recommendation

### Recommended Architecture

**React Unified Shell + FastAPI Microservices + Nginx Proxy + Selective Streamlit Embeds**

This is the minimum-viable integration approach that:

- Preserves 100% of existing business logic with no unnecessary rewrites
- Delivers a genuine single-frontend experience
- Keeps operational complexity manageable
- Avoids over-engineering

### Final Repository Structure

```
NeuroOps-Unified-Platform/
├── apps/
│   └── unified-frontend/            ← Single React + Vite application
├── services/
│   ├── autopilot-api/               ← FastAPI (PostgreSQL)
│   ├── control-room-api/            ← FastAPI (PostgreSQL)
│   ├── live-control-api/            ← FastAPI (no DB)
│   ├── incident-replay-api/         ← FastAPI (JSON)
│   └── warehouse-api/               ← FastAPI (SQLite + ChromaDB)
├── streamlit/
│   ├── career-agent/                ← Streamlit (SQLite)
│   ├── insight-engine/              ← Streamlit (SQLite + n8n)
│   └── warehouse-copilot/           ← Streamlit (delegates to warehouse-api)
├── nginx/
│   └── nginx.conf                   ← unified reverse proxy config
├── postgres/
│   └── init/                        ← per-schema SQL init scripts
├── docs/
│   └── architecture/                ← this document and diagrams
├── .env                             ← shared environment configuration
└── docker-compose.unified.yml       ← single compose file for entire platform
```

### Simplification Decisions

| Decision | Rationale |
|----------|-----------|
| No shared auth system | Out of scope; would require significant new infrastructure with no existing foundation |
| No cross-service event bus | Each module remains self-contained; event streaming is per-module by design |
| Streamlit apps not rewritten | iframe embed preserves all logic at zero rewrite cost |
| No API gateway or service mesh | Nginx path routing is sufficient at this scale |
| Flat data volumes | SQLite and JSON data stays per-service; no central data warehouse needed |
| n8n kept as-is | Embedded alongside Insight Engine; not promoted to a platform-wide automation layer |

### Execution Priority Order

| Priority | Task | Rationale |
|----------|------|-----------|
| 1 | Unified frontend shell + navigation | Highest value — immediately demonstrates the platform vision |
| 2 | Live Control module | Easiest migration, dramatic visual impact |
| 3 | Incident Replay module | No database, fast integration path |
| 4 | Streamlit embeds (all 3) | Parallel work — can run alongside React migrations |
| 5 | Control Room module | PostgreSQL setup required |
| 6 | Autopilot module | Most complex — simulation engine, decision engine, full DB |
| 7 | Warehouse API extraction | FastAPI split from Streamlit |
| 8 | Full Docker unification + Nginx | Final integration and stabilization |

---

## Summary

This architecture is realistic, achievable, and preserves the identity of every module while delivering a genuinely unified platform experience. The key principle throughout is **integrate existing logic — do not rewrite it**. Each project contributes its full capability to the platform; the unified shell and Nginx proxy layer are what create the cohesion.

**Awaiting implementation approval.**

---

*Generated by Claude Code — NeuroOps Unified Platform Architecture Analysis — 2026-03-21*
