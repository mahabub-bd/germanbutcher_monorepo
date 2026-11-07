# 05 — Database

PostgreSQL, accessed through TypeORM 0.3.28. Entities are the schema definition: the
application creates and alters tables from decorated classes. There is **no migrations
directory** and no `data-source.ts`.

---

## 1. Connection

Configured in `app.module.ts` from `DATABASE_*`:

| Setting | Value |
| --- | --- |
| Pool max | `DATABASE_POOL_MAX` (default 30) |
| Pool min | 2 |
| Idle timeout | 30 s |
| Connect timeout | 8 s (a bad host fails fast rather than hanging a request) |
| `autoLoadEntities` | `true` — a module's `forFeature([...])` registers the entity |
| `synchronize` | `NODE_ENV !== 'production' \|\| TEMP_DB_SYNC === 'true'` |

Because `autoLoadEntities` is on, an entity that is never passed to
`TypeOrmModule.forFeature()` in some module is **not** part of the schema. This is the most
common reason a new table "does not appear" after a restart.

---

## 2. Schema change policy

**Development:** start the API with `NODE_ENV` unset/`development` and let
`synchronize` create tables. It will also *alter* and *drop* columns to match entities —
never point a development `.env.local` at a database you care about.

**Production:** `synchronize` is off. Options, in order of preference:

1. Write an idempotent SQL script under `apps/backend/scripts/`, review it, run it during a
   maintenance window, then deploy the code that reads the new column.
2. Set `TEMP_DB_SYNC=true` for a single boot **only** for additive changes, then remove the
   variable immediately. This is a break-glass tool: TypeORM may drop or rewrite things
   you did not intend, and it holds locks while it does.
3. Restore-from-dump workflow for large refactors.

Rules that keep this survivable:

- Additive-first: add nullable columns, backfill, then make them `NOT NULL` in a later
  release.
- Never rename a column in one step in production — add, dual-write, migrate reads, drop.
- Keep every script in `scripts/` even after it has run; they document history.
- Update `database.dbml` in the same pull request (it is a snapshot, see §8).

The existing scripts (`rename-order-payment-status.sql`, `backfill-delivered-at.sql`,
`product-history-table.sql`, `add-crm-segments.sql`, …) are the precedent to follow, not a
guarantee of ordering or idempotency.

---

## 3. Domain map

| Domain | Tables |
| --- | --- |
| **Identity & access** | `user`, `role`, `menu`, `menu_permission`, `address` |
| **Catalog** | `product`, `category`, `brand`, `unit`, `supplier`, `attachment`, `galleries`, `banner` |
| **Commerce** | `cart`, `cart_item`, `order`, `order_item`, `order_status_track`, `order_note`, `order_payment`, `order_payment_method` |
| **Procurement** | `purchase`, `purchase_item`, `payment`, `payment_method` |
| **Promotions** | `coupon`, `coupon_usage_log`, `bogo_campaigns`, `bogo_usage_log`, `flash_sale_campaigns`, `flash_sale_usage_log`, `free_delivery_campaigns`, `free_delivery_usage_log` |
| **Inventory** | `stock_movements`, `product_history` |
| **Fulfilment** | `shipping_method`, `delivery_coverage`, `delivery_man` |
| **Engagement** | `product_review`, `wishlist`, `notification`, `subscribers`, `contact_message`, `testimonial` |
| **CRM & insight** | `crm_*` tables, `analytics`, `user_activity` |
| **Content & settings** | `recipe`, `client`, `sales_point`, `sales_partner`, `sales_point_shop`, `business_settings`, `location` |

Exact table names come from `@Entity('...')`; a few entities rely on TypeORM's default
naming (class name lower-cased), which is why `galleries` is plural while `product` is not.

---

## 4. Core relationships

```
role 1──n user 1──1 cart 1──n cart_item n──1 product
                 │                          │
                 ├──n address 1──n order ───┤
                 │                 │        ├──n1 category / brand / unit / supplier
                 │                 │        ├──1 attachment, 1 gallery
                 │                 │        └──n stock_movements (ledger)
                 │                 ├──n order_item n──1 product
                 │                 ├──n order_status_track
                 │                 ├──n order_note
                 │                 ├──n order_payment n──1 order_payment_method
                 │                 ├──n1 coupon
                 │                 ├──n1 shipping_method
                 │                 └──n1 delivery_man
                 │
                 └──n purchase 1──n purchase_item n──1 product
                              └──n payment n──1 payment_method

menu 1──n menu_permission n──1 role
```

Key cardinalities to remember:

- `cart.userId` is **unique** — one cart per user. The relation is declared on both sides
  (`user.cartId` and `cart.userId` both carry a join column); queries use `cart.userId`,
  and deleting a user cascades to their cart.
- `order.address` is a snapshot reference to the chosen `address` row, not a copy. Editing
  an address later changes what the order appears to ship to; the order stores its own
  `shippingCost` for exactly this reason.
- `order_item` carries **price snapshots** (`unitPrice`, `totalPrice`, `unitDiscount`) so a
  later price change never rewrites order history.
- Deleting a gallery cascades to its attachments; deleting a category sets `parentId` to
  null; deleting an order cascades to status tracks.

---

## 5. Invariants

### Money

- Every monetary column is `decimal(10,2)` (a few `numeric(12,2)` totals on `product`).
- **The `pg` driver returns `numeric` as a string.** Code converts before arithmetic —
  `Number(product.sellingPrice)`, `Number(coupon.value)`. Skipping the conversion produces
  string concatenation and silently wrong totals.
- Round at the boundary: `Math.round(value * 100) / 100`.
- `order.totalValue` is the **payable total including shipping** after all discounts;
  `order.totalDiscount` accumulates product + campaign + coupon discounts (it does not
  include waived shipping).

### Status

- `OrderStatus`: `pending | processing | on_hold | shipped | delivered | cancelled`.
- `PaymentStatus` (database values): `unpaid | partial | paid | failed | refunded |
  need_refund | refund_complete | partial_refund`. The TypeScript enum member
  `PaymentStatus.PENDING` maps to the **`unpaid`** string — this rename is why
  `scripts/rename-order-payment-status.sql` exists.
- `deliveredAt` / `cancelledAt` are maintained alongside the status: set when the order
  enters that state, cleared when it leaves. Reports use these timestamps, not `updatedAt`.

### Stock

`product.stock` is the operational number; `stock_movements` is the append-only ledger that
explains it. Every change writes a row with `stockBefore` / `stockAfter`:

| Type | Trigger |
| --- | --- |
| `purchase` | A purchase is received |
| `purchase_reversal` | A received purchase is reverted/deleted |
| `order_sale` | An order is placed |
| `order_cancel` | An order is cancelled and stock returns |
| `adjustment` | Manual correction from the admin |

`product_history` records product lifecycle (`created`, `updated`, `activated`,
`deactivated`, `deleted`) and is **not** subject to the 90-day audit purge.

### Lifecycle flags

Catalog rows are never hard-deleted for merchandising reasons; `isActive` hides them.
Products additionally use `isFeatured`, `saleCount`, and `galleryId`. A deactivated product
must not be orderable — `order.service.ts` rejects it explicitly, and product-detail pages
bypass the Next.js cache so the 404 is immediate.

---

## 6. Table reference (most-used)

| Table | Notes |
| --- | --- |
| `user` | `email` unique, `roleId` default 3, `password` and `otp` are `@Exclude()`d from responses. `isVerified`, `lastLoginAt`, `profilePhotoId` |
| `role` | `rolename` unique. `admin` / `superadmin` bypass permission checks |
| `menu` | Tree via `parentId`; `url` must match `@ModulePermissions(...)`; `is_admin_menu`, `is_main_menu`, `order` |
| `menu_permission` | `roleId` + `menuId` + `canView/canCreate/canEdit/canDelete` |
| `product` | `slug` + `productSku` unique, `stock`, `sellingPrice`, `purchasePrice`, discount window fields, `totalValueBySalePrice` / `totalValueByPurchasePrice` rollups |
| `category` | Self-referencing tree (`parentId`), `slug`, `is_main_menu` |
| `order` | `orderNo` unique, status + payment status indexed, `shippingCost`, `paidAmount`, `deliveryMan` |
| `order_item` | `productId`, `quantity`, price snapshots |
| `order_payment` | `paymentNumber` unique, `amount`, `paymentDate`, `sslPaymentId`, `paymentMethodId` |
| `coupon` | `code` unique, `discountType`, `value`, `maxDiscountAmount`, validity window, `timesUsed`/`maxUsage`, excluded items relation |
| `shipping_method` | `name` unique, `cost`, `deliveryTime`, `isPickup`, `minOrderAmount`, `isExcludedFromFreeDelivery` |
| `purchase` / `purchase_item` | Procurement; `purchaseNumber` unique, `paymentStatus` (`due`…), `amountPaid` |
| `payment` | **Supplier** payments: `paymentNumber` unique, `purchaseId`, `paymentMethodId` |
| `stock_movements` | Ledger with `(productId, createdAt)`, `createdAt`, `type` indexes |
| `analytics` | One row per request (path, method, status, duration, device, `ipAddress`, user agent); purged after retention. IPs are stored in clear text, not hashed |
| `user_activity` | Audit trail; purged after 90 days |

---

## 7. Naming inconsistencies you will hit

The schema grew incrementally, so column naming is mixed. Verified examples:

| Convention | Examples |
| --- | --- |
| camelCase (majority) | `createdAt`, `orderNo`, `isActive`, `menuId` |
| snake_case | `attachment.gallery_id`, `address.user_id`, `purchase.purchase_date`, `unit.created_date` / `updated_date`, `menu.is_active` / `is_main_menu` |
| lowercase audit columns | `brand.createdby` / `updatedby`, `unit.createdby`, `order_payment.createdby` |
| boolean flags | `isActive`, `is_active`, `isFeatured`, `is_main_menu`, `isPickup` |

One trap worth memorizing: `Category.isMainCategory` is stored in a column named
**`is_main_menu`**. Reading the entity suggests one name, the database shows another.

Verified delete behaviour: gallery → attachments `CASCADE`, category parent `SET NULL`,
order → status tracks/notes `CASCADE`, user → reviews/wishlist/notifications/activities
`CASCADE`, attachment references from testimonials/reviews `SET NULL`.

Always check the entity before writing SQL by hand. Do not "fix" naming in a synchronize
run against production — it will drop and recreate columns.

---

## 8. `database.dbml` is a stale snapshot

`apps/backend/database.dbml` is useful for a quick ERD import, but it lags the entities:

- `order.orderStatus` enum lacks `on_hold`.
- `order.paymentStatus` still lists `pending`/`completed`; the code uses
  `unpaid`/`paid` plus the refund states.
- `order_item` in the DBML lacks `unitPrice`, `totalPrice`, `unitDiscount`.
- `menu_permission` in the DBML only has `canView`; the code checks four actions.
- `order` lacks `shippingCost`, `deliveredAt`, `cancelledAt`, `deliveryMan`.
- Several newer tables (CRM, stock movements, campaign usage logs) are absent or partial.

**Entities are the source of truth.** If you regenerate the DBML, do it from a real database
(`dbml2sql`/`sql2dbml` round-trip), not by hand.

---

## 9. Useful operational queries

```sql
-- Stock that disagrees with its ledger's latest row
SELECT p.id, p.name, p.stock, sm."stockAfter"
FROM product p
JOIN LATERAL (
  SELECT "stockAfter" FROM stock_movements
  WHERE "productId" = p.id ORDER BY "createdAt" DESC, id DESC LIMIT 1
) sm ON true
WHERE p.stock <> sm."stockAfter";

-- Orders with no payment ledger row (should be COD/unpaid only)
SELECT o.id, o."orderNo", o."paymentStatus"
FROM "order" o
LEFT JOIN order_payment op ON op."orderId" = o.id
WHERE op.id IS NULL;

-- Coupons past their usage cap but still active
SELECT code, "timesUsed", "maxUsage" FROM coupon
WHERE "maxUsage" IS NOT NULL AND "timesUsed" >= "maxUsage" AND "isActive" = true;

-- Admin screens with no permission rows (invisible to every non-admin role)
SELECT m.id, m.name, m.url FROM menu m
LEFT JOIN menu_permission mp ON mp."menuId" = m.id
WHERE m."is_admin_menu" = true AND mp.id IS NULL;
```

The third and fourth queries are the fastest way to diagnose "the campaign still applies"
and "the menu item disappeared" reports.

---

## 10. Backup and recovery

- Take a logical backup before any schema change: `pg_dump -Fc <db> > pre_change.dump`.
- `synchronize` in development can destroy data; keep local databases disposable.
- Restores must preserve sequence values — use `pg_restore`, not hand-inserted rows, or new
  inserts will collide on primary keys.
