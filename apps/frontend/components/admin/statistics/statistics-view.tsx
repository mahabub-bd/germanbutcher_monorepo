"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { formatCurrencyEnglish } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import {
  getPaymentMethodColor,
  getPaymentMethodIcon,
} from "@/utils/order-helper";
import type { DeliveryMan } from "@/utils/types";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  MapPin,
  Package,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface OrderStatistics {
  totalOrders: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  pendingValue: number;
  processingValue: number;
  shippedValue: number;
  deliveredValue: number;
  cancelledValue: number;
}

interface PaymentMethodShare {
  name: string;
  orderCount: number;
  totalValue: number;
}

interface TodaySnapshot {
  todayOrders: number;
  todayValue: number;
  yesterdayOrders: number;
  yesterdayValue: number;
}

interface PaymentDue {
  dueOrders: number;
  dueAmount: number;
}

interface StockSummary {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
}

interface BestsellerProduct {
  id: number;
  name: string;
  sellingPrice: string;
  stock: number;
  saleCount: number;
  isActive: boolean;
}

interface SalesPointStatistics {
  overview: {
    total: number;
    totalActive: number;
    totalInactive: number;
  };
  byDivision: { division: string; total: number; active: number }[];
  bySalesPoint: {
    salesPointId: number;
    salesPointName: string;
    totalShops: number;
    activeShops: number;
  }[];
}

export function StatisticsView() {
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [bestsellers, setBestsellers] = useState<BestsellerProduct[]>([]);
  const [paymentMethodShare, setPaymentMethodShare] = useState<
    PaymentMethodShare[]
  >([]);
  const [todaySnapshot, setTodaySnapshot] = useState<TodaySnapshot | null>(
    null
  );
  const [paymentDue, setPaymentDue] = useState<PaymentDue | null>(null);
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [salesPointStats, setSalesPointStats] =
    useState<SalesPointStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [
          orders,
          stock,
          topProducts,
          deliveryMenData,
          salesPoints,
          methodShare,
          today,
          dues,
        ] = await Promise.all([
          fetchProtectedData<OrderStatistics>("orders/reports/statistics"),
          fetchProtectedData<StockSummary>("products/reports/stock-summary"),
          fetchProtectedData<BestsellerProduct[]>(
            "products/bestsellers?limit=10"
          ),
          fetchProtectedData<DeliveryMan[]>("delivery-man"),
          fetchProtectedData<SalesPointStatistics>(
            "sales-point-shops/statistics"
          ),
          fetchProtectedData<PaymentMethodShare[]>(
            "orders/reports/payment-methods"
          ),
          fetchProtectedData<TodaySnapshot>("orders/reports/today"),
          fetchProtectedData<PaymentDue>("orders/reports/payment-due"),
        ]);
        if (cancelled) return;
        setOrderStats(orders);
        setStockSummary(stock);
        setPaymentMethodShare(Array.isArray(methodShare) ? methodShare : []);
        setTodaySnapshot(today);
        setPaymentDue(dues);
        setBestsellers(Array.isArray(topProducts) ? topProducts : []);
        setDeliveryMen(Array.isArray(deliveryMenData) ? deliveryMenData : []);
        setSalesPointStats(salesPoints);
      } catch (err) {
        console.error("Error loading statistics:", err);
        if (!cancelled) setError("Failed to load statistics.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeDeliveryMen = deliveryMen.filter((d) => d.isActive);
  const totalDeliveries = deliveryMen.reduce(
    (sum, d) => sum + (d.totalDeliveries || 0),
    0
  );
  const totalEarnings = deliveryMen.reduce(
    (sum, d) => sum + Number(d.totalEarnings || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Loading statistics…
      </div>
    );
  }

  if (error) {
    return <div className="py-24 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Order Statistics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> Order Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatsCard
            icon={ShoppingCart}
            title="Total Orders"
            value={orderStats?.totalOrders ?? 0}
            bgColor="blue"
          />
          <StatsCard
            icon={Clock}
            title="Pending"
            value={orderStats?.pending ?? 0}
            count={formatCurrencyEnglish(orderStats?.pendingValue || 0)}
            bgColor="amber"
          />
          <StatsCard
            icon={Boxes}
            title="Processing"
            value={orderStats?.processing ?? 0}
            count={formatCurrencyEnglish(orderStats?.processingValue || 0)}
            bgColor="purple"
          />
          <StatsCard
            icon={Truck}
            title="Shipped"
            value={orderStats?.shipped ?? 0}
            count={formatCurrencyEnglish(orderStats?.shippedValue || 0)}
            bgColor="indigo"
          />
          <StatsCard
            icon={PackageCheck}
            title="Delivered"
            value={orderStats?.delivered ?? 0}
            count={formatCurrencyEnglish(orderStats?.deliveredValue || 0)}
            bgColor="green"
          />
          <StatsCard
            icon={XCircle}
            title="Cancelled"
            value={orderStats?.cancelled ?? 0}
            count={formatCurrencyEnglish(orderStats?.cancelledValue || 0)}
            bgColor="red"
          />
        </div>
      </section>

      {/* Revenue & Payments */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Revenue &amp; Payments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            icon={DollarSign}
            title="Today's Revenue"
            value={formatCurrencyEnglish(todaySnapshot?.todayValue || 0)}
            count={`${todaySnapshot?.todayOrders ?? 0} orders`}
            bgColor="green"
          />
          <StatsCard
            icon={Clock}
            title="Yesterday's Revenue"
            value={formatCurrencyEnglish(todaySnapshot?.yesterdayValue || 0)}
            count={`${todaySnapshot?.yesterdayOrders ?? 0} orders`}
            bgColor="blue"
          />
          <StatsCard
            icon={AlertTriangle}
            title="Payment Due"
            value={formatCurrencyEnglish(paymentDue?.dueAmount || 0)}
            count={`${paymentDue?.dueOrders ?? 0} delivered orders`}
            bgColor="red"
          />
          <StatsCard
            icon={CreditCard}
            title="Payment Methods"
            value={paymentMethodShare.length}
            count="methods in use"
            bgColor="purple"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethodShare.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No payment data found
                  </TableCell>
                </TableRow>
              ) : (
                paymentMethodShare.map((m) => {
                  const totalRevenue = paymentMethodShare.reduce(
                    (sum, item) => sum + Number(item.totalValue || 0),
                    0
                  );
                  const share =
                    totalRevenue > 0
                      ? ((Number(m.totalValue || 0) / totalRevenue) * 100).toFixed(
                          1
                        )
                      : "0.0";
                  return (
                    <TableRow key={m.name}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${getPaymentMethodColor(m.name)}`}
                        >
                          <span className="flex items-center gap-1.5">
                            {getPaymentMethodIcon(m.name)}
                            {m.name}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.orderCount}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrencyEnglish(Number(m.totalValue || 0))}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {share}%
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Product Statistics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" /> Product Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            icon={Package}
            title="Total Products"
            value={stockSummary?.totalProducts ?? 0}
            bgColor="blue"
          />
          <StatsCard
            icon={AlertTriangle}
            title="Out of Stock"
            value={stockSummary?.outOfStock ?? 0}
            bgColor="red"
          />
          <StatsCard
            icon={TrendingUp}
            title="Low Stock (< 5)"
            value={stockSummary?.lowStock ?? 0}
            bgColor="amber"
          />
          <StatsCard
            icon={TrendingUp}
            title="Top Seller Units Sold"
            value={bestsellers[0]?.saleCount ?? 0}
            count={bestsellers[0]?.name}
            bgColor="purple"
            className="sm:col-span-3"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bestsellers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No sales data found
                  </TableCell>
                </TableRow>
              ) : (
                bestsellers.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(Number(p.sellingPrice || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.stock ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.saleCount ?? 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Deliveryman Statistics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" /> Deliveryman Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            icon={Truck}
            title="Delivery Men"
            value={deliveryMen.length}
            count={`${activeDeliveryMen.length} active`}
            bgColor="blue"
          />
          <StatsCard
            icon={PackageCheck}
            title="Total Deliveries"
            value={totalDeliveries}
            bgColor="green"
          />
          <StatsCard
            icon={CheckCircle2}
            title="Total Earnings"
            value={formatCurrencyEnglish(totalEarnings)}
            bgColor="purple"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Deliveries</TableHead>
                <TableHead className="text-right">Total Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryMen.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No delivery men found
                  </TableCell>
                </TableRow>
              ) : (
                deliveryMen.map((man) => (
                  <TableRow key={man.id}>
                    <TableCell className="font-medium">{man.name}</TableCell>
                    <TableCell className="text-sm">
                      {man.mobileNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          man.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }
                      >
                        {man.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {man.totalDeliveries || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyEnglish(Number(man.totalEarnings || 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Sales Point Statistics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Sales Point Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            icon={MapPin}
            title="Total Shops"
            value={salesPointStats?.overview?.total ?? 0}
            count={`${salesPointStats?.overview?.totalActive ?? 0} active`}
            bgColor="blue"
          />
          <StatsCard
            icon={CheckCircle2}
            title="Active Shops"
            value={salesPointStats?.overview?.totalActive ?? 0}
            bgColor="green"
          />
          <StatsCard
            icon={XCircle}
            title="Inactive Shops"
            value={salesPointStats?.overview?.totalInactive ?? 0}
            bgColor="red"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Point</TableHead>
                  <TableHead className="text-right">Total Shops</TableHead>
                  <TableHead className="text-right">Active Shops</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(salesPointStats?.bySalesPoint ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No sales points found
                    </TableCell>
                  </TableRow>
                ) : (
                  salesPointStats?.bySalesPoint.map((sp) => (
                    <TableRow key={sp.salesPointId}>
                      <TableCell className="font-medium">
                        {sp.salesPointName}
                      </TableCell>
                      <TableCell className="text-right">
                        {sp.totalShops}
                      </TableCell>
                      <TableCell className="text-right">
                        {sp.activeShops}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Division</TableHead>
                  <TableHead className="text-right">Total Shops</TableHead>
                  <TableHead className="text-right">Active Shops</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(salesPointStats?.byDivision ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No division data found
                    </TableCell>
                  </TableRow>
                ) : (
                  salesPointStats?.byDivision.map((row) => (
                    <TableRow key={row.division}>
                      <TableCell className="font-medium capitalize">
                        {row.division}
                      </TableCell>
                      <TableCell className="text-right">{row.total}</TableCell>
                      <TableCell className="text-right">
                        {row.active}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
