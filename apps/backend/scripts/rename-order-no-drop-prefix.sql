-- Drop the "ORD-" prefix from order numbers: ORD-2026-2363 -> 2026-2363.
--
-- New-format generation lives in order.service.ts createOrder (YYYY-NNNN,
-- no prefix). Run this backfill AFTER deploying that backend — the new
-- generator tolerates both formats (matches %YYYY-%, sorts by the numeric
-- tail), so mixed data during the transition is safe.
--
-- Idempotent: only touches rows that still carry the prefix.
UPDATE "order"
SET "orderNo" = SUBSTRING("orderNo" FROM 5)
WHERE "orderNo" LIKE 'ORD-%';
