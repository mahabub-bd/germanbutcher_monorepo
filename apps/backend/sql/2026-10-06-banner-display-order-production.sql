-- Banner display ordering (2026-10-06)
--
-- Ensures the displayOrder column and its indexes exist in production.
-- The column was previously created by TypeORM synchronize; this script
-- makes the schema reproducible without synchronize.
--
-- Run on production before deploying the banner reorder feature.

ALTER TABLE banners ADD COLUMN IF NOT EXISTS "displayOrder" integer NOT NULL DEFAULT 0;

-- Backfill: stagger existing banners (all defaulted to 0) by id so they
-- keep a stable, deterministic order instead of tying.
UPDATE banners SET "displayOrder" = id - 1 WHERE "displayOrder" = 0;

CREATE INDEX IF NOT EXISTS "IDX_banner_displayOrder" ON banners ("displayOrder");
CREATE INDEX IF NOT EXISTS "IDX_banner_isActive_displayOrder" ON banners ("isActive", "displayOrder");

-- Verify:
-- SELECT id, title, type, position, "displayOrder" FROM banners ORDER BY "displayOrder";
