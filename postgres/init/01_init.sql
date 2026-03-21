-- ============================================================
-- NeuroOps Unified Platform — PostgreSQL Initialization
-- This script runs automatically on first container start.
-- Creates schemas for each service that uses PostgreSQL and
-- sets up cross-service metadata.
-- ============================================================

-- ------------------------------------------------------------
-- Schemas (one per service to avoid table naming collisions)
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS autopilot;
CREATE SCHEMA IF NOT EXISTS control_room;

-- ------------------------------------------------------------
-- Permissions
-- ------------------------------------------------------------
GRANT ALL PRIVILEGES ON SCHEMA autopilot    TO neuroops;
GRANT ALL PRIVILEGES ON SCHEMA control_room TO neuroops;

-- Future schemas can be added here as new services are added
-- GRANT ALL PRIVILEGES ON SCHEMA live_control TO neuroops;
-- GRANT ALL PRIVILEGES ON SCHEMA incident_replay TO neuroops;

-- Default search path: public first, then service schemas
ALTER ROLE neuroops SET search_path = public, autopilot, control_room;

-- ------------------------------------------------------------
-- Platform metadata table (cross-service, lives in public)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_meta (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT         NOT NULL,
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_meta (key, value) VALUES
    ('platform_version',  '1.0.0'),
    ('initialized_at',    NOW()::TEXT),
    ('platform_name',     'NeuroOps Unified Platform')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- Autopilot schema bootstrap
-- (The autopilot service manages its own migrations; these
--  objects ensure the schema exists before the app starts.)
-- ------------------------------------------------------------
-- Uncomment/extend as needed when autopilot migrations are integrated:
-- CREATE TABLE IF NOT EXISTS autopilot.rules (...);

-- ------------------------------------------------------------
-- Control Room schema bootstrap
-- ------------------------------------------------------------
-- CREATE TABLE IF NOT EXISTS control_room.incidents (...);

-- Done
SELECT 'NeuroOps database initialized successfully' AS status;
