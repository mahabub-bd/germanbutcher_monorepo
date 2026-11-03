-- 2026-11-03 — Add "Date-wise Delivery" report to the Reports submenu (parentId 35).
--
-- The route the backend PermissionGuard checks is the menu URL:
--   GET /orders/reports/date-wise-delivery
--   @ModulePermissions('/admin/reports/date-wise-delivery')
--
-- Matches by URL, not id, so it is safe if ids drift. Idempotent. Wrapped
-- in a transaction; review then COMMIT.

BEGIN;

-- 1) Menu row: appended after Area Wise Orders (order 14), matching the
--    idempotent INSERT pattern from 2026-11-01-menu-restructure-production.sql.
INSERT INTO menu (name, url, icon, "parentId", "order",
                  is_main_menu, is_active, is_admin_menu,
                  "createdAt", "updatedAt")
SELECT 'Date-wise Delivery', '/admin/reports/date-wise-delivery', '', 35, 15,
       false, true, true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM menu WHERE url = '/admin/reports/date-wise-delivery'
);

-- 2) Permission rows: admin roles get canView (role 1 = superadmin,
--    role 2 = admin), same as the other report menus.
INSERT INTO menu_permission ("roleId", "menuId", "canView",
                             "canCreate", "canEdit", "canDelete",
                             "createdAt", "updatedAt")
SELECT r.id, m.id, true,
       r.id = 1, r.id = 1, r.id = 1,
       NOW(), NOW()
FROM role r
JOIN menu m ON m.url = '/admin/reports/date-wise-delivery'
WHERE r.id IN (1, 2)
  AND NOT EXISTS (
    SELECT 1 FROM menu_permission mp
    WHERE mp."roleId" = r.id AND mp."menuId" = m.id
  );

COMMIT;

-- Verify after commit:
-- SELECT id, name, url, "order" FROM menu WHERE "parentId" = 35 ORDER BY "order";
-- Expected: rows 1–15 ending with Date-wise Delivery (order 15).
