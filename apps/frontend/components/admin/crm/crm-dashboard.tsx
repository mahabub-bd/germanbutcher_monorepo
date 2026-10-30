"use client";

import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { PillBadge } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDateTime, formatCurrencyEnglish } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Crown,
  ListTodo,
  MapPin,
  RefreshCw,
  ShoppingCart,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

interface DashCustomer {
  id: number;
  name: string;
  email: string;
  mobileNumber: string | null;
  area: string | null;
  rfm: {
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderAt: string | null;
  };
  segment: string;
}

interface DashboardData {
  totalCustomers: number;
  newCustomers: number;
  segments: Record<string, number>;
  abandonedCarts: { count: number; totalValue: number };
  tasks: { open: number; overdue: number };
  activitiesLast7Days: number;
  topCustomers: DashCustomer[];
  /** Highest lifetime spender inside the champions segment, if any. */
  topChampion: DashCustomer | null;
}

/** Canonical RFM order — health descending, churn risk ascending. */
const SEGMENT_ORDER = [
  "champions",
  "vip",
  "loyal",
  "promising",
  "new",
  "about_to_sleep",
  "at_risk",
  "lost",
  "inactive",
] as const;

type SegmentKey = (typeof SEGMENT_ORDER)[number];

/** Share-bar accent per segment, tuned to the badge hues. */
const SEGMENT_BAR: Record<string, string> = {
  champions: "bg-amber-500",
  vip: "bg-purple-500",
  loyal: "bg-green-500",
  promising: "bg-sky-500",
  new: "bg-blue-500",
  about_to_sleep: "bg-yellow-500",
  at_risk: "bg-orange-500",
  lost: "bg-red-500",
  inactive: "bg-slate-400",
};

// Medal-tinted initials for the top three rows of the VIP table.
const TOP_RANK_STYLES: Record<number, string> = {
  0: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  1: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  2: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const formatMoney = (value: number) => `৳${formatCurrencyEnglish(value, 0)}`;
const formatCount = (value: number) => value.toLocaleString("en-US");
const percentOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;
const dateOnly = (value: string | null) =>
  value ? formatDateTime(value).split(",")[0] : "—";

export function CrmDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (background = false) => {
    if (background) setIsRefreshing(true);
    try {
      const res = await fetchProtectedData<DashboardData>("crm/dashboard");
      setStats(res);
    } catch {
      toast.error("Failed to load the CRM dashboard.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pageHeader = (
    <PageHeader
      title="CRM dashboard"
      titleIcon={<Users className="size-6 text-primaryColor" />}
      description="Customer health, lifetime value and follow-ups in one view."
      actionLabel="All customers"
      actionHref="/admin/crm/customers"
      actionIcon={<ArrowRight className="mr-2 size-4" />}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={isRefreshing}
        onClick={() => load(true)}
      >
        <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </PageHeader>
  );

  if (isLoading) {
    return <LoadingIndicator message="Loading CRM dashboard..." />;
  }

  if (!stats) {
    return (
      <div className="w-full">
        {pageHeader}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <AlertTriangle className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Could not load the dashboard</p>
            <p className="text-xs text-muted-foreground">
              Check the backend connection, then try again.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={() => load(true)}
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const champion = stats.topChampion;
  const totalCustomers = stats.totalCustomers || 0;
  const newShare = percentOf(stats.newCustomers, totalCustomers);

  const segmentRows = Object.entries(stats.segments ?? {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => {
      const ai = SEGMENT_ORDER.indexOf(a[0] as SegmentKey);
      const bi = SEGMENT_ORDER.indexOf(b[0] as SegmentKey);
      if (ai !== bi) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return b[1] - a[1];
    });

  const vipRows = stats.topCustomers ?? [];
  const vipOrders = vipRows.reduce((sum, c) => sum + (c.rfm?.orderCount ?? 0), 0);
  const vipSpend = vipRows.reduce((sum, c) => sum + (c.rfm?.totalSpent ?? 0), 0);

  const attention = [
    {
      href: "/admin/crm/tasks?status=open&overdue=true",
      icon: AlertTriangle,
      label: "Overdue tasks",
      meta: "Past their due date",
      value: stats.tasks.overdue,
      chip: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
    },
    {
      href: "/admin/crm/tasks",
      icon: ListTodo,
      label: "Open tasks",
      meta: "Awaiting follow-up",
      value: stats.tasks.open,
      chip: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    },
    {
      href: "/admin/analytics/abandoned-carts",
      icon: ShoppingCart,
      label: "Abandoned carts",
      meta: `${formatMoney(stats.abandonedCarts.totalValue)} value at risk`,
      value: stats.abandonedCarts.count,
      chip: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    },
    {
      href: "/admin/crm/activities",
      icon: Activity,
      label: "Activities",
      meta: "Logged in the last 7 days",
      value: stats.activitiesLast7Days,
      chip: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    },
  ];

  return (
    <div className="w-full">
      {pageHeader}

      {/* Headline numbers */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/admin/crm/customers" className="block">
          <StatsCard
            title="Total customers"
            value={formatCount(totalCustomers)}
            description="Every registered customer"
            icon={Users}
            bgColor="blue"
          />
        </Link>
        <StatsCard
          title="New (30 days)"
          value={formatCount(stats.newCustomers)}
          description={`${newShare}% of all customers`}
          icon={UserPlus}
          bgColor="green"
        />
        <Link href="/admin/analytics/abandoned-carts" className="block">
          <StatsCard
            title="Abandoned carts"
            value={formatCount(stats.abandonedCarts.count)}
            description={`${formatMoney(stats.abandonedCarts.totalValue)} not recovered`}
            icon={ShoppingCart}
            bgColor="orange"
          />
        </Link>
        <Link href="/admin/crm/tasks" className="block">
          <StatsCard
            title="Open tasks"
            value={formatCount(stats.tasks.open)}
            description={`${formatCount(stats.tasks.overdue)} already overdue`}
            icon={ListTodo}
            bgColor="purple"
          />
        </Link>
      </div>

      {/* Spotlight + action queue */}
      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        {champion ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Crown className="size-4 text-amber-500" />
                  Top champion
                  <PillBadge tone="amber">#1 spender</PillBadge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Highest lifetime spend among champions
                </p>
              </div>
              <Link
                href="/admin/crm/customers?segment=champions"
                className="text-xs whitespace-nowrap text-primaryColor hover:underline"
              >
                View champions
              </Link>
            </div>

            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {champion.name?.charAt(0) || "?"}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/crm/customers/${champion.id}`}
                      className="truncate text-base font-semibold hover:text-primaryColor hover:underline"
                    >
                      {champion.name}
                    </Link>
                    <SegmentBadge segment={champion.segment} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {champion.mobileNumber && (
                      <Link
                        href={`tel:${champion.mobileNumber}`}
                        className="hover:underline"
                      >
                        {champion.mobileNumber}
                      </Link>
                    )}
                    {champion.email && (
                      <span className="max-w-56 truncate">{champion.email}</span>
                    )}
                    {champion.area && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {champion.area}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  {
                    label: "Lifetime spend",
                    value: formatMoney(champion.rfm.totalSpent),
                    highlight: true,
                  },
                  {
                    label: "Orders",
                    value: formatCount(champion.rfm.orderCount),
                  },
                  {
                    label: "Avg order",
                    value: formatMoney(champion.rfm.averageOrderValue),
                  },
                  {
                    label: "Last order",
                    value: dateOnly(champion.rfm.lastOrderAt),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      {stat.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-sm font-semibold tabular-nums",
                        stat.highlight && "text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card px-6 py-10 text-center xl:col-span-2">
            <div className="rounded-full bg-muted p-3">
              <Crown className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">No champions yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Customers reach the champions segment after repeat recent orders
              with high lifetime spend.
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-orange-500" />
                Needs attention
              </h3>
              <p className="text-xs text-muted-foreground">
                Follow-ups worth clearing today
              </p>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {attention.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    item.chip
                  )}
                >
                  <item.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.meta}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {formatCount(item.value)}
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Segment distribution */}
      <div className="mb-4 overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Customer segments</h3>
            <p className="text-xs text-muted-foreground">
              RFM distribution · select a segment to open the filtered list
            </p>
          </div>
          <PillBadge className="font-medium tabular-nums">
            {segmentRows.length} segment{segmentRows.length === 1 ? "" : "s"}
          </PillBadge>
        </div>

        {segmentRows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No customers have been segmented yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {segmentRows.map(([segment, count]) => {
              const share = percentOf(count, totalCustomers);
              return (
                <Link
                  key={segment}
                  href={`/admin/crm/customers?segment=${segment}`}
                  className="rounded-lg border px-3 py-2.5 transition-colors hover:border-primaryColor/40 hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <SegmentBadge segment={segment} />
                    <span className="text-sm font-bold tabular-nums">
                      {formatCount(count)}
                    </span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        SEGMENT_BAR[segment] ?? "bg-slate-400"
                      )}
                      style={{ width: `${Math.max(share, 2)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                    {share}% of customers
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Top VIP customers */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="size-4 text-primaryColor" />
              Top VIP customers
            </h3>
            <p className="text-xs text-muted-foreground">
              Ranked by lifetime spend · delivered orders only
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PillBadge className="font-medium tabular-nums">
              {vipRows.length} customer{vipRows.length === 1 ? "" : "s"}
            </PillBadge>
            <Link
              href="/admin/crm/customers"
              className="text-xs whitespace-nowrap text-primaryColor hover:underline"
            >
              View all
            </Link>
          </div>
        </div>

        {vipRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
            <div className="rounded-full bg-muted p-3">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold">No customer spend yet</p>
            <p className="text-xs text-muted-foreground">
              Delivered orders will populate this ranking automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Customer</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total spent</TableHead>
                    <TableHead className="pr-4">Last order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vipRows.map((customer, index) => (
                    <TableRow key={customer.id}>
                      <TableCell className="py-2.5 pl-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
                              TOP_RANK_STYLES[index] ??
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            {customer.name?.charAt(0) || "?"}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/crm/customers/${customer.id}`}
                              className="block max-w-44 truncate text-sm font-semibold hover:text-primaryColor hover:underline"
                              title={customer.name}
                            >
                              {customer.name}
                            </Link>
                            {customer.email && (
                              <p className="max-w-44 truncate text-[11px] text-muted-foreground">
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.mobileNumber ? (
                          <Link
                            href={`tel:${customer.mobileNumber}`}
                            className="text-sm text-muted-foreground hover:underline"
                          >
                            {customer.mobileNumber}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <SegmentBadge segment={customer.segment} />
                      </TableCell>
                      <TableCell>
                        {customer.area ? (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="max-w-32 truncate">
                              {customer.area}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCount(customer.rfm.orderCount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatMoney(customer.rfm.totalSpent)}
                        </span>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          avg {formatMoney(customer.rfm.averageOrderValue)}
                        </p>
                      </TableCell>
                      <TableCell className="pr-4">
                        <span className="text-sm">
                          {dateOnly(customer.rfm.lastOrderAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Total
                    </TableCell>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCount(vipOrders)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {formatMoney(vipSpend)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4">
                      <span className="text-xs text-muted-foreground">
                        Top {vipRows.length}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {vipRows.map((customer, index) => (
                <div key={customer.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase",
                          TOP_RANK_STYLES[index] ??
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {customer.name?.charAt(0) || "?"}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/crm/customers/${customer.id}`}
                          className="block truncate text-sm font-semibold hover:text-primaryColor hover:underline"
                        >
                          {customer.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.mobileNumber || customer.email || "No contact"}
                        </p>
                      </div>
                    </div>
                    <SegmentBadge segment={customer.segment} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      {
                        label: "Orders",
                        value: formatCount(customer.rfm.orderCount),
                      },
                      {
                        label: "Total spent",
                        value: formatMoney(customer.rfm.totalSpent),
                      },
                      {
                        label: "Last order",
                        value: dateOnly(customer.rfm.lastOrderAt),
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border bg-muted/30 px-2.5 py-2"
                      >
                        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                          {stat.label}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {customer.area && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      {customer.area}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
