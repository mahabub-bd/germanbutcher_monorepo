"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { ReportPdfButton } from "@/components/admin/reports/generic-report-pdf";
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
import { Ticket, TrendingUp, Truck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface FreeDeliveryUsageRow {
  id: number;
  campaignName: string;
  shippingWaived: string | number;
  orderTotal: string | number;
  createdAt: string;
  user?: { id: number; name: string; email: string } | null;
  order?: { id: number; orderNo: string } | null;
}

interface ReportStats {
  totalUses: number;
  totalShippingWaived: number;
  totalOrderValue: number;
  avgOrderValue: number;
  uniqueCampaigns: number;
}

interface FreeDeliveryUsageReportProps {
  initialPreset?: string;
  initialFromDate?: string;
  initialToDate?: string;
}

export function FreeDeliveryUsageReport({
  initialPreset,
  initialFromDate,
  initialToDate,
}: FreeDeliveryUsageReportProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ReportFilterParams>({
    preset: initialPreset,
    fromDate: initialFromDate,
    toDate: initialToDate,
  });
  const [rows, setRows] = useState<FreeDeliveryUsageRow[]>([]);
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
          data: FreeDeliveryUsageRow[];
          total: number;
          totalPages: number;
        }>(`free-delivery-usage-logs?${buildQuery(currentPage, true)}`),
        fetchDataPagination<{ data: ReportStats }>(
          `free-delivery-usage-logs/report-stats${query ? `?${query}` : ""}`
        ),
      ]);
      setRows(listResponse.data);
      setTotalItems(listResponse.total);
      setTotalPages(listResponse.totalPages);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Error fetching free delivery usage report:", error);
      toast.error("Failed to load free delivery usage report.");
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
    router.push(`/admin/reports/free-delivery-usage?${search.toString()}`, {
      scroll: false,
    });
  };

  const formatMoney = (value: number | string) =>
    `BDT ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Amounts use the ASCII "BDT " prefix everywhere — the ৳ glyph is not
  const formatMoneyPdf = (value: number | string) =>
    `BDT ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const periodLabel = filters.fromDate || filters.toDate
    ? `Period: ${filters.fromDate ?? "start"} to ${filters.toDate ?? "today"}`
    : filters.preset
      ? `Period: ${filters.preset.replace(/_/g, " ")}`
      : "Period: all time";

  return (
    <div className="w-full md:p-6 p-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader
          title="Free Delivery Usage Report"
          description="Free delivery campaign usage with customer and order details"
        />
        <ReportPdfButton
          title="Free Delivery Usage Report"
          subtitle={periodLabel}
          fileName="free-delivery-usage-report"
          columns={[
            { header: "Date", width: 2 },
            { header: "Customer", width: 1.6 },
            { header: "Order No", width: 1.3 },
            { header: "Campaign", width: 1.6 },
            { header: "Waived", width: 1.1, align: "right" },
            { header: "Total", width: 1.1, align: "right" },
          ]}
          rows={rows.map((row) => [
            formatDateTime(row.createdAt),
            row.user?.name || "-",
            row.order?.orderNo || "-",
            row.campaignName,
            formatMoneyPdf(row.shippingWaived),
            formatMoneyPdf(row.orderTotal),
          ])}
          summary={
            stats
              ? [
                { label: "Total Uses", value: String(stats.totalUses) },
                { label: "Shipping Waived", value: formatMoneyPdf(stats.totalShippingWaived) },
                { label: "Total Order Value", value: formatMoneyPdf(stats.totalOrderValue) },
              ]
              : undefined
          }
        />
      </div>

      <ReportDateFilters
        preset={filters.preset}
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        onApply={handleFilterApply}
      />

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Uses"
            value={stats.totalUses}
            description="Free deliveries granted in period"
            icon={Truck}
            bgColor="blue"
          />
          <StatsCard
            title="Total Shipping Waived"
            value={formatMoney(stats.totalShippingWaived)}
            description="Shipping cost covered by campaigns"
            icon={Ticket}
            bgColor="green"
          />
          <StatsCard
            title="Total Order Value"
            value={formatMoney(stats.totalOrderValue)}
            description="Value of orders with free delivery"
            icon={TrendingUp}
            bgColor="purple"
          />
          <StatsCard
            title="Campaigns Used"
            value={stats.uniqueCampaigns}
            description="Distinct campaigns applied"
            icon={Users}
            bgColor="orange"
          />
        </div>
      )}

      {isLoading ? (
        <LoadingIndicator message="Loading free delivery usage report..." />
      ) : (
        <div className="mt-2">
          <Table className="[&_td]:py-4 [&_td]:px-3 [&_th]:pb-3 [&_th]:pt-0 [&_th]:px-3">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[12%]">Date</TableHead>
                <TableHead className="w-[28%]">Customer</TableHead>
                <TableHead className="w-[16%]">Order</TableHead>
                <TableHead className="w-[17%]">Campaign</TableHead>
                <TableHead className="hidden md:table-cell md:w-[13%] md:text-right">
                  Shipping Waived
                </TableHead>
                <TableHead className="hidden md:table-cell md:w-[14%] md:text-right">
                  Order Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No free delivery usage found for the selected period.
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
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="max-w-40 truncate bg-primaryColor/5 text-primaryColor border-primaryColor/20"
                      >
                        {row.campaignName}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right whitespace-nowrap">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {formatMoney(row.shippingWaived)}
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
