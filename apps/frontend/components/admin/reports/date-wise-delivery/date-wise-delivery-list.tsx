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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  PackageCheck,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, useTransition } from "react";

interface DeliveryManEntry {
  id: number | null;
  name: string;
  deliveries: number;
  avgHours: number;
  lateOrders: number;
  deliveredValue: number;
  cashCollected: number;
  onlineAmount: number;
}

interface DayRow {
  date: string;
  totalDeliveries: number;
  totalValue: number;
  totalCash: number;
  totalOnline: number;
  totalLate: number;
  /** Sum of placement→delivery hours; avg = totalHours / totalDeliveries. */
  totalHours: number;
  deliveryMen: DeliveryManEntry[];
}

interface Summary {
  totalDeliveries: number;
  totalDeliveredValue: number;
  totalCashCollected: number;
  totalOnlineAmount: number;
  deliveryDays: number;
  activeDeliveryMen: number;
  avgPerDay: number;
  avgHours: number;
  totalLate: number;
}

interface DateWiseDeliveryListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  deliveryManId?: string;
  deliveryMenOptions: { id: number; name: string }[];
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

export default function DateWiseDeliveryList({
  fromDate,
  toDate,
  preset,
  deliveryManId,
  deliveryMenOptions,
  summary,
  days,
}: DateWiseDeliveryListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState<string>(
    deliveryManId || "all"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);

    // An empty filter set means "clear" — drop the delivery-man filter too.
    if (!qs.toString()) {
      setSelectedDeliveryMan("all");
      startTransition(() => router.push("?"));
      return;
    }

    if (selectedDeliveryMan && selectedDeliveryMan !== "all")
      qs.set("deliveryManId", selectedDeliveryMan);
    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const handleFilterClear = () => setSelectedDeliveryMan("all");

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = days.length > 0;

  // Flat export rows: one row per date × delivery man, plus a per-day total row.
  const exportRows: (string | number)[][] = [];
  for (const day of days) {
    const dayAvg =
      day.totalDeliveries > 0
        ? (day.totalHours / day.totalDeliveries).toFixed(1)
        : "0.0";
    for (const d of day.deliveryMen) {
      exportRows.push([
        prettyDate(day.date),
        d.name,
        d.deliveries,
        Number(d.avgHours || 0).toFixed(1),
        d.lateOrders,
        formatMoney(d.deliveredValue),
        formatMoney(d.cashCollected),
        formatMoney(d.onlineAmount),
      ]);
    }
    exportRows.push([
      prettyDate(day.date),
      "Total",
      day.totalDeliveries,
      dayAvg,
      day.totalLate,
      formatMoney(day.totalValue),
      formatMoney(day.totalCash),
      formatMoney(day.totalOnline),
    ]);
  }

  const pdfSummary = [
    { label: "Total Deliveries", value: String(summary?.totalDeliveries ?? 0) },
    {
      label: "Delivered Value",
      value: formatMoney(summary?.totalDeliveredValue ?? 0),
    },
    {
      label: "Cash Collected",
      value: formatMoney(summary?.totalCashCollected ?? 0),
    },
    {
      label: "Online Payment",
      value: formatMoney(summary?.totalOnlineAmount ?? 0),
    },
    { label: "Delivery Days", value: String(summary?.deliveryDays ?? 0) },
    { label: "Avg / Day", value: String(summary?.avgPerDay ?? 0) },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Date-wise Delivery Report"
        description={`Delivered orders per day and delivery man in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Date-wise Delivery Report"
              subtitle={rangeLabel}
              headers={[
                "Date",
                "Delivery Man",
                "Deliveries",
                "Avg Hours",
                "Late",
                "Delivered Value",
                "Cash Collected",
                "Online Payment",
              ]}
              rows={exportRows}
              summary={pdfSummary}
              fileName="date-wise-delivery-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Date-wise Delivery Report"
                  headers={[
                    "Date",
                    "Delivery Man",
                    "Deliveries",
                    "Avg Hours",
                    "Late",
                    "Delivered Value",
                    "Cash",
                    "Online",
                  ]}
                  flexes={[1.3, 1.5, 0.8, 0.7, 0.6, 1.1, 1, 1]}
                  alignRight={[2, 3, 4, 5, 6, 7]}
                  rows={exportRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`date-wise-delivery-report-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            />
          </>
        )}
      </PageHeader>

      {/* Filters — shared date bar plus the report's own delivery-man select */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        extra={
          <Select
            value={selectedDeliveryMan || "all"}
            onValueChange={setSelectedDeliveryMan}
          >
            <SelectTrigger className="w-full md:w-44 md:shrink-0">
              <SelectValue placeholder="Delivery Man" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All delivery men</SelectItem>
              {deliveryMenOptions.map((dm) => (
                <SelectItem key={dm.id} value={String(dm.id)}>
                  {dm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onApply={handleFilterApply}
        onClear={handleFilterClear}
      />

      {!hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <PackageCheck className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No deliveries found</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range or pick another delivery man.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleFilterClear();
              startTransition(() => router.push("?preset=this_year"));
            }}
          >
            Search this year
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <StatsCard
              icon={PackageCheck}
              title="Delivered"
              value={(summary?.totalDeliveries ?? 0).toLocaleString("en-US")}
              description={`Orders delivered in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="green"
            />
            <StatsCard
              icon={Truck}
              title="Delivered value"
              value={amount(summary?.totalDeliveredValue ?? 0)}
              description="Sum of delivered order value"
              bgColor="blue"
            />
            <StatsCard
              icon={Banknote}
              title="Cash collected"
              value={amount(summary?.totalCashCollected ?? 0)}
              description="COD payments received"
              bgColor="teal"
            />
            <StatsCard
              icon={CreditCard}
              title="Online payment"
              value={amount(summary?.totalOnlineAmount ?? 0)}
              description="Card / mobile payments received"
              bgColor="purple"
            />
            <StatsCard
              icon={CalendarDays}
              title="Avg deliveries / day"
              value={(summary?.avgPerDay ?? 0).toLocaleString("en-US")}
              description={`${summary?.deliveryDays ?? 0} day${
                (summary?.deliveryDays ?? 0) === 1 ? "" : "s"
              } · ${summary?.activeDeliveryMen ?? 0} man${
                (summary?.activeDeliveryMen ?? 0) === 1 ? "" : " involved"
              }`}
              bgColor="orange"
            />
          </div>

          {/* Days */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Delivery days</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · newest day first
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {days.length} day{days.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table: one section row per day, one row per delivery man */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Date</TableHead>
                    <TableHead>Delivery Man</TableHead>
                    <TableHead className="text-right">Deliveries</TableHead>
                    <TableHead className="text-right">Avg Hours</TableHead>
                    <TableHead className="text-right">Late</TableHead>
                    <TableHead className="text-right">Delivered Value</TableHead>
                    <TableHead className="text-right">Cash</TableHead>
                    <TableHead className="pr-4 text-right">Online</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {days.map((day) => (
                    <Fragment key={day.date}>
                      <TableRow className="bg-muted/40">
                        <TableCell className="py-2 pl-4">
                          <span className="text-sm font-bold">{prettyDate(day.date)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Day total
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold tabular-nums">
                            {day.totalDeliveries}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold tabular-nums">
                            {day.totalDeliveries > 0
                              ? (day.totalHours / day.totalDeliveries).toFixed(1)
                              : "0.0"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "text-sm font-bold tabular-nums",
                              day.totalLate > 0 &&
                                "text-red-600 dark:text-red-400",
                            )}
                          >
                            {day.totalLate}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold tabular-nums">
                            {bare(day.totalValue)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold tabular-nums">
                            {bare(day.totalCash)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span className="text-sm font-bold tabular-nums">
                            {bare(day.totalOnline)}
                          </span>
                        </TableCell>
                      </TableRow>
                      {day.deliveryMen.map((d) => (
                        <TableRow key={`${day.date}-${d.id ?? "unassigned"}`}>
                          <TableCell className="py-2 pl-4" />
                          <TableCell>
                            <span className="text-sm font-medium">{d.name}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold tabular-nums">
                              {d.deliveries}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                              {Number(d.avgHours || 0).toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                d.lateOrders > 0 &&
                                  "text-red-600 dark:text-red-400",
                              )}
                            >
                              {d.lateOrders}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold tabular-nums">
                              {bare(d.deliveredValue)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                              {bare(d.cashCollected)}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <span className="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                              {bare(d.onlineAmount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={2}
                      className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Range total
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {(summary?.totalDeliveries ?? 0).toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {summary?.avgHours ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                        {summary?.totalLate ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(summary?.totalDeliveredValue ?? 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
                        {bare(summary?.totalCashCollected ?? 0)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums text-violet-600 dark:text-violet-400">
                        {bare(summary?.totalOnlineAmount ?? 0)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards: one card per day */}
            <div className="divide-y md:hidden">
              {days.map((day) => (
                <article key={day.date} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{prettyDate(day.date)}</p>
                    <PillBadge tone="emerald" className="shrink-0">
                      {day.totalDeliveries} delivered
                    </PillBadge>
                  </div>

                  <div className="space-y-1.5">
                    {day.deliveryMen.map((d) => (
                      <div
                        key={`${day.date}-${d.id ?? "unassigned"}`}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {d.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {d.deliveries} · {bare(d.deliveredValue)} ·{" "}
                          <span className="text-teal-600 dark:text-teal-400">
                            {bare(d.cashCollected)}
                          </span>{" "}
                          ·{" "}
                          <span className="text-violet-600 dark:text-violet-400">
                            {bare(d.onlineAmount)}
                          </span>
                          {d.lateOrders > 0 && (
                            <span className="text-red-600 dark:text-red-400">
                              {" "}
                              · {d.lateOrders} late
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Day value
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(day.totalValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Cash
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                        {amount(day.totalCash)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Online
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                        {amount(day.totalOnline)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {days.length} delivery day{days.length === 1 ? "" : "s"}{" "}
                in this range
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
