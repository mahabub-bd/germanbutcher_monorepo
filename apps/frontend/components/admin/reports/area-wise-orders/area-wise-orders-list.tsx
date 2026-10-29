"use client";

import { PageHeader } from "@/components/admin/page-header";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import { ReportExcelButton, dateRangeSubtitle } from "@/components/admin/reports/download-excel-button";
import { ReportDateFilters } from "@/components/admin/reports/report-date-filters";
import { ReportTablePDF } from "@/components/admin/reports/report-pdf-document";
import { PaginationComponent } from "@/components/common/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { cn, formatCurrencyEnglish } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Summary {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  totalValue: number;
  deliveredValue: number;
  totalAreas: number;
}

interface AreaRow {
  area: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  onHoldOrders: number;
  totalValue: number;
  deliveredValue: number;
}

interface AreaWiseOrdersListProps {
  fromDate?: string;
  toDate?: string;
  preset?: string;
  summary: Summary | null;
  areas: AreaRow[];
}

const PAGE_SIZE = 10;

/** One decimal, guarded against divide-by-zero. */
const pct = (part: number, whole: number) =>
  whole > 0 ? ((part / whole) * 100).toFixed(1) : "0.0";

/** Colored icon tile + label + big number + share of total. */
function ReportStat({
  icon: Icon,
  label,
  value,
  percent,
  tileClass,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  percent: string;
  tileClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          tileClass
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold leading-tight tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">{percent}% of total</p>
      </div>
    </div>
  );
}

export default function AreaWiseOrdersList({
  fromDate,
  toDate,
  preset,
  summary,
  areas,
}: AreaWiseOrdersListProps) {
  const router = useRouter();
  const settings = useBusinessSettings();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const applyParams = (params: {
    preset?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.preset) q.set("preset", params.preset);
    if (params.fromDate) q.set("fromDate", params.fromDate);
    if (params.toDate) q.set("toDate", params.toDate);
    router.push(`?${q.toString()}`);
  };

  const pdfRows = areas.map((a) => [
    a.area,
    a.totalOrders,
    a.deliveredOrders,
    a.cancelledOrders,
    a.pendingOrders,
    a.processingOrders,
    a.onHoldOrders,
    formatCurrencyEnglish(a.totalValue),
    formatCurrencyEnglish(a.deliveredValue),
  ]);

  const pdfSummary = [
    { label: "Total Orders", value: String(summary?.totalOrders ?? 0) },
    { label: "Delivered Orders", value: String(summary?.deliveredOrders ?? 0) },
    { label: "Cancelled Orders", value: String(summary?.cancelledOrders ?? 0) },
    { label: "Pending Orders", value: String(summary?.pendingOrders ?? 0) },
    { label: "Processing Orders", value: String(summary?.processingOrders ?? 0) },
    { label: "On Hold Orders", value: String(summary?.onHoldOrders ?? 0) },
    { label: "Order Value", value: formatCurrencyEnglish(summary?.totalValue ?? 0) },
    { label: "Delivered Value", value: formatCurrencyEnglish(summary?.deliveredValue ?? 0) },
    { label: "Areas", value: String(summary?.totalAreas ?? 0) },
  ];

  const filteredAreas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return areas;
    return areas.filter((a) => a.area.toLowerCase().includes(term));
  }, [areas, search]);

  const total = filteredAreas.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageAreas = filteredAreas.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const summaryTotal = summary?.totalOrders ?? 0;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Delivery Report (Area Wise)"
        description="View delivery performance and order status by area"
        titleIcon={
          <span className="mr-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10">
            <Truck className="size-6 text-primaryColor" />
          </span>
        }
      >
        <ReportDateFilters
          preset={preset}
          fromDate={fromDate}
          toDate={toDate}
          onApply={applyParams}
          className="mb-0 border-none bg-transparent p-0 shadow-none"
        />
        {areas.length > 0 && (
          <div className="flex shrink-0 gap-2">
            <ReportExcelButton
              title="Area Wise Order Report"
              subtitle={dateRangeSubtitle(preset, fromDate, toDate)}
              headers={[
                "Area",
                "Orders",
                "Delivered",
                "Cancelled",
                "Pending",
                "Processing",
                "On Hold",
                "Order Value",
                "Delivered Value",
              ]}
              rows={pdfRows}
              summary={pdfSummary}
              fileName="area-wise-order-report"
            />
            <LazyPdfDownloadLink
              document={
                <ReportTablePDF
                  title="Area Wise Order Report"
                  headers={[
                    "Area",
                    "Orders",
                    "Delivered",
                    "Cancelled",
                    "Pending",
                    "Processing",
                    "On Hold",
                    "Order Value",
                    "Delivered Value",
                  ]}
                  flexes={[1.5, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 1.1, 1.1]}
                  alignRight={[1, 2, 3, 4, 5, 6, 7, 8]}
                  rows={pdfRows}
                  summary={pdfSummary}
                  settings={settings}
                />
              }
              fileName={`area-wise-order-report-${
                new Date().toISOString().split("T")[0]
              }.pdf`}
            />
          </div>
        )}
      </PageHeader>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <ReportStat
          icon={FileText}
          label="Total Orders"
          value={summaryTotal}
          percent={pct(summaryTotal, summaryTotal)}
          tileClass="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
        />
        <ReportStat
          icon={CheckCircle2}
          label="Delivered"
          value={summary?.deliveredOrders ?? 0}
          percent={pct(summary?.deliveredOrders ?? 0, summaryTotal)}
          tileClass="bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"
        />
        <ReportStat
          icon={Clock}
          label="Pending"
          value={summary?.pendingOrders ?? 0}
          percent={pct(summary?.pendingOrders ?? 0, summaryTotal)}
          tileClass="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        />
        <ReportStat
          icon={RefreshCw}
          label="Processing"
          value={summary?.processingOrders ?? 0}
          percent={pct(summary?.processingOrders ?? 0, summaryTotal)}
          tileClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        />
        <ReportStat
          icon={Ban}
          label="Cancelled"
          value={summary?.cancelledOrders ?? 0}
          percent={pct(summary?.cancelledOrders ?? 0, summaryTotal)}
          tileClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        />
      </div>

      {/* Areas table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search area..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-180">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Processing</TableHead>
                <TableHead>Cancelled</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageAreas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {search
                      ? `No areas match "${search}"`
                      : "No orders found for this range"}
                  </TableCell>
                </TableRow>
              ) : (
                pageAreas.map((a, index) => {
                  const completion = pct(a.deliveredOrders, a.totalOrders);
                  return (
                    <TableRow key={a.area} className="hover:bg-muted/50">
                      <TableCell className="text-muted-foreground">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{a.area}</TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {a.totalOrders}
                      </TableCell>
                      <TableCell>
                        <span className="block font-semibold text-green-600 dark:text-green-400 tabular-nums">
                          {a.deliveredOrders}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {pct(a.deliveredOrders, a.totalOrders)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                          {a.pendingOrders}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {pct(a.pendingOrders, a.totalOrders)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {a.processingOrders}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {pct(a.processingOrders, a.totalOrders)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="block font-semibold tabular-nums">
                          {a.cancelledOrders}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {pct(a.cancelledOrders, a.totalOrders)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <span
                              className="block h-full rounded-full bg-green-600 transition-[width] duration-300"
                              style={{ width: `${completion}%` }}
                            />
                          </span>
                          <span className="text-sm tabular-nums">{completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/admin/orders?area=${encodeURIComponent(a.area)}`}
                          >
                            <Eye className="mr-1 size-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {total > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t p-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * PAGE_SIZE + 1).toLocaleString()} to{" "}
              {Math.min(currentPage * PAGE_SIZE, total).toLocaleString()} of{" "}
              {total.toLocaleString()} areas
            </div>
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
