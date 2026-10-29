"use client";

import type React from "react";

import { AddPaymentModal } from "@/components/admin/orders/add-payment-modal";
import { EditOrderModal } from "@/components/admin/orders/edit-order-modal";
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
  Filter,
  List,
  Lock,
  MapPin,
  MoreHorizontal,
  Pencil,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const DIVISIONS = Object.keys(DIVISION_DISTRICTS);

const STALE_AFTER_DAYS = 3;

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

  const renderActiveFilters = () => {
    const hasFilters = searchQuery || statusFilter || paymentMethodFilter || shippingMethodFilter || areaFilter || divisionFilter || cityFilter;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {searchQuery && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {statusFilter && statusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Status: {statusFilter}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {paymentMethodFilter && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Payment:{" "}
            {paymentMethods.find((m) => m.id.toString() === paymentMethodFilter)
              ?.name || paymentMethodFilter}
            <button onClick={() => setPaymentMethodFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {shippingMethodFilter && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Shipping:{" "}
            {shippingMethods.find((m) => m.id.toString() === shippingMethodFilter)
              ?.name || shippingMethodFilter}
            <button
              onClick={() => setShippingMethodFilter("")}
              className="ml-1"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {areaFilter && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Area: {areaFilter}
            <button onClick={() => setAreaFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {divisionFilter && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Division: {divisionFilter}
            <button
              onClick={() => {
                setDivisionFilter("");
                setCityFilter("");
                setAreaFilter("");
              }}
              className="ml-1"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {cityFilter && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            City: {cityFilter}
            <button
              onClick={() => {
                setCityFilter("");
                setAreaFilter("");
              }}
              className="ml-1"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
    );
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
        <div className="flex flex-row justify-between items-center p-2 border-t">
          <div className="text-xs text-muted-foreground whitespace-nowrap hidden md:flex 2xl:text-sm">
            Showing {Math.min((currentPage - 1) * limit + 1, totalItems)} to{" "}
            {Math.min(currentPage * limit, totalItems)} of {totalItems} orders
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

  const hasActiveFilters =
    (statusFilter && statusFilter !== "all") ||
    paymentMethodFilter ||
    shippingMethodFilter ||
    areaFilter ||
    divisionFilter ||
    cityFilter;

  // Shared filter sections, rendered inside the desktop dropdown and the
  // mobile bottom sheet so both stay in sync.
  const renderFilterSections = () => (
    <>
      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Order Status
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            "all",
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`text-xs py-1.5 px-2 rounded-md border capitalize ${statusFilter === status ||
                (!statusFilter && status === "all")
                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Filter */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-40 overflow-y-auto">
          <button
            onClick={() => {
              setPaymentMethodFilter("");
              setCurrentPage(1);
            }}
            className={`text-xs py-1.5 px-2 rounded-md border capitalize ${!paymentMethodFilter
              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
              }`}
          >
            all
          </button>
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => {
                setPaymentMethodFilter(method.id.toString());
                setCurrentPage(1);
              }}
              className={`text-xs py-1.5 px-2 rounded-md border capitalize truncate ${paymentMethodFilter === method.id.toString()
                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                }`}
            >
              {method.name}
            </button>
          ))}
        </div>
      </div>

      {/* Shipping Method Filter */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Shipping Method
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-40 overflow-y-auto">
          <button
            onClick={() => {
              setShippingMethodFilter("");
              setCurrentPage(1);
            }}
            className={`text-xs py-1.5 px-2 rounded-md border capitalize ${!shippingMethodFilter
              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
              : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
              }`}
          >
            all
          </button>
          {shippingMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => {
                setShippingMethodFilter(method.id.toString());
                setCurrentPage(1);
              }}
              className={`text-xs py-1.5 px-2 rounded-md border capitalize truncate ${shippingMethodFilter === method.id.toString()
                ? "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                }`}
            >
              {method.name}
            </button>
          ))}
        </div>
      </div>

      {/* Location Filter — cascading Division → City → Area, same data
          source as checkout */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Division
        </label>
        <Select
          value={divisionFilter}
          onValueChange={(value) => {
            if (value !== divisionFilter) {
              // Reset downstream selections when the division changes
              setCityFilter("");
              setAreaFilter("");
            }
            setDivisionFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Select Division" />
          </SelectTrigger>
          <SelectContent>
            {DIVISIONS.map((division) => (
              <SelectItem key={division} value={division}>
                {division}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          City
        </label>
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
          placeholder={
            divisionFilter ? "Select City" : "Select Division first"
          }
          searchPlaceholder="Search city..."
          disabled={!divisionFilter}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Area
        </label>
        <SearchableSelect
          value={areaFilter}
          onValueChange={(value) => {
            setAreaFilter(value);
            setCurrentPage(1);
          }}
          options={areasByDistrict.get(cityFilter) ?? []}
          placeholder={cityFilter ? "Select Area" : "Select City first"}
          searchPlaceholder="Search area..."
          emptyMessage="No area found."
          disabled={!cityFilter}
          className="h-8 text-xs"
        />
      </div>
    </>
  );

  return (
    <div className="w-full space-y-2">
      <div className="space-y-2">
        <div className="flex flex-row justify-between gap-2">
          <TableSearch
            wrapperClassName="w-full sm:max-w-xs"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={handleSearchChange}
          />

          <div className="flex items-center gap-2">
            {/* Desktop: dropdown panel */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-130 p-3 rounded-lg shadow-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"
                  sideOffset={8}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Filters</h4>
                      {hasActiveFilters ? (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Clear all
                        </button>
                      ) : null}
                    </div>

                    {/* Filter sections (shared with the mobile sheet) */}
                    {renderFilterSections()}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile: bottom sheet */}
            <div className="sm:hidden">
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="rounded-t-xl max-h-[85dvh]"
                >
                  <SheetHeader>
                    <SheetTitle className="text-sm">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
                    <div className="space-y-3">
                      {renderFilterSections()}
                    </div>
                  </div>
                  <SheetFooter className="flex-row gap-2 pt-0!">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                    >
                      Clear all
                    </Button>
                    <SheetClose asChild>
                      <Button size="sm" className="flex-1">
                        Show Results
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {renderActiveFilters()}

        {renderTableView()}
      </div>

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
