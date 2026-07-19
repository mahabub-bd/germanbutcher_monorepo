"use client";

import { DateRangePreset, OrderStatus } from "@/common/enums";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { formatCurrencyEnglish } from "@/lib/utils";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { CheckCircle, CreditCard, Eye, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentReportPDF } from "./PaymentReportPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

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
interface PaymentRecord {
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

  const [startDate, setStartDate] = useState<Date | undefined>(
    fromDate ? new Date(fromDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    toDate ? new Date(toDate) : undefined
  );
  const [quickRange, setQuickRange] = useState<string>(preset || "");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>(
    orderStatus || "all"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- handle filter ---
  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("fromDate", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("toDate", format(endDate, "yyyy-MM-dd"));
    if (selectedOrderStatus && selectedOrderStatus !== "all")
      params.set("orderStatus", selectedOrderStatus);
    router.push(`?${params.toString()}`);
  };

  // --- quick range handler ---
  const handleQuickRange = (value: string) => {
    setQuickRange(value);
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    switch (value) {
      case DateRangePreset.TODAY:
        from = today;
        to = today;
        break;
      case DateRangePreset.THIS_WEEK:
        from = startOfWeek(today, { weekStartsOn: 6 });
        to = endOfWeek(today, { weekStartsOn: 6 });
        break;
      case DateRangePreset.LAST_WEEK:
        from = subWeeks(startOfWeek(today, { weekStartsOn: 6 }), 1);
        to = subWeeks(endOfWeek(today, { weekStartsOn: 6 }), 1);
        break;
      case DateRangePreset.THIS_MONTH:
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case DateRangePreset.LAST_MONTH:
        const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case DateRangePreset.LAST_3_MONTHS:
        from = subMonths(today, 3);
        to = today;
        break;
      case DateRangePreset.LAST_6_MONTHS:
        from = subMonths(today, 6);
        to = today;
        break;
      case DateRangePreset.LAST_YEAR:
        from = subYears(today, 1);
        to = today;
        break;
      case DateRangePreset.THIS_YEAR:
        from = new Date(today.getFullYear(), 0, 1);
        to = today;
        break;
      default:
        from = undefined;
        to = undefined;
    }

    setStartDate(from);
    setEndDate(to);

    const params = new URLSearchParams();
    if (value) params.set("preset", value);
    if (selectedOrderStatus && selectedOrderStatus !== "all")
      params.set("orderStatus", selectedOrderStatus);
    router.push(`?${params.toString()}`);
  };

  const handleOrderStatusChange = (value: string) => {
    setSelectedOrderStatus(value);
    const params = new URLSearchParams();
    if (quickRange) params.set("preset", quickRange);
    if (startDate) params.set("fromDate", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("toDate", format(endDate, "yyyy-MM-dd"));
    if (value && value !== "all") params.set("orderStatus", value);
    router.push(`?${params.toString()}`);
  };

  // --- clear filter ---
  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setQuickRange("");
    setSelectedOrderStatus("all");
    router.push("?");
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Order Payments"
        description="Filter, view, and export payment records"
      />

      {/* Filters + Export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Range Dropdown */}
          <Select value={quickRange} onValueChange={handleQuickRange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Quick Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DateRangePreset.TODAY}>Today</SelectItem>
              <SelectItem value={DateRangePreset.THIS_WEEK}>This Week</SelectItem>
              <SelectItem value={DateRangePreset.LAST_WEEK}>Last Week</SelectItem>
              <SelectItem value={DateRangePreset.THIS_MONTH}>This Month</SelectItem>
              <SelectItem value={DateRangePreset.LAST_MONTH}>Last Month</SelectItem>
              <SelectItem value={DateRangePreset.LAST_3_MONTHS}>
                Last 3 Months
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_6_MONTHS}>
                Last 6 Months
              </SelectItem>
              <SelectItem value={DateRangePreset.LAST_YEAR}>Last Year</SelectItem>
              <SelectItem value={DateRangePreset.THIS_YEAR}>This Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Order Status Dropdown */}
          <Select
            value={selectedOrderStatus || "all"}
            onValueChange={handleOrderStatusChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={OrderStatus.PROCESSING}>
                Processing
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

          {/* Manual Date Pickers */}
          <DatePicker
            value={startDate}
            onChange={(date) => setStartDate(date)}
            placeholder="From Date"
            className="w-[200px]"
          />
          <DatePicker
            value={endDate}
            onChange={(date) => setEndDate(date)}
            placeholder="To Date"
            className="w-[200px]"
          />

          <Button onClick={handleFilter} variant="default">
            Filter
          </Button>
          {(startDate || endDate || selectedOrderStatus !== "all") && (
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          )}
        </div>

        {payments.length > 0 && mounted && (
          <PDFDownloadLink
            document={<PaymentReportPDF payments={payments} />}
            fileName={`order-payments-${new Date().toISOString().split("T")[0]}.pdf`}
          >
            {({ loading, error }) => (
              <Button variant="secondary" disabled={!!error}>
                {error ? "PDF Error" : loading ? "Generating PDF..." : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Summary */}
      {payments.length > 0 && (
        <div className="mb-4 grid grid-cols-2 2xl:grid-cols-4 gap-3">
          <StatsCard
            title="Payments"
            value={String(payments.length)}
            count={formatCurrencyEnglish(
              payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
            )}
            description="Total payment transactions"
            icon={CreditCard}
            bgColor="blue"
          />
          <StatsCard
            title="Total Amount"
            value={formatCurrencyEnglish(
              payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
            )}
            count={String(payments.length)}
            description="Sum of all payments"
            icon={CreditCard}
            bgColor="green"
          />
          <StatsCard
            title="Completed Orders"
            value={String(
              payments.filter((p) => p.order.paymentStatus === "completed")
                .length
            )}
            count={formatCurrencyEnglish(
              payments
                .filter((p) => p.order.paymentStatus === "completed")
                .reduce((sum, p) => sum + parseFloat(p.amount), 0)
            )}
            description="Fully paid orders"
            icon={CheckCircle}
            bgColor="purple"
          />
          <StatsCard
            title="Payment Methods"
            value={String([...new Set(payments.map((p) => p.paymentMethod.name))].length)}
            count={formatCurrencyEnglish(
              payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
            )}
            description="Different payment methods used"
            icon={Layers}
            bgColor="orange"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Payment No</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Method</TableHead>
              <TableHead className="text-xs hidden md:table-cell">
                Order
              </TableHead>
              <TableHead className="text-xs hidden lg:table-cell">
                Created By
              </TableHead>
              <TableHead className="text-right text-xs">Action</TableHead>
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
                  <TableCell>{p.paymentMethod.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {p.order.orderNo}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {p.createdBy ? p.createdBy.name : "System"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/order/${p.order.id}/payments`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
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
