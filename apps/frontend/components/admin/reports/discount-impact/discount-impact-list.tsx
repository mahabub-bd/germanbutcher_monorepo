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
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  BadgePercent,
  Percent,
  ShoppingBag,
  Tag,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface DayRow {
  date: string;
  orders: number;
  discountedOrders: number;
  discountAmount: number;
  orderValue: number;
  couponAmount: number;
  couponUses: number;
  bogoAmount: number;
  bogoUses: number;
  flashAmount: number;
  flashUses: number;
  discountSharePct: number;
}

interface Summary {
  totalOrders: number;
  discountedOrders: number;
  totalDiscount: number;
  totalOrderValue: number;
  totalCouponAmount: number;
  totalCouponUses: number;
  totalBogoAmount: number;
  totalBogoUses: number;
  totalFlashAmount: number;
  totalFlashUses: number;
  discountSharePct: number;
}

interface DiscountImpactListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  days: DayRow[];
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

/** yyyy-mm-dd → "01 Nov 2025" without pulling a date library into the row map. */
const prettyDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][(m || 1) - 1];
  return `${String(d).padStart(2, "0")} ${month} ${y}`;
};

export default function DiscountImpactList({
  fromDate,
  toDate,
  preset,
  summary,
  days,
}: DiscountImpactListProps) {
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
    startTransition(() =>
      router.push(qs.toString() ? `?${qs.toString()}` : "?")
    );
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = days.length > 0;

  // Column sums, computed from the day rows.
  const totals = days.reduce(
    (acc, day) => ({
      orders: acc.orders + (day.orders || 0),
      discountedOrders: acc.discountedOrders + (day.discountedOrders || 0),
      discountAmount: acc.discountAmount + (day.discountAmount || 0),
      orderValue: acc.orderValue + (day.orderValue || 0),
      couponAmount: acc.couponAmount + (day.couponAmount || 0),
      couponUses: acc.couponUses + (day.couponUses || 0),
      bogoAmount: acc.bogoAmount + (day.bogoAmount || 0),
      bogoUses: acc.bogoUses + (day.bogoUses || 0),
      flashAmount: acc.flashAmount + (day.flashAmount || 0),
      flashUses: acc.flashUses + (day.flashUses || 0),
    }),
    {
      orders: 0,
      discountedOrders: 0,
      discountAmount: 0,
      orderValue: 0,
      couponAmount: 0,
      couponUses: 0,
      bogoAmount: 0,
      bogoUses: 0,
      flashAmount: 0,
      flashUses: 0,
    }
  );

  const exportRows: (string | number)[][] = days.map((day) => [
    prettyDate(day.date),
    day.orders,
    day.discountedOrders,
    formatMoney(day.discountAmount),
    `${day.discountSharePct}%`,
    formatMoney(day.couponAmount),
    formatMoney(day.bogoAmount),
    formatMoney(day.flashAmount),
  ]);

  const pdfSummary = [
    { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
    { label: "Discounted Orders", value: String(summary?.discountedOrders ?? 0) },
    {
      label: "Total Discount",
      value: formatMoney(summary?.totalDiscount ?? 0),
    },
    { label: "Order Value", value: formatMoney(summary?.totalOrderValue ?? 0) },
    { label: "Discount Share", value: `${summary?.discountSharePct ?? 0}%` },
  ];

  const headers = [
    "Date",
    "Orders",
    "Discounted",
    "Discount",
    "% of Value",
    "Coupon",
    "BOGO",
    "Flash Sale",
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Discount Impact Report"
        description={`Discounts, coupons, BOGO and flash-sale impact on orders in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Discount Impact Report"
              subtitle={rangeLabel}
              headers={headers}
              rows={exportRows}
              summary={pdfSummary}
              fileName="discount-impact-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Discount Impact Report"
                  headers={headers}
                  flexes={[1.3, 0.8, 0.9, 1.1, 0.9, 1, 1, 1.1]}
                  alignRight={[1, 2, 3, 4, 5, 6, 7]}
                  rows={exportRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`discount-impact-report-${new Date()
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
            <BadgePercent className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No orders matched</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range to see discount activity.
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
              icon={ShoppingBag}
              title="Orders"
              value={(summary?.totalOrders ?? 0).toLocaleString("en-US")}
              description={`Orders placed in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="blue"
            />
            <StatsCard
              icon={Tag}
              title="Discounted orders"
              value={(summary?.discountedOrders ?? 0).toLocaleString("en-US")}
              description="Orders with any discount applied"
              bgColor="orange"
            />
            <StatsCard
              icon={BadgePercent}
              title="Total discount"
              value={amount(summary?.totalDiscount ?? 0)}
              description="Coupons, BOGO and flash-sale savings"
              bgColor="red"
            />
            <StatsCard
              icon={Wallet}
              title="Order value"
              value={amount(summary?.totalOrderValue ?? 0)}
              description="Gross value before discounts"
              bgColor="green"
            />
            <StatsCard
              icon={Percent}
              title="Discount share"
              value={`${summary?.discountSharePct ?? 0}%`}
              description="Discount as a share of order value"
              bgColor="purple"
            />
          </div>

          {/* Days */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Discount activity by day</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · newest day first
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {days.length} day{days.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Date</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Discounted</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">% of Value</TableHead>
                    <TableHead className="text-right">Coupon</TableHead>
                    <TableHead className="text-right">BOGO</TableHead>
                    <TableHead className="pr-4 text-right">Flash Sale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {days.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="py-2 pl-4">
                        <span className="text-sm font-medium">
                          {prettyDate(day.date)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {day.orders}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {day.discountedOrders}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(day.discountAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                          {day.discountSharePct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(day.couponAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(day.bogoAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(day.flashAmount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Range total
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.orders.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {totals.discountedOrders.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totals.discountAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {summary?.discountSharePct ?? 0}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totals.couponAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totals.bogoAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(totals.flashAmount)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {days.map((day) => (
                <article key={day.date} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{prettyDate(day.date)}</p>
                    <div className="flex shrink-0 gap-1.5">
                      <PillBadge tone="sky" className="shrink-0">
                        {day.orders} orders
                      </PillBadge>
                      {day.discountedOrders > 0 && (
                        <PillBadge tone="amber" className="shrink-0">
                          {day.discountedOrders} discounted
                        </PillBadge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Discount
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                        {amount(day.discountAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        % of Value
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {day.discountSharePct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Order value
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(day.orderValue)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Coupon {bare(day.couponAmount)} · BOGO {bare(day.bogoAmount)}{" "}
                    · Flash {bare(day.flashAmount)}
                  </p>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {days.length} day{days.length === 1 ? "" : "s"} in this
                range
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
