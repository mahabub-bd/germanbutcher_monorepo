-- Free Delivery Campaign Usage Log — production schema
-- Run on: gb_production (144.79.249.74)
-- Matches apps/backend/src/free-delivery-usage-log/entities/free-delivery-usage-log.entity.ts

CREATE TABLE IF NOT EXISTS "free_delivery_usage_log" (
  "id" serial PRIMARY KEY,
  "campaignName" character varying NOT NULL,
  "shippingWaived" numeric(10,2) NOT NULL DEFAULT 0,
  "orderTotal" numeric(10,2) NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "campaignId" integer,
  "orderId" integer,
  "userId" integer
);

CREATE UNIQUE INDEX IF NOT EXISTS "PK_free_delivery_usage_log"
  ON public.free_delivery_usage_log USING btree (id);

ALTER TABLE "free_delivery_usage_log" DROP CONSTRAINT IF EXISTS "FK_fd_usage_campaign";
ALTER TABLE "free_delivery_usage_log"
  ADD CONSTRAINT "FK_fd_usage_campaign"
  FOREIGN KEY ("campaignId") REFERENCES free_delivery_campaign(id) ON DELETE CASCADE;

ALTER TABLE "free_delivery_usage_log" DROP CONSTRAINT IF EXISTS "FK_fd_usage_order";
ALTER TABLE "free_delivery_usage_log"
  ADD CONSTRAINT "FK_fd_usage_order"
  FOREIGN KEY ("orderId") REFERENCES "order"(id) ON DELETE CASCADE;

ALTER TABLE "free_delivery_usage_log" DROP CONSTRAINT IF EXISTS "FK_fd_usage_user";
ALTER TABLE "free_delivery_usage_log"
  ADD CONSTRAINT "FK_fd_usage_user"
  FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;

-- Menu entry + admin permissions (skip if you create them via the admin UI)
INSERT INTO menu (name, "parentId", icon, url, "order", is_main_menu, is_active, is_admin_menu, "createdAt", "updatedAt")
SELECT 'Free Delivery Usage Logs', 22, 'Truck', '/admin/marketing/free-delivery-usage-logs', 5, false, true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE url = '/admin/marketing/free-delivery-usage-logs');

INSERT INTO menu_permission ("roleId","menuId","canView","canCreate","canEdit","canDelete","createdAt","updatedAt")
SELECT r.id, m.id, true, true, true, true, NOW(), NOW()
FROM "role" r
CROSS JOIN menu m
WHERE m.url = '/admin/marketing/free-delivery-usage-logs' AND r.id IN (1,2)
  AND NOT EXISTS (
    SELECT 1 FROM menu_permission mp
    WHERE mp."roleId" = r.id AND mp."menuId" = m.id
  );

-- Report pages: Coupon Usage Report + Free Delivery Usage Report (Reports section)
-- The Reports parent menu is resolved by URL, not a hardcoded id.
INSERT INTO menu (name, "parentId", icon, url, "order", is_main_menu, is_active, is_admin_menu, "createdAt", "updatedAt")
SELECT 'Coupon Usage Report', parent.id, 'Ticket', '/admin/reports/coupon-usage', 8, false, true, true, NOW(), NOW()
FROM (SELECT id FROM menu WHERE url = '/admin/reports' AND is_admin_menu = true LIMIT 1) parent
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE url = '/admin/reports/coupon-usage');

INSERT INTO menu (name, "parentId", icon, url, "order", is_main_menu, is_active, is_admin_menu, "createdAt", "updatedAt")
SELECT 'Free Delivery Usage Report', parent.id, 'Truck', '/admin/reports/free-delivery-usage', 9, false, true, true, NOW(), NOW()
FROM (SELECT id FROM menu WHERE url = '/admin/reports' AND is_admin_menu = true LIMIT 1) parent
WHERE NOT EXISTS (SELECT 1 FROM menu WHERE url = '/admin/reports/free-delivery-usage');

INSERT INTO menu_permission ("roleId","menuId","canView","canCreate","canEdit","canDelete","createdAt","updatedAt")
SELECT r.id, m.id, true, true, true, true, NOW(), NOW()
FROM "role" r
CROSS JOIN menu m
WHERE m.url IN ('/admin/reports/coupon-usage', '/admin/reports/free-delivery-usage')
  AND r.id IN (1,2)
  AND NOT EXISTS (
    SELECT 1 FROM menu_permission mp
    WHERE mp."roleId" = r.id AND mp."menuId" = m.id
  );
