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
interface Order {
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
  totalOrders,
  totalValue,
  totalDiscount,
  totalPaid,
}: OrderReportProps) {
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

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("fromDate", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.set("toDate", format(endDate, "yyyy-MM-dd"));
    if (selectedOrderStatus && selectedOrderStatus !== "all")
      params.set("orderStatus", selectedOrderStatus);
    router.push(`?${params.toString()}`);
  };

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

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setQuickRange("");
    setSelectedOrderStatus("all");
    router.push("?");
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

  return (
    <div className="w-full">
      <PageHeader
        title="Order Reports"
        description="Filter, view, and export order reports"
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
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

          <Button onClick={handleFilter}>Filter</Button>
          {(startDate || endDate || selectedOrderStatus !== "all") && (
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          )}
        </div>

        {orders.length > 0 && mounted && (
          <PDFDownloadLink
            document={<OrderReportPDF orders={orders} />}
            fileName={`order-report-${new Date().toISOString().split("T")[0]}.pdf`}
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
      {orders.length > 0 && (
        <div className="mb-4 grid grid-cols-2 2xl:grid-cols-4 gap-3">
          <StatsCard
            title="Total Orders"
            value={formatCurrencyEnglish(totalValue)}
            count={String(totalOrders)}
            description="All orders in this period"
            icon={ShoppingCart}
            bgColor="blue"
          />
          <StatsCard
            title="Total Value"
            value={formatCurrencyEnglish(totalValue)}
            count={String(totalOrders)}
            description="Sum of order values"
            icon={ShoppingCart}
            bgColor="green"
          />
          <StatsCard
            title="Total Discount"
            value={formatCurrencyEnglish(totalDiscount)}
            count={String(totalOrders)}
            description="Total discounts given"
            icon={Wallet}
            bgColor="orange"
          />
          <StatsCard
            title="Total Paid"
            value={formatCurrencyEnglish(totalPaid)}
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
                  <TableCell>{format(new Date(o.orderDate), "PPpp")}</TableCell>
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
