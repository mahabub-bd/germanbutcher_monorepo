-- Backfill orders."cancelledAt" for cancelled orders, mirroring the
-- deliveredAt backfill. Prod DB has no synchronize/migrations (see
-- CLAUDE.md workflow), so run manually once on gb_production before
-- deploying the cancelledAt feature. Dev DBs get the column via
-- synchronize when the backend starts.
--
-- Run the UPDATE in this file's companion order (ALTER first).
-- Safe to re-run: both statements are idempotent.

ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP;

UPDATE "order" o
SET "cancelledAt" = COALESCE(
  (SELECT MAX(ost."createdAt")
   FROM order_status_track ost
   WHERE ost."orderId" = o.id AND ost."status" = 'cancelled'),
  o."updatedAt"
)
WHERE o."orderStatus" = 'cancelled'
  AND o."cancelledAt" IS NULL;

-- Sanity check afterwards: should return 0 rows.
SELECT id, "orderNo", "createdAt", "cancelledAt"
FROM "order"
WHERE "orderStatus" = 'cancelled' AND "cancelledAt" IS NULL;
