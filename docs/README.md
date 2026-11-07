# German Butcher — Engineering Documentation

German Butcher is a production e-commerce platform for a German-style butcher and deli
business operating in Bangladesh. It ships two applications from one pnpm workspace:

- **Storefront + admin** — Next.js App Router application (server components, server actions).
- **API** — NestJS service with 50 feature modules wired at the root, 51 controllers and
  ~350 route handlers, backed by PostgreSQL through TypeORM.

The platform covers the full commercial loop: catalog and merchandising, cart and checkout,
SSLCommerz payments (cards and mobile banking), delivery coverage and delivery-man
assignment, procurement and stock ledger, coupon / BOGO / flash-sale / free-delivery
campaigns, CRM segments and campaigns, and a large reporting surface for the ops team — plus
the public marketing site (recipes, brands, sales points, testimonials, FAQ and policy
pages).

---

## Documentation map

| Document | Read it when you need to… |
| --- | --- |
| [01 — Getting started](01-getting-started.md) | Install, configure `.env`, run both apps, connect a database, fix a broken local setup |
| [02 — Architecture](02-architecture.md) | Understand runtime topology, request lifecycle, authentication and real-time flow |
| [03 — Backend guide](03-backend-guide.md) | Work inside `apps/backend`: module anatomy, guards, decorators, caching, storage, mail, payments |
| [04 — API reference](04-api-reference.md) | Call the API: envelope, pagination, error shape, endpoint map, WebSocket events |
| [05 — Database](05-database.md) | Understand entities, relationships, money/stock invariants and schema-change policy |
| [06 — Frontend guide](06-frontend-guide.md) | Work inside `apps/frontend`: routing, layouts, data fetching, auth, state, admin UI patterns |
| [07 — Features](07-features.md) | Understand what the product does: storefront, checkout pricing rules, marketing engine, CRM, procurement, reports |
| [08 — Deployment](08-deployment.md) | Build images, configure production, run and monitor the stack |
| [09 — Contributing](09-contributing.md) | Follow code style, add an endpoint/page, review a PR, understand known debt |

---

## System at a glance

| Item | Value |
| --- | --- |
| Repository layout | pnpm workspace, `apps/*`, no shared package yet |
| Frontend | Next.js `16.4.3`, React `19.3`, Tailwind CSS v4, Radix UI, TypeScript 6 |
| Backend | NestJS `11.1`, TypeORM `0.3.28`, TypeScript 6 |
| Database | PostgreSQL (external; no migrations directory — see [05](05-database.md)) |
| Dev ports | API `3000` (`/v1`), storefront `3002` |
| API prefix / versioning | Global prefix `v1`, URI versioning enabled |
| API docs | Swagger UI at `http://localhost:3000/docs` (dev; opt-in in production) |
| Auth | JWT access token in an httpOnly cookie; menu-level RBAC on the admin |
| Real-time | Socket.IO namespace `/notifications` |
| Files | AWS S3 (server-side uploads, public base URL) |
| Payments | SSLCommerz (hosted checkout + IPN) plus cash-on-delivery style methods |
| Mail / SMS | ZeptoMail / HTTP SMS gateway used for OTP and order notifications |
| Container images | Node 24 Alpine, pnpm 11 via corepack, non-root user, multi-stage |

### Size of the codebase

| Metric | Count |
| --- | --- |
| Backend feature modules | 50 wired in `AppModule` (55 `.module.ts` files in total) |
| Backend controllers | 51 |
| Route handlers (`@Get/@Post/@Put/@Patch/@Delete`) | ~350 |
| Frontend pages (`page.tsx`) | 191 |
| Frontend layouts | 7 |
| Frontend route handlers (`route.ts`) | 2 |
| Backend unit-test files | 68 (generated stubs — see [09](09-contributing.md#6-known-technical-debt)) |

---

## Where to start

- **New developer** → [01 Getting started](01-getting-started.md), then
  [02 Architecture](02-architecture.md), then the guide for the app you will touch.
- **Frontend work** → [06 Frontend guide](06-frontend-guide.md) and
  [04 API reference](04-api-reference.md).
- **Backend work** → [03 Backend guide](03-backend-guide.md) and
  [05 Database](05-database.md).
- **Product / QA / support** → [07 Features](07-features.md); use the admin screens named
  there as the map of the system.
- **DevOps** → [08 Deployment](08-deployment.md).

---

## How these documents were produced

Everything here was read out of the repository at the time of writing (November 2026):
module wiring in `app.module.ts`, `main.ts` bootstrap order, guard and decorator
implementations, entity definitions, the order-pricing pipeline in
`order.service.ts`, `next.config.js`, `proxy.ts`, both Dockerfiles and
`docker-compose.yml`.

Where the code and an older document disagreed, the code wins. Two examples that are
corrected here relative to the original root README:

- The backend reads `.env.local` in development and `.env.production` in production —
  **not** `.env`.
- Global client state is React Context (`CartProvider`, `NotificationProvider`,
  `SearchProvider`); Redux Toolkit is installed but not used anywhere in the source.

If you change a contract (route prefix, response envelope, cookie name, env key, queue or
cache behaviour), update the matching document in the same pull request.
