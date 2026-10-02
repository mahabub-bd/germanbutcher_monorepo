-- Banner image support for sales points (2026-10-02)
-- Run against: psql -h 144.79.249.74 -U mahabub -d gb_production
-- Deploy order: run BEFORE deploying this backend build
--   (the updated sales-points query selects bannerAttachment).
-- Idempotent: safe to run twice.

ALTER TABLE sales_points ADD COLUMN IF NOT EXISTS "bannerAttachmentId" integer;

-- Verify:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'sales_points' AND column_name ILIKE '%banner%';
