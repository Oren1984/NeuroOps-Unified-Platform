# NeuroOps Unified Platform — Integration Report

This document explains every architectural and implementation decision made during the integration of seven independent NeuroOps projects into the unified platform. It serves as a permanent record of what was done, what was changed, and why.

---

## Summary Table

| Project | Integration Method | Reason | Status |
|---|---|---|---|
| NeuroOps-Autopilot-System | Direct React + API proxy | React/FastAPI — fully composable | Integrated |
| NeuroOps-Control-Room-System | Direct React + API proxy | React/FastAPI — fully composable | Integrated |
| NeuroOps-live-Control-System | Direct React + API proxy | React/FastAPI — fully composable | Integrated |
| NeuroOps-Incident-Replay-System | Direct React (TS) + API proxy | React/FastAPI — fully composable | Integrated |
| NeuroOps-Career-Agent-System | iframe embed | Streamlit — not directly composable | Embedded |
| NeuroOps-Insight-Engine-System | iframe embed | Streamlit — not directly composable | Embedded |
| NeuroOps-Warehouse-Copilot-System | iframe embed | Streamlit — not directly composable | Embedded |

---

## Section 1: Directly Integrated Modules (React)

The four React-based projects were integrated by migrating their component trees and API logic directly into the unified frontend shell. This approach provides native navigation, shared design tokens, and consistent layout without any visual seams.

### Autopilot System

**What was migrated:**
- All React components from the Autopilot frontend (decision tables, run controls, configuration panels, status indicators)
- All custom hooks managing WebSocket connections and polling intervals
- All API call logic (fetch wrappers, error handlers, retry logic)

**What was changed:**
- API base URLs changed from hardcoded `http://localhost:8001` to the environment-relative path `/api/autopilot`. This allows the unified Nginx proxy to route correctly in all environments.
- Standalone `<App />` root component removed; the module now exports a top-level `<AutopilotModule />` component that the unified shell mounts inside the shared layout.
- Top-level navigation bar and page header removed. The unified shell's `<TopBar />` and `<Sidebar />` replace these.
- `index.html` entry point removed — the module does not need its own HTML document.

**What was preserved:**
- 100% of business logic including all decision engine state machine logic
- All WebSocket event handlers and reconnection logic
- All form validation and user interaction flows
- All error boundary components

**Key technical notes:**
React Router configuration was merged into the unified shell's router. Autopilot routes are mounted under `/autopilot/*` in the shared router, so deep links to specific views continue to work. The Autopilot API container continues to run on port 8001 internally and is proxied through Nginx.

---

### Control Room System

**What was migrated:**
- Alert panels, investigation sidebars, service topology views, log stream components
- All hooks for polling alert feeds and fetching investigation context
- API clients for the Control Room FastAPI backend

**What was changed:**
- API base URL changed from `http://localhost:8002` to `/api/control-room`
- Standalone app shell removed; module exports `<ControlRoomModule />`
- Per-page breadcrumb navigation replaced by unified shell breadcrumbs
- Custom font imports removed — unified design tokens provide typography

**What was preserved:**
- All alert correlation logic
- All investigation workflow state
- All data visualization components (charts, timelines, heatmaps)
- PostgreSQL schema and all existing data models

**Key technical notes:**
Control Room shares the PostgreSQL instance with Autopilot but uses a separate schema (`control_room`) to avoid table name collisions. The existing schema was not modified — the Control Room API was configured to target its schema using the `search_path` connection parameter.

---

### Live Control System

**What was migrated:**
- Real-time metrics charts, streaming data tables, alerting threshold controls
- WebSocket client hooks for the live metrics stream
- SSE (Server-Sent Events) handlers for high-frequency data

**What was changed:**
- API base URL changed from `http://localhost:8003` to `/api/live-control`
- Module isolated from its own React root and exported as `<LiveControlModule />`
- Standalone status bar removed; metrics are surfaced in the unified `<TopBar />` where applicable

**What was preserved:**
- All WebSocket stream logic and reconnection handling
- All charting logic (time-series charts, gauge components)
- All threshold configuration and alert dispatch logic

**Key technical notes:**
Live Control does not use PostgreSQL — it uses an in-memory state store backed by the FastAPI process. This was preserved as-is since persistent storage is not a requirement for real-time streaming data. The Live Control API was the simplest migration: no database dependency and a straightforward REST + WebSocket interface.

---

### Incident Replay System

**What was migrated:**
- Timeline scrubber component, event log viewer, replay controls (play, pause, step, speed)
- All TypeScript interfaces and type definitions
- All API clients and data-fetching hooks

**What was changed:**
- API base URL changed from `http://localhost:8004` to `/api/incident-replay`
- Module exported as `<IncidentReplayModule />`
- TypeScript path aliases updated to reference module-relative paths instead of root-relative paths

**What was preserved:**
- All TypeScript type definitions and interfaces
- All replay engine logic (timeline state machine, event sequencing)
- All incident data files (`incidents.json` and associated event logs)
- The FastAPI backend's file-based data loading approach

**Key technical notes:**
Incident Replay is the only module written in TypeScript. The unified frontend is also TypeScript (React 18 + Vite), so no transpilation changes were needed. Type imports from Incident Replay are available to shared components where needed (for example, the `IncidentSummary` type is used by the dashboard home page's recent incidents widget).

---

## Section 2: Embedded Modules (Streamlit)

### Why iframe Embedding Was Chosen

Streamlit applications are not designed to be composed as React sub-components. They are self-contained web servers that render their own HTML, manage their own state, and use their own widget system. Converting three Streamlit applications to React would have required rewriting hundreds of lines of application logic, data pipelines, and UI patterns — with significant risk of introducing regressions and losing functionality.

The iframe embedding approach was selected because:

1. **Zero logic risk** — 100% of Streamlit application code is preserved unmodified
2. **Fast integration** — iframe configuration is a matter of Nginx routing and Streamlit startup flags, not code rewriting
3. **Independent development** — each Streamlit app can be developed, tested, and deployed independently
4. **Acceptable UX tradeoff** — the unified sidebar and topbar remain visible around the iframe, providing navigation continuity

---

### Career Agent

**How the embed is configured:**
- Streamlit is started with `--server.baseUrlPath=/embed/career-agent` so all its internal asset paths are prefixed correctly
- `--server.enableCORS=false` allows the iframe to load without cross-origin errors when embedded in the unified frontend
- `--server.enableXsrfProtection=false` is required to allow form submissions through the iframe/proxy combination
- Nginx proxies `/embed/career-agent/` to the Career Agent container on port 8501

**What was preserved:**
- Complete job discovery pipeline (web scraping, RSS feed parsing, job board API integrations)
- LLM-based resume analysis and scoring logic
- Keyword extraction and job matching algorithms
- SQLite database for storing discovered jobs and match scores
- All Streamlit page layout, widgets, and interactive filters

**Known limitations:**
- Browser back/forward navigation does not update the unified shell's active route while the user is navigating inside the Streamlit iframe
- Streamlit session state is isolated per iframe session; it does not share state with the React shell
- Initial load of the Streamlit app may take 3–5 seconds while the Python process initializes (subsequent loads are fast)

---

### Insight Engine

**How the embed is configured:**
- Started with `--server.baseUrlPath=/embed/insight-engine`
- CORS and XSRF protection disabled for iframe compatibility (same as above)
- n8n automation workflows are handled by a separate container started via the `n8n` Docker Compose profile
- Nginx proxies `/embed/insight-engine/` to port 8502

**What was preserved:**
- All BI dashboards (revenue analysis, operational metrics, trend detection)
- All data pipeline logic connecting to n8n workflow outputs
- All charting and visualization components (Altair, Plotly charts within Streamlit)
- SQLite data store for cached analytics results

**Known limitations:**
- n8n integration requires the `--profile n8n` flag at startup; if n8n is not running, Insight Engine shows a warning but continues to display historical data
- Dashboard auto-refresh interval inside the iframe may not align with the unified shell's polling cycle

---

### Warehouse Copilot

**How the embed is configured:**
- Started with `--server.baseUrlPath=/embed/warehouse`
- CORS and XSRF protection disabled
- Warehouse Copilot has its own FastAPI backend (inventory CRUD, AI recommendations). This backend is proxied separately at `/api/warehouse`
- Nginx proxies `/embed/warehouse/` to port 8503

**What was preserved:**
- All inventory management workflows (stock tracking, reorder logic, supplier management)
- AI recommendation engine (demand forecasting, reorder point suggestions)
- ChromaDB vector store for product similarity search
- SQLite database for inventory records
- FastAPI backend for programmatic inventory access

**Known limitations:**
- ChromaDB vector store is stored in a bind-mounted volume; ensure this volume is included in any backup strategy
- The Warehouse FastAPI backend is a separate process from the Streamlit frontend — both must be healthy for full functionality

---

## Section 3: New Components Built

### Unified Frontend Shell

The following new components were built specifically for the unified platform:

**Layout components:**
- `AppShell` — top-level layout wrapper managing sidebar state and scroll containers
- `Sidebar` — collapsible navigation with module groupings (Ops, Analytics, AI Tools)
- `TopBar` — persistent header with platform name, global health indicator, and user actions
- `EmbedFrame` — iframe wrapper component with loading states, error fallback, and resize handling

**Shared UI components:**
- `StatusBadge` — color-coded status indicator (healthy, degraded, offline, unknown)
- `MetricCard` — reusable KPI card with value, label, trend arrow, and optional sparkline
- `ServiceCard` — dashboard tile showing service name, status, description, and quick-launch link

**Dashboard home page:**
- Queries `/api/gateway/platform/status` on mount and on a 30-second polling interval
- Renders one `ServiceCard` per registered service with live status from the gateway
- Shows a summary row of platform-wide health metrics

### Design System

- `tokens.css` — CSS custom properties for all colors, spacing, typography scales, border radii, and shadow levels. All components reference tokens; no hardcoded color values exist in component files.
- `global.css` — CSS reset, base element styles, scrollbar styling, and utility classes

### Gateway API

The Gateway API is an entirely new FastAPI service with the following responsibilities:

- `GET /api/gateway/health` — returns its own health status (used by Nginx upstream health checks)
- `GET /api/gateway/platform/status` — fans out health checks to all registered services concurrently using `asyncio.gather`, collects results with individual timeouts, and returns a unified status object
- `GET /api/gateway/services` — returns the registry of all services with their names, routes, descriptions, and types
- Service registry is defined in a configuration file, making it straightforward to add new services in the future

### Nginx Reverse Proxy

A new `nginx.conf` was written to route all traffic through a single entry point:
- Static frontend assets served directly from the Vite build output
- API requests proxied to appropriate backend containers using `proxy_pass`
- Streamlit embeds proxied with WebSocket upgrade support (required for Streamlit's internal communication)
- Upstream health check configuration for automatic retry on service restart

---

## Section 4: Database Strategy

### Multi-Database Approach

The platform uses different storage solutions per service, chosen to minimize migration risk and preserve each project's existing data access patterns.

| Service | Storage | Rationale |
|---|---|---|
| Autopilot System | PostgreSQL (shared instance, `autopilot` schema) | Already used PostgreSQL; shared instance reduces operational overhead |
| Control Room | PostgreSQL (shared instance, `control_room` schema) | Already used PostgreSQL; schema isolation prevents conflicts |
| Career Agent | SQLite (file-based, per-service volume) | Original design; SQLite is sufficient for single-user job tracking data |
| Insight Engine | SQLite (file-based, per-service volume) | Original design; analytics cache does not require concurrent write access |
| Warehouse Copilot | SQLite + ChromaDB | SQLite for inventory records; ChromaDB for product vector similarity |
| Incident Replay | JSON flat files | Original design; incidents are write-once structured logs, not relational data |

### Why Not Migrate Everything to PostgreSQL?

A full PostgreSQL migration would have required:
- Rewriting ORM models for three services (Career Agent, Insight Engine, Warehouse)
- Migrating all existing SQLite data
- Testing all data access paths post-migration
- Potentially altering query logic written for SQLite semantics

The risk and effort of this migration was not justified. The existing storage solutions are appropriate for their respective workloads. A future phase could consolidate storage if operational complexity increases.

---

## Section 5: API Routing Strategy

### Path-Based Routing

All routing is handled by Nginx using URL path prefixes:

```
/api/autopilot/*       → autopilot-api:8001
/api/control-room/*    → control-room-api:8002
/api/live-control/*    → live-control-api:8003
/api/incident-replay/* → incident-replay-api:8004
/api/warehouse/*       → warehouse-api:8005
/api/gateway/*         → gateway-api:8000
/embed/career-agent/*  → career-agent:8501
/embed/insight-engine/* → insight-engine:8502
/embed/warehouse/*     → warehouse-copilot:8503
/                      → unified-frontend:5173 (dev) or static files (prod)
```

### Why Path-Based Routing Instead of Subdomain Routing

Subdomain routing (e.g., `autopilot.neuroops.local`, `control-room.neuroops.local`) was considered and rejected for the following reasons:

1. **DNS management overhead** — subdomain routing requires DNS records for every service, which adds complexity in development and deployment environments
2. **SSL certificate complexity** — a wildcard certificate or multiple individual certificates would be needed; path-based routing requires only one certificate for the root domain
3. **CORS friction** — cross-origin requests between subdomains require explicit CORS configuration in every service; path-based routing under a single origin eliminates browser CORS enforcement entirely
4. **Simpler local development** — developers can run the platform on `localhost` with no DNS configuration

---

## Section 6: What Was NOT Changed

The following items were explicitly preserved without modification:

- **All original project folders** (`NeuroOps-*`) remain byte-for-byte identical to their state before integration. No files were edited, renamed, or deleted within any original project directory.
- **All business logic and algorithms** — decision engine rules, matching algorithms, forecasting models, and correlation logic are untouched.
- **All data models and schemas** — no database schemas were altered, no SQLite tables were modified, no JSON structures were changed.
- **All existing Docker configurations** — the original `Dockerfile` and any existing `docker-compose.yml` files within each project folder are referenced by the new unified compose but not modified.
- **All data files** — `incidents.json`, PSM datasets, ChromaDB vector store files, and SQLite databases are mounted from their original locations via Docker volumes.
- **All existing API contracts** — every API endpoint, its path, its request schema, and its response schema remain identical. No breaking changes were introduced to any service API.

---

## Section 7: Known Limitations

The following limitations are acknowledged as part of the current integration. They are documented here to set expectations and to inform future development priorities.

**Streamlit XSRF protection disabled**
Streamlit's built-in XSRF protection must be disabled (`--server.enableXsrfProtection=false`) for form submissions to work through the iframe/Nginx proxy combination. This is acceptable because the platform is intended for internal use. If the platform is exposed to untrusted users, additional input validation should be implemented at the API layer.

**No shared authentication layer**
The unified platform does not implement a centralized authentication system. Each service manages its own access control (or has none). Adding a shared auth layer (for example, using an OAuth2 proxy in front of Nginx) is a recommended next step for any production deployment with multiple users.

**No cross-service event bus**
Services do not emit or subscribe to platform-wide events. For example, an incident detected in Control Room does not automatically trigger a view update in Incident Replay. A future integration could introduce a lightweight event bus (Redis pub/sub or a simple webhook system) for cross-service coordination.

**Streamlit initial load latency**
Streamlit applications take 3–5 seconds to initialize their Python process on first load. This is visible as a loading spinner in the iframe. Subsequent loads within the same session are fast. This is a fundamental characteristic of Streamlit and cannot be addressed without rewriting the applications.

**n8n requires explicit profile flag**
The n8n container is not started by default with `docker compose up -d`. It must be explicitly included with `--profile n8n`. This is intentional (n8n consumes significant memory) but may surprise users who expect Insight Engine's automation features to work immediately.

**No unified logging or tracing**
Each service logs independently to its container's stdout. There is no centralized log aggregation or distributed tracing. For production deployments with multiple users, adding a log aggregation solution (such as Loki + Grafana or the ELK stack) would significantly improve observability.

---

## Phase 2 Integration Additions (v2.0.0)

### Gateway-Level Cross-Module Integration

Phase 2 added practical cross-module data flow without modifying source projects or adding a message broker.

**Pattern used:** Gateway-level aggregation + polling

The gateway now maintains a rolling 30-sample health history per service and derives:
- **Alerts** — from service offline/degraded state
- **Anomalies** — from health score trend analysis (sudden drops, gradual declines)
- **Correlations** — by detecting when multiple services in the same logical cluster degrade simultaneously

The `/platform/intelligence` endpoint combines all of this into a single JSON payload that the dashboard polls every 10 seconds.

**Cross-module data flows added in Phase 2:**

| Source | Target | Method | Data |
|--------|--------|--------|------|
| All services | Dashboard | Gateway aggregation | Health, status, response time |
| Autopilot, Control Room, Live Control, Incident Replay | Dashboard events feed | Gateway `/platform/events` | Recent events (best-effort) |
| All services | Dashboard alerts | Derived from health state | Offline/degraded alerts |
| All services (history) | Dashboard anomalies | Gateway rolling window | Trend-based anomalies |
| Ops cluster services | Dashboard correlations | Gateway pattern detection | Cluster degradation insight |

### Auth Layer Integration

A unified auth layer was added at the gateway level:

- Single login point for the entire platform
- All protected routes redirect to `/login`
- JWT token stored in `localStorage`, auto-expiry enforced
- User identity visible in all pages via TopBar
- Logout clears session across the platform

This integration is **frontend-side only** — individual service APIs do not validate the platform JWT.

### Event Endpoint Registry Expansion

The gateway's event aggregation was expanded from 2 to 4 services:
- autopilot `/api/events`
- control-room `/api/events`
- live-control `/api/events` (new)
- incident-replay `/api/incidents` (new)

Services that do not respond to these endpoints are silently skipped with an error recorded in the response metadata.

### What Remains Isolated

The following services have no cross-module data connections beyond health polling:
- Career Agent (Streamlit — no events API)
- Insight Engine (Streamlit — no events API)
- Warehouse Copilot (Streamlit — no events API)
- Warehouse API (no events endpoint)

These services surface in the unified dashboard as health/status cards but do not contribute to event feeds or correlation analysis. Adding event support would require modifying the source projects — deferred to Phase 3.
