# Phase 4 — Platform Experience & Hardening

**Document:** PHASE4_PLATFORM_EXPERIENCE_AND_HARDENING.md
**Date:** 2026-03-21
**Status:** Complete
**Gateway Version:** 4.0.0
**Frontend Version:** 4.0.0

---

## Executive Summary

Phase 4 transforms the NeuroOps Unified Platform from a functional integration into a polished, production-hardened AI operations command center. Seven targeted improvements span backend reliability, data intelligence, observability, and user experience.

---

## Phase 4A — Platform Events Lifecycle Management

**Problem:** The `platform_events` table grows indefinitely with no retention policy. At steady state (~1 event/10s), the table would accumulate ~3M rows per year.

**Solution:** Time-based retention with configurable TTL and automatic hourly cleanup.

### Changes

**`services/gateway-api/app/events.py`**
- Added `_RETENTION_DAYS` module constant (reads `EVENTS_RETENTION_DAYS` env var, default 30)
- Added `_sync_cleanup(retention_days)` — DELETE WHERE `occurred_at < NOW() - INTERVAL '% days'`
- Added `async cleanup_old_events(retention_days)` — async wrapper, graceful no-op when DB unavailable

**`services/gateway-api/app/main.py`**
- Added `_EVENTS_RETENTION_DAYS` config from env
- Added `_cleanup_task` task reference for proper cancellation
- Added `_background_events_cleanup()` — hourly background coroutine (60s initial delay, 3600s interval)
- Added `POST /platform/events/cleanup` endpoint — manual trigger with optional `retention_days` override
- Bumped version to 4.0.0

**`docker-compose.yml`**
- Added `EVENTS_RETENTION_DAYS: ${EVENTS_RETENTION_DAYS:-30}` to gateway-api environment

**`.env.example`**
- Added `EVENTS_RETENTION_DAYS=30` with documentation comment

### Behaviour
- Default retention: 30 days
- Cleanup runs hourly after a 60-second startup delay
- If DB is unavailable, cleanup silently no-ops — no error surfaced
- Manual cleanup: `POST /platform/events/cleanup?retention_days=7`
- Deleted count logged at INFO level only when rows were actually removed

---

## Phase 4B — Insight Engine Smart CSV Auto-Sync

**Problem:** The Phase 3B loader used a binary populated/not-populated check. After updating CSV files, the operator had to manually set `INSIGHT_FORCE_RELOAD=true` and restart. On a restart with `INSIGHT_FORCE_RELOAD=false`, no reload occurred even if the CSVs changed.

**Solution:** SHA256 hash comparison per CSV file. Only reload the table(s) whose CSV has changed.

### Changes

**`NeuroOps-Insight-Engine-System/src/data_loader/loader.py`**

- Added `hashlib` import and `_sha256_file(path)` — streams file in 64 KB chunks, returns hex digest
- Added `compute_csv_hashes()` — returns `{table_name: sha256_hex}` for all 4 managed CSVs
- Added `csv_sync_state` table (auto-created, idempotent):
  - PostgreSQL: `insight_engine.csv_sync_state` with `ON CONFLICT DO UPDATE`
  - SQLite: `csv_sync_state` with `INSERT OR REPLACE`
- Added `_get_stored_hashes(engine)` — reads stored hashes from DB
- Added `_store_hashes(engine, hashes)` — upserts current hashes after successful load
- Rewrote `init_db()` — smart sync logic:
  1. Compute current CSV hashes
  2. If `INSIGHT_FORCE_RELOAD=true` → reload all, store all hashes
  3. Otherwise compare current vs stored → reload only stale tables
  4. Store updated hashes for synced tables
- Updated `_load_dataframes_to_db()` — accepts optional `tables_to_reload` list for partial reload
- Updated `force_reload()` — stores hashes after full reload

### Behaviour
- **First run:** all 4 tables loaded (no stored hashes yet), hashes stored
- **Subsequent restarts:** hash comparison → skip unchanged tables (typical: 0 reloads in <1s)
- **After updating a CSV:** only that table is reloaded on next start
- **INSIGHT_FORCE_RELOAD=true:** forces full reload regardless of hashes, then stores new hashes
- CSV files remain source of truth; never modified

---

## Phase 4C — Career Agent Concurrency Hardening

**Problem 1 (normalizer.py SAVEPOINT bug):** `insert_jobs_dedup` flushed each job individually and called `session.rollback()` on `IntegrityError`. This rolled back the entire transaction, not just the failing row — all previously flushed-but-not-committed inserts were lost.

**Problem 2 (session.py):** PostgreSQL connection pool used SQLAlchemy defaults, which are designed for web apps with many short-lived requests. Career Agent runs as a single Streamlit process — explicit pool sizing avoids connection exhaustion.

### Changes

**`NeuroOps-Career-Agent-System/app/db/normalizer.py`** — SAVEPOINT fix
- Replaced `session.add(job); session.flush()` + `session.rollback()` pattern
- Now uses `nested = session.begin_nested()` (SAVEPOINT) per insert
  - `nested.commit()` on success
  - `nested.rollback()` on `IntegrityError` — only this insert is rolled back
- Prior successful inserts in the outer transaction are preserved

**`NeuroOps-Career-Agent-System/app/db/session.py`** — Pool hardening
- PostgreSQL `create_engine` now includes:
  - `pool_size=5` — max persistent connections (single-process Streamlit)
  - `max_overflow=5` — burst headroom for background collectors
  - `pool_timeout=30` — wait up to 30s for a connection
  - `pool_recycle=1800` — recycle every 30 min to avoid stale TCP sockets

---

## Phase 4D — Live Events Dashboard

**New React page at `/events`.**

**Files created:**
- `apps/unified-frontend/src/modules/events/EventsPage.jsx`

**Files modified:**
- `apps/unified-frontend/src/router/index.jsx` — added `/events` route + `EventsPage` import
- `apps/unified-frontend/src/components/layout/Sidebar.jsx` — added Platform Events nav item with LIVE badge, Zap icon

### EventsPage Features
- Polls `GET /api/gateway/platform/events` every 5 seconds
- Severity filter chips: All / Info / Warning / Critical / Error
- Service filter dropdown (dynamic, derived from event data)
- Column layout: Severity | Service | Event Type | Message | Timestamp
- New event flash animation (3s fade after arrival)
- DB event count and live service event count displayed in header
- Unreachable source services shown in footer warning bar
- Empty state messaging (no events vs no match after filter)

---

## Phase 4E — Cross-Module Platform Context

**Approach:** Embedded in Phase 4G dashboard upgrade.

- Dashboard Live Events mini-panel (polls `/platform/events` every 8s)
- Platform status pill shown in dashboard header (pulsing dot + status label)
- Module cards now show glow when healthy, dimmed when offline
- Quick Access strip links to Platform Events page

Full cross-module action surface (surfacing autopilot state in other modules) deferred to Phase 5 — requires per-module API contracts.

---

## Phase 4F — Observability Stack (Prometheus + Grafana)

**New services added under `--profile monitoring`.**

### Gateway API changes

**`services/gateway-api/app/main.py`**
- Added `GET /metrics/prometheus` endpoint — Prometheus text exposition format (v0.0.4)
- Exports per-service gauges: `health_score`, `response_ms`, `status` (numeric: 1/0.5/0)
- Exports platform-wide gauges: `platform_health_score`, `uptime_seconds`, `services_total/healthy/offline/degraded`, `events_db_available`

### New files
- `monitoring/prometheus.yml` — Prometheus config, scrapes gateway at 15s interval
- `monitoring/grafana/provisioning/datasources/prometheus.yml` — auto-provisions Prometheus datasource
- `monitoring/grafana/provisioning/dashboards/dashboards.yml` — dashboard file provider config
- `monitoring/grafana/dashboards/neuroops-platform.json` — pre-built Grafana dashboard with 7 panels:
  - Platform health score (stat, color-coded)
  - Services online / offline (stats)
  - Platform uptime (stat)
  - Service health scores over time (timeseries)
  - Service response latency (timeseries)
  - Service status numeric (timeseries)

### docker-compose.yml additions
- `prometheus` service — `prom/prometheus:v2.50.1`, 15d retention
- `grafana` service — `grafana/grafana:10.3.3`, auto-provisioned
- New volumes: `prometheus-data`, `grafana-data`
- Both behind `--profile monitoring`

### Makefile
- Added `make monitoring` target — `$(COMPOSE) --profile monitoring up -d`
- Added monitoring profile to `down`, `build`, `build-nc`, `reset` targets
- Updated help text

### Access
- Grafana: `http://localhost:3000` (admin / neuroops2024, configurable via `GRAFANA_USER` / `GRAFANA_PASSWORD`)
- Prometheus: `http://localhost:9090`
- Prometheus scrape target: `/api/gateway/metrics/prometheus`

### .env.example additions
- `GRAFANA_USER=admin`
- `GRAFANA_PASSWORD=neuroops2024`
- `EVENTS_RETENTION_DAYS=30`
- `PLATFORM_VERSION` bumped to 4.0.0

---

## Phase 4G — Dashboard UI/UX Upgrade

**Rewritten:** `apps/unified-frontend/src/modules/dashboard/Dashboard.jsx`

### New components (inlined)

**`HealthRing`** — Animated SVG ring showing platform health score
- Smooth SVG `strokeDashoffset` animation on score changes
- Color transitions: green (≥80) → yellow (≥50) → red (<50)
- Drop-shadow glow on the progress arc
- Center shows numeric score + "health" label

**`PulseDot`** — Pulsing radial status indicator
- Outer ring animates `scale(1)` → `scale(2.6)` with opacity fade
- Inner dot is solid, colors match service status
- `pulse=false` suppresses animation (for offline/unknown services)

**`EventsMiniPanel`** — Live events feed embedded in dashboard
- Polls `/api/gateway/platform/events` every 8 seconds
- Shows last 6 events with severity color coding
- "View all" link navigates to `/events`

### Visual upgrades

- Health ring replaces flat text badge in dashboard header
- Platform status pill: pulsing dot + status text + colored glow shadow
- Module cards: top accent bar gradient, icon glow when online, health bar glow
- Module activity bars: glow shadow on the progress fill
- Quick Access strip: pulsing dots per module, Platform Events shortcut button
- Anomaly/correlation section collapsed when empty (cleaner default state)

---

## Version Summary

| Component | Phase 3 | Phase 4 |
|---|---|---|
| Gateway API | 3.0.0 | 4.0.0 |
| Frontend | 2.0.0 | 4.0.0 |
| Sidebar | v2.0.0 label | v4.0.0 label |
| Docker Compose profiles | lite/core/heavy/n8n | + monitoring |
| Makefile targets | core/lite/heavy/full/n8n | + monitoring |

---

## Remaining Known Limitations

1. **Insight Engine CSV schema changes:** If a CSV adds/removes columns, `to_sql` with `if_exists="replace"` handles it correctly. The `csv_sync_state` table will detect the change via hash and trigger a reload automatically.

2. **Career Agent single-process concurrency:** SAVEPOINT fix handles the race condition between in-process insert batches. True multi-process concurrent writes still require advisory locks (Phase 5).

3. **Platform events retention — no alert on table size:** No Prometheus metric tracks `platform_events` table row count. A future Phase 5 could add this gauge.

4. **Cross-module context (Phase 4E partial):** Full cross-module action surface (e.g., surfacing autopilot AI decisions inside the Control Room module) deferred to Phase 5.

5. **Grafana auth:** Grafana is exposed on port 3000 with basic auth only. For production, TLS and OAuth/LDAP should be configured.

6. **Prometheus scrape — no auth:** The `/metrics/prometheus` endpoint has no authentication. On production deployments, restrict access via nginx or network policy.
