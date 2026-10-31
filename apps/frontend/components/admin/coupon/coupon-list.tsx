"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import { deleteData, fetchProtectedData } from "@/utils/api-utils";
import type { Coupon, TopCouponUsage } from "@/utils/types";
import {
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Tag,
  TicketPercent,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

/** Grouped amount, up to 2 decimals — the ৳ mark lives in the header note. */
const bare = (value: number | string) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

type CouponStatus = "active" | "expiring" | "expired" | "inactive";

const STATUS_META: Record<
  CouponStatus,
  { label: string; tone: "emerald" | "amber" | "red" | "neutral" }
> = {
  active: { label: "Active", tone: "emerald" },
  expiring: { label: "Expiring soon", tone: "amber" },
  expired: { label: "Expired", tone: "red" },
  inactive: { label: "Inactive", tone: "neutral" },
};

const isCouponExpired = (coupon: Coupon): boolean =>
  new Date(coupon.validUntil) < new Date();

/** Expiring soon = still valid, but within the next 7 days. */
const isCouponExpiringSoon = (coupon: Coupon): boolean => {
  const now = new Date();
  const validUntil = new Date(coupon.validUntil);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  return validUntil > now && validUntil <= sevenDaysFromNow;
};

const statusOf = (coupon: Coupon): CouponStatus => {
  if (isCouponExpired(coupon)) return "expired";
  if (isCouponExpiringSoon(coupon)) return "expiring";
  if (!coupon.isActive) return "inactive";
  return "active";
};

export function CouponList() {
  const MENU_URL = "/admin/marketing/coupon/coupon-list";
  const { can } = usePermissions();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [topCoupons, setTopCoupons] = useState<TopCouponUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchProtectedData("coupons");
      setCoupons(response as Coupon[]);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons. Please try again.");
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    // Performance data is auxiliary — a failure leaves the section hidden.
    fetchProtectedData<TopCouponUsage[]>(
      "coupon-usage-logs/reports/top?days=30&limit=5"
    )
      .then((data) => setTopCoupons(data ?? []))
      .catch(() => setTopCoupons([]));
  }, [fetchCoupons]);

  const handleDeleteClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;

    try {
      await deleteData("coupons", selectedCoupon.id);
      fetchCoupons();
      toast.success("Coupon deleted successfully");
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const activeCount = coupons.filter(
    (c) => !isCouponExpired(c) && c.isActive
  ).length;
  const expiringSoonCount = coupons.filter(isCouponExpiringSoon).length;
  const expiredCount = coupons.filter(isCouponExpired).length;

  const hasFilters = Boolean(searchQuery || statusFilter);

  const filteredCoupons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return coupons.filter((coupon) => {
      if (statusFilter && statusOf(coupon) !== statusFilter) return false;
      if (!query) return true;
      return coupon.code.toLowerCase().includes(query);
    });
  }, [coupons, searchQuery, statusFilter]);

  const topCouponsTotalUses = topCoupons.reduce((sum, c) => sum + c.uses, 0);
  const topCouponsDiscount = topCoupons.reduce(
    (sum, c) => sum + c.discountGiven,
    0
  );
  const topCouponsOrderValue = topCoupons.reduce(
    (sum, c) => sum + c.orderValue,
    0
  );

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  const discountLabel = (coupon: Coupon) =>
    coupon.discountType === "percentage"
      ? `${coupon.value}%`
      : `৳${bare(coupon.value)}`;

  const renderActions = (coupon: Coupon) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/marketing/coupon/${coupon?.code}/usage-logs`}>
            <Eye className="mr-2 h-4 w-4" /> Usage Logs
          </Link>
        </DropdownMenuItem>
        {can(MENU_URL, "canEdit") && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/marketing/coupon/${coupon?.code}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
        )}
        {can(MENU_URL, "canDelete") && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDeleteClick(coupon)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="w-full">
        <PageHeader
          title="Coupons"
          description="Discount codes with their usage against the allowed limit and validity window."
          {...(can(MENU_URL, "canCreate")
            ? {
                actionLabel: "Add Coupon",
                actionHref: "/admin/marketing/coupon/add",
              }
            : {})}
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/marketing/coupon/usage-logs">
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Usage Logs</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchCoupons}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </PageHeader>

        {/* Toolbar */}
        <div className="mb-6 rounded-xl border bg-card p-3 shadow-xs">
          <div className="flex flex-col gap-2.5 md:flex-row md:flex-nowrap md:items-center md:gap-3">
            <TableSearch
              wrapperClassName="w-full md:max-w-xs"
              className="h-9"
              placeholder="Search by coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2.5 md:flex md:items-center md:gap-3">
              <div className="md:w-40 md:shrink-0">
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) =>
                    setStatusFilter(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring">Expiring soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 md:ml-auto">
                <PillBadge className="font-medium">
                  {[
                    searchQuery && `Search: ${searchQuery}`,
                    statusFilter &&
                      `Status: ${STATUS_META[statusFilter as CouponStatus]?.label ?? statusFilter}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </PillBadge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-muted-foreground"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingIndicator message="Loading coupons..." />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <TicketPercent className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No coupons found</p>
              <p className="text-xs text-muted-foreground">
                Get started by creating your first coupon code.
              </p>
            </div>
            {can(MENU_URL, "canCreate") && (
              <Button size="sm" asChild>
                <Link href="/admin/marketing/coupon/add">
                  <Plus className="size-4" /> Add Coupon
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Range totals */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatsCard
                icon={Tag}
                title="Total coupons"
                value={coupons.length.toLocaleString("en-US")}
                description="All coupon codes"
                bgColor="blue"
              />
              <StatsCard
                icon={CheckCircle2}
                title="Active"
                value={activeCount.toLocaleString("en-US")}
                description="Valid and enabled"
                bgColor="green"
              />
              <StatsCard
                icon={Clock}
                title="Expiring soon"
                value={expiringSoonCount.toLocaleString("en-US")}
                description="Within the next 7 days"
                bgColor="amber"
              />
              <StatsCard
                icon={XCircle}
                title="Expired"
                value={expiredCount.toLocaleString("en-US")}
                description="Past their valid until date"
                bgColor="red"
              />
            </div>

            {/* Coupon performance — last 30 days (hidden when no usage) */}
            {topCoupons.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-xl border bg-card shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold">Coupon performance</h3>
                    <p className="text-xs text-muted-foreground">
                      Last 30 days · discount given on orders that used them
                    </p>
                  </div>
                  <PillBadge tone="violet" className="font-medium tabular-nums">
                    Top {topCoupons.length} · {topCouponsTotalUses} uses
                  </PillBadge>
                </div>

                <div className="grid grid-cols-2 divide-x divide-y border-b sm:grid-cols-3 sm:divide-y-0">
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Uses
                    </p>
                    <p className="text-base font-bold tabular-nums">
                      {topCouponsTotalUses.toLocaleString("en-US")}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Discount given
                    </p>
                    <p className="text-base font-bold tabular-nums">
                      ৳{bare(topCouponsDiscount)}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Order value
                    </p>
                    <p className="text-base font-bold tabular-nums">
                      ৳{bare(topCouponsOrderValue)}
                    </p>
                  </div>
                </div>

                <div className="divide-y">
                  {topCoupons.map((coupon) => (
                    <div
                      key={coupon.couponCode}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <PillBadge tone="blue" className="font-mono">
                          {coupon.couponCode}
                        </PillBadge>
                        <span className="text-xs text-muted-foreground">
                          {coupon.uses.toLocaleString("en-US")} use
                          {coupon.uses === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm tabular-nums">
                        <span className="font-semibold">
                          ৳{bare(coupon.discountGiven)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          on ৳{bare(coupon.orderValue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coupons */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">All coupons</h3>
                  <p className="text-xs text-muted-foreground">
                    Amounts in ৳ · newest codes first
                  </p>
                </div>
                <PillBadge className="font-medium tabular-nums">
                  {filteredCoupons.length.toLocaleString("en-US")} of{" "}
                  {coupons.length.toLocaleString("en-US")}
                </PillBadge>
              </div>

              {filteredCoupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <TicketPercent className="size-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">No coupons found</p>
                    <p className="text-xs text-muted-foreground">
                      No coupons match these filters. Try a different code or
                      status.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table className="report-table min-w-190">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="pl-4">Code</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Min. order</TableHead>
                          <TableHead>Valid period</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="pr-4 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCoupons.map((coupon) => {
                          const status = statusOf(coupon);
                          const usagePercent =
                            coupon.maxUsage > 0
                              ? Math.min(
                                  100,
                                  (coupon.timesUsed / coupon.maxUsage) * 100
                                )
                              : 0;

                          return (
                            <TableRow key={coupon.id}>
                              <TableCell className="py-2.5 pl-4">
                                <PillBadge tone="blue" className="font-mono">
                                  {coupon.code}
                                </PillBadge>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm font-semibold tabular-nums">
                                  {discountLabel(coupon)}
                                </span>
                                {coupon.maxDiscountAmount ? (
                                  <p className="text-[11px] text-muted-foreground">
                                    Max ৳{bare(coupon.maxDiscountAmount)}
                                  </p>
                                ) : null}
                              </TableCell>

                              <TableCell>
                                <span className="flex items-center gap-1.5 text-sm tabular-nums">
                                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                  {coupon.timesUsed} / {coupon.maxUsage || "∞"}
                                </span>
                                {coupon.maxUsage > 0 && (
                                  <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={cn(
                                        "h-full rounded-full",
                                        usagePercent >= 100
                                          ? "bg-red-500"
                                          : "bg-emerald-500"
                                      )}
                                      style={{ width: `${usagePercent}%` }}
                                    />
                                  </div>
                                )}
                              </TableCell>

                              <TableCell className="text-muted-foreground">
                                {coupon.minOrderAmount
                                  ? bare(coupon.minOrderAmount)
                                  : "No minimum"}
                              </TableCell>

                              <TableCell className="text-muted-foreground">
                                <p className="text-xs tabular-nums">
                                  {formatDateTime(coupon.validFrom)}
                                </p>
                                <p className="text-[11px] tabular-nums">
                                  → {formatDateTime(coupon.validUntil)}
                                </p>
                              </TableCell>

                              <TableCell>
                                <PillBadge tone={STATUS_META[status].tone}>
                                  {STATUS_META[status].label}
                                </PillBadge>
                              </TableCell>

                              <TableCell className="pr-4 text-right">
                                {renderActions(coupon)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y md:hidden">
                    {filteredCoupons.map((coupon) => {
                      const status = statusOf(coupon);
                      return (
                        <article key={coupon.id} className="space-y-3 p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <PillBadge tone="blue" className="font-mono">
                                {coupon.code}
                              </PillBadge>
                              <p className="mt-1.5 text-sm font-semibold tabular-nums">
                                {discountLabel(coupon)}
                                {coupon.maxDiscountAmount ? (
                                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                                    max ৳{bare(coupon.maxDiscountAmount)}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <PillBadge tone={STATUS_META[status].tone}>
                                {STATUS_META[status].label}
                              </PillBadge>
                              {renderActions(coupon)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Used
                              </p>
                              <p className="text-sm font-semibold tabular-nums">
                                {coupon.timesUsed} / {coupon.maxUsage || "∞"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Min. order
                              </p>
                              <p className="text-sm font-semibold tabular-nums">
                                {coupon.minOrderAmount
                                  ? `৳${bare(coupon.minOrderAmount)}`
                                  : "None"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Valid
                              </p>
                              <p className="text-xs">
                                {formatDateTime(coupon.validFrom)} →{" "}
                                {formatDateTime(coupon.validUntil)}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Footer: what the list covers */}
                  <div className="border-t px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredCoupons.length.toLocaleString("en-US")} of{" "}
                      {coupons.length.toLocaleString("en-US")} coupon
                      {coupons.length === 1 ? "" : "s"}
                      {hasFilters && " matching the current filters"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        defaultToast={false}
      />
    </>
  );
}
