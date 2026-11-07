# 06 — Frontend guide

Next.js 16 App Router with React 19 and the React Compiler enabled. The default is server
rendering: most pages are async server components that fetch from the Nest API and hand
serialisable data to a smaller number of client components.

---

## 1. Stack as actually used

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js `16.4.3` | `output: 'standalone'`, `reactCompiler: true` |
| Language | TypeScript 6 (strict) | Path alias `@/*` from `tsconfig.json` |
| Styling | Tailwind CSS v4 + `tailwind-merge` + `cva` | Tokens in `app/globals.css` |
| Primitives | Radix UI (19 packages) + local `components/ui` | shadcn-style, edited in place |
| Icons | `lucide-react`, `react-icons` | `IconRenderer` maps menu icons |
| Motion | `framer-motion`, `embla-carousel-autoplay` | |
| Charts | `recharts` (`components/ui/chart.tsx`) | Admin analytics/reports |
| Search UI | `cmdk` | Command-palette search modal |
| Toasts | `sonner` (`<Toaster richColors />`) | |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` + `zod` | Schemas in `utils/form-validation.ts` |
| Dates | `date-fns`, `react-day-picker` | |
| Rich text | TipTap 3 (admin content) + `jodit-editor.tsx` | Product/recipe descriptions |
| PDF | `@react-pdf/renderer` | Invoices |
| Excel | `exceljs` | Report exports |
| Realtime | `socket.io-client` | Notifications only |
| Dev server | Turbopack (`next dev --turbopack -p 3002`) | Production build uses webpack |

**Redux Toolkit is a dependency but is not used.** All shared client state is React
Context. Do not add a Redux store without a deliberate decision — see
[09](09-contributing.md#6-known-technical-debt).

---

## 2. Directory conventions

```
apps/frontend/
├── app/
│   ├── (main)/            # storefront, shares Header/Footer layout
│   ├── admin/             # back office, shares AdminLayoutClient
│   ├── auth/              # sign-in / sign-up / forgot-password (no chrome)
│   ├── api/               # 2 route handlers only
│   ├── layout.tsx         # html/body, fonts, analytics, global providers
│   └── globals.css
├── actions/               # "use server" functions: auth, jwt utils, revalidate
├── components/
│   ├── ui/                # 50 primitives (button, dialog, table, chart…)
│   ├── admin/             # back-office widgets grouped by domain
│   ├── homepage/ header/ footer/ products/ cart/ checkout/ payment/
│   ├── user-account/ auth/ recipe/ faqs/ common/ icons/ …
├── contexts/              # createContext objects only
├── providers/             # "use client" providers that own state
├── hooks/                 # use-cart, …
├── lib/                   # small services (coupon, bogo, delivery coverage, sound)
├── utils/                 # api-utils, types, formatting, PDF, guards
└── public/
```

Rule of thumb: `contexts/` and `providers/` are split so that the context object can be
imported by server code without pulling a client component into the graph.

---

## 3. Route map

### Storefront — `app/(main)`

| Path | Purpose |
| --- | --- |
| `/` | Home: hero banners, featured/popular/flash-sale/BOGO rails, categories |
| `/products` | Catalog with filters, sorting, pagination |
| `/products/search`, `/products/search/[search]` | Search results |
| `/products/featured`, `/popular`, `/bogo`, `/flash-sale`, `/special-offers` | Merchandising rails |
| `/product/[slug]` | Product detail: gallery, price, stock, reviews, add-to-cart |
| `/categories`, `/categories/[slug]` | Category browsing |
| `/brands`, `/brands/[slug]`, `/our-brands`, `/our-brands/[slug]` | Brand browsing |
| `/cart` | Cart page (modal variant also exists) |
| `/checkout` | Address → shipping method → payment method → review |
| `/payment/success/[id]`, `/payment/failed/[id]`, `/payment/cancelled/[id]` | Gateway return pages |
| `/order-confirmation/[id]` | Post-order confirmation |
| `/recipes`, `/recipe/[id]` | Content |
| `/about-us`, `/certification`, `/clients`, `/contact-us`, `/how-to-order`, `/where-to-buy` | Marketing pages |
| `/user/[id]/(profile\|orders\|order/[orderId]\|addresses\|notifications\|reviews\|support\|wishlist)` | Account area |

### Policy — `app/(main)/(policy)`

`/faqs`, `/privacy-policy`, `/return-refund-policy`, `/terms-and-conditions` — share a
policy layout (breadcrumb + typography), no cart chrome.

### Auth — `app/auth`

`/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`. Sign-in supports e-mail/password
and mobile + OTP.

### Admin — `app/admin`

| Area | Paths |
| --- | --- |
| Dashboard | `/admin/dashboard`, `/admin/dashboard/orders` |
| Orders | `/admin/orders/{pending,processing,on-hold,shipped,delivered,cancelled}`, `/admin/order/[id]/{view,edit,payments}` |
| Catalog | `/admin/products/{products-list,add,[id]/view,[id]/edit,inventory,history,stock-movements,[id]/stock-movements}`, `/admin/products/units…` |
| Merchandising | `/admin/categories`, `/admin/brand`, `/admin/banner`, `/admin/recipe`, `/admin/testimonial`, `/admin/client` |
| Marketing | `/admin/marketing/{coupon,coupons,discounts,bogo,flash-sales,free-delivery}` + `*-usage-logs` |
| CRM | `/admin/crm/{customers,customers/[id],activities,tasks,campaigns,abandoned-carts,abandoned-carts/[id]}` |
| Customers | `/admin/customer/customer-list`, `/admin/customer/[id]/{view,edit}` |
| Procurement | `/admin/procurement/{purchases,suppliers}` (+ add/edit/payments) |
| Fulfilment | `/admin/delivery-man`, `/admin/sales-point`, `/admin/sales-point-shop`, `/admin/sales-partner` |
| Reports | `/admin/reports/*` — 22 report screens (sales, delivery, cancellations, refunds, coupons, campaigns, inventory, customers) |
| Analytics | `/admin/analytics/analytics-info`, `/admin/analytics/payment-transactions` |
| Settings | `/admin/settings/{business-info,delivery-coverage,payment-method,shipping-method,subscriber-list}` |
| Access | `/admin/user`, `/admin/menu`, `/admin/audit-log`, `/admin/profile` |
| Inbox | `/admin/inbox`, `/admin/inbox/notifications` |

The sidebar for all of this is **not hard-coded** — it is fetched from
`menu-permissions/accessible-menus/:userId`. A screen can exist in the codebase and still be
invisible because no `menu` row/permission grants it. When adding a screen, add the menu row
or nobody will find it.

---

## 4. Layout and provider chain

```
app/layout.tsx                     fonts, GTM/GA, <Toaster>, metadata from Business Settings
└── NotificationProvider           Socket.IO client, sound
    └── CartProvider               server cart + guest cart, coupon
        └── SearchProvider         command-palette state
            └── (page)
                ├── (main)/layout.tsx      Header, Footer, WhatsApp widget, mobile bar,
                │                          visitor heartbeat, maintenance takeover
                ├── admin/layout.tsx       AdminLayoutClient (sidebar, header, collapse)
                ├── (policy)/layout.tsx    policy chrome
                └── auth/*                 bare pages
```

Root layout responsibilities that surprise people:

- `generateMetadata()` reads **Business Settings** at request time for the logo/OG image.
- The server cart is fetched in the root layout, so a soft navigation does not refresh
  prices — `useCart` refreshes the RSC tree on tab focus, throttled to once a minute.
- `(main)/layout.tsx` evaluates maintenance mode per request and can replace the entire
  storefront with `MaintenancePage`. Admin, auth and API routes are outside that layout and
  stay reachable.

---

## 5. Server vs client components

**Server (default).** Pages fetch and compose. Example — an admin list page is a thin
wrapper:

```tsx
export default async function OrderPage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } = await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer className="md:p-2 p-2 space-y-6 rounded-sm">
      <OrderList initialPage={page} initialLimit={limit}
                 initialSearchParams={{ ...params, orderStatus: "pending" }} />
    </AdminPageContainer>
  );
}
```

**Client (`"use client"`).** Anything with state, effects, Radix interactivity, charts or
Socket.IO. They receive serialisable props only.

Conventions:

- Server pages do not import from `components/admin/*` client widgets except as children —
  that is fine, but keep the props JSON-serialisable (no functions, no class instances).
- Money/dates are formatted at render time (`utils/datetime.ts`,
  `Intl.NumberFormat` usage in report widgets), never stored formatted.
- `useSearchParams` requires a `<Suspense>` boundary; the admin layout already wraps its
  shell in one.

---

## 6. Data access and caching

All HTTP goes through `utils/api-utils.ts`. Do not call `fetch(process.env.NEXT_PUBLIC_API_URL + …)`
directly — you would lose the cookie-based token resolution and the 401 cleanup.

| Helper | Cache behaviour |
| --- | --- |
| `fetchData` | 60 s ISR; product endpoints 300 s + tag `products`; **product detail = `no-store`** |
| `fetchPublicData` | 60 s ISR, tag `public` |
| `fetchProtectedData` | `no-store` unless a `revalidate` option is passed |
| `fetchDataPagination` | returns the full envelope (`data` + `total`/`page`/`totalPages`) |
| `postData` / `patchData` / `putData` / `deleteData` | no cache |
| `formPostData` | multipart, no cache |

Client-side, product-detail responses are memoised for **5 seconds** to absorb rapid
re-renders.

**Revalidation.** After a mutation, call `revalidatePath`/`revalidateTag` via
`utils/revalidatePath.ts` or a server action in `actions/revalidate.ts`. Forgetting this is
why "I edited the product but the site still shows the old price" happens: the API answers
fresh, the Next cache answers stale.

---

## 7. Auth in the browser and on the server

| Concern | Implementation |
| --- | --- |
| Login | `actions/auth.ts → login()` — validates with Zod, calls `auth/login`, parses the JWT, writes cookies |
| Cookies | `auth_token` (httpOnly, 24 h) and `user` (JSON snapshot incl. `isAdmin`) |
| Server reads | `getUser()` / `getToken()` in `actions/auth.ts` |
| Client reads | `resolveAuthToken()` → `GET /api/auth/token` |
| 401 handling | `fetchProtectedData` clears cookies; the UI redirects on the next navigation |
| Route guard | `proxy.ts` (`/user/:path*`, `/admin/:path*`) |
| Admin gate | `user.isAdmin === true` or role in `admin \| superadmin \| moderator` |
| Refresh | `utils/token-refresh.ts` posts to `auth/refresh` and rewrites cookies |

Two details that cause confusing bugs:

1. `resolveAuthToken()` caches the token for the lifetime of the page. After login or
   logout, call `resetAuthTokenCache()` before the next fetch.
2. The `user` cookie is a snapshot. Renaming a user or changing their role requires a
   re-login (or a manual cookie rewrite) before the UI reflects it.

---

## 8. Client state

| Provider | State | Persistence |
| --- | --- | --- |
| `CartProvider` → `useCart` | items, quantities, applied coupon, loading | Logged-in: server cart. Guest: `localStorage` keys `user-cart`, `user-coupon` |
| `NotificationProvider` | unread count, live notifications | Socket.IO + API; sound via `lib/notification-sound.ts` |
| `SearchProvider` | modal open/closed, query | in-memory |

Guest → user transition: on login the layout supplies the server cart and local state is
dropped (`setLocalCart(null)`). There is **no merge** of a guest cart into the server cart —
a deliberate simplification worth knowing when a customer reports "my cart emptied".

---

## 9. Forms

- Schemas live in `utils/form-validation.ts` (`loginSchema`, `registerSchema`, checkout
  schemas) and are shared between client validation and server actions — the action
  re-validates with `safeParse`, so client validation is a convenience, not a guarantee.
- Use the `components/ui/form.tsx` wrappers (RHF `FormField` + `FormMessage`) for
  consistent error display.
- Server actions return `{ success, message, errors? , redirect? }`; the calling client
  component shows a toast and navigates on `redirect`.
- File uploads go through `formPostData` (multipart) to `attachment` (or
  `attachment/upload-multiple`), then the returned attachment id is attached to the
  resource.

---

## 10. Admin screen patterns

A list screen is consistently assembled from:

| Piece | Component |
| --- | --- |
| Page frame | `AdminPageContainer` (padding, rounded surface) |
| Title + actions | `PageHeader` / `FormPageHeader` |
| Tabs between statuses | `RouteTabs` |
| Filters + table + pagination | domain component in `components/admin/<domain>/` |
| Empty/loading states | `LoadingIndicator`, skeleton rows |
| Destructive confirm | `DeleteConfirmationDialog` |
| Search params plumbing | `utils/admin-search-params.ts` (`parseListSearchParams`) |

URL is the source of truth for list state (`?page=&limit=&search=&sort=…`) so screens are
shareable and back/forward works. Keep new filters in the query string, not in component
state, and thread them through `parseListSearchParams`.

---

## 11. Media and documents

- **Images** — `next/image` with `remotePatterns` limited to the two S3 hosts.
  `minimumCacheTTL` is 31 days because S3 object keys are immutable UUIDs. SVG is allowed
  (`dangerouslyAllowSVG`) with a sandboxing CSP. Blur placeholders come from
  `utils/blur-generator.ts` (`plaiceholder` + `sharp`).
- **PDF invoices** — `utils/invoice-download.tsx` renders with `@react-pdf/renderer`;
  remote images are proxied through `/api/pdf-image`, which refuses any host other than
  `germanbutcher.s3.ap-southeast-1.amazonaws.com` (SSRF guard).
- **Excel** — `exceljs` in `download-excel-button.tsx` for report exports; generated in the
  browser from data already loaded.

---

## 12. Build and runtime configuration

`next.config.js`:

```js
reactCompiler: true,
output: 'standalone',
transpilePackages: ['@react-pdf/renderer'],   // + server externals
images: { remotePatterns: [<2 S3 hosts>], minimumCacheTTL: 31d, qualities: [70,75,85,100] }
```

- Dev uses Turbopack; **production build uses webpack** (`next build --webpack`) because the
  React PDF renderer and the image/optimizer setup are validated on webpack.
- `standalone` output is what the Dockerfile copies (`node apps/frontend/server.js`).
- `NEXT_PUBLIC_*` values are baked at build time — a container built with localhost URLs
  will point at localhost in production no matter what you set at runtime.

---

## 13. Checklists

**Add a storefront page**

1. Create `app/(main)/<route>/page.tsx` as a server component.
2. Fetch via `fetchData` / `fetchPublicData`; wrap optional data in `.catch(() => null)` if
   the page should survive an API outage (the main layout does this for settings).
3. Add metadata (`export const metadata` or `generateMetadata`).
4. Build interactive parts as client components in `components/<area>/`.
5. Check the mobile layout: the storefront has a bottom bar and a search modal overlay.

**Add an admin screen**

1. Backend controller + `@ModulePermissions('/admin/<area>')` and a matching `menu` row.
2. `app/admin/<area>/page.tsx` → parse search params → render a client list component.
3. Add add/edit routes as separate pages; reuse `FormPageHeader` + `DeleteConfirmationDialog`.
4. Grant the menu to the relevant roles (`menu_permission`), or only admins will see it.
5. Call `revalidatePath` after mutations so storefront pages pick up the change.

---

## 14. Gotchas

| Symptom | Cause |
| --- | --- |
| `undefined/products` requests | `NEXT_PUBLIC_API_URL` missing at build time |
| Storefront shows stale prices after an admin edit | Next Data Cache (`revalidate` 60/300) not invalidated |
| Product page keeps working after deactivation | It should not; detail fetches are `no-store`. If it does, check for a custom fetch that reintroduced caching |
| Admin page renders but sidebar lacks the entry | No `menu` row / permission for the role |
| Socket notifications dead on a new dev port | Gateway CORS is hard-coded to specific origins |
| Cart appears empty after login | Guest carts are not merged into server carts by design |
| Hydration warning in the console | A client component read `localStorage`/`window` during render — move it into `useEffect` (see `useCart`'s `isMounted`) |
