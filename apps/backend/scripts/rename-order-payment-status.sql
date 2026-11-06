-- Rename order payment status values: pending -> unpaid, completed -> paid.
--
-- Backend enum now writes 'unpaid' / 'paid' (src/common/enums/index.ts).
-- Run this against EVERY database (gb_test, gb_production) BEFORE deploying
-- the new backend, or status writes/reads will fail against the old labels.
--
-- Notes:
--   * The row UPDATE must run BEFORE relying on the new code: 'completed'
--     rows are folded into the existing 'paid' value (which already exists
--     because the refund flow used it). 'pending' rows need no UPDATE —
--     RENAME VALUE relabels them in place, preserving row order/data.
--   * Postgres cannot remove enum labels, so 'completed' stays as a dead
--     label. Dev (TEMP_DB_SYNC=true) will drop/recreate the type to match
--     the entity on next boot; prod keeps it harmlessly.
--   * Idempotent: guards use DO blocks so re-running is safe.

-- 1. Fold completed rows into paid (skip if already migrated).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'order_paymentstatus_enum' AND e.enumlabel = 'completed'
  ) THEN
    UPDATE "order" SET "paymentStatus" = 'paid' WHERE "paymentStatus" = 'completed';
  END IF;
END
$$;

-- 2. Rename pending -> unpaid (no-op error if already renamed).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'order_paymentstatus_enum' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE "order_paymentstatus_enum" RENAME VALUE 'pending' TO 'unpaid';
  END IF;
END
$$;

-- Verify: SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
--         WHERE t.typname='order_paymentstatus_enum' ORDER BY enumsortorder;
--         SELECT "paymentStatus", count(*) FROM "order" GROUP BY 1;
