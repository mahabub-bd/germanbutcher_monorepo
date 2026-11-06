"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountPageHeader } from "@/components/user-account/account-page-header";
import { useCartContext } from "@/contexts/cart-context";
import { useBusinessSettings } from "@/hooks/use-business-settings";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { downloadOrderInvoice } from "@/utils/invoice-download";
import {
  getOrderStatusColor,
  getPaymentMethodColor,
  getPaymentMethodIcon,
  getPaymentStatusColor,
  getStatusIcon,
} from "@/utils/order-helper";
import { Order } from "@/utils/types";
import {
  FileText,
  Loader2,
  Repeat,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import PayNow from "../payment/pay-now";

interface MyOrderProps {
  orders: Order[];
}

const OrderTable = ({ orders }: MyOrderProps) => {
  const params = useParams();
  const userId = params.id as string;
  const settings = useBusinessSettings();
  const { addManyItems } = useCartContext();


  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [invoicingId, setInvoicingId] = useState<number | null>(null);

  const sortedOrders = [...(orders ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const detailHref = (id: number) => `/user/${userId}/order/${id}`;

  const handleReorder = async (order: Order) => {
    setReorderingId(order.id);
    try {
      await addManyItems(
        order.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        }))
      );
    } finally {
      setReorderingId(null);
    }
  };

  const handleInvoice = async (order: Order) => {
    setInvoicingId(order.id);
    try {
      await downloadOrderInvoice(order, settings);
    } finally {
      setInvoicingId(null);
    }
  };


  const shouldShowPayNow = (order: Order): boolean => {
    if (order.orderStatus === "cancelled") return false;
    const status = (order.paymentStatus || "").toLowerCase();
    if (status === "paid" || status === "completed") return false;
    return Number(order.paidAmount || 0) < Number(order.totalValue || 0);
  };

  const emptyState = (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <ShoppingCart className="h-7 w-7" />
        </span>
        <div>
          <h3 className="font-semibold text-gray-900">No orders yet</h3>
          <p className="text-sm text-muted-foreground">
            When you place an order it will show up here.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <AccountPageHeader title="My Orders" />

      {sortedOrders.length === 0 ? (
        emptyState
      ) : (
        <>
          {/* Mobile: one compact card per order */}
          <div className="space-y-3 md:hidden">
            {sortedOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={detailHref(order.id)}
                      className="font-medium text-gray-900 hover:text-primaryColor"
                    >
                      {order.orderNo}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 capitalize ${getOrderStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {getStatusIcon(order.orderStatus)}
                      {order.orderStatus}
                    </span>
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="font-semibold text-gray-900">
                    ৳{formatCurrencyEnglish(order.totalValue || 0)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`capitalize ${getPaymentStatusColor(
                      order.paymentStatus
                    )}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {getStatusIcon(order.paymentStatus)}
                      {order.paymentStatus}
                    </span>
                  </Badge>
                  <Badge
                    variant="outline"
                    title={order.paymentMethod?.name || undefined}
                    className={`max-w-40 truncate capitalize ${getPaymentMethodColor(
                      order.paymentMethod?.name
                    )}`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      {getPaymentMethodIcon(order.paymentMethod?.name || "")}
                      <span className="truncate">
                        {order.paymentMethod?.name || "N/A"}
                      </span>
                    </span>
                  </Badge>
                </div>

                {shouldShowPayNow(order) && (
                  <div className="mt-3">
                    <PayNow order={order} />
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleReorder(order)}
                    disabled={reorderingId === order.id}
                  >
                    {reorderingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Repeat className="mr-1 h-4 w-4" />
                    )}
                    Buy Again
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleInvoice(order)}
                    disabled={invoicingId === order.id}
                  >
                    {invoicingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-1 h-4 w-4" />
                    )}
                    Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>


          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <Table className="min-w-220 text-sm [&_td]:py-2.5 [&_th]:h-10 lg:min-w-0">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="whitespace-nowrap">
                          <Link
                            href={detailHref(order.id)}
                            className="font-medium text-gray-900 transition-colors hover:text-primaryColor"
                          >
                            {order.orderNo}
                          </Link>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`capitalize ${getOrderStatusColor(
                              order.orderStatus
                            )}`}
                          >
                            <span className="flex items-center gap-1.5">
                              {getStatusIcon(order.orderStatus)}
                              {order.orderStatus}
                            </span>
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`capitalize ${getPaymentStatusColor(
                              order.paymentStatus
                            )}`}
                          >
                            <span className="flex items-center gap-1.5">
                              {getStatusIcon(order.paymentStatus)}
                              {order.paymentStatus}
                            </span>
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            title={order.paymentMethod?.name || undefined}
                            className={`max-w-36 truncate capitalize lg:max-w-none ${getPaymentMethodColor(
                              order.paymentMethod?.name
                            )}`}
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              {getPaymentMethodIcon(
                                order.paymentMethod?.name || ""
                              )}
                              <span className="truncate">
                                {order.paymentMethod?.name || "N/A"}
                              </span>
                            </span>
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right font-medium whitespace-nowrap">
                          ৳{formatCurrencyEnglish(order.totalValue || 0)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {shouldShowPayNow(order) && (
                              <PayNow order={order} className="h-8" />
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleReorder(order)}
                              disabled={reorderingId === order.id}
                              title="Buy again"
                            >
                              {reorderingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Repeat className="mr-1 h-4 w-4" />
                              )}
                              Buy Again
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleInvoice(order)}
                              disabled={invoicingId === order.id}
                              title="Download invoice"
                            >
                              {invoicingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="mr-1 h-4 w-4" />
                              )}
                              Invoice
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderTable;
