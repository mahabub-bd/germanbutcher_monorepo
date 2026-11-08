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
| Backend | NestJS `12.4`, Express `5.3`, TypeORM `0.3.28`, TypeScript 6 |
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
| Testing / lint | Vitest 5 (API; specs are scaffolding) + oxlint/ESLint; Next ESLint only |

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

Everything here was read out of the repository at the time of writing (8 November 2026;
NestJS 12 upgrade in the working tree): module wiring in `app.module.ts`, `main.ts`
bootstrap order, guard and decorator implementations, entity definitions, the order-pricing
pipeline in `order.service.ts`, `next.config.js`, `proxy.ts`, both Dockerfiles and
`docker-compose.yml`. Each document carries a "last verified" line at the bottom.

Where the code and an older document disagreed, the code wins. Two examples that are
corrected here relative to the original root README:

- Configuration precedence is `real environment > .env > .env.local | .env.production`:
  `dotenv/config` loads `.env` first and `ConfigModule` does not override it, which the
  original README's "`.env` is not read" advice did not describe.
- Global client state is React Context (`CartProvider`, `NotificationProvider`,
  `SearchProvider`); the unused Redux Toolkit dependency the README implied was removed in
  the November 2026 cleanup.

If you change a contract (route prefix, response envelope, cookie name, env key, queue or
cache behaviour), update the matching document in the same pull request.

---

## Contacts

| Role | Contact |
| --- | --- |
| Company | German Butcher — House 56/B, Road 132, Gulshan 1, Dhaka |
| Customer support | +8809666791991 · support@germanbutcherbd.com |
| Developer / maintainer | Mahabub Hossain — contact@mahabub.bd · 01711852202 |

Support handles customer-facing issues (orders, delivery, refunds); the developer handles
code, deployment and infrastructure. See
[08 §10](08-deployment.md#10-contacts) for escalation during incidents.

---

## Document change log

| Date | Change |
| --- | --- |
| 8 Nov 2026 | NestJS 12 upgrade: bootstrap route options (`specificity`, conflict warnings), Observe agent hook, native `errorCode` on exceptions, dotenv-loaded `.env`, Vitest + oxlint as primary tooling |
| 8 Nov 2026 | Added company and maintainer contacts (README, docs index, deployment escalation) |
| 8 Nov 2026 | Re-verified after the payment / BOGO / numbering fixes: `YYYY-NNNNNN` order and payment numbers (id **or** order number in routes), BOGO `maxFreePerUser` + cart ceiling + preview, coupon re-validation at order creation, guest-cart merge on login, `/payment/failed` redirects, analytics referrer attribution, dependency cleanup (Redux, framer-motion, input-otp, bcrypt→bcryptjs), `apps/backend/scripts/` removed from the tree |
| 7 Nov 2026 | Initial documentation set |

_Last verified against the code: 8 November 2026 (NestJS 12 working tree)._
