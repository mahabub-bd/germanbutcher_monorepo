-- 2026-11-01 — Menu restructure: move Customer List report and Abandoned Carts
-- out of Analytics, and normalize the Reports sub-menu display order.
--
-- Mirror of the gb_test change (menu rows 78 / 104 there; ids differ here).
-- Matches rows by URL, not id, so it is safe even if ids drift further.
--
-- ⚠️ Run AFTER deploying the backend that includes the crm-menu-seeder fix.
-- The old seeder deletes any menu row with url '/admin/crm/abandoned-carts'
-- at boot; deploying first makes it clean up the old analytics URL instead.
--
-- Verified against gb_production on 2026-11-01:
--   Customer List report : id 78, parent 101 (Analytics), order 3
--   Abandoned Carts      : row GONE (was id 100) — deleted since the morning
--     inspection, its menu_permission rows cascaded away with it → INSERT.
--   Reports children had duplicate order 9 and a missing 12.
--
-- Wrapped in a transaction; review then COMMIT.

BEGIN;

-- 1) Customer List report → Reports, positioned after Top Customer Report (5).
UPDATE menu SET "parentId" = 35, url = '/admin/reports/customer-list', "order" = 6
WHERE url = '/admin/analytics/customer-list';

-- 2) Abandoned Carts → CRM, appended after CRM Tasks. The old row was
--    deleted from prod, so this is an INSERT (idempotent). Remove any
--    stale analytics-location row first so we never end up with both.
DELETE FROM menu WHERE url = '/admin/analytics/abandoned-carts';

INSERT INTO menu (name, url, icon, "parentId", "order",
                  is_main_menu, is_active, is_admin_menu,
                  "createdAt", "updatedAt")
SELECT 'Abandoned Carts', '/admin/crm/abandoned-carts', '', 111, 5,
       false, true, true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM menu WHERE url = '/admin/crm/abandoned-carts'
);

-- 2b) Restore its permission rows: admin roles get canView
--     (role 1 = superadmin, role 2 = admin — same grants as the morning state).
INSERT INTO menu_permission ("roleId", "menuId", "canView",
                             "canCreate", "canEdit", "canDelete",
                             "createdAt", "updatedAt")
SELECT r.id, m.id, true,
       r.id = 1, r.id = 1, r.id = 1,
       NOW(), NOW()
FROM role r
JOIN menu m ON m.url = '/admin/crm/abandoned-carts'
WHERE r.id IN (1, 2)
  AND NOT EXISTS (
    SELECT 1 FROM menu_permission mp
    WHERE mp."roleId" = r.id AND mp."menuId" = m.id
  );

-- 3) Reports display order: dedupe the doubled 9 and close the 12 gap.
--    Target order mirrors gb_test:
--    1 Sales, 2 Daily Summary, 3 Monthly, 4 Product Sales, 5 Top Customer,
--    6 Customer List (set above), 7 Coupon, 8 Free Delivery, 9 Flash Sale,
--    10 Refund & Cancelled, 11 BOGO, 12 Deliveryman, 13 Inventory, 14 Area Wise.
UPDATE menu SET "order" = 7  WHERE "parentId" = 35 AND url = '/admin/reports/coupon-usage';             -- was 6
UPDATE menu SET "order" = 8  WHERE "parentId" = 35 AND url = '/admin/reports/free-delivery-usage';      -- was 7
UPDATE menu SET "order" = 9  WHERE "parentId" = 35 AND url = '/admin/reports/flash-sale-usage';         -- was 8
UPDATE menu SET "order" = 10 WHERE "parentId" = 35 AND url = '/admin/reports/refunds';                  -- was 9 (duplicate)
UPDATE menu SET "order" = 11 WHERE "parentId" = 35 AND url = '/admin/reports/bogo-usage';               -- was 9 (duplicate)
UPDATE menu SET "order" = 12 WHERE "parentId" = 35 AND url = '/admin/reports/deliveryman-performance';  -- was 10
UPDATE menu SET "order" = 13 WHERE "parentId" = 35 AND url = '/admin/reports/inventory';                -- was 11
UPDATE menu SET "order" = 14 WHERE "parentId" = 35 AND url = '/admin/reports/area-wise-orders';         -- was 13

COMMIT;

-- Verify after commit:
-- SELECT id, name, url, "order" FROM menu WHERE "parentId" = 35 ORDER BY "order";
-- SELECT id, name, url, "order" FROM menu WHERE "parentId" = 111 ORDER BY "order";
-- Expected: Reports 1–14 with no gaps/duplicates, CRM 0–5 with Abandoned Carts last.
