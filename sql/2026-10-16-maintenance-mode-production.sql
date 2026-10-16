-- Production DB update (2026-10-16)
-- 1) Maintenance Mode: toggle, message and schedule window on Business Settings
-- 2) Sidebar menu entry for the Abandoned Carts report (+ view permission
--    for the admin/superadmin roles)
-- All statements are idempotent — safe to run more than once.
-- Run against gb_production when deploying.

-- ---------------------------------------------------------------------------
-- 1) Maintenance Mode columns
-- ---------------------------------------------------------------------------
ALTER TABLE business_setting
  ADD COLUMN IF NOT EXISTS "maintenanceMode" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "maintenanceMessage" text,
  ADD COLUMN IF NOT EXISTS "maintenanceStartsAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "maintenanceEndsAt" timestamptz;

-- ---------------------------------------------------------------------------
-- 2) Abandoned Carts report menu (under "Reports & Analytics")
-- ---------------------------------------------------------------------------
INSERT INTO menu (name, url, "parentId", "order", "is_main_menu", "is_active", "is_admin_menu", "createdAt", "updatedAt")
SELECT 'Abandoned Carts', '/admin/reports/abandoned-carts', parent.id, 14,
       false, true, true, NOW(), NOW()
FROM menu parent
WHERE parent.url = '/admin/reports'
  AND NOT EXISTS (
    SELECT 1 FROM menu WHERE url = '/admin/reports/abandoned-carts'
  );

-- View permission for superadmin + admin roles
INSERT INTO menu_permission ("roleId", "menuId", "canView", "canCreate", "canEdit", "canDelete", "createdAt", "updatedAt")
SELECT r.id, m.id, true, false, false, false, NOW(), NOW()
FROM "role" r
CROSS JOIN menu m
WHERE m.url = '/admin/reports/abandoned-carts'
  AND r."rolename" IN ('superadmin', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM menu_permission mp
    WHERE mp."roleId" = r.id AND mp."menuId" = m.id
  );
