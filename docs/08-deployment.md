# 08 — Deployment and operations

Two containers, one PostgreSQL database, and a set of external services. Everything is
built from multi-stage Dockerfiles that assume the **repository root** as build context.

---

## 1. Images

| | Backend (`Dockerfile.backend`) | Frontend (`Dockerfile.frontend`) |
| --- | --- | --- |
| Base | `node:24-alpine` | `node:24-alpine` + `libc6-compat` |
| Package manager | pnpm 11 via corepack | pnpm 11 via corepack |
| Install | `pnpm install --frozen-lockfile --prefer-offline --filter germanbutcher-backend...` | `…--filter germanbutcher-frontend...` |
| Build | `pnpm --filter germanbutcher-backend build` (`nest build`) | `next build --webpack` with `.next/cache` mounted |
| Runtime | `node dist/main` from `/app/apps/backend` | `node apps/frontend/server.js` (standalone output) |
| User | `nestjs` (uid 1001) | `nextjs` (uid 1001) |
| Port | 3000 | 3002 |

Both Dockerfiles copy **both** `apps/*/package.json` files because the lockfile records an
importer for each workspace package; a missing manifest breaks `--frozen-lockfile`.

Build-cache notes:

- The pnpm store and `.next/cache` are BuildKit cache mounts. Without them, every frontend
  build recompiles from scratch (~3.5 min compile + type check).
- `.dockerignore` excludes `node_modules`, `.next`, `dist`, `.git`, `docs` and — importantly
  — **all `.env*` files**.

### Frontend public env is baked in

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SOCKET_URL` are inlined by
`next build`. The Dockerfile exposes them as `ARG`/`ENV`, so they must be supplied **at
build time**:

```bash
docker build -f Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/v1 \
  --build-arg NEXT_PUBLIC_BASE_URL=https://www.example.com \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.example.com \
  -t germanbutcher-frontend .
```

Because `.env*` is excluded from the build context and `docker-compose.yml` does not declare
`build.args`, a plain `docker-compose build` produces an image whose public URLs are empty.
Either add `args:` to the compose build block or build with `--build-arg` explicitly. This
is the most common "the site loads but every request goes to `undefined/...`" failure.

---

## 2. Compose stack

```bash
pnpm docker:up      # docker-compose up -d --build
pnpm docker:down
pnpm docker:logs
```

`docker-compose.yml` defines:

| Service | Port | Env source | Healthcheck |
| --- | --- | --- | --- |
| `frontend` | `3002:3002` | `./apps/frontend/.env` | `wget --spider http://localhost:3002` every 30 s |
| `backend` | `3000:3000` | `./apps/backend/.env` | `wget --spider http://localhost:3000/v1` every 30 s |

Both run with `restart: unless-stopped` on a private bridge network. `env_file` injects
variables as real process environment, which is why a file named `.env` works for Compose
even though the Nest `ConfigModule` would ignore it when choosing its own env file (see
[01 §3.1](01-getting-started.md#31-how-the-backend-loads-configuration)).

The healthcheck on `:3000/v1` proves the process is up and can reach the database (the route
returns the configured DB host), but it is not a deep readiness check — it does not exercise
a write path or S3.

---

## 3. Production environment checklist

**Backend**

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_HOST/PORT/NAME/USER/PASSWORD` pointing at the managed instance
- [ ] `DATABASE_POOL_MAX` sized to the plan (default 30 per replica)
- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — long, random, different from each other
- [ ] `CORS_ORIGINS` — explicit list; **leaving it empty disables the allow-list entirely**
- [ ] `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_S3_ACCESS_KEY`, `AWS_S3_SECRET_KEY`,
      `AWS_S3_BASE_URL`
- [ ] `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE=true` for live
- [ ] `PAYMENT_IPN_URL`, `PAYMENT_SUCCESS_URL`, `PAYMENT_FAIL_URL`, `PAYMENT_CANCEL_URL`,
      `FRONTEND_URL` — all HTTPS, all reachable from the public internet
- [ ] `ZEPTOMAIL_*` if transactional mail is expected
- [ ] `SMS_*` if mobile OTP login is expected
- [ ] `SWAGGER_ENABLED` unset/false (or intentionally true behind auth)
- [ ] `TEMP_DB_SYNC` **unset**
- [ ] `ANALYTICS_RETENTION_DAYS` agreed with the business (default 90)

**Frontend (build-time)**

- [ ] `NEXT_PUBLIC_API_URL=https://<api-host>/v1`
- [ ] `NEXT_PUBLIC_BASE_URL=https://<storefront-host>`
- [ ] `NEXT_PUBLIC_SOCKET_URL=https://<api-host>`

**Platform**

- [ ] TLS terminated in front of both apps; `trust proxy` is already set to `1`
- [ ] WebSocket upgrade allowed for the API host (Socket.IO `/notifications`)
- [ ] PostgreSQL backups + point-in-time recovery enabled
- [ ] S3 bucket CORS allows the storefront origin (direct uploads from the admin)
- [ ] Log aggregation (both apps log to stdout)

---

## 4. Database changes in production

There is no migration runner. Sequence for a schema change:

1. Take a backup (`pg_dump -Fc`).
2. Apply an idempotent SQL script during a quiet window (the historical home,
   `apps/backend/scripts/`, is now in git history only).
3. Deploy backend code that uses the new shape.
4. Deploy frontend code if the API contract changed.
5. Remove any temporary `TEMP_DB_SYNC` flag.

Prefer additive changes; see [05 §2](05-database.md#2-schema-change-policy).

---

## 5. Deploy sequence

```text
1. Build images (with public build args)          → registry
2. Backup database
3. Run pending SQL scripts                        → verify row counts
4. Deploy backend                                 → wait for healthcheck
5. Deploy frontend                                → wait for healthcheck
6. Smoke test: home, product page, add-to-cart, checkout, admin login, one report
7. Revalidate: touch a product in admin and confirm the storefront updates
8. Watch logs for 401/429/500 bursts for 15 minutes
```

Rollback: redeploy the previous image tags. The database is the hard part — additive
changes are safe to leave in place; destructive ones need a down-script written **before**
the deploy, not during an incident.

---

## 6. Runtime behaviour under load

| Concern | Behaviour | Implication |
| --- | --- | --- |
| Throttling | In-memory buckets per instance | Limits multiply with replicas; a shared store (Redis) would be needed for global limits |
| Next cache | Per frontend instance | Multiple frontends each keep their own ISR entries |
| `SwrCache`, analytics caches | Per backend instance | More replicas = more cold misses, no correctness issue |
| Socket.IO | In-memory rooms | Multiple API instances need a Redis adapter + sticky sessions, otherwise events only reach sockets on the same instance |
| Crons | Run on every instance | Analytics purge and audit purge are idempotent; any future non-idempotent job must be leader-elected or externalised |
| Analytics buffer | Up to 3 s / 1000 rows in memory | A hard kill loses the buffered rows; SIGTERM flushes |
| Body size | 2 MB JSON / 5 MB uploads | Large CSV imports must be chunked |
| Compression | gzip on JSON responses | Product lists benefit; already-compressed images are unaffected |

---

## 7. Monitoring and logging

- Both apps log to stdout; collect with your platform's log driver.
- Backend prints a startup banner with environment, port, API/docs URLs and "security
  features enabled".
- Swagger is the fastest way to verify a deploy: `/docs` should list the current tags.
- Signals worth alerting on:
  - 5xx rate on `/v1/*`
  - 429 rate (login/OTP share a site-wide bucket — a burst can lock out all shoppers)
  - `stock_movements` insert failures
  - analytics buffer drops (log line when the cap is hit)
  - database connection saturation (pool max, 8 s connect timeout)
- There is no APM/tracing integration; request timings live in the `analytics` table.

---

## 8. Security hardening checklist

- [ ] `CORS_ORIGINS` set to the exact storefront/admin origins
- [ ] JWT secrets rotated from any value that ever appeared in a repository or chat
- [ ] Swagger disabled in production (or protected)
- [ ] `TEMP_DB_SYNC` never left on
- [ ] S3 bucket policy: public read only for the media prefix; no listing
- [ ] `/api/pdf-image` host allow-list reviewed whenever the bucket changes
- [ ] Admin accounts limited to `admin`/`superadmin`; other roles rely on menu permissions
- [ ] Database user is not a superuser
- [ ] Backups encrypted and access-controlled
- [ ] Known gaps accepted or fixed: Socket.IO handshake trusts `userId`; analytics beacon is
      unauthenticated; no CSP on the storefront
      ([04 §4](04-api-reference.md#4-errors))

---

## 9. Disaster recovery

| Scenario | Recovery |
| --- | --- |
| Bad deploy | Redeploy previous image; schema is additive so no rollback needed in most cases |
| Corrupt/incorrect bulk update | `pg_restore` the latest dump into a scratch DB, extract affected rows, re-apply surgically |
| Lost analytics/audit data | Acceptable by design (retention windows); restore only if compliance requires it |
| Lost media | S3 versioning/replication must be enabled outside this repository — the app does not back up objects |
| Compromised JWT secret | Rotate `JWT_ACCESS_SECRET`; all sessions invalidate immediately (users must sign in again) |

---

## 10. Contacts

| Topic | Contact |
| --- | --- |
| Company | German Butcher — House 56/B, Road 132, Gulshan 1, Dhaka |
| Customer support (orders, delivery, refunds) | +8809666791991 · support@germanbutcherbd.com |
| Code, deployment, infrastructure | Mahabub Hossain — contact@mahabub.bd · 01711852202 |

Recommended routing: support triages customer reports; anything involving a deploy, the
database, payment gateway credentials or the S3 bucket goes to the developer. A live payment
outage should reach both at once.

---

_Last verified against the code: 8 November 2026 (commit `70b9f60`)._
