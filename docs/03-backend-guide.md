# 03 — Backend guide

`apps/backend` is a NestJS 12 application: one PostgreSQL database through TypeORM, one
controller per resource, no CQRS, no microservices, no message broker. Everything is
request/response except the notification gateway and two cron jobs.

---

## 1. Module anatomy

Every feature repeats the same five-piece shape:

```
src/<feature>/
├── <feature>.module.ts          # registers controller + service + entities
├── <feature>.controller.ts      # HTTP surface, guards, Swagger metadata, envelope
├── <feature>.service.ts         # business logic + repository access
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts  # PartialType(Create…)
│   └── <feature>-response.dto.ts
└── entities/
    └── <feature>.entity.ts
```

Conventions worth copying:

- Modules import `TypeOrmModule.forFeature([...])` and export the service when another
  module needs it (`StockMovementModule`, `ProductHistoryModule`, `MenuModule`, …).
- Response DTOs exist mainly to drive Swagger, not to transform data — `ClassSerializer`
  does the stripping.
- A module that another module depends on is imported directly. There is **no
  `forwardRef` anywhere** in the codebase today; if you introduce a dependency cycle you
  will be the first, and it is worth restructuring the module instead.
- Spec files sit next to the unit they cover (`*.spec.ts`) but are currently stubs — see
  [09](09-contributing.md#3-testing).

### Module catalog

**Catalog & merchandising**

| Module | Responsibility |
| --- | --- |
| `product` | Product CRUD, pricing fields, stock, search/filter lists, featured/bestseller/discounted/flash-sale/BOGO feeds, product reports, stock adjustments |
| `product-history` | Audit rows for product field changes |
| `stock-movement` | Append-only stock ledger (`order_sale`, purchase receipt, manual adjustment) with `stockBefore`/`stockAfter` |
| `category` | Hierarchical categories (`parentId`, slug, main-menu flag, image) |
| `brand` | Brands with slug, logo, website |
| `unit` | Selling units (kg / pcs / pack) |
| `gallery` + `attachment` | Image galleries and S3-backed file metadata |
| `supplier` | Procurement suppliers |
| `product-review` | Customer reviews and moderation state |
| `banner` | Merchandising banners (position, type, display order) |
| `testimonial`, `client`, `recipe` | Content: testimonials, client logo wall, recipes |

**Commerce**

| Module | Responsibility |
| --- | --- |
| `cart` | One cart per user plus line items |
| `order` | Order creation and lifecycle, notes, status tracks, delivery assignment, cancellation, ~25 report endpoints |
| `order-payment` | Customer payment ledger per order |
| `order-payment-method` | Checkout payment options (cash on delivery, hosted card, …) |
| `ssl-payment` | SSLCommerz session creation, IPN, success/fail/cancel handling (`/v1/payment`) |
| `payment`, `payment-method` | **Procurement** payments to suppliers (not customer payments) |
| `purchase` | Purchase orders and purchase items |
| `shipping-methods` | Shipping options: cost, pickup flag, minimum order amount, free-delivery exclusion |
| `delivery-coverage` | Which areas are serviceable |
| `delivery-man` | Delivery staff records and assignment |
| `address`, `location` | User addresses; division/city/area reference data |
| `wishlist` | Saved products |

**Marketing**

| Module | Responsibility |
| --- | --- |
| `coupon` | Fixed/percentage coupons with validity window, usage caps, exclusions, max discount |
| `coupon-usage-log` | One row per redeemed coupon |
| `bogo-campaigns` | Buy-X-get-Y campaigns with per-order and per-customer free-unit caps |
| `bogo-usage-log` | BOGO redemptions |
| `flash-sale-campaigns` | Time-boxed campaign pricing that overrides product discounts |
| `flash-sale-usage-log` | Flash-sale redemptions with discount amounts |
| `free-delivery-campaigns` | Shipping waiver by subtotal/quantity/category/user |
| `free-delivery-usage-log` | Free-delivery redemptions |
| `subscribers` | Newsletter sign-ups |

**CRM & insight**

| Module | Responsibility |
| --- | --- |
| `crm` | Segments, activities, tasks, campaigns and recipients, abandoned carts |
| `analytics` | Request analytics ingest, dashboards, retention cron |
| `online-users` | Live visitor count |
| `user-activity` | Admin audit trail + 90-day purge cron |
| `notification` | In-app notifications + Socket.IO gateway |
| `contact-message` | Contact-form inbox with status, source, priority and taken actions |

**Access & platform**

| Module | Responsibility |
| --- | --- |
| `auth` | Register, login, refresh, logout, validate, mobile OTP login, JWT strategies |
| `user` | Users/customers, profile, password change/reset, customer reports |
| `roles` | Role records (`superadmin`, `admin`, `moderator`, customer roles) |
| `menu` | Menu tree (admin + storefront), lineage helper |
| `menu-permission` | Role→menu permissions and `accessible-menus/:userId` |
| `business-settings` | Singleton storefront settings, including maintenance mode |
| `email` | ZeptoMail transport and templates |

> `payment` vs `order-payment` is the most common source of confusion: **`payment` pays
> suppliers for purchases**, `order-payment` records money received from customers.

---

## 2. Controller conventions

A representative admin endpoint:

```ts
@ApiTags('Products')
@Controller('products')
@ApiBearerAuth('token')
export class ProductController {
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/products')
  @Post()
  @ApiOperation({ summary: 'Create a new product with discount' })
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto, @Req() req: Request) {
    const product = await this.productService.create(dto, req.user as User);
    return this.formatResponse('Product created successfully', HttpStatus.CREATED, product);
  }
}
```

Non-negotiables for new endpoints:

1. `@ApiTags(...)` on the controller, `@ApiOperation` + `@ApiQuery/@ApiBody` +
   `@ApiOkResponse/@ApiCreatedResponse` on the handler. Swagger is the API contract for
   the frontend team.
2. Always guard admin routes with **both** `JwtAuthGuard` and `PermissionGuard`, and add
   `@ModulePermissions('<menu url>')`. The URL must exist in the `menu` table.
3. Use the `{ message, statusCode, data }` envelope via the controller's `formatResponse`,
   with pagination meta for lists.
4. Pass `req.user` into the service for `createdBy`/`updatedBy` audit columns.
5. Public storefront routes simply omit guards; there is no `@Public()` decorator in
   practice (the `'isPublic'` flag is honoured by `JwtAuthGuard` but rarely set).
6. **Give client-actionable failures an `errorCode`**. Nest 12's `HttpException` options
   support it and the default filter copies it into the body:

   ```ts
   throw new BadRequestException('Coupon has expired', {
     errorCode: 'COUPON_EXPIRED',
   });
   ```

   Coupon validation already uses this (`COUPON_NOT_ACTIVE`, `COUPON_EXPIRED`,
   `COUPON_NOT_YET_VALID`, `COUPON_USAGE_LIMIT_EXCEEDED`, `COUPON_MIN_ORDER_NOT_MET`, …).
   Clients can branch on `errorCode` instead of matching message text.
7. **Logging**: `new Logger('Context')`; in Nest 12 a trailing object is stored as structured
   parameters instead of being stringified, so `logger.log('Order created', { orderNo })`
   stays searchable.

---

## 3. Validation and DTOs

`main.ts` installs a global pipe:

```ts
new ValidationPipe({ whitelist: true, transform: true,
                     transformOptions: { enableImplicitConversion: true } })
```

Practical consequences:

- Unknown properties are **silently stripped**, not rejected. A typo in a field name is a
  no-op, not a 400.
- Query params arrive as strings and are converted by the declared TS type; use
  `@Type(() => Number)` for arrays/objects where implicit conversion is ambiguous.
- `ParseIntPipe` is the norm for path ids (`@Param('id', ParseIntPipe)`).
- Validation errors produce the standard 400 payload with `message: string[]`.

Separate DTOs per operation (`Create…`, `Update… extends PartialType(Create…)`) and one
response DTO per resource. Enums shared across modules live in
`src/common/enums/index.ts` — `OrderStatus`, `PaymentStatus`, `DiscountType`, `AddressType`,
`CrmSegment`, `CrmCampaignChannel`, … Add new shared enums there rather than inline strings.

---

## 4. Services, data access and money

- Services inject repositories with `@InjectRepository(Entity)`; raw SQL is rare and
  confined to reporting aggregations.
- **Money is `decimal(10,2)` in the database and `number` in TypeScript.** Round to two
  decimals at the boundary (`Math.round(x * 100) / 100`) exactly as the order pipeline
  does. Never store currency in `float`/`int`.
- Only two services use explicit transactions (`menu-permission`, `delivery-coverage`).
  **Order creation is not transactional**: it decrements stock and writes stock movements
  per item, then writes the order row, then writes usage logs. A failure between those
  steps leaves stock decremented without an order. If you touch that flow, consider
  wrapping it in `dataSource.transaction`.
- Usage logs (coupon/BOGO/flash/free-delivery) are written **best-effort**: failures are
  logged and never fail the order. Keep that property — analytics must not block checkout.

---

## 5. Guards, decorators and cross-cutting utilities

| Item | Location | Use |
| --- | --- | --- |
| `JwtAuthGuard` | `auth/guards` | Authenticate |
| `OptionalJwtAuthGuard` | `auth/guards` | Personalize without requiring auth |
| `AdminGuard` | `auth/guards` | Admin/superadmin only |
| `RolesGuard` + `@Roles()` | `auth/guards`, `auth/decorators` | Exact role match |
| `PermissionGuard` + `@ModulePermissions(url)` | `auth/guards`, `auth/decorators` | Menu-level RBAC |
| `@GetUser()` | `auth/decorators` | Extract `request.user` |
| `@SkipThrottle()` | `common/decorators` | Bypass the global throttler |
| `@HttpCache(seconds)` | `common/decorators` | `Cache-Control` header |
| `@SkipAnalytics()` | `common/decorators` | Do not record a usage row |
| `SwrCache` | `common/utils/swr-cache.ts` | In-process stale-while-revalidate cache |
| `dhaka-time.util.ts` | `common/utils` | Timezone-correct reporting boundaries (Asia/Dhaka) |
| `report-date-range.util.ts` | `common/utils` | Preset → range conversion for reports |
| `ip-extractor.util.ts` | `common/utils` | Client IP behind proxies |

Reports that group by day must use the Dhaka-time helpers. Using UTC boundaries silently
shifts revenue between days for the business's actual timezone.

---

## 6. Caching in the backend

Three mechanisms, in order of preference:

1. **`@HttpCache(seconds)`** — lets browsers/CDNs cache a read endpoint. Used on high-volume
   public lists (`GET /products` = 15 s). Do not put it on personalised responses.
2. **`SwrCache`** — process-local cache for expensive list queries with single-flight
   refresh (`product.service.ts`). Entries are shared across requests and must be treated
   as read-only.
3. **`@nestjs/cache-manager`** — `@CacheKey` / `@CacheTTL` on selected handlers; plus
   hand-rolled dashboard caches inside `AnalyticsService`.

Invalidation strategy is deliberately short-TTL rather than tag-based: product lists can be
up to 15 s (HTTP) / 300 s (Next) stale. Admin writes do not purge caches; the frontend
calls `revalidatePath`/`revalidateTag` after mutations where it matters.

---

## 7. Files and S3

`attachment` handles uploads: `POST /v1/attachment` (single, form field `file`) and
`POST /v1/attachment/upload-multiple` (form field `files`), both capped at **5 MB per
file** by `MaxFileSizeValidator`. The service streams to S3 and stores `fileName`,
`originalName`, `mimeType`, `size`, `url` and `key` on `attachment`.

- Public URLs are built from `AWS_S3_BASE_URL`.
- `next.config.js` whitelists exactly two S3 hostnames for `next/image`; a new bucket needs
  a `remotePatterns` entry.
- Deletion removes both the row and the object (see `attachment.service.ts`).

---

## 8. Email and SMS

- **Email** — `EmailModule` wraps ZeptoMail (`ZEPTOMAIL_*`). Templates live in
  `src/email/templates` and `src/auth/templates`. Order confirmations, contact
  acknowledgements and admin alerts are best-effort (failures are logged, never thrown).
  The contact-reply e-mail is the exception: it rethrows, so its caller must handle the
  failure.
- **SMS / OTP** — `auth/sms.service.ts` posts to `SMS_SEND_URL` with `SMS_API_KEY` and
  `SMS_SENDER_NUMBER`. In `NODE_ENV=development` the OTP is fixed to `123456`, so no
  gateway is needed locally.

---

## 9. Payments

`ssl-payment` owns the SSLCommerz integration:

1. `POST /v1/payment/init` creates a gateway session for an order.
2. The gateway calls back to `PAYMENT_IPN_URL` (server-to-server) and redirects the browser
   to `PAYMENT_SUCCESS_URL` / `PAYMENT_FAIL_URL` / `PAYMENT_CANCEL_URL`, all of which point
   at storefront `/payment/*` pages.
3. `order-payment` writes the ledger row; `order.paymentStatus` and `paidAmount` are
   derived from it.

Ledger details that matter operationally:

- Payment and refund numbers are `YYYY-NNNNNN` (6-digit tail since the Nov 2026 migration;
  pre-migration rows keep 4-digit tails), drawn from **one shared sequence** across both
  types because they share a table and column.
- Inserts retry up to three times on a Postgres unique violation (`23505`), because
  SSLCommerz can fire the browser redirect and the IPN callback at the same instant.
- Recording a payment also **syncs `order.paymentMethod`** to the method the money actually
  arrived through, so a manual cash entry fixes an abandoned online method.

`order-payment-method` rows are the customer-facing options; `payment-method` rows belong to
procurement. Do not mix them.

---

## 10. Scheduled jobs

| Job | Schedule | Effect |
| --- | --- | --- |
| `AnalyticsService.scheduledRetention` | daily 03:00 | Deletes analytics rows older than `ANALYTICS_RETENTION_DAYS` (default 90) |
| `UserActivityService.scheduledCleanup` | daily 02:00 | Deletes audit rows older than 90 days (fixed) |

Both are in-process crons. Running multiple API replicas runs each job once **per
replica** — harmless for these deletes, but keep it in mind before adding a job with side
effects (e-mails, payment calls).

---

## 11. Adding a module — checklist

```bash
cd apps/backend
nest g module invoice
nest g controller invoice
nest g service invoice
```

Then:

1. `entities/invoice.entity.ts` — columns, relations, `@ApiProperty`, audit fields.
2. Register with `TypeOrmModule.forFeature([Invoice])` in the module; add the module to
   `AppModule.imports`.
3. DTOs with `class-validator`; update DTO via `PartialType`.
4. Controller: guards + `@ModulePermissions('/admin/invoices')` + Swagger decorators +
   envelope.
5. Add the `menu` row for `/admin/invoices` and grant it in `menu_permission`, otherwise
   `PermissionGuard` returns 403 even for a correct role. For a whole new section you can
   follow the `crm-menu-seeder.ts` pattern: an idempotent `OnModuleInit` insert that runs
   only when the rows are missing.
6. Add the admin page under `apps/frontend/app/admin/...` and a sidebar entry only if the
   menu row is seeded.
7. If the table is new and you are not in production, let `synchronize` create it. In
   production write an idempotent SQL script and run it deliberately (the historical home
   for those scripts, `apps/backend/scripts/`, is now in git history only — see
   [05](05-database.md#2-schema-change-policy)).
8. Add a service spec that asserts real behaviour — the generated "should be defined"
   stub adds no value.

---

_Last verified against the code: 8 November 2026 (NestJS 12 working tree)._
