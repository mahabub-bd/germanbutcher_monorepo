// Readable slugs for the order list routes. Detail links carry the source
// list as `?from=<slug>` (omitted for the default list) so "Back" can
// restore the exact page without putting encoded paths in the URL.
const LIST_ROUTES: Record<string, string> = {
  orders: "/admin/orders",
  pending: "/admin/orders/pending",
  processing: "/admin/orders/processing",
  shipped: "/admin/orders/shipped",
  delivered: "/admin/orders/delivered",
  cancelled: "/admin/orders/cancelled",
};

export function listRouteToSlug(pathname: string): string | undefined {
  return Object.keys(LIST_ROUTES).find((key) => LIST_ROUTES[key] === pathname);
}

export function listSlugToRoute(slug: string): string {
  return LIST_ROUTES[slug] ?? "/admin/orders";
}
