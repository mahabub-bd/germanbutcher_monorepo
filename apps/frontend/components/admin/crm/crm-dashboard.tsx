"use client";

import { PageHeader } from "@/components/admin/page-header";
import { SegmentBadge } from "@/components/admin/crm/segment-badge";
import { StatusCard } from "@/components/admin/dashboard/status-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchData } from "@/utils/api-utils";
import { formatDateTime } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ListTodo,
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
    rfm: { orderCount: number; totalSpent: number; lastOrderAt: string | null };
    segment: string;
  }>;
}

const gradient =
  "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20";

export function CrmDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchData<{ data: DashboardData }>("crm/dashboard");
        setStats((res as any).data ?? (res as any));
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
        <StatusCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          href="/admin/crm/customers"
          color="text-blue-600 dark:text-blue-400"
          gradient={gradient}
        />
        <StatusCard
          title="New (30 days)"
          value={stats.newCustomers}
          icon={CalendarClock}
          href="/admin/crm/customers?segment=new"
          color="text-green-600 dark:text-green-400"
          gradient="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
        />
        <StatusCard
          title="Abandoned Carts"
          value={stats.abandonedCarts.count}
          icon={ShoppingCart}
          href="/admin/crm/abandoned-carts"
          color="text-orange-600 dark:text-orange-400"
          gradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
        />
        <StatusCard
          title="Open Tasks"
          value={stats.tasks.open}
          icon={ListTodo}
          href="/admin/crm/customers"
          color="text-purple-600 dark:text-purple-400"
          gradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
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
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border px-3 py-2">
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {stats.tasks.overdue}
              </div>
              <div className="text-muted-foreground">Overdue tasks</div>
            </div>
            <div className="rounded-md border px-3 py-2">
              <div className="text-lg font-semibold">
                {stats.activitiesLast7Days}
              </div>
              <div className="text-muted-foreground">
                Activities (7 days)
              </div>
            </div>
            <div className="rounded-md border px-3 py-2">
              <div className="text-lg font-semibold">
                {stats.abandonedCarts.totalValue.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Cart value at risk</div>
            </div>
            <div className="rounded-md border px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <Link
                href="/admin/crm/abandoned-carts"
                className="text-sm hover:underline"
              >
                Review carts
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> Top VIP Customers
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead className="hidden md:table-cell">Last Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.topCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No customers yet.
                </TableCell>
              </TableRow>
            ) : (
              stats.topCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/admin/crm/customers/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.name}
                    </Link>
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
