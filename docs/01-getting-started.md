# 01 — Getting started

This guide takes an empty machine to a running storefront (`:3002`) and API (`:3000`)
against a PostgreSQL database, and covers the local traps that cost the most time.

---

## 1. Prerequisites

| Requirement | Why | Notes |
| --- | --- | --- |
| **Node.js ≥ 20** | Next 16 / Nest 12 | Docker images use Node **24**; use 24 locally to match production |
| **pnpm 11** | Workspace + lockfile | `corepack enable && corepack prepare pnpm@11 --activate` |
| **PostgreSQL** | Primary datastore | Any reachable instance; the repo has no migrations, see [05](05-database.md) |
| **Docker** (optional) | Containerised run | Only needed for `pnpm docker:*` |
| **AWS S3 credentials** (optional) | Image/product media | Uploads fail without them; text-only work is fine |
| **SSLCommerz sandbox** (optional) | Hosted payments | Checkout by cash-style methods works without it |

`pnpm-workspace.yaml` approves native build scripts for `sharp` and `unrs-resolver` (plus
`@scarf/scarf` telemetry). Password hashing moved to **`bcryptjs`**, which is pure
JavaScript and needs no native build — the `bcrypt` entry in `allowBuilds` is now vestigial.
If you install with a package manager that ignores that file, approve the remaining builds
manually or `sharp` (image processing) and `unrs-resolver` will fail to install.

---

## 2. Install

```bash
git clone <repository-url> germanbutcher_monorepo
cd germanbutcher_monorepo
pnpm install
```

There are only two workspace packages:

- `germanbutcher-frontend` → `apps/frontend`
- `germanbutcher-backend` → `apps/backend`

The Dockerfiles intentionally install with `--frozen-lockfile --filter <package>...` so
each image only pulls the dependencies it needs.

---

## 3. Environment files

### 3.1 How the backend loads configuration

Two loaders run, in this order:

1. `main.ts` imports **`dotenv/config`**, which reads **`apps/backend/.env`** into
   `process.env` at process start (resolved from the working directory, i.e. `apps/backend`).
2. `ConfigModule.forRoot()` then loads **`.env.production`** when `NODE_ENV=production`,
   otherwise **`.env.local`**.

Neither loader overwrites variables that already exist in `process.env` (no `override: true`
anywhere), so precedence is:

```
real environment (shell / container)  >  .env  >  .env.local | .env.production
```

Consequences you must plan for:

1. `.env` is **no longer ignored**. A key defined in both `.env` and `.env.local` takes the
   `.env` value.
2. Use `.env` for shared/base values. Put a machine-specific override in `.env.local` only
   if `.env` does not define that key — or remove the key from `.env`.
3. `.env` also decides which file step 2 loads, because it can set `NODE_ENV`. Make sure it
   says `development` for local work; if it says `production`, `synchronize` is off,
   Swagger may be hidden, OTP stays real, and a fresh database never gets its tables.
4. In production, `.env` is not in the image (`.dockerignore`); variables come from
   `env_file`/the orchestrator, and `.env.production` is optional.
5. A missing env file does not crash the process; it leaves variables undefined and you fail
   later at the database or JWT step.

Practical local setup:

```bash
cd apps/backend
cp .env .env.local        # only if you already have a .env
```

A fresh clone has no `.env` — create `.env` (and, optionally, `.env.local` for keys it does
not define) from the reference below.

### 3.2 Backend variables

Only the variables below are actually read by source code (verified against
`apps/backend/src`). "Required" means the app will misbehave at startup or on the first
request without it.

#### Core

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development` \| `production`. Selects the env file, disables TypeORM `synchronize` in production, gates Swagger, and enables the fixed OTP `123456` in development |
| `PORT` | No (default `3000`) | HTTP listen port |
| `CORS_ORIGINS` | Recommended | Comma-separated allow-list. Empty ⇒ the API accepts **any** origin (dev convenience, unsafe in production) |
| `API_URL` | Optional | Used in startup logging and generated links |
| `BASE_URL` | Optional | Base URL used by payment redirect construction |

> `API_PREFIX` appears in `.env` but is **not read** — the prefix is hard-coded to `v1`
> in `main.ts`.

#### Database

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_HOST` | Yes | PostgreSQL host |
| `DATABASE_PORT` | Yes | PostgreSQL port |
| `DATABASE_USER` | Yes | Role |
| `DATABASE_PASSWORD` | Yes | Password |
| `DATABASE_NAME` | Yes | Database name |
| `DATABASE_POOL_MAX` | No (default `30`) | Connection pool ceiling; pool also sets `min: 2`, 30 s idle, 8 s connect timeout |
| `TEMP_DB_SYNC` | No | Set `true` to force `synchronize` in production for a one-off schema push. Remove afterwards |

#### Auth

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_ACCESS_SECRET` | Yes | Access-token signing key (passport-jwt `secretOrKey`) |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing key |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token TTL (e.g. `1d`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token TTL |

#### OTP / SMS

| Variable | Required | Purpose |
| --- | --- | --- |
| `SMS_SEND_URL` | For mobile login | Gateway endpoint |
| `SMS_API_KEY` | For mobile login | Gateway key |
| `SMS_SENDER_NUMBER` | For mobile login | Sender mask |
| `OTP_EXPIRES_IN` | No | OTP lifetime |

In `development` the OTP is always **`123456`** (hard-coded in `otp.service.ts`), so no
SMS provider is needed locally. `OTP_DEV_MODE`, `OTP_DEV_CODE` and `SMS_RETRY_ATTEMPTS`
exist in `.env` but are not read by the current code.

#### Storage (S3)

| Variable | Required | Purpose |
| --- | --- | --- |
| `AWS_REGION` | For uploads | Bucket region |
| `AWS_S3_BUCKET_NAME` | For uploads | Bucket |
| `AWS_S3_ACCESS_KEY` | For uploads | Access key id |
| `AWS_S3_SECRET_KEY` | For uploads | Secret |
| `AWS_S3_BASE_URL` | For uploads | Public URL prefix stored on `attachment.url` |

Upload size is capped at **5 MB per file** in `attachment.controller.ts`. `MAX_FILE_SIZE`
and `ALLOWED_MIME_TYPES` in `.env` are not read.

#### Payments (SSLCommerz)

| Variable | Required | Purpose |
| --- | --- | --- |
| `SSLCOMMERZ_STORE_ID` | For hosted checkout | Store id |
| `SSLCOMMERZ_STORE_PASSWORD` | For hosted checkout | Store password |
| `SSLCOMMERZ_IS_LIVE` | No | `true` for live gateway; otherwise sandbox |
| `PAYMENT_IPN_URL` | Yes for reconciliation | IPN callback |
| `PAYMENT_SUCCESS_URL` / `PAYMENT_FAIL_URL` / `PAYMENT_CANCEL_URL` | Yes | Browser return URLs (storefront `/payment/*` pages) |
| `FRONTEND_URL` | Yes | Used in redirects and e-mails |

#### Email (ZeptoMail)

`ZEPTOMAIL_API_URL`, `ZEPTOMAIL_API_KEY`, `ZEPTOMAIL_FROM_EMAIL`, `ZEPTOMAIL_FROM_NAME`.
Transactional mail is best-effort: order creation does not fail when the mail call fails.

#### Swagger

`SWAGGER_ENABLED` (`true` forces docs on in production), `SWAGGER_TITLE`,
`SWAGGER_DESCRIPTION`, `SWAGGER_VERSION`, `SWAGGER_FAVICON`, `SWAGGER_CUSTOM_CSS_URL`.

#### Observability (Nest 12 Observe agent)

| Variable | Required | Purpose |
| --- | --- | --- |
| `OBSERVE_APP_KEY` | Optional | Observe agent key; without both keys the agent sends nothing and warns at startup |
| `OBSERVE_APP_SECRET` | Optional | Observe agent secret |
| `OBSERVE_SERVICE_VERSION` | Optional | Release/commit label attached to telemetry |
| `OBSERVE_ENDPOINT` | Optional | Collector base URL (defaults to the hosted Observe API) |

`serviceId` is a code option (`ObserveModule.forRoot`), not an env var in this agent version.

See [02 §3.2](02-architecture.md#32-observability-agent-nest-12) for what is wired and what is not.

#### Analytics buffer

`ANALYTICS_FLUSH_BATCH_SIZE` (default 100), `ANALYTICS_FLUSH_INTERVAL_MS` (default 3000),
`ANALYTICS_MAX_BUFFER_SIZE` (default 1000), `ANALYTICS_RETENTION_DAYS` (default 90,
`0` disables the purge job). See [02](02-architecture.md#7-analytics-pipeline).

### 3.3 Frontend variables

`apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_BASE_URL=http://localhost:3002
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

These are **build-time** values: `next build` inlines them, so a container image must be
built with the production URLs (the Dockerfile exposes them as build args). If
`NEXT_PUBLIC_API_URL` is empty, request helpers build URLs like `undefined/products` —
the single most common "nothing loads" symptom after a fresh clone.

---

## 4. Database

1. Create an empty database and a role that can create tables:

   ```sql
   CREATE DATABASE gb_development;
   ```

2. Point the `DATABASE_*` variables at it.
3. Start the API. With `NODE_ENV` unset/`development`, TypeORM `synchronize` is **on**, so
   the schema is created from the entities on first boot.

There are no migration files or migration tooling in the tree. Schema evolution in
production is a deliberate, manual process — read
[05 Database](05-database.md#2-schema-change-policy) before touching entities. Earlier one-off
SQL/JS scripts are preserved in git history under `apps/backend/scripts/`
(`git log -- apps/backend/scripts`): location/coverage seeds, `deliveredAt`/`cancelledAt`
backfills, the payment-status rename, the four- to six-digit order/payment repadding, and a
debug-token generator. Treat them as operational history, not an ordered migration suite:
they were written as needed and are not idempotent in every case.

---

## 5. Run

```bash
# both apps, watch mode
pnpm dev

# or individually
pnpm dev:backend    # NestJS watch, http://localhost:3000
pnpm dev:frontend   # Next dev + Turbopack, http://localhost:3002
```

Verify, in order:

| Check | Expected |
| --- | --- |
| `http://localhost:3000/v1` | A string (database host) — proves config + DB wiring |
| `http://localhost:3000/docs` | Swagger UI with ~50 tags |
| `http://localhost:3002` | Storefront home page |
| `http://localhost:3002/admin` | Redirects to `/auth/sign-in` unless an admin session cookie exists |

### Seeding the minimum an admin needs

A fresh database has no roles, menus or menu permissions. The admin UI is **menu-driven**:
the sidebar is fetched from `GET /v1/menu-permissions/accessible-menus/:userId`, and
`PermissionGuard` denies access to any controller whose `@ModulePermissions(url)` does not
match a row in `menu`. To get a working admin you need, at minimum:

1. a row in `role` (the `user.roleId` default is `3`),
2. the `menu` tree rows whose `url` values match the `@ModulePermissions(...)` paths,
3. `menu_permission` rows for the role,
4. a `user` row whose role is `superadmin` or `admin` (both bypass permission checks).

The only automated seeder is `crm-menu-seeder.ts`, which inserts the CRM menu rows on
startup when they are missing. Everything else (roles, the rest of the menu tree, role
permissions) must be populated with SQL or by restoring a known-good database dump.

---

## 6. Everyday commands

| Command | Scope |
| --- | --- |
| `pnpm build` | Build both apps |
| `pnpm build:backend` / `build:frontend` | Build one app |
| `pnpm start` | Start both apps (`nest start` for the API, `next start` for the site) |
| `pnpm --filter germanbutcher-backend test` | Vitest unit tests |
| `pnpm --filter germanbutcher-backend test:cov` | Vitest with coverage |
| `pnpm --filter germanbutcher-backend test:jest` | Legacy Jest runner (kept for compatibility) |
| `pnpm --filter germanbutcher-backend test:e2e` | E2E tests (`test/`, Jest config) |
| `pnpm --filter germanbutcher-backend lint` | `oxlint src` (fast pass) |
| `pnpm --filter germanbutcher-backend lint:eslint` | ESLint flat config with `--fix` |
| `pnpm --filter germanbutcher-frontend lint` | `next lint` |
| `pnpm docker:up` | Build + start both containers |

Frontend has **no test runner configured** — no Jest/Vitest/Playwright dependency and no
`test` script. See [09](09-contributing.md#3-testing).

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `ECONNREFUSED` on boot, or 8 s timeouts | Database unreachable | Check `DATABASE_*`; the pool fails fast at 8 s by design |
| Env changes have no effect | The key is set in a higher-precedence source | Remember `real env > .env > .env.local \| .env.production`; edit/remove it in `.env`, or override it in the shell |
| Every API call returns 401 and the UI bounces to sign-in | `auth_token` cookie expired/cleared; `resolveAuthToken()` caches it per page load | Sign in again. Server code clears cookies on a 401 |
| Data looks stale after an admin edit | Next.js Data Cache: `fetchData` uses `revalidate` (60 s, 300 s for products) and tags | Trigger `revalidatePath`/`revalidateTag` from the action, or hard-refresh; product **detail** pages are explicitly `no-store` |
| Product detail page 404s after deactivation | Expected — detail fetches bypass the Next cache | — |
| Image upload fails | No S3 credentials, file > 5 MB, or bucket CORS | Configure `AWS_S3_*`; resize the file |
| `next/image` refuses a remote URL | Host missing from `images.remotePatterns` (only two S3 hosts are allowed) | Add the host in `next.config.js` |
| Socket notifications never arrive | `NEXT_PUBLIC_SOCKET_URL` missing, or origin not in the gateway CORS list | Set the env var; gateway allows the production domains plus `localhost:3000/3001` |
| Ports already in use | Old processes | `netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F` (Windows) |
| Swagger UI missing | `NODE_ENV=production` and `SWAGGER_ENABLED` unset | Set `SWAGGER_ENABLED=true` temporarily, or read `/docs` from a non-prod environment |
| `pnpm install` skips a native build | Build scripts not approved | Keep `allowBuilds` in `pnpm-workspace.yaml`; reinstall (`sharp` is the one that bites) |
| Specs fail on Jest-only APIs under Vitest | `tests/vitest-setup.mts` only maps `jest` to `vi` (the 359 `jest.fn()` call sites); `spyOn`/`useFakeTimers` are not shimmed | Use `vi.*`, or run `pnpm test:jest` |

---

## 8. First-day reading list

1. [02 Architecture](02-architecture.md) — how a request flows and where cross-cutting
   concerns live.
2. The guide for your app: [03 Backend](03-backend-guide.md) or
   [06 Frontend](06-frontend-guide.md).
3. [07 Features](07-features.md#3-checkout-pricing-pipeline) — the order-pricing rules are
   the highest-risk part of the domain.

---

_Last verified against the code: 8 November 2026 (NestJS 12 working tree)._
