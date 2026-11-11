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
import { CheckCircle, CreditCard, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  order: OrderSummary;
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
}: {
  payments: PaymentRecord[];
  fromDate?: string;
  toDate?: string;
  preset?: string;
  orderStatus?: string;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const settings = useBusinessSettings();

  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>(
    orderStatus || "all"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- filter handlers (shared date-range bar + local order status) ---
  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    if (selectedOrderStatus && selectedOrderStatus !== "all")
      qs.set("orderStatus", selectedOrderStatus);
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
                p.order.orderNo,
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
              payments.filter((p) => p.order.paymentStatus === "paid")
                .length
            )}
            count={formatCurrencyEnglish(
              payments
                .filter((p) => p.order.paymentStatus === "paid")
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

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="report-table min-w-180 text-sm [&_th]:text-sm [&_td]:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Payment No</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Method</TableHead>
              <TableHead className="text-xs">
                Order
              </TableHead>
              <TableHead className="text-xs">SSL Transaction ID</TableHead>
              <TableHead className="text-xs">
                Created By
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.paymentNumber}</TableCell>
                  <TableCell>{p.paymentDate}</TableCell>
                  <TableCell>
                    {formatCurrencyEnglish(parseFloat(p.amount))}
                  </TableCell>
                  <TableCell>
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
                  <TableCell>
                    <Link
                      href={`/admin/order/${p.order.orderNo}/view`}
                      className="font-medium hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                    >
                      {p.order.orderNo}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {p.sslPaymentId || "—"}
                  </TableCell>
                  <TableCell>
                    {p.createdBy ? p.createdBy.name : "System"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
