# 04 — API reference

The backend exposes one HTTP API under `/v1` and one Socket.IO namespace. This document
covers the contracts you need before reading a controller: envelope, pagination, errors,
access levels, and the endpoint map. Per-field schemas live in Swagger.

- **Interactive docs:** `http://localhost:3000/docs` (always in development; in production
  only when `SWAGGER_ENABLED=true`)
- **Base URL (local):** `http://localhost:3000/v1`
- **Bearer auth:** `Authorization: Bearer <access token>`; Swagger scheme name is `token`

---

## 1. Versioning and prefix

`main.ts` calls `setGlobalPrefix('v1')` **and** enables URI versioning. No route declares a
version, so every path is simply `/v1/<controller>`. There is no `/v2`.

A second consequence: the prefix is hard-coded. `API_PREFIX` in `.env` is not read.

---

## 2. Response envelope

Successful responses from feature controllers use a three-key envelope:

```json
{
  "message": "Product retrieved successfully",
  "statusCode": 200,
  "data": { "id": 42, "name": "Bratwurst" }
}
```

List endpoints add pagination metadata at the top level (not inside `data`):

```json
{
  "message": "Products retrieved successfully",
  "statusCode": 200,
  "data": [ { "id": 42 } ],
  "total": 128,
  "page": 1,
  "limit": 12,
  "totalPages": 11
}
```

The shape is declared in `src/common/types/index.ts` (`ApiResponseDto`) and
`src/common/dto/paginated-response.dto.ts` (`PaginatedResponseDto`). The frontend relies on
`result.data`; helpers such as `fetchData` unwrap it automatically.

Deviations exist and are worth knowing:

- `GET /v1` returns a bare string (database host) — a smoke test, not an envelope.
- SSLCommerz callbacks return HTML/redirects, not JSON.
- Some report endpoints return `{ message, statusCode, data: { ...multi-section payload } }`
  where `data` is a dashboard object rather than a list.

---

## 3. Pagination, filtering and sorting

The convention across list endpoints:

| Param | Meaning | Default |
| --- | --- | --- |
| `page` | 1-based page number | `1` |
| `limit` | Page size | endpoint-specific (often `10`–`100`) |
| `search` | Free-text filter (name/number/phone depending on resource) | — |
| `sort` | Endpoint-specific enum | endpoint-specific |

`GET /v1/products` accepts the richest filter set:

```text
page, limit, search, category, brand, supplier, featured,
sort, minPrice, maxPrice, isActive, hasDiscount, discountType,
discountActive, tags
```

`sort` accepts `price_asc | price_desc | name_asc | name_desc`; the default is name
ascending.

`GET /v1/orders` accepts:

```text
page, limit, search, sort, orderStatus, paymentStatus,
paymentMethodId, shippingMethodId, area, division, city
```

Report endpoints accept a date preset from `DateRangePreset`:

```text
today | this_week | last_week | this_month | last_month |
last_3_months | last_6_months | last_year | this_year
```

plus explicit `startDate` / `endDate` where the handler supports it. Day boundaries are
computed in **Asia/Dhaka** (`common/utils/dhaka-time.util.ts`) — passing UTC dates shifts
revenue between days.

---

## 4. Errors

Errors are **not** wrapped in the success envelope. They use Nest's default exception body:

```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

| Status | When |
| --- | --- |
| 400 | DTO validation failed (`message` is a `string[]`), business rule violated (out of stock, inactive product, minimum order amount) |
| 401 | Missing/invalid/expired access token (`JwtAuthGuard` normalizes it) |
| 403 | Role mismatch, missing menu permission, inactive role, unknown `@ModulePermissions` path |
| 404 | Entity not found |
| 429 | Throttler limit exceeded (3000/min, 10 000/5 min, 50 000/h per client) |
| 500 | Unhandled exception |

**Rate limiting is not per shopper.** Login, register and OTP calls are made from the
Next.js server (server actions), so the API sees one shared source IP for every visitor;
their `@Throttle({ short, medium, long })` buckets are site-wide and sized for campaign
peaks (login and mobile-login: 120/min, 400/5 min, 1200/h; verify-otp: 1200/h plus retry
headroom; register: 60/min, 200/5 min, 600/h). `mobile-login` sends a paid SMS per call,
so its limit is also the SMS-drain guard — don't loosen it further without checking the
gateway bill. Overrides must use those bucket names — a `default` key matches nothing and
is silently ignored (see `app.module.ts`).

Notes:

- Validation uses `whitelist: true`, so **unknown fields are dropped, not rejected**. A
  misspelled field produces a silently unchanged resource, not a 400.
- Body limit is **2 MB** for JSON and urlencoded payloads.
- Report/analytics failures are usually caught and returned as empty sections rather than
  500s; treat a zero-filled report as "possibly failed", and check server logs.

---

## 5. Access levels

Legend: **P** public (no guard) · **U** authenticated user · **A** admin menu permission
(`JwtAuthGuard + PermissionGuard`) · **M** mixed (public reads, admin writes, or user-owned
resources).

| Base path | Purpose | Access |
| --- | --- | --- |
| `/` | Smoke test, returns DB host | P |
| `/addresses` | User shipping/billing addresses | M |
| `/analytics` | Traffic dashboards and request metrics | A |
| `/analytics/track` | Public page-view beacon (product pages only) | P |
| `/attachment` | S3 uploads and metadata | M |
| `/auth` | register, login, refresh, logout, validate, mobile-login, verify-otp | P (refresh guarded) |
| `/banners` | Merchandising banners | M |
| `/bogo-campaigns` | Buy-one-get-one campaigns | M |
| `/bogo-usage-logs` | BOGO redemption log | A |
| `/brands` | Brand catalog | M |
| `/business-settings` | Storefront settings singleton | M (GET public) |
| `/cart` | Cart and items | U |
| `/categories` | Category tree | M |
| `/clients` | Client logo wall | M |
| `/contact-messages` | Contact inbox | M (POST public) |
| `/coupons` | Coupon definitions and validation | M |
| `/coupon-usage-logs` | Coupon redemption log | A |
| `/crm` | Segments, customer 360, activities/tasks, campaigns | A |
| `/delivery-man` | Delivery staff and assignment data | A |
| `/flash-sale-campaigns` | Time-boxed pricing campaigns | M |
| `/flash-sale-usage-logs` | Flash-sale redemption log | A |
| `/free-delivery-campaigns` | Shipping-waiver campaigns + eligibility evaluation | M |
| `/free-delivery-usage-logs` | Free-delivery redemption log | A |
| `/galleries` | Image galleries | M |
| `/locations` | Divisions / cities / areas | P |
| `/menu` | Menu tree (admin and storefront) | A (writes) |
| `/menu-permissions` | Role↔menu permissions, `accessible-menus/:userId` | A / U (own menus) |
| `/notifications` | In-app notifications | M |
| `/online-users` | Live visitor count | A |
| `/orders` | Order lifecycle, notes, status, delivery assignment, reports | M |
| `/orders/payments` | Customer payment ledger per order | A |
| `/order-payment-methods` | Checkout payment options | M |
| `/payments` | **Supplier** payments for purchases | A |
| `/payment-methods` | **Supplier** payment methods | A |
| `/products` | Catalog, pricing, stock, feeds, reports | M |
| `/reviews` | Product reviews and moderation | M |
| `/purchases` | Procurement purchase orders | A |
| `/recipes` | Recipe content | M |
| `/roles` | Roles | A (AdminGuard) |
| `/sales-partners` | Where-to-buy partners | M |
| `/sales-points` | Outlet locations | M |
| `/sales-point-shops` | Shops within sales points | M |
| `/shipping-methods` | Shipping options and rules | M |
| `/payment` | SSLCommerz init + IPN/success/fail/cancel callbacks | P (callbacks) |
| `/subscribers` | Newsletter sign-ups | M (POST public) |
| `/suppliers` | Procurement suppliers | A |
| `/testimonials` | Testimonials | M |
| `/units` | Product units | M |
| `/users` | Users/customers, profile, passwords, reports | M |
| `/user-activities` | Admin audit trail | A |
| `/wishlist` | Saved products | U |

The authoritative per-endpoint truth is the Swagger lock icon; the table above summarizes
intent. Remember that an admin route also needs a matching `menu` row — see
[02 §5.3](02-architecture.md#53-menu-level-rbac).

---

## 6. Endpoint groups worth memorizing

### Auth (`/auth`)

| Method & path | Notes |
| --- | --- |
| `POST /register` | Creates a customer, hashes password, role defaults to `3` |
| `POST /login` | Returns `accessToken` + `user`; refresh token is exchanged separately |
| `POST /refresh` | `JwtRefreshGuard`; body carries the current token |
| `POST /logout` | Writes an audit row and returns 200; the token itself stays valid until it expires, so the client must discard it |
| `POST /validate` | Token validation helper |
| `POST /mobile-login` | Sends an OTP; in development the OTP is `123456` |
| `POST /verify-otp` | Exchanges mobile + OTP for an access token and user |

### Catalog feeds (`/products`)

| Path | Purpose |
| --- | --- |
| `GET /products` | Filtered, paginated list (cached 15 s) |
| `GET /products/all` | Lightweight full list |
| `GET /products/slug/:slug` | Product detail by slug (`no-store` on the Next side) |
| `GET /products/:id/similar` | Related products |
| `GET /products/discounted` | Active product discounts |
| `GET /products/flash-sale` | Items in active flash-sale campaigns |
| `GET /products/bogo` | Items in active BOGO campaigns |
| `GET /products/bestsellers` / `featured` / `tags` | Merchandising feeds |
| `GET /products/:id/stock-movements` | Stock ledger for one product |
| `POST /products/:id/stock-adjust` | Manual adjustment (writes a stock movement) |
| `GET /products/reports/{low-stock,out-of-stock,sales,stock-valuation,stock-summary}` | Inventory reports |

### Orders (`/orders`)

Lifecycle: `PENDING → PROCESSING → SHIPPED → DELIVERED`, with `ON_HOLD` and `CANCELLED` as
branches. Money: `paymentStatus ∈ {unpaid, partial, paid, failed, refunded, need_refund,
refund_complete, partial_refund}` (`PaymentStatus.PENDING` serializes as `unpaid`).

| Path | Purpose |
| --- | --- |
| `GET /orders` | Admin list with filters |
| `POST /orders` | Create order — runs the pricing pipeline ([07](07-features.md#3-checkout-pricing-pipeline)) |
| `GET /orders/:id` / `/orders/user/:userId` | Detail / customer history |
| `GET /orders/:id/neighbors` | Previous/next order in the current filtered list |
| `PATCH /orders/:id/order-status` | Advance status (writes a status track) |
| `PATCH /orders/:id/payment-status` | Manual payment reconciliation |
| `PATCH /orders/:id/assign-delivery-man` | Dispatch |
| `PATCH /orders/:id/cancel` | Cancel with reason + notes |
| `POST /orders/:id/notes` | Internal notes |
| `GET /orders/reports/*` | ~20 report endpoints (see below) |

Order report endpoints: `dashboard`, `date-range`, `daily-summary`, `refunds`,
`deliveryman-performance`, `date-wise-delivery`, `payment-methods`,
`payment-method-share`, `shipping-methods`, `cancellations`, `repeat-buyers`,
`discount-impact`, `late-delivery`, `delivery-performance-summary`,
`area-wise-orders`, `statistics`, `monthly`, `monthly/years`,
`last-30-days-delivered`, `today`, `payment-due`, `customer-type`,
`category-sales`.

### User & access

| Path | Purpose |
| --- | --- |
| `GET /users/customers` | Customer list (admin) |
| `GET /users/customers/area-stats`, `/customers/top` | Customer analytics |
| `PATCH /users/:id` | Profile update |
| `PATCH /users/password/change` | Authenticated password change |
| `POST /users/password/reset-request` / `reset` | Password reset flow |
| `GET /menu-permissions/accessible-menus/:userId` | Drives the admin sidebar |
| `GET /user-activities` | Audit trail (90-day retention) |

---

## 7. Real-time API (Socket.IO)

Namespace: **`/notifications`**

```ts
io(`${NEXT_PUBLIC_SOCKET_URL}/notifications`, {
  query: { userId: String(user.id), isAdmin: String(user.isAdmin) },
  withCredentials: true,
});
```

| Direction | Event | Payload |
| --- | --- | --- |
| server → client | `newOrder` | Order summary; room `admins` only |
| server → client | `newMessage` | Contact message; room `admins` only |
| server → client | `orderStatusUpdate` | `{ orderId, status }` to `user:<id>` |
| server → client | `paymentStatusUpdate` | `{ orderId, paymentStatus }` |
| server → client | `orderConfirmation` | After successful payment |
| server → client | `notification` | Generic in-app notification |
| server → client | `broadcast` | Announcement to all sockets |
| client → server | `joinRoom` / `leaveRoom` | Join/leave a custom room |
| client → server | `sendBroadcast` | Admin-only broadcast (validated server-side) |

The handshake `userId`/`isAdmin` values are trusted as provided; they are not derived from a
verified token. Treat socket message contents as UI hints, not authorization.

---

## 8. Calling the API from the frontend

All helpers live in `apps/frontend/utils/api-utils.ts`; use them instead of raw `fetch`:

| Helper | Use for | Caching |
| --- | --- | --- |
| `fetchData<T>(path)` | Public reads; unwraps `data` | `revalidate: 60` (300 + tag `products` for product paths); detail paths `no-store` |
| `fetchPublicData<T>(path)` | Public reads with ISR | `revalidate: 60`, tag `public` |
| `fetchProtectedData<T>(path)` | Authenticated server reads | `no-store` by default |
| `fetchDataPagination<T>(path)` | Authenticated list reads | Returns the **full envelope** (needs `total`/`totalPages`) |
| `postData` / `patchData` / `putData` / `deleteData` | Mutations | — |
| `formPostData` | Multipart uploads | — |

`path` is relative to `/v1` (`fetchData("products")` → `/v1/products`).
`fetchProtectedData` and friends attach `Authorization` automatically by resolving the
httpOnly cookie, and clear cookies on a 401.
