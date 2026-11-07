# 07 — Features

What the platform does, in the order a customer and an operator meet it. The rules below
are implementation rules, not marketing copy: they are the ones that produce the numbers in
the database.

---

## 1. Actors

| Actor | Access | Notes |
| --- | --- | --- |
| Guest | Storefront | Cart lives in `localStorage`; checkout requires an account or mobile OTP login |
| Customer | Storefront + `/user/[id]` | Orders, addresses, reviews, wishlist, notifications |
| `superadmin`, `admin` | Everything | Bypass all menu-permission checks |
| Other admin roles (`moderator`, custom) | Only granted menus | Sidebar and `PermissionGuard` both derive from `menu_permission` |
| Delivery man | No login | A dispatch record attached to orders; performance is reported per person |
| Supplier | No login | Procurement record only |

---

## 2. Storefront journey

1. **Home** — banners by position, category rails, featured / bestseller / discounted /
   flash-sale / BOGO feeds, testimonials, recipes.
2. **Browse** — `/products` with category, brand, supplier, price range, tag, discount and
   stock filters plus sorting; `/categories/[slug]`, `/brands/[slug]`, `/products/search`.
3. **Product detail** — gallery, effective price (flash sale or product discount, never
   both), stock availability, reviews, wishlist, related products, add to cart.
4. **Cart** — guest cart in `localStorage`, server cart once signed in; coupon apply and a
   free-delivery banner that evaluates live against active campaigns.
5. **Checkout** — customer information → address (division/city/area) → shipping method →
   payment method → coupon → order summary. The server **recomputes** every amount; the
   client total is only a preview.
6. **Payment** — SSLCommerz hosted checkout for card/mobile banking, or a cash-style method
   that leaves the order `unpaid`. Gateway returns land on `/payment/success|failed|cancelled/[id]`.
7. **Confirmation** — `/order-confirmation/[id]` with the order number and a downloadable
   PDF invoice.
8. **Account** — order history and tracking, addresses, reviews, wishlist, notifications,
   support/contact.

Guest carts are **not merged** into the server cart at login. If the cart contents matter,
the customer must add them again after signing in.

---

## 3. Checkout pricing pipeline

This is the highest-risk logic in the system (`order.service.ts#create`). The order of
operations is deliberate:

| # | Step | Rule |
| --- | --- | --- |
| 1 | Product validation | Product must exist and be `isActive`, and `product.stock >= quantity`; otherwise 400/404 with a human-readable message |
| 2 | Base price | `sellingPrice` |
| 3 | Flash sale | If an active campaign matches the product (directly or via its category), the campaign price **replaces** the product discount — no stacking |
| 4 | Product discount | Otherwise, if `now` is inside `discountStartDate…discountEndDate`: `fixed` subtracts the value, `percentage` takes `value%`; price floored at 0 |
| 5 | Line totals | `totalValue += price × qty`, `totalDiscount += unitDiscount × qty`; stock is decremented, `saleCount` incremented, and an `order_sale` stock movement written |
| 6 | BOGO | For each campaign (lowest id first): pool eligible units across lines, every `buy+get` units make the `get` cheapest units free; capped by `maxGroupsPerOrder`; campaign totals are written back into the line prices |
| 7 | Coupon | Only inside its validity window; excluded products are removed from the eligible base; `fixed` subtracts the value, `percentage` takes `value%` of the **post-BOGO** eligible total, capped by `maxDiscountAmount`; total floored at 0 |
| 8 | Free delivery | Evaluated against the **payable subtotal after steps 4–7**, total quantity, matching products/categories, user history and Dhaka-time window; if matched and the shipping method is not excluded, shipping is 0 |
| 9 | Shipping minimum | `shippingMethod.minOrderAmount` is checked against the post-discount subtotal (skipped for pickup); failure is a 400 |
| 10 | Grand total | `totalValue += chargedShipping`, both totals rounded to 2 decimals |
| 11 | Persist | Order created `pending`, `shippingCost` stored, item price snapshots written |
| 12 | Usage logs | Coupon (`timesUsed++`), free delivery, one flash-sale row per matching campaign, one BOGO row per campaign that freed a unit — all best-effort |

**Worked example**

| Line | Computation |
| --- | --- |
| Product A: ৳500 × 2, flash −10% | unit ৳450 → line ৳900, discount ৳100 |
| Product B: ৳300 × 1 | line ৳300 |
| Subtotal | ৳1 200 |
| BOGO “buy 2 get 1”, 3 pooled units | cheapest unit (৳300) free → subtotal ৳900, discount ৳400 |
| Coupon 10% on ৳900 | −৳90 → payable ৳810 |
| Free delivery needs ৳1 000 | not met → shipping ৳60 |
| **Grand total** | **৳870** |

Operational consequences:

- A coupon percentage never discounts BOGO-free units, because BOGO is applied first and
  rewrites line totals.
- Free delivery is judged **after** discounts, so a coupon can push an order below the
  threshold and reintroduce the shipping fee.
- `order.totalDiscount` accumulates product + BOGO + coupon discounts, but **not** waived
  shipping.
- Usage caps are checked when the coupon is validated and incremented after the order is
  written; concurrent checkouts can exceed `maxUsage` by the number of in-flight orders.

---

## 4. Orders and fulfilment

### Status model

```
pending ──► processing ──► shipped ──► delivered
   │            │
   ├──► on_hold ┘
   └──► cancelled
```

- `PATCH /orders/:id/order-status` writes an `order_status_track` row; `deliveredAt` is set
  when entering `delivered`, and cleared if the status leaves it.
- Cancellation is only allowed from `pending`, `processing` or `on_hold`. Shipped and
  delivered orders must go through returns/support.
- Cancelling restores stock with an `order_cancel` movement, decrements `saleCount`, stamps
  `cancelledAt`, and maps payment status:

| Before cancel | After cancel |
| --- | --- |
| `paid` or `paidAmount > 0` | `need_refund` |
| `partial` | `partial_refund` |
| anything else | `failed` |

- Delivery assignment (`assign-delivery-man`) feeds the delivery-man performance reports.
- Internal notes are append-only (`order_note`).
- `GET /orders/:id/neighbors` supports previous/next navigation inside a filtered admin list.

### Payments

- `order_payment` is the ledger; every create/delete recomputes `order.paidAmount` and
  derives `paymentStatus` (`unpaid → partial → paid`, refunds → `partial_refund` /
  `refund_complete`).
- **Manual `PATCH /orders/:id/payment-status` changes only the status field — it does not
  touch `paidAmount`.** Use the payment ledger for reconciliation; use the manual endpoint
  only to correct a wrongly-labelled status.

---

## 5. Shipping, coverage and delivery

| Concept | Behaviour |
| --- | --- |
| Shipping method | Name, cost, delivery time, `isPickup`, `minOrderAmount`, `isExcludedFromFreeDelivery` |
| Pickup | Never charged; bypasses the minimum-order check |
| Coverage | Division → city → area tree (`delivery_coverage`); determines serviceable addresses at checkout |
| Delivery man | Attached to orders; drives performance reports (assigned vs delivered, late deliveries) |
| Free delivery | Waives the method cost only when the method is not excluded and the campaign matches |

Counters and reports read `deliveredAt` / `cancelledAt`, not `updatedAt` — backfill scripts
exist precisely because those stamps were added later.

---

## 6. Marketing engine

Four campaign types, all evaluated at order creation, all logged for reporting.

### Coupons

Fields: `code` (unique), `discountType` (`percentage`/`fixed`), `value`,
`maxDiscountAmount`, `validFrom`/`validUntil`, `isActive`, `maxUsage` (`null` = unlimited),
`timesUsed`, excluded products.

Validation responses: inactive → 400, expired → **410 Gone**, not yet valid → 400, usage cap
exceeded → 400. Exclusions apply per product; a percentage coupon's base is the eligible
line total after BOGO.

### BOGO (buy X get Y)

Fields: `buyQuantity`, `getQuantity`, `maxGroupsPerOrder` (0 = unlimited), `maxUsage`
(0 = unlimited), `usageCount`, product/category scope, validity window.

Rules: units pool across eligible lines (not per line), the cheapest units become free,
campaigns are processed in id order and a unit can only feed one campaign, and every
campaign that freed a unit gets its own usage-log row.

### Flash sales

Fields: `discountType`, `discountValue`, validity window, `maxUsage` (0 = unlimited),
`usageCount`, product/category scope.

A matching flash campaign **replaces** the product's own discount for that line. Usage is
incremented once per campaign per order.

### Free delivery

Fields: `daysOfWeek` (0 = Sunday), `startTime`/`endTime` (`HH:mm`, Asia/Dhaka, end
exclusive, midnight wrap supported), `minOrderAmount`, `minQuantity`, `newCustomersOnly`,
product/category scope, `usageCount`.

Rules: any eligible item qualifies the whole order; `newCustomersOnly` requires zero
previous orders and never matches guests; the minimum amount is compared to the **payable**
subtotal after product, BOGO and coupon discounts.

### Precedence summary

```
flash sale  >  product discount        (per line, mutually exclusive)
BOGO        >  coupon                  (coupon base excludes free units)
discounts   >  free-delivery check     (threshold uses the discounted subtotal)
free delivery  >  shipping minimum     (waived cost still obeys pickup/minimum rules)
```

---

## 7. Catalog and inventory

- **Products** carry slug, SKU, selling/purchase price, stock, unit, category, brand,
  supplier, gallery, featured flag, `saleCount`, discount window and rollup values
  (`totalValueBySalePrice`, `totalValueByPurchasePrice`).
- **Stock** changes only through the ledger: order sale, order cancel, purchase receipt,
  purchase reversal, manual adjustment. Every row stores before/after values, so product
  stock can always be reconciled (see [05 §9](05-database.md#9-useful-operational-queries)).
- **Purchases** (procurement): create a purchase with line items at unit cost → receive it
  (stock in, `purchase` movements) → record supplier payments against it. Reversing a
  received purchase writes `purchase_reversal` movements.
- **Product history** records `created`, `updated`, `activated`, `deactivated`, `deleted`
  and is retained separately from the 90-day audit log.
- **Categories** are a tree, optionally surfaced in the main menu. **Brands**, **units**,
  **galleries/attachments** and **banners** are supporting catalog data.

---

## 8. CRM

Segments are computed from purchase behaviour and mapped to the enum
`champions | vip | loyal | promising | about_to_sleep | at_risk | lost | new | inactive`.
`GET /crm/segment-rules` exposes the thresholds so the UI can explain a segment.

| Capability | Endpoint | Notes |
| --- | --- | --- |
| Customer list + filters | `GET /crm/customers` | Segment, spend, recency, search |
| Customer 360 | `GET /crm/customers/:id` | Orders, spend, segment, activity timeline |
| Export | `GET /crm/customers/export` | CSV/Excel payload for the report export button |
| Activities / tasks | `GET/POST/PATCH/DELETE /crm/activities` | Types: `note`, `task`, `call`, `email`; status `open`/`completed`. The admin "Tasks" screen is the same endpoint filtered to `task` |
| Campaigns | `POST/GET /crm/campaigns`, `POST /crm/campaigns/:id/send` | Channels `sms`/`email`; statuses `draft → sending → sent`/`failed`; recipients preview before send |
| Dashboard | `GET /crm/dashboard` | Segment distribution, activity load, campaign outcomes |
| Abandoned carts | `GET /cart/reports/abandoned` | Carts with items inactive for 24 h+ (note: not under `/crm`) |

Campaign sending is synchronous per recipient and records a recipient row with
`sent|failed|skipped`; a failed send does not roll back the campaign.

---

## 9. Reports

22 admin screens under `/admin/reports`, backed by four endpoint families.

| Group | Screens | Backing endpoints |
| --- | --- | --- |
| Sales & orders | `order-reports`, `daily-summary`, `monthly-orders`, `product-sales`, `discount-impact`, `top-customers`, `repeat-buyers` | `/orders/reports/*`, `/products/reports/sales` |
| Payment | `payment-methods`, `refunds` | `/orders/reports/payment-methods`, `/orders/reports/refunds` |
| Delivery | `date-wise-delivery`, `deliveryman-performance`, `late-delivery`, `area-wise-orders`, `shipping-methods` | `/orders/reports/*` |
| Cancellations | `cancellations` | `/orders/reports/cancellations` |
| Promotions | `coupon-usage`, `bogo-usage`, `flash-sale-usage`, `free-delivery-usage` | `*-usage-logs` (+ `report-stats`) |
| Inventory | `inventory` | `/products/reports/*` |
| Customers | `customer-list` | `/users/reports/customer-list` |
| Checkout | `abandoned-checkout` | `/cart/reports/abandoned` |

All report screens share date filters (`ReportDateFilters`) and export to PDF
(`@react-pdf/renderer`) and Excel (`exceljs`). Day boundaries are Asia/Dhaka.

---

## 10. Content, settings and inbox

- **Business settings** (singleton): logo, contact details, social links, storefront copy
  and **maintenance mode** with an optional schedule. The public `GET` feeds header, footer,
  invoices and the maintenance takeover page.
- **Banners**: position (`top|middle|bottom|sidebar`), type (`main|promotional|featured`),
  display order, target URL, image.
- **Recipes, testimonials, clients, sales points/partners/shops**: marketing content managed
  from the admin, rendered on the storefront.
- **Policy pages** (FAQ, privacy, returns, terms) are static routes, not CMS content —
  changing them requires a deploy.
- **Contact inbox**: submissions carry status (`pending|in_progress|resolved|closed`),
  source (`website|facebook|phone|email|whatsapp|other`), priority and taken actions; replies
  are stored per message.
- **Subscribers**: newsletter list, exportable.

---

## 11. Notifications

| Event | Recipient | Transport |
| --- | --- | --- |
| New order | Admins room | Socket.IO `newOrder` + notification row |
| New contact message | Admins room | Socket.IO `newMessage` |
| Order status / payment status change | The customer's room | Socket.IO + notification row |
| Broadcast | Everyone | Socket.IO `broadcast` |
| Transactional e-mail | Customer | ZeptoMail (best-effort) |
| OTP | Customer | SMS gateway; fixed `123456` in development |

The admin header shows a live unread count and plays a sound for new-order alerts.

---

## 12. Access control and audit

- **Roles** → **menus** → **permissions** (`canView`, `canCreate`, `canEdit`, `canDelete`),
  with ancestor inheritance so a section grant covers its children.
- **Audit trail** (`/admin/audit-log`): every admin request recorded by
  `ActivityInterceptor`, retained 90 days, purged nightly at 02:00.
- **Online users**: live visitor counter for the dashboard.
- **Analytics**: request volume, response times, top endpoints/pages, devices, traffic
  sources, conversion, peak hours — fed by the interceptor and purged after the retention
  window.

---

## 13. Behavioural edge cases worth knowing

| Situation | Actual behaviour |
| --- | --- |
| Guest adds items, then signs in | Guest cart is dropped; server cart is shown. No merge |
| Coupon expires/lapses while a cart is open | Order creation **re-validates** the coupon (`CouponService.assertUsable`) and fails with 400 — the customer removes the coupon and retries. The cart-level check endpoint still returns 410 Gone for expiry |
| Product deactivated while in a cart | Order creation rejects it ("no longer available"); detail pages 404 immediately |
| Product price edited after an order | Order history is unchanged (line-level price snapshots) |
| Manual payment-status change | `paidAmount` is untouched; reports based on the ledger disagree until reconciled |
| Order creation fails mid-loop | Stock may already be decremented (no surrounding transaction) — the known risk described in [03](03-backend-guide.md#4-services-data-access-and-money) |
| Free delivery + express method | Express methods marked `isExcludedFromFreeDelivery` always charge |
| Pickup method + minimum order | Minimum is not enforced for pickup |
| Coupon/campaign cap reached during checkout | Order creation re-checks the coupon cap (`assertUsable`), but `timesUsed` increments after the order is written — a concurrent burst can still overshoot |
| Admin screen missing from sidebar | No `menu` row or no `menu_permission` for that role |
