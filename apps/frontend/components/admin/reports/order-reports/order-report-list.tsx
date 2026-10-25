"use client";

import { OrderStatus } from "@/common/enums";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { PageHeader } from "@/components/admin/page-header";
import { PdfDownloadButton } from "@/components/admin/reports/pdf-download-button";
import {
  ReportDateFilters,
  type ReportFilterParams,
} from "@/components/admin/reports/report-date-filters";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { PaymentStatus } from "@/utils/types";
import { Eye, ShoppingCart, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderReportPDF } from "./order-report-pdf";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

interface Customer {
  name: string;
  mobileNumber: string;
  email: string;
}
interface ShippingAddress {
  address: string;
  area: string;
  city: string;
  division: string;
}
interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
export interface Order {
  id: number;
  orderNo: string;
  orderStatus: string;
  paymentStatus: string;
  totalValue: number;
  totalDiscount: number;
  paidAmount: number;
  orderDate: string;
  customer: Customer;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: string;
  items: OrderItem[];
}
interface OrderReportProps {
  orders: Order[];
  fromDate?: string;
  toDate?: string;
  preset?: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalOrders: number;
  totalValue: number;
  totalDiscount: number;
  totalPaid: number;
}

export default function OrderReportList({
  orders,
  fromDate,
  toDate,
  preset,
  orderStatus,
  paymentStatus,
  totalOrders,
  totalValue,
  totalDiscount,
  totalPaid,
}: OrderReportProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const settings = useBusinessSettings();

  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>(
    orderStatus || "all"
  );
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>(
    paymentStatus || "all"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFilterApply = (params: ReportFilterParams) => {
    const qs = new URLSearchParams();
    if (params.preset) qs.set("preset", params.preset);
    if (params.fromDate) qs.set("fromDate", params.fromDate);
    if (params.toDate) qs.set("toDate", params.toDate);
    if (selectedOrderStatus && selectedOrderStatus !== "all")
      qs.set("orderStatus", selectedOrderStatus);
    if (selectedPaymentStatus && selectedPaymentStatus !== "all")
      qs.set("paymentStatus", selectedPaymentStatus);
    router.push(`?${qs.toString()}`);
  };

  const handleFilterClear = () => {
    setSelectedOrderStatus("all");
    setSelectedPaymentStatus("all");
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <PageHeader
            title="Sales Report"
          />
        </div>
        {orders.length > 0 && mounted && (
          <PDFDownloadLink
            document={<OrderReportPDF orders={orders} settings={settings} />}
            fileName={`order-report-${new Date().toISOString().split("T")[0]}.pdf`}
          >
            {({ loading, error }) => (
              <PdfDownloadButton loading={loading} error={error} />
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Filters — shared single-row filter bar (identical on all report pages) */}
      <ReportDateFilters
        preset={preset}
        fromDate={fromDate}
        toDate={toDate}
        extra={
          <>
            <Select
              value={selectedOrderStatus || "all"}
              onValueChange={setSelectedOrderStatus}
            >
              <SelectTrigger className="w-full md:w-40 md:shrink-0">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Status</SelectItem>
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
            <Select
              value={selectedPaymentStatus || "all"}
              onValueChange={setSelectedPaymentStatus}
            >
              <SelectTrigger className="w-full md:w-42.5 md:shrink-0">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={PaymentStatus.PARTIAL}>Partial</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                <SelectItem value={PaymentStatus.NEED_REFUND}>
                  Need Refund
                </SelectItem>
                <SelectItem value={PaymentStatus.PARTIAL_REFUND}>
                  Partial Refund
                </SelectItem>
                <SelectItem value={PaymentStatus.REFUND_COMPLETE}>
                  Refund Complete
                </SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        onApply={handleFilterApply}
        onClear={handleFilterClear}
      />

      {/* Summary */}
      {orders.length > 0 && (
        <div className="mb-4 grid grid-cols-2 2xl:grid-cols-4 gap-3">
          <StatsCard
            title="Total Orders"
            value={formatCurrencyEnglish(totalValue, 0)}
            count={String(totalOrders)}
            description="All orders in this period"
            icon={ShoppingCart}
            bgColor="blue"
          />
          <StatsCard
            title="Total Value"
            value={formatCurrencyEnglish(totalValue, 0)}
            count={String(totalOrders)}
            description="Sum of order values"
            icon={ShoppingCart}
            bgColor="green"
          />
          <StatsCard
            title="Total Discount"
            value={formatCurrencyEnglish(totalDiscount, 0)}
            count={String(totalOrders)}
            description="Total discounts given"
            icon={Wallet}
            bgColor="orange"
          />
          <StatsCard
            title="Total Paid"
            value={formatCurrencyEnglish(totalPaid, 0)}
            count={String(totalOrders)}
            description="Total amount paid"
            icon={Wallet}
            bgColor="purple"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto capitalize">
        <Table>
          <TableHeader>
            <TableRow>

              <TableHead>Order No</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-muted-foreground"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.orderNo}>

                  <TableCell>{o.orderNo}</TableCell>
                  <TableCell>{o.orderStatus}</TableCell>
                  <TableCell>{o.paymentStatus}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(o.orderDate)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrencyEnglish(o.totalValue)}</TableCell>
                  <TableCell>{formatCurrencyEnglish(o.paidAmount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/order/${o.id}/view`}>
                        <Eye className="h-4 w-4" />
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
