"use client";

import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  MapPin,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

interface DashboardData {
  totalCustomers: number;
  newCustomers: number;
  segments: Record<string, number>;
  abandonedCarts: { count: number; totalValue: number };
  tasks: { open: number; overdue: number };
  activitiesLast7Days: number;
  topCustomers: Array<{
    id: number;
    name: string;
    email: string;
    mobileNumber: string | null;
    area: string | null;
    rfm: { orderCount: number; totalSpent: number; lastOrderAt: string | null };
    segment: string;
  }>;
}

// Medal-tinted initials for the top three rows of the VIP table.
const TOP_RANK_STYLES: Record<number, string> = {
  0: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  1: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  2: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export function CrmDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchProtectedData<DashboardData>("crm/dashboard");
        setStats(res);
      } catch {
        toast.error("Failed to load CRM dashboard.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return <LoadingIndicator message="Loading CRM dashboard..." />;
  }

  if (!stats) return null;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="CRM Dashboard"
        description="Segments, abandoned carts and follow-up tasks at a glance"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="All registered customers"
          bgColor="blue"
        />
        <StatsCard
          title="New (30 days)"
          value={stats.newCustomers}
          icon={CalendarClock}
          description="Joined this month"
          bgColor="green"
        />
        <StatsCard
          title="Abandoned Carts"
          value={stats.abandonedCarts.count}
          icon={ShoppingCart}
          description="Carts inactive 90+ days"
          bgColor="orange"
        />
        <StatsCard
          title="Open Tasks"
          value={stats.tasks.open}
          icon={ListTodo}
          description="Pending follow-ups"
          bgColor="purple"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Customer Segments
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.segments).map(([segment, count]) => (
              <Link
                key={segment}
                href={`/admin/crm/customers?segment=${segment}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50"
              >
                <SegmentBadge segment={segment} />
                <span className="text-sm font-semibold">{count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Attention Needed
          </h3>
          <div className="grid grid-cols-2 gap-2 lg:[&>div]:min-h-0 lg:[&>div]:p-2">
            <StatsCard
              title="Overdue tasks"
              value={stats.tasks.overdue}
              icon={AlertTriangle}
              description="Past due date"
              bgColor="orange"
            />
            <StatsCard
              title="Activities (7 days)"
              value={stats.activitiesLast7Days}
              icon={Activity}
              description="Notes, calls, emails"
              bgColor="blue"
            />
            <StatsCard
              title="Cart value at risk"
              value={stats.abandonedCarts.totalValue.toLocaleString()}
              icon={ShoppingCart}
              description="In abandoned carts"
              bgColor="red"
            />
            <Link
              href="/admin/analytics/abandoned-carts"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-white/3 px-3 text-sm font-medium text-primaryColor hover:bg-primaryColor/5 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" /> Review carts
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 pb-0 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> Top VIP Customers
          </h3>
          <Link
            href="/admin/crm/customers"
            className="text-xs text-primaryColor hover:underline whitespace-nowrap"
          >
            View All
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden lg:table-cell">Mobile</TableHead>
              <TableHead className="hidden sm:table-cell">Segment</TableHead>
              <TableHead className="hidden md:table-cell">Area</TableHead>

              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead className="hidden md:table-cell">Last Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.topCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No customers yet.
                </TableCell>
              </TableRow>
            ) : (
              stats.topCustomers.map((customer, index) => (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
                          TOP_RANK_STYLES[index] ??
                          "bg-muted text-muted-foreground"
                        )}
                      >
                        {customer.name?.charAt(0) || "?"}
                      </span>
                      <Link
                        href={`/admin/crm/customers/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {customer.mobileNumber ? (
                      <Link
                        href={`tel:${customer.mobileNumber}`}
                        className="text-sm hover:underline"
                      >
                        {customer.mobileNumber}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <SegmentBadge segment={customer.segment} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.area ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {customer.area}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>{customer.rfm.orderCount}</TableCell>
                  <TableCell>{customer.rfm.totalSpent.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.rfm.lastOrderAt
                      ? formatDateTime(customer.rfm.lastOrderAt)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
