"use client";

import {
  CancelOrderModal,
  canCancelOrder,
} from "@/components/admin/orders/cancel-order-modal";
import { OrderStatusBadges } from "@/components/admin/orders/order-status-badges";
import { RefundModal } from "@/components/admin/orders/refund-modal";
import { Button } from "@/components/ui/button";
import type { Order } from "@/utils/types";
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Download,
  FileEdit,
  Printer,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Check if an order can be refunded
 * Order must have payment status of "need_refund" and have payments with paid amount
 */
export function canRefundOrder(order: Order): boolean {
  const hasPayments = !!(order.payments && order.payments.length > 0);
  const hasPaidAmount = order.paidAmount > 0;
  const isNeedRefund = order.paymentStatus === "need_refund";

  return hasPayments && hasPaidAmount && isNeedRefund;
}

interface OrderActionsProps {
  order: Order;
  onGeneratePDF: () => Promise<void>;
  onThermalPrint?: () => void;
  onBack?: () => void;
  onCancelSuccess?: () => void;
  onRefundSuccess?: () => void;
}

export function OrderActions({
  order,
  onGeneratePDF,
  onThermalPrint,
  onBack,
  onCancelSuccess,
  onRefundSuccess,
}: OrderActionsProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const canCancel = canCancelOrder(order);
  const canRefund = canRefundOrder(order);
  const isNeedRefundOnly = order.paymentStatus === "need_refund";

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await onGeneratePDF();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleThermalPrint = () => {
    if (!onThermalPrint) return;
    setIsPrinting(true);
    try {
      onThermalPrint();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="w-full border rounded-lg bg-card p-3">
      {/* Main Action Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Section: Back button, Order #, and Status Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="hover:bg-primary/10 h-8 w-8"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold whitespace-nowrap">
              #{order.orderNo}
            </h1>
            <OrderStatusBadges
              orderStatus={order.orderStatus}
              paymentStatus={order.paymentStatus}
            />
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isNeedRefundOnly ? (
            <>
              {/* Only show Refund button when payment status is need_refund */}
              {canRefund && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRefundModal(true)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <RefreshCw className="size-3.5" />
                  <span className="xs:inline">Refund</span>
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Refund */}
              {canRefund && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRefundModal(true)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <RefreshCw className="size-3.5" />
                  <span className="xs:inline">Refund</span>
                </Button>
              )}

              {/* Cancel */}
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <X className="size-3.5" />
                  <span className="xs:inline">Cancel</span>
                </Button>
              )}

              {/* Edit */}
              {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                <Link href={`/admin/order/${order.id}/edit`}>
                  <Button size="sm" className="gap-1.5 h-8 text-xs">
                    <FileEdit className="size-3.5" />
                    <span className="xs:inline">Edit</span>
                  </Button>
                </Link>
              )}

              {/* Update Payment */}
              {order.paymentStatus !== "completed" && order.paymentStatus !== "need_refund" && order.paymentStatus !== "refund_complete" && order.orderStatus !== "cancelled" && (
                <Link href={`/admin/order/${order.id}/payment`}>
                  <Button size="sm" className="gap-1.5 h-8 text-xs">
                    <CreditCard className="size-3.5" />
                    <span className="xs:inline">Payment</span>
                  </Button>
                </Link>
              )}

              {/* Print - Only show if onThermalPrint is provided */}
              {onThermalPrint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleThermalPrint}
                  disabled={isPrinting}
                  className="gap-1.5 h-8 text-xs"
                >
                  {isPrinting ? (
                    <>
                      <Clock className="size-3.5 animate-spin" />
                      <span className="xs:inline">Printing...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="size-3.5" />
                      <span className=" xs:inline">Print</span>
                    </>
                  )}
                </Button>
              )}

              {/* PDF */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="gap-1.5 h-8 text-xs"
              >
                {isGeneratingPDF ? (
                  <>
                    <Clock className="size-3.5 animate-spin" />
                    <span className="xs:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-3.5" />
                    <span className="xs:inline">PDF</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CancelOrderModal
        order={order}
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onCancelSuccess={() => {
          onCancelSuccess?.();
          setShowCancelModal(false);
        }}
      />

      <RefundModal
        order={order}
        open={showRefundModal}
        onOpenChange={setShowRefundModal}
        onSuccess={() => {
          onRefundSuccess?.();
          setShowRefundModal(false);
        }}
      />
    </div>
  );
}
