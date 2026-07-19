"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyEnglish } from "@/lib/utils";
import { fetchProtectedData } from "@/utils/api-utils";
import { Order } from "@/utils/types";
import { ArrowLeft, CheckCircle, Clock, DollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentsTable } from "./payment-table";

export default function OrderPaymentsListPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await fetchProtectedData<Order>(`orders/${orderId}`);
        setOrder(response);
      } catch (error) {
        console.error("Error fetching order data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

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
    <div className="w-full border rounded-sm">
      <div className="md:p-4 p-2">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <PageHeader
            title={`Payments for Order #${order.orderNo}`}
            description="Manage and track payment details"
          />

          <div className="flex gap-3">
            <Button variant="secondary" asChild>
              <Link href="/admin/orders" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Orders</span>
              </Link>
            </Button>

            {remainingAmount > 0 && (
              <Button asChild>
                <Link
                  href={`/admin/order/${orderId}/payment`}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Payment</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Compact Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Total Value Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Value
                  </p>
                  <p className="text-lg font-bold">
                    {formatCurrencyEnglish(order.totalValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paid Amount Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Paid Amount
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrencyEnglish(order.paidAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remaining Amount Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${remainingAmount > 0 ? "bg-orange-100" : "bg-green-100"}`}
                >
                  <Clock
                    className={`h-5 w-5 ${remainingAmount > 0 ? "text-orange-600" : "text-green-600"}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Remaining
                  </p>
                  <p
                    className={`text-lg font-bold ${remainingAmount > 0 ? "text-orange-600" : "text-green-600"}`}
                  >
                    {formatCurrencyEnglish(remainingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="md:p-6 p-2">
        <PaymentsTable payments={order.payments ?? []} />
      </div>
    </div>
  );
}
