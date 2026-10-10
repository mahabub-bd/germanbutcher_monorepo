"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { ReportPdfButton } from "@/components/admin/reports/generic-report-pdf";
import { ReportDateFilters, type ReportFilterParams } from "@/components/admin/reports/report-date-filters";
import { PaginationComponent } from "@/components/common/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDataPagination } from "@/utils/api-utils";
import { Tag, Ticket, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface CouponUsageLogRow {
  id: number;
  couponCode: string;
  discountAmount: number;
  orderTotal: number;
  createdAt: string;
  user?: { id: number; name: string; email: string } | null;
  order?: { id: number; orderNo: string } | null;
}

interface ReportStats {
  totalUses: number;
  totalDiscountGiven: number;
  totalOrderValue: number;
  avgDiscountAmount: number;
  uniqueCoupons: number;
}

interface CouponUsageReportProps {
  initialPreset?: string;
  initialFromDate?: string;
  initialToDate?: string;
}

export function CouponUsageReport({
  initialPreset,
  initialFromDate,
  initialToDate,
}: CouponUsageReportProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<ReportFilterParams>({
    preset: initialPreset,
    fromDate: initialFromDate,
    toDate: initialToDate,
  });
  const [rows, setRows] = useState<CouponUsageLogRow[]>([]);
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
          data: CouponUsageLogRow[];
          total: number;
          totalPages: number;
        }>(`coupon-usage-logs?${buildQuery(currentPage, true)}`),
        fetchDataPagination<{ data: ReportStats }>(
          `coupon-usage-logs/report-stats${query ? `?${query}` : ""}`
        ),
      ]);
      setRows(listResponse.data);
      setTotalItems(listResponse.total);
      setTotalPages(listResponse.totalPages);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Error fetching coupon usage report:", error);
      toast.error("Failed to load coupon usage report.");
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
    router.push(`/admin/reports/coupon-usage?${search.toString()}`, {
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
          title="Coupon Usage Report"
          description="Discounts given per coupon with customer and order details"
        />
        <ReportPdfButton
          title="Coupon Usage Report"
          subtitle={periodLabel}
          fileName="coupon-usage-report"
          columns={[
            { header: "Coupon", width: 1.2 },
            { header: "Customer", width: 1.6 },
            { header: "Order No", width: 1.4 },
            { header: "Discount", width: 1.2, align: "right" },
            { header: "Order Total", width: 1.2, align: "right" },
            { header: "Date", width: 1.4 },
          ]}
          rows={rows.map((row) => [
            row.couponCode,
            row.user?.name || "-",
            row.order?.orderNo || "-",
            formatMoneyPdf(row.discountAmount),
            formatMoneyPdf(row.orderTotal),
            new Date(row.createdAt).toLocaleString(),
          ])}
          summary={
            stats
              ? [
                  { label: "Total Uses", value: String(stats.totalUses) },
                  { label: "Total Discount", value: formatMoneyPdf(stats.totalDiscountGiven) },
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
          <StatsCard title="Total Uses" value={stats.totalUses} icon={Ticket} />
          <StatsCard
            title="Total Discount Given"
            value={formatMoney(stats.totalDiscountGiven)}
            icon={Tag}
          />
          <StatsCard
            title="Total Order Value"
            value={formatMoney(stats.totalOrderValue)}
            icon={TrendingUp}
          />
          <StatsCard
            title="Unique Coupons Used"
            value={stats.uniqueCoupons}
            icon={Users}
          />
        </div>
      )}

      {isLoading ? (
        <LoadingIndicator message="Loading coupon usage report..." />
      ) : (
        <div className="mt-2">
          <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
            <TableHeader>
              <TableRow>
                <TableHead>Coupon</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="hidden md:table-cell">Discount</TableHead>
                <TableHead className="hidden md:table-cell">Order Total</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No coupon usage found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    <TableCell>
                      <span className="rounded-full bg-primaryColor/5 px-2.5 py-0.5 text-xs font-semibold text-primaryColor">
                        {row.couponCode}
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
                          className="text-sm font-medium hover:underline"
                        >
                          {row.order.orderNo}
                        </Link>
                      ) : (
                        <span className="text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm font-medium text-primaryColor">
                        {formatMoney(row.discountAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{formatMoney(row.orderTotal)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </span>
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
