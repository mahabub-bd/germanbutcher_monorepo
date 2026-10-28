"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { ReportPdfButton } from "@/components/admin/reports/generic-report-pdf";
import { ReportExcelButton } from "@/components/admin/reports/download-excel-button";
import { ReportDateFilters, type ReportFilterParams } from "@/components/admin/reports/report-date-filters";
import { PaginationComponent } from "@/components/common/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination } from "@/utils/api-utils";
import { Gift, Tag, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface BogoUsageRow {
  id: number;
  campaignName: string;
  discountAmount: string | number;
  freeUnits?: number;
  orderTotal: string | number;
  createdAt: string;
  user?: { id: number; name: string; email: string } | null;
  order?: { id: number; orderNo: string } | null;
}

interface ReportStats {
  totalUses: number;
  totalDiscount: number;
  totalFreeUnits: number;
  totalOrderValue: number;
  avgOrderValue: number;
  uniqueCampaigns: number;
}

interface BogoUsageReportProps {
  initialPreset?: string;
  initialFromDate?: string;
  initialToDate?: string;
}

export function BogoUsageReport({
  initialPreset,
  initialFromDate,
  initialToDate,
}: BogoUsageReportProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ReportFilterParams>({
    preset: initialPreset,
    fromDate: initialFromDate,
    toDate: initialToDate,
  });
  const [rows, setRows] = useState<BogoUsageRow[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  const buildQuery = useCallback(
    (page: number, includePaging: boolean) => {
      const params = new URLSearchParams();
      if (includePaging) {
        params.set("page", String(page));
        params.set("limit", String(limit));
      }
      if (filters.preset) params.set("preset", filters.preset);
      if (filters.fromDate) params.set("fromDate", filters.fromDate);
      if (filters.toDate) params.set("toDate", filters.toDate);
      return params.toString();
    },
    [filters, limit]
  );

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = buildQuery(1, false);
      const [listResponse, statsResponse] = await Promise.all([
        fetchDataPagination<{
          data: BogoUsageRow[];
          total: number;
          totalPages: number;
        }>(`bogo-usage-logs?${buildQuery(currentPage, true)}`),
        fetchDataPagination<{ data: ReportStats }>(
          `bogo-usage-logs/report-stats${query ? `?${query}` : ""}`
        ),
      ]);
      setRows(listResponse.data);
      setTotalItems(listResponse.total);
      setTotalPages(listResponse.totalPages);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Error fetching BOGO usage report:", error);
      toast.error("Failed to load BOGO usage report.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery, currentPage]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFilterApply = (params: ReportFilterParams) => {
    setFilters(params);
    setCurrentPage(1);
    const search = new URLSearchParams();
    if (params.preset) search.set("preset", params.preset);
    if (params.fromDate) search.set("fromDate", params.fromDate);
    if (params.toDate) search.set("toDate", params.toDate);
    router.push(`/admin/reports/bogo-usage?${search.toString()}`, {
      scroll: false,
    });
  };

  const formatMoney = (value: number | string, decimals = 2) =>
    `৳${Number(value).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  // Amounts use the ASCII "BDT " prefix for the PDF — the ৳ glyph is not
  // embedded in the PDF font.
  const formatMoneyPdf = (value: number | string) =>
    `BDT ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const periodLabel = filters.fromDate || filters.toDate
    ? `Period: ${filters.fromDate ?? "start"} to ${filters.toDate ?? "today"}`
    : filters.preset
      ? `Period: ${filters.preset.replace(/_/g, " ")}`
      : "Period: all time";

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="BOGO Usage Report"
        />
        <div className="flex shrink-0 gap-2">
          <ReportExcelButton
            title="BOGO Usage Report"
            subtitle={periodLabel}
                        headers={["Date", "Customer", "Order No", "Campaign", "Free Units", "Discount", "Total"]}
            rows={rows.map((row) => [
              formatDateTime(row.createdAt),
              row.user?.name || "-",
              row.order?.orderNo || "-",
              row.campaignName,
              String(row.freeUnits ?? 0),
              formatMoneyPdf(row.discountAmount),
              formatMoneyPdf(row.orderTotal),
            ])}
            summary={
              stats
                ? [
                  { label: "Total Uses", value: String(stats.totalUses) },
                  { label: "Discount Given", value: formatMoneyPdf(stats.totalDiscount) },
                  { label: "Free Units Given", value: String(stats.totalFreeUnits) },
                  { label: "Total Order Value", value: formatMoneyPdf(stats.totalOrderValue) },
                ]
                : undefined
            }
            fileName="bogo-usage-report"
          />
          <ReportPdfButton
            title="BOGO Usage Report"
            subtitle={periodLabel}
            fileName="bogo-usage-report"
            columns={[
              { header: "Date", width: 2 },
              { header: "Customer", width: 1.5 },
              { header: "Order No", width: 1.2 },
              { header: "Campaign", width: 1.5 },
              { header: "Free Units", width: 0.9, align: "right" },
              { header: "Discount", width: 1.1, align: "right" },
              { header: "Total", width: 1.1, align: "right" },
            ]}
            rows={rows.map((row) => [
              formatDateTime(row.createdAt),
              row.user?.name || "-",
              row.order?.orderNo || "-",
              row.campaignName,
              String(row.freeUnits ?? 0),
              formatMoneyPdf(row.discountAmount),
              formatMoneyPdf(row.orderTotal),
            ])}
            summary={
              stats
                ? [
                  { label: "Total Uses", value: String(stats.totalUses) },
                  { label: "Discount Given", value: formatMoneyPdf(stats.totalDiscount) },
                  { label: "Free Units Given", value: String(stats.totalFreeUnits) },
                  { label: "Total Order Value", value: formatMoneyPdf(stats.totalOrderValue) },
                ]
                : undefined
            }
          />
        </div>
      </div>

      <ReportDateFilters
        preset={filters.preset}
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onApply={handleFilterApply}
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatsCard
            title="Total Uses"
            value={stats.totalUses}
            description="Orders with a BOGO deal in period"
            icon={Gift}
            bgColor="blue"
          />
          <StatsCard
            title="Total Discount Given"
            value={formatMoney(stats.totalDiscount, 0)}
            description="BOGO discounts on those orders"
            icon={Tag}
            bgColor="green"
          />
          <StatsCard
            title="Free Units Given"
            value={stats.totalFreeUnits}
            description="Items given free in period"
            icon={Users}
            bgColor="orange"
          />
          <StatsCard
            title="Total Order Value"
            value={formatMoney(stats.totalOrderValue, 0)}
            description="Value of orders with a BOGO deal"
            icon={TrendingUp}
            bgColor="purple"
          />
          <StatsCard
            title="Campaigns Used"
            value={stats.uniqueCampaigns}
            description="Distinct campaigns applied"
            icon={Tag}
            bgColor="violet"
          />
        </div>
      )}

      {isLoading ? (
        <LoadingIndicator message="Loading BOGO usage report..." />
      ) : (
        <div className="mt-2">
          <Table className="[&_td]:py-4 [&_td]:px-3 [&_th]:pb-3 [&_th]:pt-0 [&_th]:px-3">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[12%]">Date</TableHead>
                <TableHead className="w-[28%]">Customer</TableHead>
                <TableHead className="w-[16%]">Order</TableHead>
                <TableHead className="w-[17%]">Campaign</TableHead>
                <TableHead className="hidden md:table-cell md:w-[10%] md:text-right">
                  Free Units
                </TableHead>
                <TableHead className="hidden md:table-cell md:w-[11%] md:text-right">
                  Discount
                </TableHead>
                <TableHead className="hidden md:table-cell md:w-[12%] md:text-right">
                  Order Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No BOGO usage found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(row.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{row.user?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-48">
                        {row.user?.email || ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      {row.order?.orderNo ? (
                        <Link
                          href="/admin/orders"
                          className="text-sm font-medium whitespace-nowrap hover:underline"
                        >
                          {row.order.orderNo}
                        </Link>
                      ) : (
                        <span className="text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap bg-primaryColor/5 text-primaryColor border-primaryColor/20 px-3 py-1"
                      >
                        {row.campaignName}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right whitespace-nowrap">
                      <span className="text-sm">{row.freeUnits ?? 0}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right whitespace-nowrap">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        −{formatMoney(row.discountAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right whitespace-nowrap">
                      <span className="text-sm">{formatMoney(row.orderTotal)}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            <p className="text-xs text-muted-foreground">
              {`Showing ${rows.length} of ${totalItems} usages`}
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
