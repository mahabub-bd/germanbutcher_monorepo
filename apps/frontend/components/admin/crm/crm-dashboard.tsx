"use client";

import type React from "react";

import {
  SEGMENT_LABELS,
  SegmentBadge,
} from "@/components/admin/crm/segment-badge";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { PillBadge } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Crown,
  ListTodo,
  MapPin,
  Megaphone,
  RefreshCw,
  SearchX,
  ShoppingCart,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  /** Top champions by lifetime spend (up to 3), highest first. */
  topChampions?: DashCustomer[];
  /** Legacy single champion — kept as a fallback for older payloads. */
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

/**
 * Health roll-up of the RFM segments — reads left-to-right off the same
 * SEGMENT_ORDER, so the stacked bar and the legend always agree.
 */
const HEALTH_GROUPS: {
  label: string;
  dot: string;
  segments: SegmentKey[];
}[] = [
    {
      label: "Healthy",
      dot: "bg-emerald-500",
      segments: ["champions", "vip", "loyal"],
    },
    {
      label: "Growing",
      dot: "bg-sky-500",
      segments: ["promising", "new"],
    },
    {
      label: "Cooling",
      dot: "bg-amber-500",
      segments: ["about_to_sleep", "inactive"],
    },
    {
      label: "At risk",
      dot: "bg-red-500",
      segments: ["at_risk", "lost"],
    },
  ];

// Medal-tinted markers for the top three ranks (VIP table initials, the
// champion spotlight's rank numbers).
const TOP_RANK_STYLES: Record<number, string> = {
  0: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  1: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  2: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

// Shared keyboard-focus affordance for the clickable cards / links below —
// outline follows each element's own border radius, so no radius needed here.
const FOCUS_CLASS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryColor/60";

const formatMoney = (value: number) => `৳${formatCurrencyEnglish(value, 0)}`;
const formatCount = (value: number) => value.toLocaleString("en-US");
const percentOf = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;
const dateOnly = (value: string | null) =>
  value ? formatDateTime(value).split(",")[0] : "—";

/** KPI card wrapper: whole card is a link, with a hover chevron. */
function KpiCard({
  href,
  title,
  value,
  description,
  icon,
  bgColor,
}: {
  href: string;
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: "blue" | "green" | "orange" | "purple";
}) {
  return (
    <Link href={href} className={cn("group block", FOCUS_CLASS)}>
      <div className="relative h-full">
        <StatsCard
          title={title}
          value={value}
          description={description}
          icon={icon}
          bgColor={bgColor}
          className="h-full"
        />
        <ChevronRight className="pointer-events-none absolute right-2.5 bottom-3 size-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

/** Layout-matched skeleton — avoids the full-page spinner swap. */
function DashboardSkeleton() {
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <Skeleton className="h-56 rounded-xl xl:col-span-2" />
        <Skeleton className="h-56 rounded-xl" />
      </div>

      <Skeleton className="mb-4 h-44 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function CrmDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchProtectedData<DashboardData>("crm/dashboard");
      setStats(res);
      setFailed(false);
    } catch {
      toast.error("Failed to load the CRM dashboard.");
      setFailed(true);
    } finally {
      setIsLoading(false);
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
    />
  );

  if (isLoading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <div className="w-full">
        {pageHeader}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <AlertTriangle className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Could not load the dashboard
            </p>
            <p className="text-xs text-muted-foreground">
              {failed
                ? "Check the backend connection, then try again."
                : "No dashboard data came back — try again."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="mr-1.5 size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const champions =
    stats.topChampions && stats.topChampions.length > 0
      ? stats.topChampions
      : stats.topChampion
        ? [stats.topChampion]
        : [];
  const totalCustomers = stats.totalCustomers || 0;
  const newShare = percentOf(stats.newCustomers, totalCustomers);

  const countOf = (segment: string) => stats.segments?.[segment] ?? 0;

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

  // Same rows as the grid below, so the bar never disagrees with the detail.
  const barSegments = segmentRows.map(([segment]) => segment);

  const vipRows = stats.topCustomers ?? [];
  const vipOrders = vipRows.reduce(
    (sum, c) => sum + (c.rfm?.orderCount ?? 0),
    0,
  );
  const vipSpend = vipRows.reduce(
    (sum, c) => sum + (c.rfm?.totalSpent ?? 0),
    0,
  );

  const attention = [
    {
      href: "/admin/crm/tasks?status=open&overdue=true",
      icon: AlertTriangle,
      label: "Overdue tasks",
      meta: "Past their due date",
      value: stats.tasks.overdue,
      chip: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
      urgent: true,
    },
    {
      href: "/admin/crm/tasks",
      icon: ListTodo,
      label: "Open tasks",
      meta: "Awaiting follow-up",
      value: stats.tasks.open,
      chip: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      urgent: false,
    },
    {
      href: "/admin/crm/abandoned-carts",
      icon: ShoppingCart,
      label: "Abandoned carts",
      meta: `${formatMoney(stats.abandonedCarts.totalValue)} value at risk`,
      value: stats.abandonedCarts.count,
      chip: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
      urgent: false,
    },
    {
      href: "/admin/crm/activities",
      icon: Activity,
      label: "Activities",
      meta: "Logged in the last 7 days",
      value: stats.activitiesLast7Days,
      chip: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
      urgent: false,
    },
  ];

  // Nothing segmented yet — the rest of the page would only be empty shells.
  if (totalCustomers === 0) {
    return (
      <div className="w-full">
        {pageHeader}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-20 text-center">
          <div className="rounded-full bg-muted p-3">
            <SearchX className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No customers yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              RFM segments, lifetime value and follow-ups appear here once
              customers start placing orders.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/crm/customers">
                <Users className="mr-1.5 size-4" />
                Customer list
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/crm/campaigns">
                <Megaphone className="mr-1.5 size-4" />
                Create a campaign
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {pageHeader}

      <>
        {/* Headline numbers */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            href="/admin/crm/customers"
            title="Total customers"
            value={formatCount(totalCustomers)}
            description={`${segmentRows.length} active segment${segmentRows.length === 1 ? "" : "s"}`}
            icon={Users}
            bgColor="blue"
          />
          <KpiCard
            href="/admin/crm/customers?segment=new"
            title="New (30 days)"
            value={formatCount(stats.newCustomers)}
            description={`${newShare}% of all customers`}
            icon={UserPlus}
            bgColor="green"
          />
          <KpiCard
            href="/admin/crm/abandoned-carts"
            title="Abandoned carts"
            value={formatCount(stats.abandonedCarts.count)}
            description={`${formatMoney(stats.abandonedCarts.totalValue)} not recovered`}
            icon={ShoppingCart}
            bgColor="orange"
          />
          <KpiCard
            href="/admin/crm/tasks"
            title="Open tasks"
            value={formatCount(stats.tasks.open)}
            description={
              stats.tasks.overdue > 0
                ? `${formatCount(stats.tasks.overdue)} already overdue`
                : "Nothing overdue"
            }
            icon={ListTodo}
            bgColor="purple"
          />
        </div>

        {/* Spotlight + action queue */}
        <div className="mb-4 grid gap-3 xl:grid-cols-3">
          {champions.length > 0 ? (
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-linear-to-r from-amber-50/80 to-transparent px-4 py-3 dark:from-amber-950/20">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Crown className="size-4 text-amber-500" />
                    Top champions
                    <PillBadge tone="amber">Top {champions.length}</PillBadge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ranked by lifetime spend among champions
                  </p>
                </div>
                <Link
                  href="/admin/crm/customers?segment=champions"
                  className={cn(
                    "text-xs whitespace-nowrap text-primaryColor hover:underline",
                    FOCUS_CLASS,
                  )}
                >
                  View champions
                </Link>
              </div>

              <div className="divide-y">
                {champions.map((customer, index) => (
                  <div
                    key={customer.id}
                    className={cn(
                      "flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between",
                      index === 0 &&
                      "bg-linear-to-r from-amber-50/60 to-transparent dark:from-amber-950/15",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                          TOP_RANK_STYLES[index] ??
                          "bg-muted text-muted-foreground",
                        )}
                        title={`Rank ${index + 1}`}
                      >
                        {index === 0 ? <Crown className="size-4" /> : index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/crm/customers/${customer.id}`}
                            className={cn(
                              "max-w-48 truncate text-sm font-semibold hover:text-primaryColor hover:underline",
                              FOCUS_CLASS,
                            )}
                            title={customer.name}
                          >
                            {customer.name}
                          </Link>
                          <SegmentBadge segment={customer.segment} />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          {customer.mobileNumber && (
                            <Link
                              href={`tel:${customer.mobileNumber}`}
                              className="hover:underline"
                            >
                              {customer.mobileNumber}
                            </Link>
                          )}
                          {customer.area && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 shrink-0" />
                              <span className="max-w-32 truncate">
                                {customer.area}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-3 gap-2">
                      {[
                        {
                          label: "Lifetime spend",
                          value: formatMoney(customer.rfm.totalSpent),
                          highlight: true,
                        },
                        {
                          label: "Orders",
                          value: formatCount(customer.rfm.orderCount),
                        },
                        {
                          label: "Last order",
                          value: dateOnly(customer.rfm.lastOrderAt),
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg border bg-muted/30 px-2.5 py-1.5"
                        >
                          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase whitespace-nowrap">
                            {stat.label}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 text-sm font-semibold tabular-nums",
                              stat.highlight &&
                              "text-amber-700 dark:text-amber-400",
                            )}
                          >
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
              <Button asChild size="sm" variant="outline" className="mt-1">
                <Link href="/admin/crm/customers?segment=promising">
                  <Trophy className="mr-1.5 size-4" />
                  Find near-miss customers
                </Link>
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="border-b px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-orange-500" />
                Needs attention
                {stats.tasks.overdue > 0 && (
                  <span
                    className="relative flex size-2"
                    title="Overdue items exist"
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Follow-ups worth clearing today
              </p>
            </div>
            <div className="space-y-2 p-3">
              {attention.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primaryColor/40 hover:bg-muted/50",
                    FOCUS_CLASS,
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      item.chip,
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
                  <span
                    className={cn(
                      "text-base font-bold tabular-nums",
                      item.value === 0 && "text-muted-foreground/60",
                      item.urgent &&
                      item.value > 0 &&
                      "text-orange-600 dark:text-orange-400",
                    )}
                  >
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
            <div className="p-4">
              {/* One read-off bar + health roll-up, so the mix is legible at a
                  glance before the per-segment detail. */}
              <div className="mb-4">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  {barSegments.map((segment) => (
                    <Link
                      key={segment}
                      href={`/admin/crm/customers?segment=${segment}`}
                      title={`${SEGMENT_LABELS[segment] ?? segment} — ${formatCount(countOf(segment))} (${percentOf(countOf(segment), totalCustomers)}%)`}
                      className={cn(
                        "h-full min-w-0.75 border-r border-background/60 transition-opacity last:border-r-0 hover:opacity-70",
                        SEGMENT_BAR[segment] ?? "bg-slate-400",
                      )}
                      style={{
                        width: `${(countOf(segment) / totalCustomers) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {HEALTH_GROUPS.map((group) => {
                    const count = group.segments.reduce(
                      (sum, s) => sum + countOf(s),
                      0,
                    );
                    return (
                      <span
                        key={group.label}
                        className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-muted-foreground"
                        title={group.segments
                          .map(
                            (s) =>
                              `${SEGMENT_LABELS[s] ?? s}: ${formatCount(countOf(s))}`,
                          )
                          .join(" · ")}
                      >
                        <span
                          className={cn("size-2 rounded-full", group.dot)}
                        />
                        <span className="font-medium text-foreground">
                          {group.label}
                        </span>
                        <span className="tabular-nums">
                          {formatCount(count)} ·{" "}
                          {percentOf(count, totalCustomers)}%
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {segmentRows.map(([segment, count]) => {
                  const share = percentOf(count, totalCustomers);
                  return (
                    <Link
                      key={segment}
                      href={`/admin/crm/customers?segment=${segment}`}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 transition-colors hover:border-primaryColor/40 hover:bg-muted/40",
                        FOCUS_CLASS,
                      )}
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
                            SEGMENT_BAR[segment] ?? "bg-slate-400",
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
            </div>
          )}
        </div>

        {/* Top VIP customers */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="size-4 text-primaryColor" />
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
                href="/admin/crm/customers?sortBy=total_spent"
                className={cn(
                  "text-xs whitespace-nowrap text-primaryColor hover:underline",
                  FOCUS_CLASS,
                )}
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
              {/* Desktop table — table-fixed with columns that total 100%
                  and give the content-bearing columns (customer, area) the
                  flexible share, so the table fills the card edge to edge
                  instead of leaving dead space on the right. */}
              <div className="hidden md:block">
                <Table className="table-fixed w-full [&_td]:text-sm [&_th]:text-sm">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[6%] pl-4 text-right">
                        #
                      </TableHead>
                      <TableHead className="w-[24%]">Customer</TableHead>
                      <TableHead className="w-[13%]">Mobile</TableHead>
                      <TableHead className="w-[13%]">Segment</TableHead>
                      <TableHead className="w-[14%]">Area</TableHead>
                      <TableHead className="w-[9%] text-right">
                        Orders
                      </TableHead>
                      <TableHead className="w-[11%] text-right">
                        Total spent
                      </TableHead>
                      <TableHead className="w-[10%] pr-4">
                        Last order
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vipRows.map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell className="py-2 pl-4 text-right">
                          <span
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              index < 3
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
                                TOP_RANK_STYLES[index] ??
                                "bg-muted text-muted-foreground",
                              )}
                            >
                              {customer.name?.charAt(0) || "?"}
                            </span>
                            {/* Name and email share one line so every column
                                stays a single row high. */}
                            <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                              <Link
                                href={`/admin/crm/customers/${customer.id}`}
                                className={cn(
                                  "max-w-[60%] shrink-0 truncate text-sm font-semibold hover:text-primaryColor hover:underline",
                                  FOCUS_CLASS,
                                )}
                                title={customer.name}
                              >
                                {customer.name}
                              </Link>
                              {customer.email && (
                                <span
                                  className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground"
                                  title={customer.email}
                                >
                                  {customer.email}
                                </span>
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
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <SegmentBadge
                            segment={customer.segment}
                            className="max-w-full px-2 text-[10px]"
                          />
                        </TableCell>
                        <TableCell>
                          {customer.area ? (
                            <span
                              className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground"
                              title={customer.area}
                            >
                              <MapPin className="size-3 shrink-0" />
                              <span className="min-w-0 truncate">
                                {customer.area}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCount(customer.rfm.orderCount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className="text-sm font-semibold tabular-nums"
                            title={`Avg per order ${formatMoney(customer.rfm.averageOrderValue)}`}
                          >
                            {formatMoney(customer.rfm.totalSpent)}
                          </span>
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
                      <TableCell className="pl-4" />
                      <TableCell colSpan={4}>
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Total
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold tabular-nums">
                          {formatCount(vipOrders)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className="text-sm font-bold tabular-nums"
                          title={`Avg order ${formatMoney(vipOrders > 0 ? vipSpend / vipOrders : 0)}`}
                        >
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
                            "relative flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase",
                            TOP_RANK_STYLES[index] ??
                            "bg-muted text-muted-foreground",
                          )}
                        >
                          {customer.name?.charAt(0) || "?"}
                          <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border bg-background text-[9px] font-bold tabular-nums">
                            {index + 1}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/crm/customers/${customer.id}`}
                            className="block truncate text-sm font-semibold hover:text-primaryColor hover:underline"
                          >
                            {customer.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {customer.mobileNumber ||
                              customer.email ||
                              "No contact"}
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

                    <Link
                      href={`/admin/crm/customers/${customer.id}`}
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-primaryColor"
                    >
                      View profile
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </>
    </div>
  );
}
