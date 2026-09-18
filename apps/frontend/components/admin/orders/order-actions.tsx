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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import type { Order } from "@/utils/types";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  FileEdit,
  Loader2,
  MoreHorizontal,
  Printer,
  RefreshCw,
  X
} from "lucide-react";
import { Fragment, useState } from "react";

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

// Per-action color coding, aligned with the status hues in order-helper:
// green=payment, blue=edit, orange=refund, violet=print, sky=export.
type Accent = "green" | "blue" | "orange" | "violet" | "sky";

const accentButtonClasses: Record<Accent, string> = {
  green: "bg-green-600 text-white hover:bg-green-700",
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  orange:
    "border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-500/60 dark:text-orange-400 dark:hover:bg-orange-950/40 dark:hover:text-orange-300",
  violet:
    "text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/40 dark:hover:text-violet-300",
  sky: "text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/40 dark:hover:text-sky-300",
};

const accentMenuClasses: Record<Accent, string> = {
  green: "text-green-600 dark:text-green-400",
  blue: "text-blue-600 dark:text-blue-400",
  orange: "text-orange-600 dark:text-orange-400",
  violet: "text-violet-600 dark:text-violet-400",
  sky: "text-sky-600 dark:text-sky-400",
};

// Single source of truth for every action; rendered as buttons on sm+ and as
// primary buttons + an overflow menu on mobile.
interface ActionConfig {
  id: string;
  label: string;
  loadingLabel?: string;
  icon: LucideIcon;
  variant: "default" | "outline" | "secondary" | "destructive";
  /** Optional color coding, applied to buttons (sm+ and mobile) and menu items. */
  accent?: Accent;
  onClick: () => void;
  visible: boolean;
  /** Destructive actions render separated on sm+ and as a red menu item on mobile. */
  danger?: boolean;
  /** Stays visible as a tappable CTA on mobile instead of moving into the menu. */
  mobilePrimary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

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

  const actions: ActionConfig[] = [
    {
      id: "payment",
      label: "Payment",
      icon: CreditCard,
      variant: "default",
      accent: "green",
      onClick: () => setShowPaymentModal(true),
      visible:
        !isNeedRefundOnly &&
        order.paymentStatus !== "completed" &&
        order.paymentStatus !== "need_refund" &&
        order.paymentStatus !== "refund_complete" &&
        order.orderStatus !== "cancelled",
      mobilePrimary: true,
    },
    {
      id: "edit",
      label: "Edit",
      icon: FileEdit,
      variant: "default",
      accent: "blue",
      onClick: () => setShowEditModal(true),
      visible:
        !isNeedRefundOnly &&
        order.orderStatus !== "delivered" &&
        order.orderStatus !== "cancelled",
      mobilePrimary: true,
    },
    {
      id: "refund",
      label: "Refund",
      icon: RefreshCw,
      variant: "outline",
      accent: "orange",
      onClick: () => setShowRefundModal(true),
      visible: canRefund,
    },
    {
      id: "print",
      label: "Print",
      loadingLabel: "Printing...",
      icon: Printer,
      variant: "outline",
      accent: "violet",
      onClick: handleThermalPrint,
      visible: !isNeedRefundOnly && !!onThermalPrint,
      disabled: isPrinting,
      loading: isPrinting,
    },
    {
      id: "pdf",
      label: "PDF",
      loadingLabel: "Generating...",
      icon: Download,
      variant: "outline",
      accent: "sky",
      onClick: handleGeneratePDF,
      visible: !isNeedRefundOnly,
      disabled: isGeneratingPDF,
      loading: isGeneratingPDF,
    },
    {
      id: "cancel",
      label: "Cancel",
      icon: X,
      variant: "destructive",
      onClick: () => setShowCancelModal(true),
      visible: !isNeedRefundOnly && canCancel,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((a) => a.visible);
  const primaryActions = visibleActions.filter((a) => a.mobilePrimary);
  const overflowActions = visibleActions.filter((a) => !a.mobilePrimary);

  return (
    <div className="w-full rounded-lg border bg-card p-2 sm:p-4">
      {/* Line 1: back on the far left (mobile convention), order context,
          prev/next grouped on the right. Icon-only nav on mobile keeps it to one line. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b pb-2 sm:gap-3 sm:pb-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">

          <h1 className="whitespace-nowrap text-base font-bold sm:text-lg">
            {order.orderNo}
          </h1>
          <OrderStatusBadges
            orderStatus={order.orderStatus}
            paymentStatus={order.paymentStatus}
          />
        </div>

        {(onPrevOrder || onNextOrder) && (
          <div className="flex shrink-0 items-center gap-1">
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
          </div>
        )}
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className={`${btnClass} -ml-1 shrink-0`}
            aria-label="Back to Order List"
            title="Back to Order List"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Order List</span>
          </Button>
        )}
      </div>

      {/* Line 2: order meta on the left, actions on the right. Mobile shows
          1-2 primary CTAs plus an overflow menu instead of six icon buttons. */}
      {(visibleActions.length > 0 || order.createdAt) && (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 sm:justify-between sm:pt-3">
          <div className="hidden min-w-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span>{formatDateTime(order.createdAt)}</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/40" />
            <span>{order.items?.length ?? 0} items</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/40" />
            <span className="font-semibold text-foreground">
              {formatCurrencyEnglish(order.totalValue || 0)}
            </span>
          </div>

          {/* sm+: full action row, destructive separated at the far end */}
          {visibleActions.length > 0 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {visibleActions.map((action) => (
                <Fragment key={action.id}>
                  {action.danger && (
                    <div
                      aria-hidden="true"
                      className="mx-1 h-6 w-px bg-border"
                    />
                  )}
                  <Button
                    variant={action.variant}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      btnClass,
                      action.accent && accentButtonClasses[action.accent]
                    )}
                    aria-label={action.label}
                    title={action.label}
                  >
                    {action.loading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <action.icon className="size-3.5" />
                    )}
                    <span>
                      {action.loading ? action.loadingLabel : action.label}
                    </span>
                  </Button>
                </Fragment>
              ))}
            </div>
          )}

          {/* Mobile: primary CTAs + overflow menu */}
          {visibleActions.length > 0 && (
            <div className="flex items-center gap-1.5 sm:hidden">
              {primaryActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                  className={cn(
                    "h-9 px-3 text-xs",
                    action.accent && accentButtonClasses[action.accent]
                  )}
                  aria-label={action.label}
                  title={action.label}
                >
                  <action.icon className="size-3.5" />
                  <span>{action.label}</span>
                </Button>
              ))}

              {overflowActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      aria-label="More actions"
                      title="More actions"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {overflowActions.map((action) => (
                      <Fragment key={action.id}>
                        {action.danger && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          variant={action.danger ? "destructive" : "default"}
                          onClick={action.onClick}
                          className={
                            action.accent
                              ? accentMenuClasses[action.accent]
                              : undefined
                          }
                        >
                          <action.icon className="size-3.5" />
                          {action.label}
                        </DropdownMenuItem>
                      </Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      )}

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
