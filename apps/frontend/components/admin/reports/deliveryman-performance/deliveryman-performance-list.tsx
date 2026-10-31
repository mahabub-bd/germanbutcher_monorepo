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
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  ClipboardList,
  PackageCheck,
  RefreshCw,
  Truck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface Summary {
  totalAssigned: number;
  totalDeliveries: number;
  totalDeliveredValue: number;
  activeDeliveryMen: number;
}

interface DeliveryManRow {
  id: number;
  name: string;
  mobileNumber: string;
  isActive: boolean;
  assigned: number;
  deliveries: number;
  inProgress: number;
  deliveredValue: number;
}

interface DeliverymanPerformanceListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  deliveryMen: DeliveryManRow[];
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

export default function DeliverymanPerformanceList({
  fromDate,
  toDate,
  preset,
  summary,
  deliveryMen,
}: DeliverymanPerformanceListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    startTransition(() => router.push(`?${qs.toString()}`));
  };

  const rangeLabel = dateRangeSubtitle(preset, fromDate, toDate);
  const hasData = deliveryMen.length > 0;

  const pdfRows = deliveryMen.map((d) => [
    d.name,
    d.mobileNumber,
    d.isActive ? "Active" : "Inactive",
    d.assigned,
    d.inProgress,
    d.deliveries,
    formatMoney(d.deliveredValue),
  ]);

  const pdfSummary = [
    { label: "Total Assigned", value: String(summary?.totalAssigned ?? 0) },
    { label: "Total Deliveries", value: String(summary?.totalDeliveries ?? 0) },
    {
      label: "Delivered Value",
      value: formatMoney(summary?.totalDeliveredValue ?? 0),
    },
    {
      label: "Men with Deliveries",
      value: String(summary?.activeDeliveryMen ?? 0),
    },
  ];

  // Current rows totals — the range totals shown in the cards come from the API.
  const rowTotals = deliveryMen.reduce(
    (sum, d) => ({
      assigned: sum.assigned + (d.assigned || 0),
      inProgress: sum.inProgress + (d.inProgress || 0),
      deliveries: sum.deliveries + (d.deliveries || 0),
      value: sum.value + (d.deliveredValue || 0),
    }),
    { assigned: 0, inProgress: 0, deliveries: 0, value: 0 }
  );

  return (
    <div className="w-full">
      <PageHeader
        title="Deliveryman Performance Report"
        description={`Assigned orders, deliveries and delivered value per delivery man in ${rangeLabel
          .replace(/^Period: /, "")
          .toLowerCase()}.`}
      >
        {mounted && hasData && (
          <>
            <ReportExcelButton
              title="Deliveryman Performance Report"
              subtitle={rangeLabel}
              headers={[
                "Name",
                "Mobile",
                "Status",
                "Assigned",
                "In Progress",
                "Deliveries",
                "Delivered Value",
              ]}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="deliveryman-performance-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Deliveryman Performance Report"
                  headers={[
                    "Name",
                    "Mobile",
                    "Status",
                    "Assigned",
                    "In Progress",
                    "Deliveries",
                    "Delivered Value",
                  ]}
                  flexes={[1.5, 1.2, 0.9, 0.9, 0.9, 0.9, 1.2]}
                  alignRight={[3, 4, 5, 6]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`deliveryman-performance-report-${new Date()
                .toISOString()
                .split("T")[0]}.pdf`}
            />
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => router.refresh())}
        >
          <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
          Refresh
        </Button>
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
            <Truck className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No delivery men matched</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range or refresh the list.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(() => router.push("?preset=this_year"))
            }
          >
            Search this year
          </Button>
        </div>
      ) : (
        <>
          {/* Range totals */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatsCard
              icon={ClipboardList}
              title="Assigned orders"
              value={(summary?.totalAssigned ?? 0).toLocaleString("en-US")}
              description={`Assignments in ${rangeLabel
                .replace(/^Period: /, "")
                .toLowerCase()}`}
              bgColor="blue"
            />
            <StatsCard
              icon={Truck}
              title="In progress"
              value={(
                summary
                  ? Math.max(0, summary.totalAssigned - summary.totalDeliveries)
                  : 0
              ).toLocaleString("en-US")}
              description="Assigned but not yet delivered"
              bgColor="orange"
            />
            <StatsCard
              icon={PackageCheck}
              title="Delivered"
              value={(summary?.totalDeliveries ?? 0).toLocaleString("en-US")}
              description={`${amount(summary?.totalDeliveredValue ?? 0)} delivered value`}
              bgColor="green"
            />
            <StatsCard
              icon={Users}
              title="Men with deliveries"
              value={(summary?.activeDeliveryMen ?? 0).toLocaleString("en-US")}
              description={`Of ${deliveryMen.length} delivery ${
                deliveryMen.length === 1 ? "man" : "men"
              } listed`}
              bgColor="purple"
            />
          </div>

          {/* Delivery men */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Delivery men</h3>
                <p className="text-xs text-muted-foreground">
                  Amounts in ৳ · sorted by deliveries
                </p>
              </div>
              <PillBadge className="font-medium tabular-nums">
                {deliveryMen.length} row{deliveryMen.length === 1 ? "" : "s"}
              </PillBadge>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Delivery man</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Assigned</TableHead>
                    <TableHead className="text-right">In Progress</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="pr-4 text-right">
                      Delivered Value
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryMen.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="py-2.5 pl-4">
                        <p className="text-sm font-medium">{d.name}</p>
                        {d.mobileNumber ? (
                          <a
                            href={`tel:${d.mobileNumber}`}
                            className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {d.mobileNumber}
                          </a>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            No mobile
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <PillBadge tone={d.isActive ? "emerald" : "neutral"}>
                          {d.isActive ? "Active" : "Inactive"}
                        </PillBadge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {d.assigned}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            d.inProgress > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {d.inProgress}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {d.deliveries}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="text-sm font-semibold tabular-nums">
                          {bare(d.deliveredValue)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {rowTotals.assigned.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        {rowTotals.inProgress.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {rowTotals.deliveries.toLocaleString("en-US")}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-bold tabular-nums">
                        {bare(rowTotals.value)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {deliveryMen.map((d) => (
                <article key={d.id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{d.name}</p>
                      {d.mobileNumber && (
                        <a
                          href={`tel:${d.mobileNumber}`}
                          className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {d.mobileNumber}
                        </a>
                      )}
                    </div>
                    <PillBadge
                      tone={d.isActive ? "emerald" : "neutral"}
                      className="shrink-0"
                    >
                      {d.isActive ? "Active" : "Inactive"}
                    </PillBadge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Assigned
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {d.assigned}
                      </p>
                      {d.inProgress > 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          {d.inProgress} in progress
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Delivered
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {d.deliveries}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Value
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {amount(d.deliveredValue)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Footer: what the list covers */}
            <div className="border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing all {deliveryMen.length} delivery 
                {deliveryMen.length === 1 ? "man" : "men"} in this range
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
