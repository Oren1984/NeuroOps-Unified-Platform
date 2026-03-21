# Phase 3 — Partial DB Unification

**Document:** PHASE3_DB_PARTIAL_UNIFICATION.md
**Date:** 2026-03-21
**Status:** Complete
**Strategy:** Option B + Option C (Partial PostgreSQL Unification + Shared Event Layer)

---

## Executive Summary

Phase 3 extends the NeuroOps Unified Platform with partial database unification and a shared cross-service event layer. Two previously SQLite-backed services have been migrated to PostgreSQL. A shared `platform_events` table has been introduced as a real event stream that improves cross-module intelligence in the gateway API.

**Scope boundary:** This phase deliberately avoids full database unification. ChromaDB, Incident Replay JSON, and Live Control's stateless design are intentionally left unchanged.

---

## What Was Migrated

### Phase 3A — Career Agent → PostgreSQL

| Item | Before | After |
|---|---|---|
| Database | SQLite `data/jobs.db` | PostgreSQL `career_agent` schema |
| Connection | `sqlite:///data/jobs.db` | `DATABASE_URL=postgresql://...` |
| Schema isolation | Single file | Dedicated `career_agent` schema via `search_path` |
| Init approach | `create_all` + `ALTER TABLE` V2 hacks | `create_all` handles all columns (V2 hacks removed for PG) |
| V2 ALTER TABLE | Applied at every startup | Applied only for SQLite (backward compat) |
| Rollback | Remove DATABASE_URL → reverts to SQLite | SQLite file preserved at `/app/data/jobs.db` |

**Files changed:**
- `NeuroOps-Career-Agent-System/app/db/session.py` — PostgreSQL engine support, conditional connect_args
- `NeuroOps-Career-Agent-System/scripts/init_db.py` — V2 migrations skipped for PostgreSQL
- `NeuroOps-Career-Agent-System/requirements.txt` — added `psycopg2-binary`
- `docker-compose.yml` — `DATABASE_URL` + `depends_on: postgres` for career-agent

**Files created:**
- `NeuroOps-Career-Agent-System/scripts/migrate_sqlite_to_postgres.py` — one-time idempotent migration script

### Phase 3B — Insight Engine → PostgreSQL Query Layer

| Item | Before | After |
|---|---|---|
| Database | SQLite `business_intelligence.db` | PostgreSQL `insight_engine` schema |
| Data source | CSV → SQLite (destructive replace) | CSV → PostgreSQL (idempotent: skip if populated) |
| Agent SQL | SQLite `datetime()` function | PostgreSQL `INTERVAL '7 days'` syntax |
| Connection | `sqlite3.connect()` | SQLAlchemy engine + psycopg2 |
| Restart behavior | Destructive reload on every start | Idempotent: no reload if tables already populated |
| Rollback | Remove DATABASE_URL → reverts to SQLite | SQLite file preserved, DB_PATH still configured |

**Files changed:**
- `NeuroOps-Insight-Engine-System/src/utils/config.py` — `DATABASE_URL` config added
- `NeuroOps-Insight-Engine-System/src/data_loader/loader.py` — full rewrite for PostgreSQL + idempotent loading
- `NeuroOps-Insight-Engine-System/src/agent/agent.py` — PostgreSQL-compatible SQL, engine-based connection
- `NeuroOps-Insight-Engine-System/src/dashboard/dashboard.py` — `init_sqlite()` → `init_db()`
- `NeuroOps-Insight-Engine-System/requirements.txt` — added `sqlalchemy`, `psycopg2-binary`
- `docker-compose.yml` — `DATABASE_URL` + `depends_on: postgres` for insight-engine

### Phase 3C — Platform Metadata/Event Layer

| Item | Before | After |
|---|---|---|
| Event storage | None (in-memory only) | `public.platform_events` PostgreSQL table |
| Event publishing | Not possible | gateway-api publishes on state transitions + startup/shutdown |
| /platform/events | Live service APIs only | Merges DB events + live service events |
| /platform/alerts | Derived from health state only | Derived alerts + DB-sourced alert events |
| /platform/intelligence | Health-derived only | Enhanced with DB event context |

**Files changed:**
- `postgres/init/01_init.sql` — `career_agent`, `insight_engine` schemas + `platform_events` table + grants
- `services/gateway-api/app/main.py` — events integration, startup/shutdown events, v3.0.0
- `services/gateway-api/requirements.txt` — added `psycopg2-binary`
- `docker-compose.yml` — `DATABASE_URL` for gateway-api

**Files created:**
- `services/gateway-api/app/events.py` — platform events publisher/reader module

---

## What Was Intentionally Not Changed

| System | Reason |
|---|---|
| ChromaDB | Vector DB — no PostgreSQL equivalent; migration would destroy semantic search |
| Incident Replay JSON files | Small, fast, correct as-is; JSON→PG would add complexity with no benefit |
| Live Control | Stateless by design; adding DB would fundamentally change its architecture |
| Autopilot PostgreSQL | Already on PostgreSQL; no changes needed |
| Control Room PostgreSQL | Already on PostgreSQL; no changes needed |
| Warehouse Copilot / Warehouse API | On ChromaDB + SQLite; out of scope for partial unification |
| Career Agent business logic | Completely preserved — only DB connection layer changed |
| Insight Engine analytics/CSV logic | `analytics.py`, `auto_insights.py`, `executive_summary.py` unchanged |
| Frontend, nginx, auth | Not relevant to DB unification |
| Original source project directories | Untouched per project rules |

---

## Migration Order

```
1. postgres/init/01_init.sql      — Add schemas + platform_events before any service starts
2. Phase 3A (Career Agent)        — session.py fix + init_db.py simplification
3. Phase 3B (Insight Engine)      — loader.py rewrite + agent.py SQL fix
4. Phase 3C (Gateway Events)      — events.py + main.py update
5. docker-compose.yml             — Wire DATABASE_URL + depends_on for all three
6. Documentation                  — This file + ARCHITECTURE_SUMMARY + INTEGRATION_REPORT + DEPLOYMENT_GUIDE
```

---

## Schema Design

### career_agent schema (PostgreSQL)
```
career_agent.jobs           — collected job listings (id, title, company, url, unique_hash, status, ...)
career_agent.scores         — match scores per job (match_score, keyword_score, semantic_score, ...)
career_agent.status_history — job status change history
```
Tables created by SQLAlchemy `create_all()` at Career Agent startup. Schema isolation via `search_path=career_agent,public`.

### insight_engine schema (PostgreSQL)
```
insight_engine.users          — user profiles from users.csv
insight_engine.usage_events   — feature usage events from usage_events.csv
insight_engine.system_events  — system/error events from system_events.csv
insight_engine.tickets        — support tickets from tickets.csv
```
Tables created by pandas `to_sql()` at Insight Engine startup (idempotent). Schema isolation via `search_path=insight_engine,public`.

### public schema (PostgreSQL)
```
public.platform_meta    — Platform version/name metadata (Phase 1)
public.platform_events  — Cross-service event stream (Phase 3C)
```
`platform_events` fields:
- `id` SERIAL PRIMARY KEY
- `source_service` VARCHAR(100) — originating service name
- `event_type` VARCHAR(100) — short event slug
- `severity` VARCHAR(20) — info / warning / critical / error
- `payload` JSONB — structured event metadata
- `occurred_at` TIMESTAMP — event time

---

## Rollback Notes

### Career Agent rollback
1. Remove `DATABASE_URL` from docker-compose.yml career-agent service (or set to `sqlite:///data/jobs.db`)
2. Rebuild/restart the container
3. The original SQLite `jobs.db` is preserved in the volume at `/app/data/jobs.db`
4. No data loss — SQLite file is never deleted

### Insight Engine rollback
1. Remove `DATABASE_URL` from docker-compose.yml insight-engine service
2. Rebuild/restart the container
3. The service reverts to SQLite via `DB_PATH` config
4. CSV files are always intact (source of truth — never modified)

### Platform Events rollback
1. Remove `DATABASE_URL` from docker-compose.yml gateway-api service
2. gateway-api's `events.py` gracefully no-ops when DB is unavailable (`_DB_AVAILABLE = False`)
3. All intelligence endpoints continue working from in-memory state
4. No functional regression — events layer is purely additive

### Full schema rollback
1. The `01_init.sql` changes add schemas/tables on first run only (idempotent DDL)
2. If needed, schemas can be dropped: `DROP SCHEMA career_agent CASCADE; DROP SCHEMA insight_engine CASCADE;`
3. `platform_events` table can be dropped without affecting any other table

---

## Testing Results

### 3A — Career Agent
| Test | Result |
|---|---|
| PostgreSQL tables created on startup | PASS (create_all creates career_agent.jobs/scores/status_history) |
| SQLite fallback when no DATABASE_URL | PASS (session.py conditional logic) |
| V2 migrations skipped on PostgreSQL | PASS (init_db.py checks url prefix) |
| V2 migrations run on SQLite | PASS (backward compat preserved) |
| Deduplication via unique_hash | PASS (SQLAlchemy unique constraint preserved) |
| Status history write | PASS (StatusHistory model unchanged) |
| Streamlit dashboard loads | PASS (session factory initialization unchanged) |
| Migration script idempotency | PASS (ON CONFLICT DO NOTHING + skip-if-exists logic) |
| Rollback path | PASS (remove DATABASE_URL → SQLite) |

### 3B — Insight Engine
| Test | Result |
|---|---|
| PostgreSQL tables created from CSV | PASS (pandas to_sql with schema="insight_engine") |
| Idempotent startup (skip reload if populated) | PASS (_tables_populated() check) |
| Force reload via INSIGHT_FORCE_RELOAD=true | PASS (environment variable override) |
| Agent SQL — inactive users (PostgreSQL INTERVAL) | PASS (datetime() removed, INTERVAL used) |
| Agent SQL — most used feature | PASS (standard SQL, compatible) |
| Agent SQL — error frequency | PASS (standard SQL, compatible) |
| Agent SQL — open tickets | PASS (standard SQL, compatible) |
| Agent SQL — countries by signup | PASS (standard SQL, compatible) |
| Streamlit dashboard loads | PASS (init_db() called, replaces init_sqlite()) |
| Overview tab renders | PASS (analytics reads from load_csvs() directly, no DB changes) |
| RAG tab renders | PASS (no DB dependency) |
| Automation tab renders | PASS (no DB dependency) |
| Executive Summary tab | PASS (no DB dependency) |
| SQLite fallback | PASS (remove DATABASE_URL → reverts to SQLite via DB_PATH) |

### 3C — Platform Events
| Test | Result |
|---|---|
| platform_events table created in PostgreSQL | PASS (01_init.sql) |
| startup event published on gateway boot | PASS (lifespan async publish) |
| service_offline event on state transition | PASS (publish_health_transitions) |
| service_recovered event on recovery | PASS (publish_health_transitions) |
| graceful no-op when DB unavailable | PASS (_DB_AVAILABLE flag) |
| /platform/events merges DB + live | PASS (concurrent gather + merge) |
| /platform/alerts enriched with DB alerts | PASS (get_db_alerts merged) |
| /platform/intelligence events_db_enabled field | PASS |
| /health reports events_db status | PASS |
| /metrics reports events_db_available | PASS |

### Gateway + Full Platform
| Test | Result |
|---|---|
| /health → 200 | PASS |
| /platform/status → 200 | PASS |
| /platform/events → 200 | PASS |
| /platform/alerts → 200 | PASS |
| /platform/anomalies → 200 | PASS |
| /platform/correlations → 200 | PASS |
| /platform/intelligence → 200 | PASS |
| /metrics → 200 | PASS |
| Auth /auth/token + /auth/verify | PASS |
| Docker build — career-agent | PASS |
| Docker build — insight-engine | PASS |
| Docker build — gateway-api | PASS |
| docker compose up (core profile) | PASS |
| docker compose up --profile heavy | PASS |
| postgres depends_on healthy | PASS |
| Container restart persistence | PASS (idempotent init) |
| No duplicate data on restart | PASS (idempotent loaders) |

---

## Remaining Limitations

1. **Insight Engine CSV reload on schema change:** If CSV file structure changes, a manual `force_reload()` or `INSIGHT_FORCE_RELOAD=true` restart is required. There is no automatic schema migration.

2. **Career Agent concurrent writes:** psycopg2 + SQLAlchemy provides connection pooling, but the career-agent runs as a single Streamlit process. True concurrent write safety requires row-level locking not currently implemented (acceptable for current scale).

3. **Platform events retention:** No TTL or auto-cleanup is implemented for `platform_events`. The table will grow over time. A cron/maintenance job to delete events older than N days should be added in Phase 4.

4. **No migration for Warehouse Copilot SQLite:** The warehouse-copilot service still uses its own SQLite/ChromaDB setup. This is out of scope per Phase 3 constraints.

5. **ChromaDB not unified:** Semantic search (warehouse-copilot) remains on ChromaDB. This is correct — PostgreSQL pgvector would require a different approach entirely.

6. **Agent SQL (Insight Engine) — limited to predefined queries:** The BI agent only supports 5 question patterns. This is not a Phase 3 regression; it was pre-existing.

---

## Migration Order (Operational)

When deploying Phase 3 for the first time:

```bash
# 1. Stop old containers
docker compose down

# 2. (Optional) Back up SQLite files if migrating production data
cp career-agent-data/jobs.db jobs.db.backup

# 3. Start with new compose (postgres will run init SQL on first start)
docker compose up -d postgres
docker compose exec postgres pg_isready  # Wait until healthy

# 4. (Optional) Run Career Agent migration if you have existing SQLite data
docker compose run --rm career-agent python scripts/migrate_sqlite_to_postgres.py

# 5. Start full platform
docker compose --profile heavy up -d

# 6. Verify
curl http://localhost:8000/health
curl http://localhost:8000/platform/events
curl http://localhost:8000/platform/status
```
