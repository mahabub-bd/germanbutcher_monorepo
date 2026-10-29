-- Add the new CRM RFM segments (champions / promising / about_to_sleep /
-- lost) to the native Postgres enum backing crm_campaign."segment".
--
-- Prod DB has no synchronize/migrations (see CLAUDE.md workflow), so run
-- manually once on gb_production before deploying. Dev DBs get the enum
-- values via synchronize when the backend starts.
--
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block on
-- older Postgres versions — run each statement separately if pgAdmin wraps
-- them in one (or run the whole file; PG 12+ allows it outside a tx).

ALTER TYPE "crm_segment_enum" ADD VALUE IF NOT EXISTS 'champions';
ALTER TYPE "crm_segment_enum" ADD VALUE IF NOT EXISTS 'promising';
ALTER TYPE "crm_segment_enum" ADD VALUE IF NOT EXISTS 'about_to_sleep';
ALTER TYPE "crm_segment_enum" ADD VALUE IF NOT EXISTS 'lost';
