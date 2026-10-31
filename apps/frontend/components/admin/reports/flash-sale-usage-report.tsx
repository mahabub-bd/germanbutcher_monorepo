"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { ReportPdfButton } from "@/components/admin/reports/generic-report-pdf";
import {
  ReportDateFilters,
  rangeForPreset,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
import { PillBadge } from "@/components/common/pill-badge";
import { PaginationComponent } from "@/components/common/pagination";
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
import { cn, formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import { format } from "date-fns";
import {
  Download,
  Loader2,
  RefreshCw,
  Tag,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";

interface FlashSaleUsageRow {
  id: number;
  campaignName: string;
  discountAmount: string | number;
  orderTotal: string | number;
  createdAt: string;
  user?: { id: number; name: string; email: string } | null;
  order?: { id: number; orderNo: string } | null;
}

interface ReportStats {
  totalUses: number;
  totalDiscount: number;
  totalOrderValue: number;
  avgOrderValue: number;
  uniqueCampaigns: number;
}

interface FlashSaleUsageReportProps {
  initialPreset?: string;
  initialFromDate?: string;
  initialToDate?: string;
}

const EXPORT_HEADERS = [
  "Date",
  "Customer",
  "Order No",
  "Campaign",
  "Discount",
  "Total",
];

/**
 * The usage-log endpoints only filter on explicit dates, so a quick-range
 * preset is resolved into a concrete from/to pair before every request.
 */
const resolveRange = (params: ReportFilterParams) => {
  if (params.fromDate || params.toDate) {
    return { fromDate: params.fromDate, toDate: params.toDate };
  }
  if (params.preset) {
    const [from, to] = rangeForPreset(params.preset);
    return {
      fromDate: from ? format(from, "yyyy-MM-dd") : undefined,
      toDate: to ? format(to, "yyyy-MM-dd") : undefined,
    };
  }
  return { fromDate: undefined, toDate: undefined };
};

/** Whole amounts only — report values never need decimal places. */
const amount = (value: number | string) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

/** Desktop cells drop the symbol — the table header states "Amounts in ৳". */
const bare = (value: number | string) =>
  Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// @react-pdf's built-in fonts have no ৳ glyph, so exports use "BDT ".
const formatMoney = (value: number | string, decimals = 0) =>
  `BDT ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

export function FlashSaleUsageReport({
  initialPreset,
  initialFromDate,
  initialToDate,
}: FlashSaleUsageReportProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ReportFilterParams>({
    preset: initialPreset,
    fromDate: initialFromDate,
    toDate: initialToDate,
  });
  const [rows, setRows] = useState<FlashSaleUsageRow[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);
  const [mounted, setMounted] = useState(false);

  // Full-range rows for Excel/PDF export, fetched on demand (first export
  // click of each filter combination) so the page load stays light. Rows are
  // tagged with the filter they belong to, so a stale set is never exported.
  const [exportState, setExportState] = useState<{
    key: string;
    rows: FlashSaleUsageRow[];
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const range = useMemo(() => resolveRange(filters), [filters]);
  const exportKey = `${range.fromDate ?? ""}|${range.toDate ?? ""}`;
  const exportRows =
    exportState && exportState.key === exportKey ? exportState.rows : null;

  const buildQuery = useCallback(
    (page: number, includePaging: boolean) => {
      const params = new URLSearchParams();
      if (includePaging) {
        params.set("page", String(page));
        params.set("limit", String(limit));
      }
      if (range.fromDate) params.set("fromDate", range.fromDate);
      if (range.toDate) params.set("toDate", range.toDate);
      return params.toString();
    },
    [range, limit]
  );

  const fetchReport = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const query = buildQuery(1, false);
        const [listResponse, statsResponse] = await Promise.all([
          fetchDataPagination<{
            data: FlashSaleUsageRow[];
            total: number;
            totalPages: number;
          }>(`flash-sale-usage-logs?${buildQuery(currentPage, true)}`),
          fetchDataPagination<{ data: ReportStats }>(
            `flash-sale-usage-logs/report-stats${query ? `?${query}` : ""}`
          ),
        ]);
        setRows(listResponse.data);
        setTotalItems(listResponse.total);
        setTotalPages(listResponse.totalPages);
        setStats(statsResponse.data);
      } catch (error) {
        console.error("Error fetching flash sale usage report:", error);
        toast.error("Failed to load flash sale usage report.");
        setRows([]);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [buildQuery, currentPage]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchReport(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilterApply = (params: ReportFilterParams) => {
    setFilters(params);
    setCurrentPage(1);
    const search = new URLSearchParams();
    if (params.preset) search.set("preset", params.preset);
    if (params.fromDate) search.set("fromDate", params.fromDate);
    if (params.toDate) search.set("toDate", params.toDate);
    router.push(`/admin/reports/flash-sale-usage?${search.toString()}`, {
      scroll: false,
    });
  };

  const handleExportPrepare = async () => {
    if (exporting || exportRows) return;
    setExporting(true);
    try {
      const all: FlashSaleUsageRow[] = [];
      let page = 1;
      let lastPage = 1;
      do {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "500");
        if (range.fromDate) params.set("fromDate", range.fromDate);
        if (range.toDate) params.set("toDate", range.toDate);
        const response = await fetchDataPagination<{
          data: FlashSaleUsageRow[];
          totalPages: number;
        }>(`flash-sale-usage-logs?${params.toString()}`);
        all.push(...(response.data || []));
        lastPage = response.totalPages || 1;
        page += 1;
      } while (page <= lastPage);
      setExportState({ key: exportKey, rows: all });
    } catch (error) {
      console.error("Failed to prepare export:", error);
      toast.error("Failed to load flash sale usages for export");
    } finally {
      setExporting(false);
    }
  };

  const periodLabel = filters.fromDate || filters.toDate
    ? `Period: ${filters.fromDate ?? "start"} to ${filters.toDate ?? "today"}`
    : filters.preset
      ? `Period: ${filters.preset.replace(/_/g, " ")}`
      : "Period: all time";

  const exportData = (exportRows ?? []).map((row) => [
    formatDateTime(row.createdAt),
    row.user?.name || "-",
    row.order?.orderNo || "-",
    row.campaignName,
    formatMoney(row.discountAmount),
    formatMoney(row.orderTotal),
  ]);

  const exportSummary = stats
    ? [
        { label: "Total Uses", value: String(stats.totalUses) },
        { label: "Discount Given", value: formatMoney(stats.totalDiscount) },
        { label: "Total Order Value", value: formatMoney(stats.totalOrderValue) },
      ]
    : undefined;

  // Current-page sums — the period totals shown in the cards come from the API.
  const pageTotals = rows.reduce(
    (sum, row) => ({
      discount: sum.discount + (Number(row.discountAmount) || 0),
      orderTotal: sum.orderTotal + (Number(row.orderTotal) || 0),
    }),
    { discount: 0, orderTotal: 0 }
  );

  const hasData = totalItems > 0;
  const firstRow = Math.min((currentPage - 1) * limit + 1, totalItems);
  const lastRow = Math.min(currentPage * limit, totalItems);

  return (
    <div className="w-full">
      <PageHeader
        title="Flash Sale Usage Report"
        description={`Every flash-sale priced order in ${periodLabel
          .replace(/^Period: /, "")
          .toLowerCase()} — campaign, discount and order value.`}
      >
        {mounted && hasData && (
          <>
            {exportRows ? (
              <>
                <ReportExcelButton
                  title="Flash Sale Usage Report"
                  subtitle={periodLabel}
                  headers={EXPORT_HEADERS}
                  rows={exportData}
                  summary={exportSummary}
                  fileName="flash-sale-usage-report"
                />
                <ReportPdfButton
                  title="Flash Sale Usage Report"
                  subtitle={periodLabel}
                  fileName="flash-sale-usage-report"
                  columns={[
                    { header: "Date", width: 2 },
                    { header: "Customer", width: 1.6 },
                    { header: "Order No", width: 1.3 },
                    { header: "Campaign", width: 1.6 },
                    { header: "Discount", width: 1.1, align: "right" },
                    { header: "Total", width: 1.1, align: "right" },
                  ]}
                  rows={exportData}
                  summary={exportSummary}
                />
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPrepare}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Preparing…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Export
                  </>
                )}
              </Button>
            )}
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          onClick={handleRefresh}
        >
          <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      <ReportDateFilters
        preset={filters.preset}
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onApply={handleFilterApply}
      />

      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <StatsCard
            title="Total uses"
            value={stats.totalUses.toLocaleString("en-US")}
            description="Orders priced by flash sales in period"
            icon={Zap}
            bgColor="blue"
          />
          <StatsCard
            title="Discount given"
            value={amount(stats.totalDiscount)}
            description="Flash sale discounts on those orders"
            icon={Tag}
            bgColor="green"
          />
          <StatsCard
            title="Order value"
            value={amount(stats.totalOrderValue)}
            description="Value of orders with flash pricing"
            icon={TrendingUp}
            bgColor="purple"
          />
          <StatsCard
            title="Campaigns used"
            value={stats.uniqueCampaigns.toLocaleString("en-US")}
            description="Distinct campaigns applied"
            icon={Users}
            bgColor="orange"
          />
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border bg-card shadow-xs">
          <LoadingIndicator message="Loading flash sale usage report..." />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Zap className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">No flash sale usages matched</p>
            <p className="text-xs text-muted-foreground">
              Widen the date range or clear the filters.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/reports/flash-sale-usage")}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Flash sale orders</h3>
              <p className="text-xs text-muted-foreground">
                Amounts in ৳ · page {currentPage} of {Math.max(totalPages, 1)}
              </p>
            </div>
            <PillBadge className="font-medium tabular-nums">
              {rows.length} row{rows.length === 1 ? "" : "s"}
            </PillBadge>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table className="report-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Campaign</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="pr-4 text-right">Order Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="py-2.5 pl-4">
                      <PillBadge
                        tone="violet"
                        className="max-w-44 truncate font-normal"
                        title={row.campaignName}
                      >
                        {row.campaignName}
                      </PillBadge>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </p>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm font-medium">
                        {row.user?.name || "N/A"}
                      </p>
                      {row.user?.email ? (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {row.user.email}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          No email
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.order?.orderNo ? (
                        <Link
                          href="/admin/orders"
                          className="text-sm font-semibold whitespace-nowrap text-foreground hover:text-primaryColor hover:underline"
                        >
                          {row.order.orderNo}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        −{bare(row.discountAmount)}
                      </span>
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <span className="text-sm font-semibold tabular-nums">
                        {bare(row.orderTotal)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell className="pl-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Page total
                  </TableCell>
                  <TableCell colSpan={2} />
                  <TableCell className="text-right">
                    <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      −{bare(pageTotals.discount)}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <span className="text-sm font-bold tabular-nums">
                      {bare(pageTotals.orderTotal)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {rows.map((row) => (
              <article key={row.id} className="space-y-3 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <PillBadge
                      tone="violet"
                      className="max-w-44 truncate font-normal"
                      title={row.campaignName}
                    >
                      {row.campaignName}
                    </PillBadge>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </p>
                  </div>
                  {row.order?.orderNo && (
                    <Link
                      href="/admin/orders"
                      className="shrink-0 text-sm font-semibold hover:text-primaryColor hover:underline"
                    >
                      {row.order.orderNo}
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="font-medium">{row.user?.name || "N/A"}</span>
                  {row.user?.email && (
                    <span className="truncate text-muted-foreground">
                      {row.user.email}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Discount
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      −{amount(row.discountAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Order Total
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {amount(row.orderTotal)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Footer: range position + pagination */}
          <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {firstRow}–{lastRow} of {totalItems} usage
              {totalItems === 1 ? "" : "s"}
            </p>
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
