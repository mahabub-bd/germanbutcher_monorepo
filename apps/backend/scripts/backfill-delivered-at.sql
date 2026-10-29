

UPDATE "order" o
SET "deliveredAt" = COALESCE(
  (SELECT MAX(ost."createdAt")
   FROM order_status_track ost
   WHERE ost."orderId" = o.id AND ost."status" = 'delivered'),
  o."updatedAt"
)
WHERE o."orderStatus" = 'delivered'
  AND o."deliveredAt" IS NULL;

-- Sanity check afterwards: should return 0 rows.
SELECT id, "orderNo", "createdAt", "deliveredAt"
FROM "order"
WHERE "orderStatus" = 'delivered' AND "deliveredAt" IS NULL;
