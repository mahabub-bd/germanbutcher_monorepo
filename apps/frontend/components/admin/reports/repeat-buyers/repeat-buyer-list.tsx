"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import {
  ReportExcelButton,
  dateRangeSubtitle,
} from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import {
  ReportDateFilters,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
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
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { Percent, Repeat, ShoppingBag, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface CustomerRow {
  id: number;
  name: string;
  mobileNumber: string;
  orders: number;
  spend: number;
  firstOrder: string;
  lastOrder: string;
  hadPriorOrders: boolean;
}

interface Summary {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  totalSpend: number;
  avgOrdersPerCustomer: number;
}

interface RepeatBuyerListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  customers: CustomerRow[];
}

/** Whole amounts only — report values never need decimal places. */
const bare = (value: number) => formatCurrencyEnglish(value || 0, 0);
/** Cards carry the ৳ mark; desktop cells rely on the header note instead. */
const amount = (value: number) => `৳${bare(value)}`;
/** @react-pdf's built-in fonts have no ৳ glyph, so exports use "BDT ". */
const formatMoney = (value: number) =>
  `BDT ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export default function RepeatBuyerList({
  fromDate,
  toDate,
  preset,
  summary,
  customers,
}: RepeatBuyerListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);

    // An empty filter set means "clear".
    if (!qs.toString()) {
      startTransition(() => router.push("?"));
      return;
    }

    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = customers.length > 0;

  const totals = customers.reduce(
    (acc, c) => ({
      orders: acc.orders + c.orders,
      spend: acc.spend + c.spend,
    }),
    { orders: 0, spend: 0 }
  );

  const exportRows: (string | number)[][] = customers.map((c) => [
    c.name,
    c.mobileNumber,
    c.hadPriorOrders || c.orders > 1 ? "Returning" : "New",
    c.orders,
    formatMoney(c.spend),
    c.firstOrder ? formatDateTime(c.firstOrder) : "-",
    c.lastOrder ? formatDateTime(c.lastOrder) : "-",
  ]);

  const pdfSummary = [
    {
      label: "Total Customers",
      value: (summary?.totalCustomers ?? 0).toLocaleString("en-US"),
    },
    { label: "New Customers", value: (summary?.newCustomers ?? 0).toLocaleString("en-US") },
    { label: "Returning Customers", value: (summary?.repeatCustomers ?? 0).toLocaleString("en-US") },
    { label: "Repeat Rate", value: `${summary?.repeatRate ?? 0}%` },
    { label: "Total Spend", value: formatMoney(summary?.totalSpend ?? 0) },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Repeat Buyer Report"
        description={`Customers with more than one order in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Repeat Buyer Report"
              subtitle={rangeLabel}
              headers={[
                "Customer",
                "Mobile",
                "Type",
                "Orders",
                "Total Spend",
                "First Order",
                "Last Order",
              ]}
              rows={exportRows}
              summary={pdfSummary}
              fileName="repeat-buyer-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Repeat Buyer Report"
                  headers={[
                    "Customer",
                    "Mobile",
                    "Type",
                    "Orders",
                    "Total Spend",
                    "First Order",
                    "Last Order",
                  ]}
                  flexes={[1.5, 1.2, 0.9, 0.7, 1.1, 1.2, 1.2]}
                  alignRight={[3, 4]}
                  rows={exportRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`repeat-buyer-report-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            />
          </>
        )}
      </PageHeader>

      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        onApply={handleFilterApply}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No customers matched</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range or pick another quick range.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startTransition(() => router.push("?preset=this_year"))}
          >
            Search this year
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatsCard
              icon={Users}
              title="Customers"
              value={(summary?.totalCustomers ?? 0).toLocaleString("en-US")}
              description={`Customers who ordered in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="blue"
            />
            <StatsCard
              icon={UserPlus}
              title="New"
              value={(summary?.newCustomers ?? 0).toLocaleString("en-US")}
              description="First order in this range"
              bgColor="green"
            />
            <StatsCard
              icon={Repeat}
              title="Returning"
              value={(summary?.repeatCustomers ?? 0).toLocaleString("en-US")}
              description="Ordered more than once"
              bgColor="purple"
            />
            <StatsCard
              icon={Percent}
              title="Repeat rate"
              value={`${summary?.repeatRate ?? 0}%`}
              description="Returning share of customers"
              bgColor="orange"
            />
            <StatsCard
              icon={ShoppingBag}
              title="Avg orders"
              value={String(summary?.avgOrdersPerCustomer ?? 0)}
              description={`Orders per customer · ${amount(summary?.totalSpend ?? 0)} spent`}
              bgColor="teal"
            />
          </div>

          {/* Customers */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Customers</h3>
                <p className="text-xs text-muted-foreground">
                  Spend in ৳ · newest customers first
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {customers.length} customer{customers.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table: one row per customer */}
            <div className="hidden md:block">
              <Table className="report-table table-fixed [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[30%] pl-4">Customer</TableHead>
                    <TableHead className="w-[12%]">Type</TableHead>
                    <TableHead className="w-[10%] text-center">Orders</TableHead>
                    <TableHead className="w-[14%] text-center">Spend</TableHead>
                    <TableHead className="w-[16%]">First Order</TableHead>
                    <TableHead className="w-[18%] pr-4">Last Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => {
                    const returning = c.hadPriorOrders || c.orders > 1;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="py-2 pl-4">
                          <span className="text-sm font-medium">{c.name}</span>
                          {c.mobileNumber && (
                            <a
                              href={`tel:${c.mobileNumber}`}
                              className="block text-xs text-muted-foreground hover:text-foreground"
                            >
                              {c.mobileNumber}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <PillBadge tone={returning ? "amber" : "emerald"}>
                            {returning ? "Returning" : "New"}
                          </PillBadge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-semibold tabular-nums">
                            {c.orders.toLocaleString("en-US")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-semibold tabular-nums">
                            {bare(c.spend)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {c.firstOrder ? formatDateTime(c.firstOrder) : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4">
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {c.lastOrder ? formatDateTime(c.lastOrder) : "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-center">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.orders.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totals.spend)}
                      </span>
                    </TableCell>
                    <TableCell />
                    <TableCell className="pr-4" />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards: one card per customer */}
            <div className="divide-y md:hidden">
              {customers.map((c) => {
                const returning = c.hadPriorOrders || c.orders > 1;
                return (
                  <article key={c.id} className="space-y-3 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.name}</p>
                        {c.mobileNumber && (
                          <a
                            href={`tel:${c.mobileNumber}`}
                            className="text-xs text-muted-foreground"
                          >
                            {c.mobileNumber}
                          </a>
                        )}
                      </div>
                      <PillBadge tone={returning ? "amber" : "emerald"} className="shrink-0">
                        {returning ? "Returning" : "New"}
                      </PillBadge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Orders
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {c.orders.toLocaleString("en-US")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Spend
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {amount(c.spend)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Last order
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {c.lastOrder ? formatDateTime(c.lastOrder) : "-"}
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
                Showing {customers.length} customer
                {customers.length === 1 ? "" : "s"} in this range
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
