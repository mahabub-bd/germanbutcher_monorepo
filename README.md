# German Butcher — E-commerce Platform

Full-stack e-commerce monorepo for German Butcher (Bangladesh): a Next.js storefront and
admin back office, a NestJS API, and a PostgreSQL database. It covers the complete
commercial loop — catalog, cart, checkout, SSLCommerz payments, delivery coverage and
dispatch, procurement and stock ledger, coupons / BOGO / flash sales / free delivery, CRM,
and a 22-screen reporting suite.

**New here? Start with [`docs/01-getting-started.md`](docs/01-getting-started.md).**

---

## Documentation

| Document | What it covers |
| --- | --- |
| [docs/README.md](docs/README.md) | Documentation index, system at a glance, codebase size |
| [01 — Getting started](docs/01-getting-started.md) | Prerequisites, env files, database, running locally, troubleshooting |
| [02 — Architecture](docs/02-architecture.md) | Runtime topology, request lifecycle, auth, real-time, caching |
| [03 — Backend guide](docs/03-backend-guide.md) | Module catalog, controller/service conventions, guards, S3, mail, payments |
| [04 — API reference](docs/04-api-reference.md) | Envelope, pagination, errors, endpoint map, WebSocket events |
| [05 — Database](docs/05-database.md) | Entities, relationships, money/stock invariants, schema-change policy |
| [06 — Frontend guide](docs/06-frontend-guide.md) | Routing, layouts, data fetching, session handling, admin patterns |
| [07 — Features](docs/07-features.md) | Storefront, checkout pricing rules, marketing engine, CRM, reports |
| [08 — Deployment](docs/08-deployment.md) | Docker images, production configuration, operations |
| [09 — Contributing](docs/09-contributing.md) | Conventions, definition of done, known technical debt |

---

## Stack

| Layer | Technology |
| --- | --- |
| Storefront & admin | Next.js `16.4.3` (App Router, RSC, Server Actions), React `19.3`, Tailwind CSS v4, Radix UI |
| API | NestJS `12.4`, Express `5.3`, TypeORM `0.3.28`, PostgreSQL |
| Auth | JWT access tokens in httpOnly cookies; menu-level RBAC on the admin |
| Real-time | Socket.IO namespace `/notifications` |
| Media | AWS S3 (server-side uploads, 5 MB cap) |
| Payments | SSLCommerz hosted checkout + cash-style methods |
| Mail / SMS | ZeptoMail, HTTP SMS gateway (OTP) |
| Tooling | pnpm 11 workspace, TypeScript 6, Docker (Node 24 Alpine) |

---

## Repository layout

```
apps/
├── backend/     NestJS API — 50 feature modules, 51 controllers, ~350 routes
│   ├── src/     modules, common/ (guards, decorators, enums, utils), config/
│   └── test/    e2e harness
└── frontend/    Next.js app — 191 pages, 7 layouts
    ├── app/     (main) storefront · admin · auth · api
    ├── components/  ui/, admin/, storefront sections
    ├── actions/     server actions (auth, revalidate)
    ├── providers/   cart, notifications, search
    └── utils/       API client, types, formatting, PDF
docs/            engineering documentation
```

---

## Quick start

**Prerequisites:** Node.js ≥ 20 (24 recommended), pnpm 11, PostgreSQL, optional Docker.

```bash
pnpm install

# Backend — dotenv loads .env, then ConfigModule adds .env.local (dev)
# or .env.production (prod) without overriding it. Put DATABASE_*, JWT_*
# and NODE_ENV=development in apps/backend/.env

# Frontend
# apps/frontend/.env.local
#   NEXT_PUBLIC_API_URL=http://localhost:3000/v1
#   NEXT_PUBLIC_BASE_URL=http://localhost:3002
#   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

pnpm dev            # both apps
pnpm dev:backend    # API  → http://localhost:3000/v1  (docs at /docs)
pnpm dev:frontend   # site → http://localhost:3002
```

In development the backend creates its schema from the entities (`synchronize`), and OTP
login accepts the fixed code `123456`. See [01](docs/01-getting-started.md) for the full
environment variable reference and the admin bootstrap requirements (roles, menus,
permissions).

> A fresh database has no roles, menus or permissions. The admin sidebar is fetched from the
> API, and `PermissionGuard` rejects any route whose `@ModulePermissions` URL has no `menu`
> row — seed those tables (or restore a dump) before expecting an admin UI.

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run both apps in watch mode |
| `pnpm dev:frontend` / `pnpm dev:backend` | Run one app |
| `pnpm build` / `pnpm build:frontend` / `pnpm build:backend` | Production builds |
| `pnpm start` | Start both apps (`nest start` for the API, `next start` for the site) |
| `pnpm docker:up` / `docker:build` / `docker:down` / `docker:logs` | Container lifecycle |
| `pnpm --filter germanbutcher-backend test` | Vitest unit tests (currently scaffolding) |
| `pnpm --filter germanbutcher-backend test:jest` | Legacy Jest runner |
| `pnpm --filter germanbutcher-backend test:e2e` | E2E tests |
| `pnpm --filter germanbutcher-backend lint` | oxlint |
| `pnpm --filter germanbutcher-backend lint:eslint` | ESLint with `--fix` |
| `pnpm --filter germanbutcher-frontend lint` | Next.js lint |

The frontend has no test runner configured.

---

## Docker

```bash
pnpm docker:up      # build + start both services
pnpm docker:down
pnpm docker:logs
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3002 |
| API | http://localhost:3000/v1 |
| Swagger | http://localhost:3000/docs |

`NEXT_PUBLIC_*` variables are inlined **at build time**. Pass them as `--build-arg` (or add
`build.args` to the compose service) when building the frontend image — see
[08 Deployment](docs/08-deployment.md#frontend-public-env-is-baked-in).

---

## Production notes

- Set `NODE_ENV=production`, a real `CORS_ORIGINS` allow-list, JWT secrets, S3 credentials
  and the SSLCommerz live flag. Never leave `TEMP_DB_SYNC` on.
- `synchronize` is disabled in production; schema changes are applied with reviewed SQL
  scripts (historical scripts live in git history — see
  [05 Database](docs/05-database.md#2-schema-change-policy)).
- Swagger is off in production unless `SWAGGER_ENABLED=true`.
- Socket.IO rooms, throttling counters and in-process caches are per instance — read the
  scaling caveats in [02 Architecture](docs/02-architecture.md#8-caching-layers) before
  running multiple replicas.

---

## Contact

**Company:** German Butcher — House 56/B, Road 132, Gulshan 1, Dhaka

- Customer support: +8809666791991 · support@germanbutcherbd.com
- Developer: Mahabub Hossain — contact@mahabub.bd · 01711852202

---

## License

Proprietary — all rights reserved.
