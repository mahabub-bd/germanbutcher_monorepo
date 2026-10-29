-- One-time backfill: stamp deliveredAt / cancelledAt on orders that reached
-- those statuses before the columns existed. Times come from the newest
-- matching row in order_status_track, which has recorded every status change
-- since launch.
--
-- Run once against the production database after deploying the entity change,
-- e.g.:  psql "$DATABASE_URL" -f backfill-order-terminal-times.sql

-- Delivered: only orders whose CURRENT status is delivered (the service clears
-- deliveredAt when a delivered order moves to another status, so a stale stamp
-- would contradict it).
UPDATE "order" o
SET "deliveredAt" = d.delivered_at
FROM (
  SELECT ost."orderId", MAX(ost."createdAt") AS delivered_at
  FROM order_status_track ost
  WHERE ost."status" = 'delivered'
  GROUP BY ost."orderId"
) d
WHERE o.id = d."orderId"
  AND o."deliveredAt" IS NULL
  AND o."orderStatus" = 'delivered';

-- Cancelled: only orders whose current status is cancelled.
UPDATE "order" o
SET "cancelledAt" = c.cancelled_at
FROM (
  SELECT ost."orderId", MAX(ost."createdAt") AS cancelled_at
  FROM order_status_track ost
  WHERE ost."status" = 'cancelled'
  GROUP BY ost."orderId"
) c
WHERE o.id = c."orderId"
  AND o."cancelledAt" IS NULL
  AND o."orderStatus" = 'cancelled';

-- Sanity check: how many terminal orders are still missing a stamp?
SELECT
  COUNT(*) FILTER (WHERE "orderStatus" = 'delivered' AND "deliveredAt" IS NULL)   AS delivered_missing,
  COUNT(*) FILTER (WHERE "orderStatus" = 'cancelled' AND "cancelledAt" IS NULL)   AS cancelled_missing
FROM "order";
