# NeuroOps Unified Platform — Deployment Guide

> **Platform Version:** 2.0.0 (Phase 2)
> **Updated:** 2026-03-21

---

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Docker Engine | 24.x | Latest |
| Docker Compose | v2.x | Latest |
| RAM (core mode) | 2 GB | 4 GB |
| RAM (full mode) | 6 GB | 8 GB |
| Disk | 10 GB | 20 GB |
| CPU | 2 vCPU | 4 vCPU |

---

## Quick Start

```bash
# 1. Enter the unified platform directory
cd NeuroOps-Unified-Platform

# 2. Create your environment file
cp .env.example .env

# 3. Edit .env — at minimum change these before any non-local deployment:
#   PLATFORM_PASSWORD=<strong password>
#   PLATFORM_SECRET=<random string, 32+ chars>
#   POSTGRES_PASSWORD=<strong password>

# 4. Start the platform (core mode — recommended)
docker compose up -d

# 5. Open in browser
#    http://localhost
#    Login: admin / neuroops2024 (or your configured credentials)
```

---

## Deployment Modes

### Core (Default) — Recommended Server Mode

Starts all 4 operational modules + platform infrastructure.

```bash
docker compose up -d
# or
make core
```

**Services:** postgres, gateway-api, frontend, nginx, autopilot-api, control-room-api, live-control-api, incident-replay-api

**Estimated RAM:** ~1.5 GB
**Suitable for:** 2–4 GB VPS, standard server deployment, demos

---

### Lite — Minimal Mode

Only platform infrastructure. No operational modules.

```bash
make lite
```

**Services:** postgres, gateway-api, frontend, nginx

**Estimated RAM:** ~350 MB
**Suitable for:** 1 GB VPS, CI/CD, frontend/gateway development, resource-constrained environments

> **Note:** Gateway will correctly report operational modules as "offline" in lite mode — this is expected behaviour.

---

### Heavy — Full AI Services

Core + AI-heavy services (warehouse, career agent, insight engine).

```bash
docker compose --profile heavy up -d
# or
make heavy
```

**Additional services:** warehouse-api, warehouse-copilot, career-agent, insight-engine

**Additional RAM:** ~2–3 GB (LLM-dependent)
**Suitable for:** 8+ GB server, full feature demonstration

---

### Full — Everything

Core + heavy + n8n workflow automation.

```bash
docker compose --profile heavy --profile n8n up -d
# or
make full
```

**Estimated RAM:** ~5 GB+

---

### n8n Add-on

Add n8n workflow automation to any running deployment.

```bash
docker compose --profile n8n up -d
# or
make n8n
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure.

### Security-Critical (change before any non-local deployment)

| Variable | Default | Description |
|----------|---------|-------------|
| `PLATFORM_USER` | `admin` | Platform login username |
| `PLATFORM_PASSWORD` | `neuroops2024` | Platform login password |
| `PLATFORM_SECRET` | `neuroops-platform-secret-...` | JWT signing secret — **must change** |
| `POSTGRES_PASSWORD` | `neuroops_dev_2024` | PostgreSQL password — **must change** |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TOKEN_EXPIRE_HOURS` | `8` | JWT token lifetime in hours |
| `POSTGRES_EXPOSE_PORT` | `5432` | External postgres port (leave empty to block external access) |
| `LLM_PROVIDER` | `demo` | LLM backend: `demo`, `rule_based`, `openai`, `anthropic`, `ollama` |
| `OPENAI_API_KEY` | (empty) | Required for OpenAI LLM features |
| `ANTHROPIC_API_KEY` | (empty) | Required for Anthropic LLM features |

---

## Health Verification

```bash
# Gateway health
curl http://localhost:8000/health

# Platform intelligence summary (alerts, anomalies, health)
curl http://localhost:8000/platform/intelligence | python3 -m json.tool

# Platform alerts only
curl http://localhost:8000/platform/alerts

# Lightweight metrics JSON
curl http://localhost:8000/metrics

# All container status
make status
# or
docker compose ps
```

---

## Service Port Reference

| Service | External Port | Notes |
|---------|--------------|-------|
| Nginx (public) | **80, 443** | Only this should be publicly exposed |
| Gateway API | 8000 | Via nginx at `/api/gateway/` |
| Autopilot API | 8001 | Via nginx at `/api/autopilot/` |
| Control Room API | 8002 | Via nginx at `/api/control-room/` |
| Live Control API | 8003 | Via nginx at `/api/live-control/` |
| Incident Replay API | 8004 | Via nginx at `/api/incident-replay/` |
| Warehouse API | 8007 | Via nginx at `/api/warehouse/` |
| Career Agent | 8511 | Via nginx at `/embed/career-agent/` |
| Insight Engine | 8512 | Via nginx at `/embed/insight-engine/` |
| Warehouse Copilot | 8513 | Via nginx at `/embed/warehouse-copilot/` |
| PostgreSQL | 5432 | Internal only (configure firewall) |
| n8n (optional) | 5678 | Via nginx if configured |

**Production firewall:** Only ports 80 and 443 should be public. All others should be firewalled.

---

## Logs & Observability

```bash
# All service logs (tailed)
make logs
# or
docker compose logs -f --tail=100

# Single service
docker compose logs -f gateway-api

# JSON metrics from gateway
curl http://localhost:8000/metrics
```

The gateway's `/metrics` endpoint returns structured JSON covering all service health scores, response times, and platform state. This is the primary observability entry point.

For Prometheus integration (Phase 3), use a JSON-to-Prometheus exporter pointed at `/metrics`.

---

## Data & Volumes

All persistent data is stored in named Docker volumes:

| Volume | Used by |
|--------|---------|
| `neuroops-unified_postgres-data` | PostgreSQL (autopilot, control-room schemas) |
| `neuroops-unified_warehouse-data` | Warehouse API data |
| `neuroops-unified_chroma-data` | Chroma vector DB (warehouse copilot) |
| `neuroops-unified_career-agent-data` | Career agent job data |
| `neuroops-unified_insight-engine-data` | Insight engine data |
| `neuroops-unified_n8n-data` | n8n workflows |

### Backup PostgreSQL

```bash
docker exec neuroops-postgres pg_dump -U neuroops neuroops > backup-$(date +%Y%m%d).sql
```

### Backup all volumes

```bash
docker run --rm \
  -v neuroops-unified_postgres-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz -C /data .
```

---

## Stopping & Resetting

```bash
# Stop all services (preserves volumes)
make down

# Stop without removing containers
docker compose stop

# DESTRUCTIVE: stop + remove all volumes (all data lost)
make reset
```

---

## TLS / HTTPS

Phase 2 does not include automated TLS. To add HTTPS:

1. Obtain a certificate (Let's Encrypt / certbot recommended)
2. Mount cert/key into nginx container via volumes
3. Add `server { listen 443 ssl; ssl_certificate ...; ssl_certificate_key ...; }` to `nginx/nginx.conf`
4. Add port 80 → 443 redirect block

This is a standard nginx TLS pattern. See Phase 3 recommendations in `PHASE2_PLATFORM_HARDENING.md`.

---

## Auth Notes

Platform access is protected by a lightweight JWT auth layer:

- Default credentials: `admin` / `neuroops2024` — **change these before deploying**
- Credentials configured via `PLATFORM_USER` and `PLATFORM_PASSWORD` env vars
- JWT signed with `PLATFORM_SECRET` — **must be changed** for any non-local deployment
- Token expires after `TOKEN_EXPIRE_HOURS` (default: 8 hours)
- This auth layer protects the unified frontend shell only; direct API port access bypasses it

This is an **internal platform auth layer** suitable for demo and experimental deployments.
For production systems requiring full auth, see Phase 3 roadmap in `PHASE2_PLATFORM_HARDENING.md`.
