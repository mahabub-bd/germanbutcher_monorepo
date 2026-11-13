"use client";

import { OrderStatus } from "@/common/enums";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { ReportExcelButton, dateRangeSubtitle } from "@/components/admin/reports/download-excel-button";
import { LazyPdfDownloadLink } from "@/components/admin/reports/lazy-pdf-download-link";
import {
  ReportDateFilters,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PillBadge } from "@/components/common/pill-badge";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish } from "@/lib/utils";
import { getPaymentMethodColor, getPaymentMethodIcon } from "@/utils/order-helper";
import { CheckCircle, CreditCard, Layers, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PaymentReportPDF } from "./PaymentReportPDF";

interface PaymentMethod {
  name: string;
  code: string;
  description: string;
}
interface OrderSummary {
  orderNo: string;
  id: number;
  orderStatus: string;
  paymentStatus: string;
  totalValue: string;
  paidAmount: string;
  /** Order's customer, included for the report's name/mobile columns. */
  user?: { name?: string | null; mobileNumber?: string | null } | null;
}
interface UserInfo {
  name: string;
  email: string;
  mobileNumber: string;
}
export interface PaymentRecord {
  id: number;
  paymentNumber: string;
  amount: string;
  paymentDate: string;
  sslPaymentId: string | null;
  /** Null for orphaned payments whose order no longer exists. */
  order: OrderSummary | null;
  paymentMethod: PaymentMethod;
  createdBy: UserInfo | null;
  updatedBy: UserInfo | null;
}

export default function OrderPaymentList({
  payments,
  fromDate,
  toDate,
  preset,
  orderStatus,
  initialSearch,
}: {
  payments: PaymentRecord[];
  fromDate?: string;
  toDate?: string;
  preset?: string;
  orderStatus?: string;
  initialSearch?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const settings = useBusinessSettings();

  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>(
    orderStatus || "all"
  );
  // Server-side search: the input is debounced into the ?search= query param
  // and the backend filters by order no / customer name / mobile number.
  const [searchInput, setSearchInput] = useState(initialSearch ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      const qs = new URLSearchParams(window.location.search);
      const current = qs.get("search") || "";
      if (next === current) return;
      if (next) qs.set("search", next);
      else qs.delete("search");
      startTransition(() => router.push(`?${qs.toString()}`));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, router]);

  // --- filter handlers (shared date-range bar + local order status) ---
  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    if (selectedOrderStatus && selectedOrderStatus !== "all")
      qs.set("orderStatus", selectedOrderStatus);
    if (searchInput.trim()) qs.set("search", searchInput.trim());
    router.push(`?${qs.toString()}`);
  };

  const handleFilterClear = () => {
    setSelectedOrderStatus("all");
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Payment Transactions"
        />
        {payments.length > 0 && mounted && (
          <div className="flex shrink-0 gap-2">
            <ReportExcelButton
              title="Payment Transactions"
              subtitle={dateRangeSubtitle(preset, fromDate, toDate)}
              headers={["#", "Payment No", "Date", "Amount", "Method", "Order No", "SSL Transaction ID"]}
              rows={payments.map((p, i) => [
                i + 1,
                p.paymentNumber,
                p.paymentDate,
                parseFloat(p.amount),
                p.paymentMethod.name,
                p.order?.orderNo || "",
                p.sslPaymentId || "",
              ])}
              summary={[
                { label: "Total Payments", value: String(payments.length) },
                {
                  label: "Total Amount",
                  value: formatCurrencyEnglish(
                    payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
                    0
                  ),
                },
              ]}
              fileName="order-payments"
            />
            <LazyPdfDownloadLink
              document={<PaymentReportPDF payments={payments} settings={settings} />}
              fileName={`order-payments-${new Date().toISOString().split("T")[0]}.pdf`}
            />
          </div>
        )}
      </div>

      {/* Filters — shared single-row filter bar (identical on all report pages) */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        extraLabel="Order Status"
        extra={
          <Select
            value={selectedOrderStatus || "all"}
            onValueChange={setSelectedOrderStatus}
          >
            <SelectTrigger className="w-full md:w-44 md:shrink-0">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={OrderStatus.PROCESSING}>
                Processing
              </SelectItem>
              <SelectItem value={OrderStatus.ON_HOLD}>
                On Hold
              </SelectItem>
              <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
              <SelectItem value={OrderStatus.DELIVERED}>
                Delivered
              </SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>
                Cancelled
              </SelectItem>
              <SelectItem value={OrderStatus.RETURNED}>Returned</SelectItem>
            </SelectContent>
          </Select>
        }
        onApply={handleFilterApply}
        onClear={handleFilterClear}
      />

      {/* Summary */}
      {payments.length > 0 && (
        <div className="mb-4 grid grid-cols-2 2xl:grid-cols-4 gap-3">
          <StatsCard
            title="Payment Transactions"
            value={String(payments.length)}
            count={formatCurrencyEnglish(
              payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
              0
            )}
            description="Total payment transactions"
            icon={CreditCard}
            bgColor="blue"
          />
          <StatsCard
            title="Total Amount"
            value={formatCurrencyEnglish(
              payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
              0
            )}
            count={String(payments.length)}
            description="Sum of all payments"
            icon={CreditCard}
            bgColor="green"
          />
          <StatsCard
            title="Paid Orders"
            value={String(
              payments.filter((p) => p.order?.paymentStatus === "paid")
                .length
            )}
            count={formatCurrencyEnglish(
              payments
                .filter((p) => p.order?.paymentStatus === "paid")
                .reduce((sum, p) => sum + parseFloat(p.amount), 0),
              0
            )}
            description="Fully paid orders"
            icon={CheckCircle}
            bgColor="purple"
          />
          <StatsCard
            title="Payment Methods"
            value={String([...new Set(payments.map((p) => p.paymentMethod.name))].length)}
            count={formatCurrencyEnglish(
              payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
              0
            )}
            description="Different payment methods used"
            icon={Layers}
            bgColor="orange"
          />
        </div>
      )}

      {/* Search + table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        {/* Search bar — server-side, filters by order no / customer name / mobile */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order no, customer name, mobile…"
              className="h-9 pl-8 text-xs"
            />
          </div>
          <PillBadge className="shrink-0 font-medium tabular-nums">
            {payments.length} payment{payments.length === 1 ? "" : "s"}
          </PillBadge>
        </div>

        <div className="overflow-x-auto">
          <Table className="report-table table-fixed min-w-220 text-sm [&_th]:text-xs [&_td]:text-[13px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[11%] pl-4">Order No</TableHead>
                <TableHead className="w-[11%]">Payment No</TableHead>
                <TableHead className="w-[11%]">Customer Name</TableHead>
                <TableHead className="w-[11%]">Mobile Number</TableHead>
                <TableHead className="w-[11%]">Date</TableHead>
                <TableHead className="w-[11%] pr-3 text-right">Amount</TableHead>
                <TableHead className="w-[11%] pl-3">Method</TableHead>
                <TableHead className="w-[12%]">SSL Transaction ID</TableHead>
                <TableHead className="w-[12%] pr-4">Created By</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchInput.trim()
                      ? "No payments match your search"
                      : "No payments found"}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4">
                      {p.order ? (
                        <Link
                          href={`/admin/order/${p.order.orderNo}/view`}
                          className="font-mono text-sm font-semibold whitespace-nowrap text-primary hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        >
                          {p.order.orderNo}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Order deleted
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[13px]">
                      {p.paymentNumber}
                    </TableCell>
                    <TableCell>
                      <span className="block truncate text-sm font-medium">
                        {p.order?.user?.name || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.order?.user?.mobileNumber ? (
                        <a
                          href={`tel:${p.order.user.mobileNumber}`}
                          className="whitespace-nowrap text-sm text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {p.order.user.mobileNumber}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        {/* Two-line stack keeps the column narrow */}
                        <span className="whitespace-nowrap text-[13px]">
                          {new Date(p.paymentDate).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Dhaka",
                          })}
                        </span>
                        <span className="block whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(p.paymentDate).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Dhaka",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-3 text-right">
                      <span className="font-semibold tabular-nums">
                        {formatCurrencyEnglish(parseFloat(p.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="pl-3">
                      <Badge
                        variant="outline"
                        title={p.paymentMethod?.name || undefined}
                        className={`capitalize ${getPaymentMethodColor(p.paymentMethod?.name)}`}
                      >
                        <span className="flex items-center gap-1.5">
                          {getPaymentMethodIcon(p.paymentMethod?.name || "")}
                          {p.paymentMethod?.name || "N/A"}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {p.sslPaymentId || "—"}
                    </TableCell>
                    <TableCell className="pr-4">
                      {p.createdBy ? p.createdBy.name : "System"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
