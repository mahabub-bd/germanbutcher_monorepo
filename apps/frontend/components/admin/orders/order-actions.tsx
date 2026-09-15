"use client";

import { AddPaymentModal } from "@/components/admin/orders/add-payment-modal";
import {
  CancelOrderModal,
  canCancelOrder,
} from "@/components/admin/orders/cancel-order-modal";
import { EditOrderModal } from "@/components/admin/orders/edit-order-modal";
import { OrderStatusBadges } from "@/components/admin/orders/order-status-badges";
import { RefundModal } from "@/components/admin/orders/refund-modal";
import { Button } from "@/components/ui/button";
import type { Order } from "@/utils/types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileEdit,
  Printer,
  RefreshCw,
  X,
} from "lucide-react";
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
  onPrevOrder?: () => void;
  onNextOrder?: () => void;
  onCancelSuccess?: () => void;
  onRefundSuccess?: () => void;
  onEditSuccess?: () => void;
  onPaymentSuccess?: () => void;
}

// Compact on mobile (single-line header, tight buttons), relaxed from sm up.
const btnClass = "h-9 text-xs sm:h-8";

export function OrderActions({
  order,
  onGeneratePDF,
  onThermalPrint,
  onBack,
  onPrevOrder,
  onNextOrder,
  onCancelSuccess,
  onRefundSuccess,
  onEditSuccess,
  onPaymentSuccess,
}: OrderActionsProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // canRefundOrder only passes for need_refund orders
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
    <div className="w-full rounded-lg border bg-card p-2 sm:p-4">
      {/* Line 1: order context and navigation. Icon-only nav on mobile keeps it to one line. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b pb-2 sm:gap-3 sm:pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="whitespace-nowrap text-base font-bold sm:text-lg">
            #{order.orderNo}
          </h1>
          <OrderStatusBadges
            orderStatus={order.orderStatus}
            paymentStatus={order.paymentStatus}
          />
        </div>

        {(onPrevOrder || onNextOrder || onBack) && (
          <div className="flex shrink-0 items-center gap-1">
            {(onPrevOrder || onNextOrder) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevOrder}
                  disabled={!onPrevOrder}
                  className={btnClass}
                  aria-label="Previous order"
                  title="Previous order"
                >
                  <ChevronLeft className="size-3.5" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextOrder}
                  disabled={!onNextOrder}
                  className={btnClass}
                  aria-label="Next order"
                  title="Next order"
                >
                  <span className="hidden sm:inline">Next </span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </>
            )}

            {onBack && (
              <Button

                size="sm"
                onClick={onBack}
                className={btnClass}
                aria-label="Back to Order List"
                title="Back to Order List"
              >
                <ArrowLeft className="size-3.5" />
                <span className="hidden sm:inline">Order List</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Line 2: actions — right-aligned. Icon-only on mobile keeps it to one line. */}
      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 sm:pt-3">
        {/* Refund */}
        {canRefund && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRefundModal(true)}
            className={btnClass}
            aria-label="Refund"
            title="Refund"
          >
            <RefreshCw className="size-3.5" />
            <span className="hidden sm:inline">Refund</span>
          </Button>
        )}

        {!isNeedRefundOnly && (
          <>
            {/* Cancel */}
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className={btnClass}
                aria-label="Cancel order"
                title="Cancel order"
              >
                <X className="size-3.5" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            )}

            {/* Edit */}
            {order.orderStatus !== "delivered" &&
              order.orderStatus !== "cancelled" && (
                <Button
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className={btnClass}
                  aria-label="Edit order"
                  title="Edit order"
                >
                  <FileEdit className="size-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}

            {/* Payment */}
            {order.paymentStatus !== "completed" &&
              order.paymentStatus !== "need_refund" &&
              order.paymentStatus !== "refund_complete" &&
              order.orderStatus !== "cancelled" && (
                <Button
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                  className={btnClass}
                  aria-label="Payment"
                  title="Payment"
                >
                  <CreditCard className="size-3.5" />
                  <span className="hidden sm:inline">Payment</span>
                </Button>
              )}

            {/* Print - Only show if onThermalPrint is provided */}
            {onThermalPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleThermalPrint}
                disabled={isPrinting}
                className={btnClass}
                aria-label="Print"
                title="Print"
              >
                {isPrinting ? (
                  <>
                    <Clock className="size-3.5 animate-spin" />
                    <span className="hidden sm:inline">Printing...</span>
                  </>
                ) : (
                  <>
                    <Printer className="size-3.5" />
                    <span className="hidden sm:inline">Print</span>
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
              className={btnClass}
              aria-label="Download PDF"
              title="Download PDF"
            >
              {isGeneratingPDF ? (
                <>
                  <Clock className="size-3.5 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">PDF</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>

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

      <EditOrderModal
        orderId={order.id}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onUpdated={() => onEditSuccess?.()}
      />

      <AddPaymentModal
        orderId={order.id}
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onUpdated={() => onPaymentSuccess?.()}
      />
    </div>
  );
}
