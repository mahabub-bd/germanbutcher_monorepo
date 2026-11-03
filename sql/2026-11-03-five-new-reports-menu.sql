-- 2026-11-03 — Add five new reports to the Reports submenu (parentId 35):
--   Payment Methods       /admin/reports/payment-methods      (order 16)
--   Repeat Buyer          /admin/reports/repeat-buyers        (order 17)
--   Discount Impact       /admin/reports/discount-impact      (order 18)
--   Late Delivery         /admin/reports/late-delivery        (order 19)
--   Abandoned Checkout    /admin/reports/abandoned-checkout   (order 20)
--
-- Backend permission strings match these URLs exactly:
--   orders/reports/payment-methods | repeat-buyers | discount-impact |
--   late-delivery                  (order module)
--   carts/reports/abandoned        (cart module — existing endpoint, reused;
--     its guard checks the CRM menu '/admin/crm/abandoned-carts', so roles
--     granted the CRM menu can also open this reports page)
--
-- Matches by URL, not id. Idempotent. Wrapped in a transaction; review then COMMIT.

BEGIN;

-- 1) Menu rows (idempotent INSERT per URL).
INSERT INTO menu (name, url, icon, "parentId", "order",
                  is_main_menu, is_active, is_admin_menu,
                  "createdAt", "updatedAt")
SELECT v.name, v.url, '', v."parentId", v."order",
       false, true, true, NOW(), NOW()
FROM (VALUES
  ('Payment Methods',    '/admin/reports/payment-methods',    35, 16),
  ('Repeat Buyer',       '/admin/reports/repeat-buyers',      35, 17),
  ('Discount Impact',    '/admin/reports/discount-impact',    35, 18),
  ('Late Delivery',      '/admin/reports/late-delivery',      35, 19),
  ('Abandoned Checkout', '/admin/reports/abandoned-checkout', 35, 20)
) AS v(name, url, "parentId", "order")
WHERE NOT EXISTS (
  SELECT 1 FROM menu m WHERE m.url = v.url
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
JOIN menu m ON m.url IN (
  '/admin/reports/payment-methods',
  '/admin/reports/repeat-buyers',
  '/admin/reports/discount-impact',
  '/admin/reports/late-delivery',
  '/admin/reports/abandoned-checkout'
)
WHERE r.id IN (1, 2)
  AND NOT EXISTS (
    SELECT 1 FROM menu_permission mp
    WHERE mp."roleId" = r.id AND mp."menuId" = m.id
  );

COMMIT;

-- Verify after commit:
-- SELECT id, name, url, "order" FROM menu WHERE "parentId" = 35 ORDER BY "order";
-- Expected: rows 1–20 with no gaps/duplicates, the five new ones last.
