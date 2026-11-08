# 02 — Architecture

Two deployable applications, one database, a handful of third-party services. There is no
message broker and no shared library package: the frontend talks to the backend over HTTP,
and the backend owns every invariant.

---

## 1. Runtime topology

```
                 ┌────────────────────────────────────────────┐
   Browser ─────►│  Next.js 16  (apps/frontend, :3002)        │
   HTML / RSC    │  • App Router, server components           │
   actions       │  • proxy.ts  → /user, /admin gate          │
                 │  • Server Actions → cookie writes          │
                 │  • route handlers: /api/auth/token,        │
                 │    /api/pdf-image                          │
                 └───────────────┬────────────────────────────┘
                                 │  fetch JSON, Bearer <access token>
                                 ▼
                 ┌────────────────────────────────────────────┐
                 │  NestJS 12  (apps/backend, :3000)          │
                 │  global prefix /v1, URI versioning         │
                 │  Swagger UI  /docs                         │
                 └───┬──────────┬──────────┬──────────┬───────┘
                     │          │          │          │
                     ▼          ▼          ▼          ▼
                PostgreSQL    AWS S3    Socket.IO   Outbound HTTP
                (TypeORM)   (uploads)  /notifications  • SSLCommerz
                     ▲                    ▲           • ZeptoMail
                     │                    │           • SMS gateway
                     └── analytics rows   └── browser client
                         (batched)
```

**Why the frontend is a server too.** The access token lives in an `httpOnly` cookie, so
only the Next server can read it. Server components call the API directly with
`fetchProtectedData()`; client components ask `/api/auth/token` for the token when they
need to call the API from the browser. This keeps the token out of `localStorage` and out
of client JS bundles.

---

## 2. Repository layout

```
germanbutcher_monorepo/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts                 # bootstrap: helmet, CORS, pipes, Swagger
│   │   │   ├── app.module.ts           # 50 feature modules + TypeORM + throttler
│   │   │   ├── common/                 # enums, DTOs, decorators, guards, utils
│   │   │   ├── config/                 # S3 / mail / app configuration
│   │   │   ├── interceptor/             # request activity interceptor
│   │   │   └── <feature>/               # ~50 feature modules: controller, service, dto/, entities/
│   │   ├── test/                       # e2e harness
│   │   └── database.dbml               # schema snapshot (see 05)
│   │
│   └── frontend/
│       ├── app/
│       │   ├── (main)/                 # storefront: products, cart, checkout, account…
│       │   ├── admin/                  # back office (menu-driven)
│       │   ├── auth/                   # sign-in, sign-up, OTP
│       │   └── api/                    # 2 route handlers
│       ├── components/                 # admin/, homepage/, products/, ui/, …
│       ├── actions/                    # server actions (auth, jwt utils, revalidate)
│       ├── providers/ + contexts/       # cart, notification, search
│       ├── utils/                       # api client, formatters, PDF, types
│       ├── proxy.ts                     # Next 16 route middleware
│       └── next.config.js
│
├── Dockerfile.backend / Dockerfile.frontend
├── docker-compose.yml
├── pnpm-workspace.yaml
└── docs/
```

`apps/frontend/app/api` deliberately holds only two handlers. Everything else that mutates
state goes through Server Actions (`actions/*.ts`) or is done by the client directly
against the Nest API.

---

## 3. Backend bootstrap order

`src/main.ts` runs these steps in order; the order matters when debugging headers, CORS or
payload limits:

1. `import 'dotenv/config'` (module import) loads **`.env`** into `process.env` before the
   application is created.
2. `NestFactory.create<NestExpressApplication>(AppModule, { … })` with the Nest 12 route
   options and the Observe instrument — see §3.1 and §3.2.
3. **Body parsers** raised to `2mb` for JSON and urlencoded — the Express default of 100 kB
   rejects large checkout payloads.
4. `compression()` — JSON product lists compress heavily over the WAN.
5. `helmet()` — security headers.
6. `enableShutdownHooks()` — lets `AnalyticsService.onModuleDestroy` flush the buffer on
   SIGTERM/SIGINT.
7. `trust proxy = 1` — client IPs come from `X-Forwarded-For` behind Nginx/ELB/Cloudflare.
8. Global prefix `v1`, then URI versioning.
9. **Swagger** — enabled unless `NODE_ENV=production`, unless `SWAGGER_ENABLED=true`.
10. **CORS** — `CORS_ORIGINS` allow-list; if the list is empty, every origin is accepted
    (`origin: true`) with credentials.
11. **Global `ValidationPipe`** — `whitelist: true`, `transform: true`,
    `enableImplicitConversion: true`.
12. **Global interceptors** — `ClassSerializerInterceptor` (drops every `@Exclude()` field,
    including `User.password` and `otp`, even in nested eager relations) and
    `AnalyticsInterceptor`.
13. `app.listen(PORT)`, then a structured `Logger` banner (Nest 12 nests trailing object
    params instead of stringifying them).

`AppModule` additionally registers three global providers:

| Provider | Type | Effect |
| --- | --- | --- |
| `ThrottlerGuard` | `APP_GUARD` | Applies the three throttler buckets to every route |
| `ActivityInterceptor` | `APP_INTERCEPTOR` | Records admin activity / audit trail |
| `HttpCacheInterceptor` | `APP_INTERCEPTOR` | Emits `Cache-Control` for `@HttpCache(n)` handlers |

Throttling is configured with three in-memory buckets: **3000 / min**, **10 000 / 5 min**,
**50 000 / h**. Several high-traffic controllers opt out at class level with
`@SkipThrottle()` (for example `ProductController`).

### 3.1 Route registration (Nest 12)

`NestFactory.create` is called with:

```ts
routeConflictPolicy: { duplicate: 'warn', shadow: 'warn' },
routeResolutionStrategy: 'specificity',
```

- `duplicate` — two handlers with the same method + path + host + version. `warn` logs it at
  startup; the default (`off`) registers both silently and the first one wins.
- `shadow` — patterns that can match the same request (`/orders/reports/today` vs
  `/orders/:id`). `warn` surfaces the overlap in the boot log; the default is `off`.
- `specificity` registers literal segments before parametric/wildcard ones on Express, so
  static report paths win over `:id` regardless of declaration order. Nest's default is
  `declaration`.

Watch the boot log when adding routes: a `duplicate` warning is a real bug; a `shadow`
warning is often benign under `specificity`, but confirm the more specific handler is the
one you meant to answer.

### 3.2 Observability agent (Nest 12)

`src/observe.ts` calls `createObserveModule()` and exports `ObserveModule` and
`ObserveInstrument`. `main.ts` passes `instrument: ObserveInstrument` to
`NestFactory.create`; `.env` supplies `OBSERVE_APP_KEY` / `OBSERVE_APP_SECRET` (optional —
with neither set the agent sends nothing and warns once).

**Gap:** the agent's canonical wiring also imports `ObserveModule.forRoot(…)` into
`AppModule`. This repo exports it but does not import it, so treat traces and runtime
metrics as not guaranteed until that line exists — see
[09](09-contributing.md#6-known-technical-debt).

---

## 4. Request lifecycle

```
HTTP request
  │
  ├─ express middleware: helmet → compression → body parser
  ├─ CORS check
  │
  ├─ ThrottlerGuard (global)                     → 429
  ├─ JwtAuthGuard (route)                        → 401  (skipped if @isPublic)
  ├─ AdminGuard / RolesGuard / PermissionGuard   → 403
  │
  ├─ ActivityInterceptor  (pre)
  ├─ HttpCacheInterceptor (pre)
  ├─ ValidationPipe: whitelist + transform + implicit conversion → 400
  │
  ├─ Controller handler → Service → TypeORM / S3 / gateway
  │
  ├─ ClassSerializerInterceptor  → strips @Exclude()
  ├─ HttpCacheInterceptor        → Cache-Control for @HttpCache(n)
  └─ AnalyticsInterceptor        → buffers a usage row (unless @SkipAnalytics)
```

Error responses are Nest's standard exception payload, plus an optional `errorCode` when the
thrown exception sets one (Nest 12's default filter copies it into the body). The API does
**not** wrap errors in the success envelope. See
[04 API reference](04-api-reference.md#4-errors).

---

## 5. Authentication and authorization

### 5.1 Tokens

- Access token: JWT signed with `JWT_ACCESS_SECRET`.
- Refresh token: signed with `JWT_REFRESH_SECRET`, exchanged at `POST /v1/auth/refresh`.
- JWT payload carries `sub`, `name`, `email`, `mobileNumber` and `roles {id, rolename}`.
- `JwtStrategy.validate()` maps that to `request.user = { userId, name, email,
  mobileNumber, role, roleId }`.

### 5.2 Guards

| Guard | Behaviour | Usage |
| --- | --- | --- |
| `JwtAuthGuard` | Passport `jwt`; honours a `'isPublic'` metadata flag; returns a uniform 401 `Invalid or expired token` | 214 routes |
| `OptionalJwtAuthGuard` | Populates `request.user` when a token is present, never rejects | 4 routes (public endpoints that personalize) |
| `AdminGuard` | `role === 'admin' \|\| 'superadmin'` | 12 routes |
| `RolesGuard` | Compares `request.user.role` against `@Roles(...)` | 1 route |
| `PermissionGuard` | Opt-in; see below | 152 routes |
| `JwtRefreshGuard` | `AuthGuard('jwt-refresh')` | refresh endpoint |

### 5.3 Menu-level RBAC

The admin is authorized twice: once by role, once by **menu**. A controller declares the
admin menu it belongs to:

```ts
@UseGuards(JwtAuthGuard, PermissionGuard)
@ModulePermissions('/admin/products')
@Controller('products')
```

`PermissionGuard` then:

1. Maps the HTTP method to an action: `GET → canView`, `POST → canCreate`,
   `PUT/PATCH → canEdit`, `DELETE → canDelete`.
2. Looks up the `menu` row whose `url` equals the declared path
   (`menuService.findByPath`). An unknown URL is a hard 403 — a typo in
   `@ModulePermissions` locks the route.
3. Loads the role's `menu_permission` rows and walks the menu **lineage**: the exact menu
   first, then ancestors, so section-level grants are inherited by child screens.
4. Rejects immediately when the role is deactivated (JWTs can outlive a role change).
5. Bypasses all of the above for `admin` and `superadmin`.

The same rule set drives the sidebar: `GET /v1/menu-permissions/accessible-menus/:userId`
returns only what the role can view, so a route can be reachable by URL but invisible in
the UI — or vice versa. Keep both in sync when adding screens.

### 5.4 Storefront session

| Piece | Detail |
| --- | --- |
| `auth_token` cookie | `httpOnly`, `sameSite=lax`, `secure` in production, `maxAge` 24 h |
| `user` cookie | JSON snapshot (`id`, `name`, `email`, `mobileNumber`, `roles`, `isAdmin`, `profilePhoto`, `createdAt`), same flags |
| Server read | `actions/auth.ts → getToken()`, `getUser()` |
| Browser read | `GET /api/auth/token` (no-store) |
| Token cache | `resolveAuthToken()` caches per browser page load; `resetAuthTokenCache()` after login/logout |
| Recovery | A 401 from `fetchProtectedData` triggers `clearAuthCookies()` |
| Refresh | `utils/token-refresh.ts` (server action) posts to `auth/refresh` and rewrites the cookies |

`proxy.ts` (Next 16's replacement for `middleware.ts`) matches `/user/:path*` and
`/admin/:path*`:

- no user → redirect `/auth/sign-in`
- `/admin` without `isAdmin` or a role in `admin|superadmin|moderator` → redirect `/user`

Note the two spellings that exist in the codebase: the **login** helper treats
`admin`, `superadmin` and `modaretor` as admin roles, while `proxy.ts` checks
`admin`, `superadmin`, `moderator`. Only `admin`/`superadmin` match everywhere (and they
are also the roles the backend bypasses), so make new admin users one of those.

---

## 6. Real-time notifications

`NotificationGateway` is a Socket.IO gateway on namespace **`/notifications`**.

- Client connects with `query: { userId, isAdmin }`; the gateway joins the socket to
  room `user:<userId>` and, for admins, to room `admins`.
- Server → client events: `newOrder`, `newMessage` (admins), `orderStatusUpdate`,
  `paymentStatusUpdate`, `orderConfirmation`, `notification`, `broadcast`.
- Client → server: `joinRoom`, `leaveRoom`, `sendBroadcast` (validated server-side, admin
  only).
- CORS origins are hard-coded: the three production hosts plus `localhost:3000/3001`.
  A new dev port must be added there, not in `CORS_ORIGINS`.

The frontend consumes it in `NotificationProvider`, which also plays a sound
(`lib/notification-sound.ts`) for admin alerts.

---

## 7. Analytics pipeline

```
request ─► AnalyticsInterceptor ─► in-memory buffer ─► bulk INSERT (batch 100 or 3 s)
                                        │
                                        └─ cap 1000 rows: oldest dropped if the DB stalls
```

- `@SkipAnalytics()` excludes noisy or sensitive handlers. `ActivityInterceptor` also skips
  a fixed path list: `/v1/online-users/heartbeat`, `/v1/free-delivery-campaigns/check` and
  `/v1/bogo-campaigns/preview`.
- A daily cron purges rows older than `ANALYTICS_RETENTION_DAYS` (default 90, `0` disables).
- The dashboard endpoint serves a cached payload: 5 min for the period-dependent view,
  10 min for fixed-window widgets (7 d / 30 d panels), with single-flight de-duplication.
- `POST /v1/analytics/track` is the public page-view beacon; it only accepts product-page
  paths (regex enforced server-side) to keep cardinality bounded. It accepts an optional
  `referrer` (the landing page's `document.referrer`) because the request's own Referer
  header is always the storefront itself; traffic-source reporting buckets Facebook's
  redirector domains (`l./lm./m./web.facebook.com`, `fb.me`) under `facebook.com`.
- `AnalyticsService.onModuleDestroy` flushes on shutdown — which is why
  `enableShutdownHooks()` is on. A `SIGKILL` loses up to 3 s of rows.

---

## 8. Caching layers

| Layer | Where | TTL / behaviour |
| --- | --- | --- |
| CDN / browser | `@HttpCache(seconds)` → `HttpCacheInterceptor` | `public, max-age=N, stale-while-revalidate=30` (product list = 15 s) |
| Next.js Data Cache | `fetchData` in `utils/api-utils.ts` | `revalidate: 60`; 300 s + tag `products` for product endpoints |
| Next.js Data Cache (detail) | product detail fetches | **`no-store`** on purpose: a deactivated product must 404 immediately |
| Browser memory | `utils/api-utils.ts` | 5 s map for product detail requests |
| Nest process | `SwrCache` in `product.service.ts` | fresh TTL + stale window, single-flight refresh |
| Nest process | analytics dashboard caches | 5 / 10 min |
| Nest process | `@nestjs/cache-manager` `CacheKey`/`CacheTTL` | per-endpoint opt-in |

**Scaling implication:** everything marked "Nest process" is per-instance. Running two API
replicas behind a load balancer is safe for correctness (each cache is a read-through of
the same database) but multiplies cache misses; Socket.IO rooms also become per-instance
unless you add a Redis adapter and sticky sessions.

---

## 9. Cross-cutting configuration surfaces

| Surface | Collection / endpoint | Consumed by |
| --- | --- | --- |
| Business settings | `business-settings` (public `GET`) | Header, footer, invoices, maintenance mode, social links |
| Maintenance mode | `BusinessSettings.maintenanceMode` + optional start/end | `(main)/layout.tsx` renders a takeover page; admin, auth and API stay reachable |
| Menus & permissions | `menu`, `menu-permission` | Admin sidebar, `PermissionGuard` |
| Delivery coverage | `delivery-coverage` | Checkout address validation, shipping availability |
| Shipping methods | `shipping-methods` | Cost, pickup flag, min order amount, free-delivery exclusion |
| Payment methods | `order-payment-methods` | Checkout options and order ledger |

---

## 10. Security posture (summary)

Implemented: JWT with short-lived access tokens kept in `httpOnly` cookies, menu-level RBAC
with inactive-role denial, `helmet` headers, global throttling, `whitelist` validation on
every DTO, TypeORM parameterized queries, CORS allow-list, S3-only image proxy
(`/api/pdf-image` pins the bucket host to prevent SSRF), `@Exclude()` serialization for
secrets, and a 5 MB upload cap.

Known gaps worth tracking: empty `CORS_ORIGINS` opens the API to any origin; the analytics
beacon is unauthenticated by design and stores request IPs in clear text; the Socket.IO
gateway trusts `userId` from the handshake query (no token verification in
`handleConnection`); and there is no CSP header on the storefront. See
[09](09-contributing.md#6-known-technical-debt).

---

_Last verified against the code: 8 November 2026 (NestJS 12 working tree)._
