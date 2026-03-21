# NeuroOps Unified Platform — v4.0.0

A single-pane-of-glass operations platform that unifies 7 independent AI-powered systems into one cohesive interface.

---

## Overview

NeuroOps Unified Platform merges seven standalone projects — spanning autonomous operations, real-time monitoring, incident investigation, job discovery, business intelligence, and warehouse management — into a single deployable application. All original projects remain fully intact and untouched. The unified shell wraps them through a combination of direct React integration (for FastAPI-backed modules) and iframe embedding (for Streamlit modules), connected by a new gateway API and Nginx reverse proxy.

LLM integrations are entirely optional. The platform runs in demo mode out of the box without any API keys.

---

## Architecture Overview

```text
Browser
  └── Nginx (port 80/443)
        ├── /                        → Unified React Frontend (Vite)
        ├── /api/gateway             → Gateway API (FastAPI)
        ├── /api/autopilot           → Autopilot System API
        ├── /api/control-room        → Control Room API
        ├── /api/live-control        → Live Control API
        ├── /api/incident-replay     → Incident Replay API
        ├── /embed/career-agent      → Career Agent (Streamlit)
        ├── /embed/insight-engine    → Insight Engine (Streamlit)
        └── /embed/warehouse         → Warehouse Copilot (Streamlit)
```

The Gateway API aggregates health checks across all services and exposes a unified platform status endpoint. The React frontend communicates with each service API directly through the Nginx-proxied paths.

---

## Module Reference

| Module | Type | Route | Description |
|---|---|---|---|
| Unified Frontend | React 18 + Vite | `/` | Shared shell, sidebar navigation, dashboard home |
| Gateway API | FastAPI | `/api/gateway` | Health aggregation, platform status, service orchestration |
| Autopilot System | React + FastAPI + PostgreSQL | `/autopilot` | AI decision engine and autonomous operations management |
| Control Room | React + FastAPI + PostgreSQL | `/control-room` | System observability, alerting, and investigation workflows |
| Live Control | React + FastAPI | `/live-control` | Real-time metrics streaming and live alerting |
| Incident Replay | React (TypeScript) + FastAPI | `/incident-replay` | Incident timeline reconstruction and step-by-step replay |
| Platform Events | React | `/events` | Live platform event stream with severity and service filtering |
| Career Agent | Streamlit | `/embed/career-agent` | AI-powered job discovery and LLM-based resume matching |
| Insight Engine | Streamlit + n8n | `/embed/insight-engine` | Business intelligence dashboards and automated analytics |
| Warehouse Copilot | Streamlit + FastAPI | `/embed/warehouse` | Inventory management with AI-driven recommendations |

---

## Quick Start

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

Open `http://localhost` in your browser. All services will be available within 30–60 seconds as containers complete their health checks.

### Optional: Monitoring Stack (Prometheus + Grafana)

```bash
docker compose --profile monitoring up -d
```

Grafana will be available at `http://localhost:3000` (default credentials: `admin` / `neuroops2024`).

### Optional: n8n Automation Engine

```bash
docker compose --profile n8n up -d
```

---

## Port Reference

All internal API services communicate exclusively over the Docker internal network. Only Nginx, PostgreSQL, and optional monitoring/automation services are accessible from the host.

| Service | Internal Port | Host Port |
|---|---|---|
| Nginx | 80 / 443 | 80 / 443 |
| Unified Frontend (Vite dev) | 5173 | 5173 (dev only) |
| Gateway API | 8000 | — (internal only) |
| Autopilot API | 8000 | — (internal only) |
| Control Room API | 8000 | — (internal only) |
| Live Control API | 8000 | — (internal only) |
| Incident Replay API | 8000 | — (internal only) |
| Career Agent (Streamlit) | 8501 | — (internal only) |
| Insight Engine (Streamlit) | 8501 | — (internal only) |
| Warehouse Copilot (Streamlit) | 8501 | — (internal only) |
| PostgreSQL | 5432 | 5432 (configurable via `POSTGRES_EXPOSE_PORT`) |
| Prometheus (monitoring profile) | 9090 | 9090 |
| Grafana (monitoring profile) | 3000 | 3000 |
| n8n (n8n profile) | 5678 | 5678 |

> All API traffic goes through Nginx at port 80. Direct host access to individual API ports is intentionally disabled to reduce attack surface.

---

## Makefile Targets

```bash
make up          # Start core platform (lite profile)
make up-full     # Start all services (heavy profile)
make monitoring  # Start Prometheus + Grafana monitoring stack
make down        # Stop all containers
make build       # Build all images
make reset       # Full teardown + volume removal
make logs        # Tail all container logs
make ps          # Show container status
```

---

## Deployment Instructions

### Production (Linux server with Docker)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/NeuroOps-Unified-Platform.git
cd NeuroOps-Unified-Platform

# 2. Configure environment
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and PLATFORM_SECRET at minimum

# 3. Build and start all services
docker compose build
docker compose up -d

# 4. Verify all containers are healthy
docker compose ps

# 5. Check gateway health
curl http://localhost/api/gateway/health
```

For full SSL/TLS setup and production hardening, see [docs/deployment/DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md).

---

## Development Mode

To run individual services locally without Docker:

```bash
# Unified frontend (hot reload)
cd apps/unified-frontend
npm install
npm run dev
``` Available at http://localhost:5173

# Gateway API
```bash
cd services/gateway-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

# Any individual service API (example: Autopilot)

```bash
cd NeuroOps-Autopilot-System/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

For full dev environment setup including hot reload and Docker Compose overrides, see `docker-compose.dev.yml`.

---

## Environment Variables

Copy `.env.example` to `.env` before starting the platform.

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | Yes | Password for the shared PostgreSQL instance |
| `PLATFORM_SECRET` | Yes (non-local) | JWT signing secret — change before any server deployment |
| `PLATFORM_USER` | No | Platform login username (default: `admin`) |
| `PLATFORM_PASSWORD` | No | Platform login password (default: `neuroops2024`) |
| `POSTGRES_USER` | No | PostgreSQL username (default: `neuroops`) |
| `POSTGRES_DB` | No | Default database name (default: `neuroops`) |
| `POSTGRES_EXPOSE_PORT` | No | Host port for PostgreSQL (leave blank to block external access) |
| `EVENTS_RETENTION_DAYS` | No | Days to retain platform events before automatic cleanup (default: `30`) |
| `GRAFANA_USER` | No | Grafana admin username (default: `admin`) |
| `GRAFANA_PASSWORD` | No | Grafana admin password (default: `neuroops2024`) |
| `LLM_PROVIDER` | No | LLM backend: `demo`, `openai`, `anthropic`, `ollama` (default: `demo`) |
| `OPENAI_API_KEY` | No | OpenAI key for LLM features |
| `ANTHROPIC_API_KEY` | No | Anthropic key for Claude-powered features |
| `ENABLE_SEMANTIC_SCORING` | No | Enable vector-based resume scoring in Career Agent |
| `N8N_ENABLED` | No | Enable n8n webhook integration in Insight Engine |

See `.env.example` for the full list with inline comments.

---

## Project Structure

```
NeuroOps-Unified-Platform/
├── README.md
├── Makefile                            # Convenience targets for compose operations
├── docker-compose.yml                  # Full platform compose file
├── docker-compose.dev.yml              # Dev overrides (hot reload, port bindings)
├── .env.example                        # Environment variable template
├── nginx/
│   ├── nginx.conf                      # Production reverse proxy configuration
│   └── nginx.dev.conf                  # Development reverse proxy configuration
├── postgres/
│   └── init/
│       └── 01_init.sql                 # PostgreSQL schema initialisation
├── monitoring/
│   ├── prometheus.yml                  # Prometheus scrape configuration
│   └── grafana/
│       ├── dashboards/
│       │   └── neuroops-platform.json  # NeuroOps Grafana dashboard
│       └── provisioning/
│           ├── datasources/            # Grafana datasource provisioning
│           └── dashboards/             # Grafana dashboard provisioning
├── apps/
│   └── unified-frontend/               # React 18 + Vite unified shell
│       ├── src/
│       │   ├── components/             # Shared UI components
│       │   ├── modules/                # Per-service React modules
│       │   └── router/                 # React Router configuration
│       └── vite.config.js
├── services/
│   └── gateway-api/                    # FastAPI gateway and health aggregator
│       ├── app/
│       │   ├── main.py                 # FastAPI application + all endpoints
│       │   └── events.py               # Platform events module (PostgreSQL)
│       └── requirements.txt
├── docs/
│   ├── deployment/
│   │   └── DEPLOYMENT_GUIDE.md
│   ├── integration/
│   │   └── INTEGRATION_REPORT.md
│   └── architecture/
│       ├── ARCHITECTURE_SUMMARY.md
│       ├── NEUROOPS_UNIFIED_PLATFORM_ARCHITECTURE.md
│       └── PHASE4_PLATFORM_EXPERIENCE_AND_HARDENING.md
├── NeuroOps-Autopilot-System/          # Original project — untouched
├── NeuroOps-Control-Room-System/       # Original project — untouched
├── NeuroOps-live-Control-System/       # Original project — untouched
├── NeuroOps-Incident-Replay-System/    # Original project — untouched
├── NeuroOps-Career-Agent-System/       # Original project — untouched
├── NeuroOps-Insight-Engine-System/     # Original project — untouched
└── NeuroOps-Warehouse-Copilot-System/  # Original project — untouched
```

---

## Important Notes

**Original projects are untouched.** Every source project folder (`NeuroOps-*`) remains exactly as it was before integration. The unified platform references their code and Docker configurations but never modifies them. You can continue developing each project independently and those changes will be reflected in the unified platform on the next build.

**LLM providers are optional.** Career Agent, Insight Engine, and Warehouse Copilot all include demo and fallback modes that work without any external API keys. Set `LLM_PROVIDER` and the corresponding API key in your `.env` to enable full AI-powered features.

**API ports are not host-exposed.** All internal service APIs (gateway, autopilot, control-room, etc.) communicate exclusively over the Docker internal network. All external traffic enters through Nginx on port 80/443. This is intentional for security — do not re-expose individual API ports in production.

---

## Further Documentation

- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md) — step-by-step production deployment on Linux

- [Integration Report](docs/integration/INTEGRATION_REPORT.md) — detailed rationale behind every integration decision

- [Architecture Summary](docs/architecture/ARCHITECTURE_SUMMARY.md) — concise component map and tech stack reference

- [Phase 4 Hardening](docs/architecture/PHASE4_PLATFORM_EXPERIENCE_AND_HARDENING.md) — platform experience and hardening record

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

