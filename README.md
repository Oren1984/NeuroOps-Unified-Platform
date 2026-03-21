# NeuroOps Unified Platform

A single-pane-of-glass operations platform that unifies 7 independent AI-powered systems into one cohesive interface.

---

## Overview

NeuroOps Unified Platform merges seven standalone projects — spanning autonomous operations, real-time monitoring, incident investigation, job discovery, business intelligence, and warehouse management — into a single deployable application. All original projects remain fully intact and untouched. The unified shell wraps them through a combination of direct React integration (for FastAPI-backed modules) and iframe embedding (for Streamlit modules), connected by a new gateway API and Nginx reverse proxy.

LLM integrations are entirely optional. The platform runs in demo mode out of the box without any API keys.

---

## Architecture Overview

```
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
| Autopilot System | React + FastAPI + PostgreSQL | `/api/autopilot` | AI decision engine and autonomous operations management |
| Control Room | React + FastAPI + PostgreSQL | `/api/control-room` | System observability, alerting, and investigation workflows |
| Live Control | React + FastAPI | `/api/live-control` | Real-time metrics streaming and live alerting |
| Incident Replay | React (TypeScript) + FastAPI | `/api/incident-replay` | Incident timeline reconstruction and step-by-step replay |
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

---

## Port Reference

| Service | Internal Port | Exposed (dev) |
|---|---|---|
| Nginx | 80 | 80 |
| Unified Frontend (Vite dev) | 5173 | 5173 |
| Gateway API | 8000 | 8010 |
| Autopilot API | 8001 | 8001 |
| Control Room API | 8002 | 8002 |
| Live Control API | 8003 | 8003 |
| Incident Replay API | 8004 | 8004 |
| Career Agent (Streamlit) | 8501 | 8501 |
| Insight Engine (Streamlit) | 8502 | 8502 |
| Warehouse Copilot (Streamlit) | 8503 | 8503 |
| PostgreSQL | 5432 | 5432 |
| n8n (optional) | 5678 | 5678 |

---

## Deployment Instructions

### Production (Linux server with Docker)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/NeuroOps-Unified-Platform.git
cd NeuroOps-Unified-Platform

# 2. Configure environment
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD at minimum

# 3. Build and start all services
docker compose build
docker compose up -d

# 4. Verify all containers are healthy
docker compose ps

# 5. Check gateway health
curl http://localhost/api/gateway/health
```

For full SSL/TLS setup and production hardening, see [docs/deployment/DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md).

### Optional: Start n8n Automation Engine

```bash
docker compose --profile n8n up -d
```

---

## Development Mode

To run individual services locally without Docker:

```bash
# Unified frontend (hot reload)
cd apps/unified-frontend
npm install
npm run dev
# Available at http://localhost:5173

# Gateway API
cd services/gateway-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8010

# Any individual service API (example: Autopilot)
cd NeuroOps-Autopilot-System/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

For development, set the gateway URL in the frontend environment:

```bash
# apps/unified-frontend/.env.local
VITE_GATEWAY_URL=http://localhost:8010
```

---

## Environment Variables

Copy `.env.example` to `.env` before starting the platform.

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | Yes | Password for the shared PostgreSQL instance |
| `POSTGRES_USER` | No | PostgreSQL username (default: `neuroops`) |
| `POSTGRES_DB` | No | Default database name (default: `neuroops`) |
| `OPENAI_API_KEY` | No | OpenAI key for LLM features (demo mode if omitted) |
| `ANTHROPIC_API_KEY` | No | Anthropic key for Claude-powered features |
| `ENABLE_SEMANTIC_SCORING` | No | Enable vector-based resume scoring in Career Agent |
| `N8N_BASIC_AUTH_PASSWORD` | No | Password for n8n web UI (required if using n8n profile) |
| `SECRET_KEY` | No | JWT secret for API authentication (auto-generated if omitted) |

See `.env.example` for the full list with inline comments.

---

## Project Structure

```
NeuroOps-Unified-Platform/
├── README.md
├── docker-compose.yml                  # Full platform compose file
├── .env.example                        # Environment variable template
├── nginx/
│   └── nginx.conf                      # Reverse proxy configuration
├── apps/
│   └── unified-frontend/               # React 18 + Vite unified shell
│       ├── src/
│       │   ├── components/             # Shared UI components (StatusBadge, MetricCard, etc.)
│       │   ├── modules/                # Per-service React modules
│       │   ├── pages/                  # Route-level page components
│       │   └── styles/                 # Design tokens and global CSS
│       └── vite.config.ts
├── services/
│   └── gateway-api/                    # FastAPI gateway and health aggregator
│       ├── main.py
│       └── requirements.txt
├── docs/
│   ├── deployment/
│   │   └── DEPLOYMENT_GUIDE.md
│   ├── integration/
│   │   └── INTEGRATION_REPORT.md
│   └── architecture/
│       ├── ARCHITECTURE_SUMMARY.md
│       └── NEUROOPS_UNIFIED_PLATFORM_ARCHITECTURE.md
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

**LLM providers are optional.** Career Agent, Insight Engine, and Warehouse Copilot all include demo and fallback modes that work without any external API keys. Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in your `.env` to enable full AI-powered features.

---

## Further Documentation

- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md) — step-by-step production deployment on Linux
- [Integration Report](docs/integration/INTEGRATION_REPORT.md) — detailed rationale behind every integration decision
- [Architecture Summary](docs/architecture/ARCHITECTURE_SUMMARY.md) — concise component map and tech stack reference
