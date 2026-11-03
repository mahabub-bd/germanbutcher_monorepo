-- 2026-11-02 — Division-level delivery pricing: add deliveryCharge and
-- minOrderAmount to delivery_coverage_divisions.
--
-- The admin coverage card previously allowed delivery time only on
-- divisions; charge and minimum were city/area-only. Both new columns are
-- nullable — existing data and behavior unchanged until values are set.
-- gb_test got the same columns automatically via TypeORM synchronize.
--
-- Safe: nullable adds only, no data touched. Idempotent via IF NOT EXISTS.

BEGIN;
ALTER TABLE delivery_coverage_divisions
  ADD COLUMN IF NOT EXISTS "deliveryCharge" double precision;
ALTER TABLE delivery_coverage_divisions
  ADD COLUMN IF NOT EXISTS "minOrderAmount" double precision;
COMMIT;

-- Verify:
-- SELECT name, "deliveryCharge", "minOrderAmount", "deliveryTime"
-- FROM delivery_coverage_divisions ORDER BY name LIMIT 5;
