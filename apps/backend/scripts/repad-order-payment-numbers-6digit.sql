-- Re-pad order/payment numbers from 4-digit to 6-digit sequence tails:
--   2026-0101  ->  2026-000101
--   2026-10000 ->  2026-010000
--
-- DEPLOY the 6-digit generator first (order.service.ts and
-- order-payment.service.ts now padStart(6)), then run this against EVERY
-- database (gb_test, gb_production). New rows created after the deploy
-- already have 6-digit tails and are skipped by the WHERE clause, so the
-- mixed-width transition window is safe for uniqueness and for the
-- zero-padded-tail max lookup in both services.
--
-- Idempotent: only touches rows whose sequence tail is 1-5 digits; run it
-- as many times as you like.

UPDATE "order"
SET "orderNo" = split_part("orderNo", '-', 1) || '-' ||
                lpad(split_part("orderNo", '-', 2), 6, '0')
WHERE "orderNo" ~ '^\d{4}-\d{1,5}$';

UPDATE order_payment
SET "paymentNumber" = split_part("paymentNumber", '-', 1) || '-' ||
                      lpad(split_part("paymentNumber", '-', 2), 6, '0')
WHERE "paymentNumber" ~ '^\d{4}-\d{1,5}$';

-- Sanity check: no duplicates either side.
SELECT 'order dup' AS check, count(*) FROM (
  SELECT "orderNo" FROM "order" GROUP BY 1 HAVING count(*) > 1
) d;
SELECT 'payment dup' AS check, count(*) FROM (
  SELECT "paymentNumber" FROM order_payment GROUP BY 1 HAVING count(*) > 1
) d;
