"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { AddPaymentModal } from "@/components/admin/orders/add-payment-modal";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { Button } from "@/components/ui/button";
import { formatCurrencyEnglish } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import { listSlugToRoute } from "@/utils/order-list-routes";
import { Order } from "@/utils/types";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PaymentsTable } from "./payment-table";

function OrderPaymentsListPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  const fetchOrderData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchProtectedData<Order>(`orders/${orderId}`);
      setOrder(response);
    } catch (error) {
      console.error("Error fetching order data:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // The list page (order-list.tsx) appends its route/page/filters to detail
  // links. "Back to Orders" rebuilds that URL so the user returns to the
  // exact page they left, instead of always landing on page 1.
  const buildListUrl = () => {
    const listSlug = searchParams.get("from");
    const from = listSlug ? listSlugToRoute(listSlug) : "/admin/orders";
    const restore = new URLSearchParams();
    const page = searchParams.get("page");
    const search = searchParams.get("search");
    const status = searchParams.get("orderStatus");
    if (page) restore.set("page", page);
    if (search) restore.set("search", search);
    if (status && status !== "all") restore.set("orderStatus", status);
    const qs = restore.toString();
    return qs ? `${from}?${qs}` : from;
  };

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  if (loading) {
    return <LoadingIndicator message="Loading Order Payments" />;
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Payment not found</p>
      </div>
    );
  }

  const remainingAmount = order.totalValue - order.paidAmount;

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">
            Payments for Order #{order.orderNo}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and track payment details
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button variant="outline" asChild>
            <Link href={buildListUrl()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>

          {remainingAmount > 0 && (
            <Button onClick={() => setShowAddPaymentModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          icon={DollarSign}
          title="Total Value"
          value={formatCurrencyEnglish(order.totalValue)}
          bgColor="blue"
        />
        <StatsCard
          icon={CheckCircle2}
          title="Paid Amount"
          value={formatCurrencyEnglish(order.paidAmount)}
          bgColor="green"
        />
        <StatsCard
          icon={Clock}
          title="Remaining"
          value={formatCurrencyEnglish(remainingAmount)}
          bgColor={remainingAmount > 0 ? "orange" : "green"}
        />
      </div>

      {/* Payments table */}
      <section className="rounded-xl border bg-card p-5">
        <PaymentsTable payments={order.payments ?? []} />
      </section>

      <AddPaymentModal
        orderId={Number(orderId)}
        open={showAddPaymentModal}
        onOpenChange={setShowAddPaymentModal}
        onUpdated={fetchOrderData}
      />
    </div>
  );
}

export default function OrderPaymentsListPage() {
  return (
    <Suspense fallback={null}>
      <OrderPaymentsListPageContent />
    </Suspense>
  );
}
