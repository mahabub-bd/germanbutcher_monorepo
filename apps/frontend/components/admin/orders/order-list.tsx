"use client";

import type React from "react";

import { AddPaymentModal } from "@/components/admin/orders/add-payment-modal";
import { EditOrderModal } from "@/components/admin/orders/edit-order-modal";
import { PageHeader } from "@/components/admin/page-header";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PaginationComponent } from "@/components/common/pagination";
import { TableSearch } from "@/components/common/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DISTRICT_AREAS,
  DIVISION_DISTRICTS,
  getDistrictsByDivision,
} from "@/data/districts-areas";
import {
  cn,
  formatCurrencyEnglish,
  formatDateTime,
  shortenArea,
} from "@/lib/utils";
import { fetchDataPagination, fetchProtectedData } from "@/utils/api-utils";
import {
  formatOrderElapsedTime,
  getOrderStatusColor,
  getPaymentMethodColor,
  getPaymentMethodIcon,
  getPaymentStatusColor,
  getShippingMethodColor,
  getShippingMethodIcon,
  getStatusIcon,
} from "@/utils/order-helper";
import { listRouteToSlug } from "@/utils/order-list-routes";
import type { Order, PaymentMethod, ShippingMethod } from "@/utils/types";
import {
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Eye,
  List,
  Lock,
  MapPin,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const DIVISIONS = Object.keys(DIVISION_DISTRICTS);

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  // The /admin/orders/on-hold route seeds this value, so it needs an option
  // even though it isn't a step in the main fulfilment flow.
  { value: "on_hold", label: "On hold" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STALE_AFTER_DAYS = 3;

// Each status route keeps its own heading; the default list covers everything.
const LIST_HEADER: Record<string, { title: string; description: string }> = {
  orders: {
    title: "Orders",
    description: "Every order with its payment, shipping and delivery status.",
  },
  pending: {
    title: "Pending Orders",
    description: "Orders waiting to be confirmed.",
  },
  processing: {
    title: "Processing Orders",
    description: "Orders being prepared for dispatch.",
  },
  "on-hold": {
    title: "On Hold Orders",
    description: "Orders paused before dispatch.",
  },
  shipped: {
    title: "Shipped Orders",
    description: "Orders handed over for delivery.",
  },
  delivered: {
    title: "Delivered Orders",
    description: "Orders completed at the customer address.",
  },
  cancelled: {
    title: "Cancelled Orders",
    description: "Orders called off before delivery.",
  },
};

/** Elapsed-time chip: neutral while fresh, red once the order sits
 *  UNDELIVERED for 3+ days; delivered orders show the order→delivery
 *  span in green; cancelled orders show the order→cancel span in slate.
 *  Re-renders every minute so ages stay current. */
function ElapsedTime({
  createdAt,
  deliveredAt,
  cancelledAt,
}: {
  createdAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isDelivered = Boolean(deliveredAt);
  const isCancelled = !isDelivered && Boolean(cancelledAt);
  const end = isDelivered
    ? new Date(deliveredAt as string).getTime()
    : isCancelled
      ? new Date(cancelledAt as string).getTime()
      : now;
  const elapsed = formatOrderElapsedTime(createdAt, end);
  const isStale =
    !isDelivered &&
    !isCancelled &&
    now - new Date(createdAt).getTime() >= STALE_AFTER_DAYS * 86400000;

  const colorClass = isDelivered
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
    : isCancelled
      ? "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400"
      : isStale
        ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
        : "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";

  const Icon = isDelivered ? CheckCircle2 : isCancelled ? XCircle : Clock;

  const title = isDelivered
    ? `Order → delivery: ${formatDateTime(createdAt)} → ${formatDateTime(deliveredAt as string)}`
    : isCancelled
      ? `Order → cancelled: ${formatDateTime(createdAt)} → ${formatDateTime(cancelledAt as string)}`
      : `Order placed ${formatDateTime(createdAt)}`;

  return (
    <span
      title={title}
      className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-px text-[10px] font-medium tabular-nums ${colorClass}`}
    >
      <Icon className="h-3 w-3" />
      {elapsed}
    </span>
  );
}

// Same district → areas lookup the checkout page uses, sorted alphabetically
const areasByDistrict = new Map(
  DISTRICT_AREAS.map(({ district, areas }) => [
    district,
    [...new Set(areas)].sort((a, b) => a.localeCompare(b)),
  ]),
);

interface OrderListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function OrderList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: OrderListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/orders";
  const listSlug = listRouteToSlug(pathname) ?? "orders";
  const headerCopy = LIST_HEADER[listSlug] ?? LIST_HEADER.orders;
  const { can } = usePermissions();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("orderStatus") as string
  );
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(
    getInitialParam("paymentMethodId") as string
  );
  const [shippingMethodFilter, setShippingMethodFilter] = useState(
    getInitialParam("shippingMethodId") as string
  );
  const [areaFilter, setAreaFilter] = useState(
    getInitialParam("area") as string
  );
  const [divisionFilter, setDivisionFilter] = useState(
    getInitialParam("division") as string
  );
  const [cityFilter, setCityFilter] = useState(
    getInitialParam("city") as string
  );

  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<Order["id"] | null>(
    null
  );
  const [payingOrderId, setPayingOrderId] = useState<Order["id"] | null>(null);

  // Below md the filters live in a bottom sheet instead of the toolbar strip.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Skip URL writes until the first fetch resolves: totalPages starts at 1,
  // so clamping a deep-linked ?page=N against it would rewrite it to page 1.
  // The sequence ref ignores stale responses so the table always matches
  // currentPage (older fetches can resolve after newer ones).
  const hasFetchedRef = useRef(false);
  const fetchSeqRef = useRef(0);

  const updateUrl = useCallback(() => {
    if (!hasFetchedRef.current) return;

    // Prevent page from exceeding totalPages
    const safePage = Math.min(currentPage, totalPages);
    const finalPage = Math.max(1, safePage);

    const params = new URLSearchParams();

    params.set("page", finalPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("orderStatus", statusFilter);
    if (paymentMethodFilter) params.set("paymentMethodId", paymentMethodFilter);
    if (shippingMethodFilter)
      params.set("shippingMethodId", shippingMethodFilter);
    if (areaFilter) params.set("area", areaFilter);
    if (divisionFilter) params.set("division", divisionFilter);
    if (cityFilter) params.set("city", cityFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, totalPages, limit, searchQuery, statusFilter, paymentMethodFilter, shippingMethodFilter, areaFilter, divisionFilter, cityFilter]);

  const fetchOrders = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "all")
        params.append("orderStatus", statusFilter);
      if (paymentMethodFilter) params.append("paymentMethodId", paymentMethodFilter);
      if (shippingMethodFilter)
        params.append("shippingMethodId", shippingMethodFilter);
      if (areaFilter) params.append("area", areaFilter);
      if (divisionFilter) params.append("division", divisionFilter);
      if (cityFilter) params.append("city", cityFilter);

      const response = await fetchDataPagination<{
        data: Order[];
        total: number;
        totalPages: number;
      }>(`orders?${params.toString()}`);
      if (seq !== fetchSeqRef.current) return; // superseded by a newer request
      setOrders(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
      hasFetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (seq !== fetchSeqRef.current) return;
      toast.error("Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      if (seq === fetchSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, limit, searchQuery, statusFilter, paymentMethodFilter, shippingMethodFilter, areaFilter, divisionFilter, cityFilter]);

  // Initial load with URL params
  useEffect(() => {
    const pageFromUrl = searchParams?.get("page");
    const searchFromUrl = searchParams?.get("search");
    const statusFromUrl = searchParams?.get("orderStatus");
    const paymentMethodFromUrl = searchParams?.get("paymentMethodId");
    const shippingMethodFromUrl = searchParams?.get("shippingMethodId");

    if (pageFromUrl) {
      const newPage = parseInt(pageFromUrl, 10);
      // Only update if different to prevent infinite loop
      if (newPage !== currentPage && newPage > 0) {
        setCurrentPage(newPage);
      }
    }
    if (searchFromUrl && searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl);
    }
    if (statusFromUrl && statusFromUrl !== statusFilter) {
      setStatusFilter(statusFromUrl);
    }
    if (paymentMethodFromUrl && paymentMethodFromUrl !== paymentMethodFilter) {
      setPaymentMethodFilter(paymentMethodFromUrl);
    }
    if (shippingMethodFromUrl && shippingMethodFromUrl !== shippingMethodFilter) {
      setShippingMethodFilter(shippingMethodFromUrl);
    }
    const areaFromUrl = searchParams?.get("area");
    if (areaFromUrl && areaFromUrl !== areaFilter) {
      setAreaFilter(areaFromUrl);
    }
    const divisionFromUrl = searchParams?.get("division");
    if (divisionFromUrl && divisionFromUrl !== divisionFilter) {
      setDivisionFilter(divisionFromUrl);
    }
    const cityFromUrl = searchParams?.get("city");
    if (cityFromUrl && cityFromUrl !== cityFilter) {
      setCityFilter(cityFromUrl);
    }
  }, [searchParams]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update URL when state changes
  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Payment and shipping method options for the filter dropdown load once
  useEffect(() => {
    fetchProtectedData<PaymentMethod[]>("order-payment-methods")
      .then((methods) => {
        if (Array.isArray(methods)) {
          setPaymentMethods(methods);
        }
      })
      .catch((error) => {
        console.error("Error fetching payment methods:", error);
      });

    fetchProtectedData<ShippingMethod[]>("shipping-methods?isActive=true")
      .then((methods) => {
        if (Array.isArray(methods)) {
          setShippingMethods(methods);
        }
      })
      .catch((error) => {
        console.error("Error fetching shipping methods:", error);
      });
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditModalOpenChange = useCallback((open: boolean) => {
    if (!open) setEditingOrderId(null);
  }, []);

  const handlePaymentModalOpenChange = useCallback((open: boolean) => {
    if (!open) setPayingOrderId(null);
  }, []);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setShippingMethodFilter("");
    setAreaFilter("");
    setDivisionFilter("");
    setCityFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Check if order can be edited
  const canEditOrder = (orderStatus: string) => {
    const nonEditableStatuses = ["shipped", "delivered"];
    return !nonEditableStatuses.includes(orderStatus.toLowerCase());
  };

  // Detail links carry the list context (route, page, filters) so the
  // detail pages can send the user back to the exact spot in the list.
  // The source list is a readable slug, omitted for the default list.
  const buildDetailHref = (id: Order["id"], tab: "view" | "payments") => {
    const params = new URLSearchParams();
    const listSlug = listRouteToSlug(pathname);
    if (listSlug && listSlug !== "orders") params.set("from", listSlug);
    params.set("page", currentPage.toString());
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter && statusFilter !== "all")
      params.set("orderStatus", statusFilter);
    if (paymentMethodFilter) params.set("paymentMethodId", paymentMethodFilter);
    if (shippingMethodFilter)
      params.set("shippingMethodId", shippingMethodFilter);
    if (areaFilter) params.set("area", areaFilter);
    if (divisionFilter) params.set("division", divisionFilter);
    if (cityFilter) params.set("city", cityFilter);
    return `/admin/order/${id}/${tab}?${params.toString()}`;
  };

  const handleCopyOrderNo = async (orderNo: string) => {
    try {
      await navigator.clipboard.writeText(orderNo);
      toast.success("Order number copied to clipboard");
    } catch {
      toast.error("Failed to copy order number");
    }
  };

  const renderTableView = () => (
    <div className="">
      <div className="overflow-x-auto">
        {/* min-w only below lg: on laptop+ the table shrinks to the container
            so all columns fit without horizontal scrolling */}
        <Table className="min-w-220 lg:min-w-0 text-xs 2xl:text-sm [&_th]:h-9 [&_td]:py-1.5">
          <TableHeader>
            <TableRow>
              <TableHead>Order ID / Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Shipping Method</TableHead>
              <TableHead>Area</TableHead>
              <TableHead className="text-center">Elapsed Time</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(limit)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="mx-auto h-4 w-12 bg-gray-200 rounded animate-pulse" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-1">
                      <h3 className="font-semibold">No orders found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ||
                          statusFilter ||
                          paymentMethodFilter ||
                          shippingMethodFilter ||
                          areaFilter ||
                          divisionFilter ||
                          cityFilter
                          ? "No orders match your search criteria."
                          : "There are no orders in the system yet."}
                      </p>
                    </div>
                    {(searchQuery ||
                      statusFilter ||
                      paymentMethodFilter ||
                      shippingMethodFilter ||
                      areaFilter ||
                      divisionFilter ||
                      cityFilter) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                        >
                          Clear Filters
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="align-top">
                    <div className="flex items-center gap-1">
                      <Link
                        href={buildDetailHref(order.id, "view")}
                        className="font-mono hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {order.orderNo}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopyOrderNo(order.orderNo)}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy order number</span>
                      </Button>
                    </div>
                    <div className="mt-0.5 text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {order.user?.id ? (
                      <Link
                        href={`/admin/customer/${order.user.id}/view`}
                        className="font-medium hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                      >
                        {order.user.name || "N/A"}
                      </Link>
                    ) : (
                      <div className="font-medium">
                        {order.user?.name || "N/A"}
                      </div>
                    )}
                    <div className="mt-0.5">
                      {order.user?.mobileNumber ? (
                        <a
                          href={`tel:${order.user.mobileNumber}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {order.user.mobileNumber}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`capitalize ${getOrderStatusColor(order.orderStatus)}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`capitalize ${getPaymentStatusColor(order.paymentStatus)}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(order.paymentStatus)}
                        {order.paymentStatus}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      title={order.paymentMethod?.name || undefined}
                      className={`capitalize max-w-32 lg:max-w-none truncate ${getPaymentMethodColor(order.paymentMethod?.name)}`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {getPaymentMethodIcon(order.paymentMethod?.name || "")}
                        <span className="truncate">
                          {order.paymentMethod?.name || "N/A"}
                        </span>
                      </span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      title={order.shippingMethod?.name || undefined}
                      className={`capitalize max-w-28 lg:max-w-none truncate ${getShippingMethodColor(
                        order.shippingMethod?.name
                      )}`}
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        {getShippingMethodIcon(order.shippingMethod?.name || "")}
                        <span className="truncate">
                          {order.shippingMethod?.name || "N/A"}
                        </span>
                      </span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="max-w-52 lg:max-w-none truncate capitalize border-transparent bg-violet-100 font-normal text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                      title={order.shippingAddress?.area || order.address?.area || undefined}
                    >
                      {/* compact 3-word area below 2xl, fuller 5-word form on
                          2xl where the column is wide enough */}
                      <span className="hidden items-center gap-1 2xl:flex">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {shortenArea(order.shippingAddress?.area || order.address?.area || "N/A", 5)}
                      </span>
                      <span className="flex items-center gap-1 2xl:hidden">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {shortenArea(order.shippingAddress?.area || order.address?.area || "N/A")}
                      </span>
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <ElapsedTime
                      createdAt={order.createdAt}
                      deliveredAt={order.deliveredAt}
                      cancelledAt={order.cancelledAt}
                    />
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {formatCurrencyEnglish(order.totalValue || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* View - Always available */}
                        <DropdownMenuItem asChild>
                          <Link href={buildDetailHref(order.id, "view")}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>

                        {/* Edit - Only for pending, processing, cancelled orders */}
                        <DropdownMenuItem
                          disabled={
                            !can(MENU_URL, "canEdit") ||
                            !canEditOrder(order.orderStatus)
                          }
                          onSelect={() => setEditingOrderId(order.id)}
                        >
                          {!canEditOrder(order.orderStatus) ? (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Edit (Order {order.orderStatus})
                            </>
                          ) : (
                            <>
                              <Pencil className="mr-2 h-4 w-4" /> Update Order
                            </>
                          )}
                        </DropdownMenuItem>

                        {/* Payment Update - Only if not fully paid and not cancelled */}
                        <DropdownMenuItem
                          disabled={
                            !can(MENU_URL, "canCreate") ||
                            (order.paidAmount || 0) >= (order.totalValue || 0) ||
                            order.orderStatus.toLowerCase() === "cancelled"
                          }
                          onSelect={() => setPayingOrderId(order.id)}
                        >
                          <DollarSign className="mr-2 h-4 w-4" /> Update Payment
                        </DropdownMenuItem>

                        {/* View Payments - Always available */}
                        <DropdownMenuItem asChild>
                          <Link href={buildDetailHref(order.id, "payments")}>
                            <List className="mr-2 h-4 w-4" /> Payment History
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      {!isLoading && orders.length > 0 && (
        <div className="flex flex-col items-start gap-2 border-t p-2 md:flex-row md:items-center md:justify-between">
          {/* The applied-filter summary lives with the results line, not in
              the toolbar, so the filter row never has to make room for it. */}
          <div className="flex min-w-0 items-center gap-2 text-[0.7rem] text-muted-foreground md:text-xs 2xl:text-sm">
            <span className="whitespace-nowrap">
              Showing {Math.min((currentPage - 1) * limit + 1, totalItems)} to{" "}
              {Math.min(currentPage * limit, totalItems)} of {totalItems} orders
            </span>
            {activeFilterSummary && (
              <span
                className="min-w-0 truncate opacity-80"
                title={activeFilterSummary}
              >
                · {activeFilterSummary}
              </span>
            )}
          </div>
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="#"
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Loading Pagination Skeleton */}
      {isLoading && (
        <div className="flex flex-row justify-between items-center p-2 border-t">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );

  const hasActiveFilters = Boolean(
    searchQuery ||
    (statusFilter && statusFilter !== "all") ||
    paymentMethodFilter ||
    shippingMethodFilter ||
    areaFilter ||
    divisionFilter ||
    cityFilter
  );

  // Count surfaced on the mobile Filters button so a collapsed sheet still
  // shows that the list is narrowed.
  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(statusFilter && statusFilter !== "all"),
    Boolean(paymentMethodFilter),
    Boolean(shippingMethodFilter),
    Boolean(divisionFilter),
    Boolean(cityFilter),
    Boolean(areaFilter),
  ].filter(Boolean).length;

  const paymentMethodName =
    paymentMethods.find((m) => m.id.toString() === paymentMethodFilter)?.name ||
    paymentMethodFilter;
  const shippingMethodName =
    shippingMethods.find((m) => m.id.toString() === shippingMethodFilter)?.name ||
    shippingMethodFilter;

  // Compact summary of everything applied, shown beside Clear: the toolbar
  // stays a single line instead of stacking removable badges underneath.
  const activeFilterSummary = [
    searchQuery && `Search: ${searchQuery}`,
    statusFilter &&
    statusFilter !== "all" &&
    `Status: ${STATUS_FILTERS.find((s) => s.value === statusFilter)?.label ?? statusFilter}`,
    paymentMethodFilter && `Payment: ${paymentMethodName}`,
    shippingMethodFilter && `Shipping: ${shippingMethodName}`,
    divisionFilter && `Division: ${divisionFilter}`,
    cityFilter && `City: ${cityFilter}`,
    areaFilter && `Area: ${areaFilter}`,
  ]
    .filter(Boolean)
    .join(" · ");

  // One source of truth for the filter controls: the toolbar renders them
  // inline and compact, the mobile sheet renders the same nodes full width
  // under a visible label.
  const renderFilterControls = (mode: "bar" | "sheet") => {
    const triggerClass =
      mode === "bar"
        ? "h-9 w-full px-2 text-xs font-medium lg:px-3 2xl:text-sm"
        : "h-11 w-full px-3 text-sm font-medium";

    return [
      {
        key: "status",
        label: "Order Status",
        node: (
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "payment",
        label: "Payment Method",
        node: (
          <Select
            value={paymentMethodFilter || "all"}
            onValueChange={(value) => {
              setPaymentMethodFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id.toString()}>
                  {method.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "shipping",
        label: "Shipping Method",
        node: (
          <Select
            value={shippingMethodFilter || "all"}
            onValueChange={(value) => {
              setShippingMethodFilter(value === "all" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Shipping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {shippingMethods.map((method) => (
                <SelectItem key={method.id} value={method.id.toString()}>
                  {method.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "division",
        label: "Division",
        node: (
          // Division → City → Area keeps the checkout cascade: each step
          // resets the ones below it.
          <Select
            value={divisionFilter || "all"}
            onValueChange={(value) => {
              const next = value === "all" ? "" : value;
              if (next !== divisionFilter) {
                setCityFilter("");
                setAreaFilter("");
              }
              setDivisionFilter(next);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All divisions</SelectItem>
              {DIVISIONS.map((division) => (
                <SelectItem key={division} value={division}>
                  {division}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "city",
        label: "City",
        node: (
          <SearchableSelect
            value={cityFilter}
            onValueChange={(value) => {
              if (value !== cityFilter) {
                setAreaFilter("");
              }
              setCityFilter(value);
              setCurrentPage(1);
            }}
            options={getDistrictsByDivision(divisionFilter)}
            placeholder="City"
            searchPlaceholder="Search city..."
            disabled={!divisionFilter}
            className={triggerClass}
          />
        ),
      },
      {
        key: "area",
        label: "Area",
        node: (
          <SearchableSelect
            value={areaFilter}
            onValueChange={(value) => {
              setAreaFilter(value);
              setCurrentPage(1);
            }}
            options={areasByDistrict.get(cityFilter) ?? []}
            placeholder="Area"
            searchPlaceholder="Search area..."
            emptyMessage="No area found."
            disabled={!cityFilter}
            className={triggerClass}
          />
        ),
      },
    ];
  };

  return (
    <div className="w-full space-y-2">
      <PageHeader
        title={headerCopy.title}
        description={headerCopy.description}
        className="mb-2"
      >
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={fetchOrders}
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      {/* Toolbar — product-list shell: search, filters and Clear on one row
          from md up; below md the filters collapse into a bottom sheet. */}
      <div className="rounded-xl border bg-card p-3 shadow-xs">
        <div className="flex flex-nowrap items-center gap-2 lg:gap-3">
          <TableSearch
            wrapperClassName="min-w-0 flex-1 md:w-40 md:flex-none lg:w-48 xl:w-56 2xl:w-64"
            className="h-9 text-xs font-medium md:text-xs 2xl:text-sm"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={handleSearchChange}
          />

          {/* Phones and small tablets: six controls cannot share one row, so
              the filters collapse into a bottom sheet opened from the toolbar.
              Same controls as the strip, full width under visible labels. */}
          <div className="shrink-0 md:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <SlidersHorizontal className="size-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="size-4.5 rounded-full px-0 text-[0.65rem] font-semibold">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[82dvh] gap-0 overflow-y-auto rounded-t-2xl"
              >
                <SheetHeader className="border-b pr-14">
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow the list by status, payment, shipping and location.
                  </SheetDescription>
                </SheetHeader>

                {renderFilterControls("sheet").map((control) => (
                  <div key={control.key} className="px-4 pt-4">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {control.label}
                    </p>
                    {control.node}
                  </div>
                ))}

                <SheetFooter className="sticky bottom-0 mt-4 flex-row border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      clearFilters();
                      setFilterSheetOpen(false);
                    }}
                  >
                    Clear all
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">
                      {totalItems > 0 ? `Show ${totalItems} orders` : "Done"}
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* md and up: filters and Clear stay on one row with the search. */}
          <div className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex lg:gap-2">
            {renderFilterControls("bar").map((control) => (
              <div key={control.key} className="min-w-16 flex-1">
                {control.node}
              </div>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 text-xs font-medium text-muted-foreground 2xl:text-sm"
                title={activeFilterSummary}
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {renderTableView()}

      <EditOrderModal
        orderId={editingOrderId}
        open={editingOrderId !== null}
        onOpenChange={handleEditModalOpenChange}
        onUpdated={fetchOrders}
      />

      <AddPaymentModal
        orderId={payingOrderId}
        open={payingOrderId !== null}
        onOpenChange={handlePaymentModalOpenChange}
        onUpdated={fetchOrders}
      />
    </div>
  );
}