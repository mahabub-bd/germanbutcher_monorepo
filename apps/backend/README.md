# `germanbutcher-backend`

NestJS 11 API for the German Butcher platform: PostgreSQL through TypeORM, JWT auth with
menu-level RBAC, S3 uploads, SSLCommerz payments, Socket.IO notifications, analytics
ingestion and the reporting surface used by the admin.

**Full documentation:** [`docs/03-backend-guide.md`](../../docs/03-backend-guide.md) ·
[`docs/04-api-reference.md`](../../docs/04-api-reference.md) ·
[`docs/05-database.md`](../../docs/05-database.md)

---

## Run

```bash
# from the repository root (recommended — links the workspace)
pnpm dev:backend

# or from this directory
pnpm start:dev
```

- API: <http://localhost:3000/v1>
- Swagger: <http://localhost:3000/docs> (enabled outside production, or with
  `SWAGGER_ENABLED=true`)

## Configuration

`ConfigModule` loads **`.env.local`** when `NODE_ENV` is not `production`, and
**`.env.production`** otherwise. A plain `.env` is not read by the app (it exists for
`docker-compose`, which injects it as process environment).

Required at minimum: `DATABASE_*`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. See
[`docs/01-getting-started.md`](../../docs/01-getting-started.md#32-backend-variables) for the
complete, verified variable list.

## Structure

```
src/
├── main.ts            bootstrap: helmet, compression, CORS, validation, Swagger
├── app.module.ts      TypeORM, throttler, 50 feature modules, global interceptors
├── common/            enums, DTOs, decorators, guards, utils (Dhaka time, SWR cache)
├── config/            S3 / mail / app configuration
└── <feature>/         controller, service, dto/, entities/  (one folder per domain)
test/                  e2e harness
database.dbml          schema snapshot — stale, entities are the source of truth
```

Module catalog and conventions: [`docs/03-backend-guide.md`](../../docs/03-backend-guide.md#1-module-anatomy).

## Conventions that matter

- Admin endpoints need **both** `JwtAuthGuard` and `PermissionGuard`, plus
  `@ModulePermissions('<menu url>')` where the URL exists in the `menu` table.
- Responses use `{ message, statusCode, data }`; lists add `total/page/limit/totalPages`.
- Money is `decimal(10,2)`; the pg driver returns strings — convert with `Number()` and
  round to 2 decimals.
- The order pricing pipeline (`src/order/order.service.ts#create`) has a fixed operation
  order — read [`docs/07-features.md`](../../docs/07-features.md#3-checkout-pricing-pipeline)
  before touching it.

## Test and lint

```bash
pnpm test          # Jest (specs are currently CLI-generated stubs)
pnpm test:e2e
pnpm test:cov
pnpm lint          # ESLint --fix
pnpm format        # Prettier
```

## Database

Development uses `synchronize`; production does not. There are no migrations — schema
changes ship as reviewed SQL scripts (the historical `scripts/` folder now lives in git
history). Read [`docs/05-database.md`](../../docs/05-database.md#2-schema-change-policy) first.

---

Maintainer: Mahabub Hossain — contact@mahabub.bd · 01711852202

Product: German Butcher — House 56/B, Road 132, Gulshan 1, Dhaka · +8809666791991 ·
support@germanbutcherbd.com
