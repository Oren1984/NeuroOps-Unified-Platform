-- ============================================================
-- NeuroOps Unified Platform — PostgreSQL Initialization
-- Phase 3 (DB Partial Unification)
-- This script runs automatically on first container start.
-- Creates schemas for each service that uses PostgreSQL and
-- sets up shared platform metadata/event infrastructure.
-- ============================================================

-- ------------------------------------------------------------
-- Schemas (one per service to avoid table naming collisions)
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS autopilot;
CREATE SCHEMA IF NOT EXISTS control_room;
CREATE SCHEMA IF NOT EXISTS career_agent;
CREATE SCHEMA IF NOT EXISTS insight_engine;

-- ------------------------------------------------------------
-- Permissions
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON SCHEMA autopilot       TO neuroops;
GRANT ALL PRIVILEGES ON SCHEMA control_room    TO neuroops;
GRANT ALL PRIVILEGES ON SCHEMA career_agent    TO neuroops;
GRANT ALL PRIVILEGES ON SCHEMA insight_engine  TO neuroops;

-- Allow neuroops to create tables in public (needed for platform_events)
GRANT ALL PRIVILEGES ON SCHEMA public TO neuroops;

-- Default search path: public first, then service schemas
ALTER ROLE neuroops SET search_path = public, autopilot, control_room, career_agent, insight_engine;

-- ------------------------------------------------------------
-- Platform metadata table (cross-service, lives in public)
-- Unchanged from Phase 2.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_meta (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT         NOT NULL,
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_meta (key, value) VALUES
    ('platform_version',  '3.0.0'),
    ('initialized_at',    NOW()::TEXT),
    ('platform_name',     'NeuroOps Unified Platform')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ------------------------------------------------------------
-- Platform Events table (Phase 3C)
-- Shared event/audit stream for platform intelligence.
-- Used by gateway-api for cross-service correlation.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_events (
    id             SERIAL       PRIMARY KEY,
    source_service VARCHAR(100) NOT NULL,
    event_type     VARCHAR(100) NOT NULL,
    severity       VARCHAR(20)  NOT NULL DEFAULT 'info',
    payload        JSONB        NOT NULL DEFAULT '{}',
    occurred_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Indexes for fast time-range and filter queries
CREATE INDEX IF NOT EXISTS idx_platform_events_occurred_at
    ON public.platform_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_source_service
    ON public.platform_events (source_service);
CREATE INDEX IF NOT EXISTS idx_platform_events_severity
    ON public.platform_events (severity);
CREATE INDEX IF NOT EXISTS idx_platform_events_event_type
    ON public.platform_events (event_type);

-- Grant neuroops full access to the events table
GRANT ALL PRIVILEGES ON TABLE public.platform_events TO neuroops;
GRANT USAGE, SELECT ON SEQUENCE public.platform_events_id_seq TO neuroops;

-- Insert a bootstrap event so the table is never empty on first use
INSERT INTO public.platform_events (source_service, event_type, severity, payload, occurred_at)
VALUES (
    'platform',
    'platform_initialized',
    'info',
    '{"message": "NeuroOps Unified Platform Phase 3 initialized", "version": "3.0.0"}',
    NOW()
) ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Career Agent schema bootstrap (Phase 3A)
-- Tables are created by SQLAlchemy create_all at runtime.
-- These GRANTs ensure the service user has full access.
-- ------------------------------------------------------------
-- SQLAlchemy will create: career_agent.jobs, career_agent.scores,
-- career_agent.status_history
-- No table DDL here to avoid conflicts with SQLAlchemy ORM.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA career_agent TO neuroops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA career_agent TO neuroops;

-- Default privileges: any future tables created in career_agent schema
ALTER DEFAULT PRIVILEGES IN SCHEMA career_agent
    GRANT ALL PRIVILEGES ON TABLES TO neuroops;
ALTER DEFAULT PRIVILEGES IN SCHEMA career_agent
    GRANT ALL PRIVILEGES ON SEQUENCES TO neuroops;

-- ------------------------------------------------------------
-- Insight Engine schema bootstrap (Phase 3B)
-- Tables are loaded from CSV by the service at startup.
-- Tables: insight_engine.users, usage_events, system_events, tickets
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA insight_engine TO neuroops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA insight_engine TO neuroops;

ALTER DEFAULT PRIVILEGES IN SCHEMA insight_engine
    GRANT ALL PRIVILEGES ON TABLES TO neuroops;
ALTER DEFAULT PRIVILEGES IN SCHEMA insight_engine
    GRANT ALL PRIVILEGES ON SEQUENCES TO neuroops;

-- ------------------------------------------------------------
-- Autopilot schema bootstrap
-- (The autopilot service manages its own migrations)
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA autopilot TO neuroops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA autopilot TO neuroops;
ALTER DEFAULT PRIVILEGES IN SCHEMA autopilot
    GRANT ALL PRIVILEGES ON TABLES TO neuroops;
ALTER DEFAULT PRIVILEGES IN SCHEMA autopilot
    GRANT ALL PRIVILEGES ON SEQUENCES TO neuroops;

-- ------------------------------------------------------------
-- Control Room schema bootstrap
-- (The control_room service manages its own migrations)
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA control_room TO neuroops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA control_room TO neuroops;
ALTER DEFAULT PRIVILEGES IN SCHEMA control_room
    GRANT ALL PRIVILEGES ON TABLES TO neuroops;
ALTER DEFAULT PRIVILEGES IN SCHEMA control_room
    GRANT ALL PRIVILEGES ON SEQUENCES TO neuroops;

-- Done
SELECT 'NeuroOps Phase 3 database initialized successfully' AS status;
