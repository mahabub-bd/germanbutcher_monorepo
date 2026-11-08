# `germanbutcher-frontend`

Next.js 16 App Router application for the German Butcher platform: the public storefront,
the customer account area, and the admin back office. Server components fetch from the Nest
API; the access token stays in an `httpOnly` cookie and never reaches client JavaScript.

**Full documentation:** [`docs/06-frontend-guide.md`](../../docs/06-frontend-guide.md) ·
[`docs/04-api-reference.md`](../../docs/04-api-reference.md) ·
[`docs/07-features.md`](../../docs/07-features.md)

---

## Run

```bash
# from the repository root (recommended)
pnpm dev:frontend

# or from this directory
pnpm dev
```

- Storefront: <http://localhost:3002>
- Admin: <http://localhost:3002/admin>

Dev uses Turbopack; the production build uses webpack (`next build --webpack`) because the
PDF renderer and image pipeline are validated there.

## Configuration

`apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_BASE_URL=http://localhost:3002
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

These are **build-time** values — Docker builds must pass them as `--build-arg`. Missing
`NEXT_PUBLIC_API_URL` produces requests to `undefined/...`.

## Structure

```
app/
├── (main)/        storefront: home, products, cart, checkout, payment, account, policies
├── admin/         back office, sidebar driven by menu-permissions
├── auth/          sign-in / sign-up / forgot-password
├── api/           two route handlers: /api/auth/token, /api/pdf-image
├── layout.tsx     fonts, GTM/GA, Toaster, global providers
└── globals.css    Tailwind v4 tokens
components/        ui/ primitives + admin/ + storefront sections
actions/           server actions: auth, JWT helpers, revalidation
providers/         cart, notifications (Socket.IO), search
utils/             api-utils (fetch layer), types, formatting, PDF invoice
proxy.ts           route protection for /user and /admin
```

Route inventory, layout/provider chain and admin screen patterns:
[`docs/06-frontend-guide.md`](../../docs/06-frontend-guide.md#3-route-map).

## Conventions that matter

- Server components by default; `"use client"` only for state, effects and Radix
  interactivity.
- All HTTP through `utils/api-utils.ts` — it resolves the cookie token and clears cookies on
  401. Raw `fetch` bypasses both.
- Product **detail** fetches are `no-store` on purpose; product lists use ISR (300 s, tag
  `products`). Call `revalidatePath`/`revalidateTag` after mutations.
- Admin navigation comes from `GET /v1/menu-permissions/accessible-menus/:userId`. A new
  screen also needs a `menu` row, or nobody can see it.
- List state lives in the URL (`page`, `limit`, `search`, `sort`) via
  `utils/admin-search-params.ts`.
- Guest carts live in `localStorage` (`user-cart`, `user-coupon`) and are **merged** into the
  server cart on login (`useCart`: POST each item, re-apply the coupon, clear storage,
  revalidate). A failed merge keeps the local cart and retries on the next login.

## Lint and build

```bash
pnpm lint      # next lint
pnpm build     # next build --webpack
pnpm start     # next start -p 3002
```

There is no test runner configured in this app — see
[`docs/09-contributing.md`](../../docs/09-contributing.md#3-testing).

---

Maintainer: Mahabub Hossain — contact@mahabub.bd · 01711852202

Product: German Butcher — House 56/B, Road 132, Gulshan 1, Dhaka · +8809666791991 ·
support@germanbutcherbd.com
