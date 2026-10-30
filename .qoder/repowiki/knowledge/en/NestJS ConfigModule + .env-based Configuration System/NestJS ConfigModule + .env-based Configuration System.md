---
kind: configuration_system
name: NestJS ConfigModule + .env-based Configuration System
category: configuration_system
scope:
    - '**'
source_files:
    - apps/backend/src/config/configuration.ts
    - apps/backend/src/app.module.ts
    - apps/backend/src/main.ts
    - apps/backend/.env
    - apps/frontend/.env.local
    - docker-compose.yml
---

## Approach

The backend uses **NestJS `@nestjs/config`** (`ConfigModule`, `ConfigService`) as the single configuration source. The frontend (Next.js) reads its own runtime variables directly from `process.env` via Next's built-in `NEXT_PUBLIC_*` loader.

## Key files

- `apps/backend/src/config/configuration.ts` — typed config shape for third-party integrations (SSLCommerz, payment URLs).
- `apps/backend/src/app.module.ts` — bootstraps `ConfigModule.forRoot`, wires it into TypeORM and Throttler.
- `apps/backend/src/main.ts` — consumes `ConfigService` at bootstrap to enable Swagger, CORS, body-parser limits, port, etc.
- `apps/backend/.env` — all backend secrets and settings (database, JWT, SMS, AWS S3, SSLCommerz, ZeptoMail, analytics batching, Swagger, CORS).
- `apps/frontend/.env.local` — Next.js public env vars (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SOCKET_URL`).
- `docker-compose.yml` — injects `NODE_ENV`/`PORT` per service and loads each app's `.env` via `env_file`.

## Architecture and conventions

1. **Environment-file selection is environment-driven.** In `AppModule`, `ConfigModule.forRoot` chooses the file based on `NODE_ENV`:
   - production → `.env.production`
   - everything else → `.env.local`
   This means a separate `.env.local` exists alongside the checked-in `.env`; Docker Compose overrides `NODE_ENV=production` so the container picks `.env.production` at runtime.

2. **Configuration is read through `ConfigService.get()` with defaults.** Values are never accessed directly from `process.env` in application code; `main.ts` and `app.module.ts` go through `configService.get('KEY', default)` (e.g. `PORT` defaults to `3000`, `SWAGGER_ENABLED` defaults to `'false'`, `DATABASE_POOL_MAX` defaults to `30`).

3. **Typed configuration groups exist for external services.** `configuration.ts` exports a function returning an object shaped like `{ sslcommerz: { storeId, storePassword, isLive }, payment: { successUrl, failUrl, cancelUrl, ipnUrl, baseUrl, frontendUrl } }`. These values are consumed by modules that need them rather than reading raw env keys.

4. **Feature flags are plain env booleans.** Examples: `TEMP_DB_SYNC=true` toggles TypeORM `synchronize`, `SWAGGER_ENABLED=true` toggles Swagger docs, `OTP_DEV_MODE=true` enables OTP development mode, `NODE_ENV` drives Swagger enablement (`development` or non-production always enables Swagger unless overridden).

5. **List-like settings are comma-separated strings split at runtime.** `CORS_ORIGINS` in `.env` is a comma-delimited list parsed in `main.ts` via `.split(',').map(...).filter(...)`. Similarly, `ALLOWED_MIME_TYPES` is stored as a comma-separated string.

6. **Secrets are grouped by domain in `.env` with section comments.** Database, JWT, SMS, OTP, Application, CORS, Swagger, AWS S3, Payment, ZeptoMail, Performance, Analytics sections are clearly separated by comment headers.

7. **Frontend-only env vars use Next.js convention.** Variables prefixed with `NEXT_PUBLIC_` are baked into the client bundle at build time; only three such vars exist (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SOCKET_URL`).

8. **Docker Compose is the deployment surface for env injection.** Each service declares both inline `environment` entries (`NODE_ENV`, `PORT`) and an `env_file` pointing at the app-specific `.env`. Healthchecks probe `/v1` for the backend and the root for the frontend.

## Conventions and constraints

- All backend configuration flows through `ConfigService`; direct `process.env` access is avoided in feature code (only used inside `configuration.ts` when building the typed config object).
- Default values are supplied via the second argument of `configService.get(key, default)` rather than hard-coded literals in consumers.
- Environment-file selection is strictly controlled by `NODE_ENV`: production uses `.env.production`, all other environments use `.env.local` (see `app.module.ts` line 65–68).
- Swagger is disabled in production unless `SWAGGER_ENABLED=true` is set (enforced in `main.ts` lines 43–45).
- TypeORM `synchronize` is disabled in production unless `TEMP_DB_SYNC=true` (enforced in `app.module.ts` lines 105–107).
- Frontend variables must be prefixed with `NEXT_PUBLIC_` to be available in browser code (Next.js-enforced convention).
- Secrets live in `.env` / `.env.local` and are not committed; the repo includes a sample `.env.local` for the frontend and a checked-in `.env` for the backend (which contains real credentials in this branch — treat as sensitive).