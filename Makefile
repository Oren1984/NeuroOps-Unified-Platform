# =============================================================================
# NeuroOps Unified Platform — Makefile
# =============================================================================
# Usage:
#   make          → show help
#   make core     → start core services (ops modules + gateway + UI)
#   make lite     → start minimal: gateway + frontend + nginx + postgres only
#   make full     → start everything (core + heavy AI services + n8n)
#   make heavy    → start heavy AI services on top of core
#   make n8n      → add n8n to core
#   make down     → stop all services
#   make logs     → tail all service logs
#   make status   → show running containers
#   make build    → rebuild all images
#   make reset    → stop, remove volumes, restart core (DESTRUCTIVE)
# =============================================================================

COMPOSE = docker compose
FLAGS   =

.DEFAULT_GOAL := help

.PHONY: help core lite full heavy n8n down logs status build build-nc reset ps

help:
	@echo ""
	@echo "  NeuroOps Unified Platform"
	@echo ""
	@echo "  Deployment Modes:"
	@echo "    make core    — Recommended: ops modules + gateway + UI + postgres (~1.5 GB RAM)"
	@echo "    make lite    — Minimal: gateway + frontend + nginx + postgres (~350 MB RAM)"
	@echo "    make heavy   — Core + AI-heavy services (warehouse, career, insight) (~4+ GB RAM)"
	@echo "    make full    — Everything including n8n (~5+ GB RAM)"
	@echo "    make n8n     — Core + n8n automation engine"
	@echo ""
	@echo "  Operations:"
	@echo "    make down    — Stop all services"
	@echo "    make logs    — Tail all logs"
	@echo "    make status  — Show running containers"
	@echo "    make build   — Rebuild all images (cached)"
	@echo "    make build-nc— Rebuild all images (no cache)"
	@echo "    make reset   — Full reset (destroys volumes!) — use with caution"
	@echo ""

## Start core operational services (recommended server mode)
core:
	$(COMPOSE) up -d

## Start minimal lite mode (gateway + UI + postgres only, no module services)
lite:
	@echo "Starting NeuroOps in LITE mode (gateway + frontend + nginx + postgres)"
	$(COMPOSE) --profile lite up -d postgres gateway-api frontend nginx

## Start core + heavy AI services
heavy:
	$(COMPOSE) --profile heavy up -d

## Start core + heavy + n8n (everything)
full:
	$(COMPOSE) --profile heavy --profile n8n up -d

## Add n8n to running core
n8n:
	$(COMPOSE) --profile n8n up -d

## Stop all services
down:
	$(COMPOSE) --profile heavy --profile n8n down

## Tail logs from all running services
logs:
	$(COMPOSE) logs -f --tail=100

## Show container status
status:
	$(COMPOSE) ps

## Alias for status
ps: status

## Rebuild all images (with cache)
build:
	$(COMPOSE) --profile heavy --profile n8n build

## Rebuild all images (no cache)
build-nc:
	$(COMPOSE) --profile heavy --profile n8n build --no-cache

## Show gateway health (requires curl)
health:
	@curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health

## Show platform intelligence summary
intel:
	@curl -s http://localhost:8000/platform/intelligence | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/platform/intelligence

## DESTRUCTIVE: stop, remove all volumes, restart core
reset:
	@echo "WARNING: This will destroy all data volumes. Press Ctrl+C to cancel, Enter to continue."
	@read _confirm
	$(COMPOSE) --profile heavy --profile n8n down -v
	$(COMPOSE) up -d
