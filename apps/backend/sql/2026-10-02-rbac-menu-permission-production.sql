-- RBAC migration for gb_production (2026-10-02)
-- Adds action-level permission flags to menu_permission.
-- Run against:  psql -h 144.79.249.74 -U mahabub -d gb_production
-- Idempotent: safe to run twice.
-- Deploy order: run this BEFORE deploying the new backend build
-- (the new code selects canCreate/canEdit/canDelete on every permission query).

BEGIN;

-- 1. Remove duplicate (roleId, menuId) rows, keeping the earliest.
--    (Production currently has 9 identical rows for superadmin x Business Info.)
DELETE FROM menu_permission
WHERE id <> (SELECT min(id) FROM menu_permission m2
             WHERE m2."roleId" = menu_permission."roleId"
               AND m2."menuId" = menu_permission."menuId")
  AND ("roleId","menuId") IN (SELECT "roleId","menuId"
                              FROM menu_permission
                              GROUP BY 1,2 HAVING count(*) > 1);

-- 2. Add the action-flag columns.
ALTER TABLE menu_permission ADD COLUMN IF NOT EXISTS "canCreate" boolean NOT NULL DEFAULT false;
ALTER TABLE menu_permission ADD COLUMN IF NOT EXISTS "canEdit"    boolean NOT NULL DEFAULT false;
ALTER TABLE menu_permission ADD COLUMN IF NOT EXISTS "canDelete"  boolean NOT NULL DEFAULT false;

-- 3. Preserve current behavior: existing view access also grants create/edit/delete.
--    Tighten individual roles afterwards via the admin Menu Permissions matrix.
UPDATE menu_permission
SET "canCreate" = true, "canEdit" = true, "canDelete" = true
WHERE "canView" = true;

-- 4. Prevent future duplicates (also speeds up the per-request permission lookups).
CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_permission_role_menu
  ON menu_permission ("roleId", "menuId");

COMMIT;

-- Verify afterwards:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'menu_permission';
-- SELECT count(*) AS rows,
--        count(*) FILTER (WHERE "canView")   AS viewable,
--        count(*) FILTER (WHERE "canCreate") AS creatable
-- FROM menu_permission;
