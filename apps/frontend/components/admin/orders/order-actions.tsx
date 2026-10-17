"use client";

import { AddPaymentModal } from "@/components/admin/orders/add-payment-modal";
import {
  CancelOrderModal,
  canCancelOrder,
} from "@/components/admin/orders/cancel-order-modal";
import { EditOrderModal } from "@/components/admin/orders/edit-order-modal";
import { OrderStatusBadges } from "@/components/admin/orders/order-status-badges";
import { RefundModal } from "@/components/admin/orders/refund-modal";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDateTime } from "@/lib/utils";
import type { Order } from "@/utils/types";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Download,
  FileEdit,
  List,
  Loader2,
  MoreHorizontal,
  Printer,
  RefreshCw,
  X
} from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";

/**
 * Check if an order can be refunded
 * Order must have payments with paid amount and be in a refundable state:
 * a refund-pending status, or a cancelled order still marked as paid money
 * (guards against stale payment statuses from older cancel logic).
 */
export function canRefundOrder(order: Order): boolean {
  const hasPayments = !!(order.payments && order.payments.length > 0);
  const hasPaidAmount = order.paidAmount > 0;
  const isRefundableStatus =
    order.paymentStatus === "need_refund" ||
    order.paymentStatus === "partial_refund" ||
    (order.orderStatus === "cancelled" &&
      (order.paymentStatus === "paid" ||
        order.paymentStatus === "completed" ||
        order.paymentStatus === "partial"));

  return hasPayments && hasPaidAmount && isRefundableStatus;
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

// Compact on mobile, relaxed from sm up.
const btnClass = "h-9 text-xs sm:h-8";

// Color is reserved for the actions that need it: solid green/blue for the
// two CTAs, orange outline for the money-sensitive refund, neutral outline
// for utility actions, destructive for cancel.
type Accent = "green" | "blue" | "orange";

const accentButtonClasses: Record<Accent, string> = {
  green: "bg-green-600 text-white hover:bg-green-700",
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  orange:
    "border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-500/60 dark:text-orange-400 dark:hover:bg-orange-950/40 dark:hover:text-orange-300",
};

const accentMenuClasses: Record<Accent, string> = {
  green: "text-green-600 dark:text-green-400",
  blue: "text-blue-600 dark:text-blue-400",
  orange: "text-orange-600 dark:text-orange-400",
};

// Single source of truth for every action; rendered as labeled buttons on
// md+, as icon-only CTAs + an overflow menu on smaller screens.
interface ActionConfig {
  id: string;
  label: string;
  loadingLabel?: string;
  icon: LucideIcon;
  variant: "default" | "outline" | "secondary" | "destructive";
  /** Optional color coding, applied to buttons (md+ and mobile) and menu items. */
  accent?: Accent;
  onClick: () => void;
  visible: boolean;
  /** Destructive actions render separated on md+ and as a red menu item on mobile. */
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
  const MENU_URL = "/admin/orders";
  const { can } = usePermissions();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNo);
      setCopied(true);
      toast.success("Order ID copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy order ID");
    }
  };

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
        can(MENU_URL, "canCreate") &&
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
        can(MENU_URL, "canEdit") &&
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
      visible: can(MENU_URL, "canCreate") && canRefund,
    },
    {
      id: "print",
      label: "Print",
      loadingLabel: "Printing...",
      icon: Printer,
      variant: "outline",
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
      visible: can(MENU_URL, "canCreate") && !isNeedRefundOnly && canCancel,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((a) => a.visible);
  const primaryActions = visibleActions.filter((a) => a.mobilePrimary);
  const overflowActions = visibleActions.filter((a) => !a.mobilePrimary);
  const hasNav = !!(onPrevOrder || onNextOrder || onBack);

  const actionIcon = (action: ActionConfig, className?: string) =>
    action.loading ? (
      <Loader2 className={cn("animate-spin", className)} />
    ) : (
      <action.icon className={className} />
    );

  const actionLabel = (action: ActionConfig) =>
    action.loading ? action.loadingLabel ?? action.label : action.label;

  return (
    <section className="w-full overflow-hidden rounded-sm border bg-card shadow-sm">
      {/* Compact single-row header: identity + actions + navigation */}
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-5">
        {/* Identity: order no, status badges, inline meta */}
        <div className="flex min-w-0 items-center gap-2.5">

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="truncate text-sm font-bold tracking-tight sm:text-base">
                {order.orderNo}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyOrderId}
                className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Copy order ID"
                title="Copy order ID"
              >
                {copied ? (
                  <Check className="size-3 text-green-600" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
              <OrderStatusBadges
                orderStatus={order.orderStatus}
                paymentStatus={order.paymentStatus}
              />
              {order.createdAt && (
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  Placed {formatDateTime(order.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions + navigation, centered on mobile, right-aligned on lg */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:justify-end">
          {visibleActions.length > 0 && (
            <>
              {/* md+: labeled buttons, destructive visually separated */}
              <div className="hidden flex-wrap items-center gap-1.5 md:flex">
                {visibleActions.map((action) => (
                  <Fragment key={action.id}>
                    {action.danger && (
                      <div aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
                    )}
                    <Button
                      variant={action.variant}
                      size="sm"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        btnClass,
                        "w-9 px-0",
                        action.accent && accentButtonClasses[action.accent]
                      )}
                      aria-label={action.label}
                      title={action.label}
                    >
                      {actionIcon(action, "size-3")}
                    </Button>
                  </Fragment>
                ))}
              </div>

              {/* Mobile: icon-only CTAs + overflow menu */}
              <div className="flex items-center gap-1.5 md:hidden">
                {primaryActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      "size-9 rounded-md p-0",
                      action.accent && accentButtonClasses[action.accent]
                    )}
                    aria-label={actionLabel(action)}
                    title={actionLabel(action)}
                  >
                    {actionIcon(action, "size-4")}
                  </Button>
                ))}

                {overflowActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="size-9 p-0"
                        aria-label="More actions"
                        title="More actions"
                      >
                        <MoreHorizontal className="size-4" />
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
                            <action.icon className="size-3" />
                            {action.label}
                          </DropdownMenuItem>
                        </Fragment>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </>
          )}

          {hasNav && (
            <div
              className={cn(
                "flex items-center gap-1 sm:gap-1.5",
                visibleActions.length > 0 &&
                "border-border/70 pl-1.5 sm:border-l sm:pl-2"
              )}
            >
              {(onPrevOrder || onNextOrder) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrevOrder}
                    disabled={!onPrevOrder}
                    className="h-9 bg-primaryColor/10 px-2.5 text-xs text-primaryColor hover:bg-primaryColor/20 hover:text-primaryColor sm:px-3"
                    aria-label="Previous order"
                    title="Previous order"
                  >
                    <ArrowLeft className="size-3" />

                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNextOrder}
                    disabled={!onNextOrder}
                    className="h-9 bg-primaryColor/10 px-2.5 text-xs text-primaryColor hover:bg-primaryColor/20 hover:text-primaryColor sm:px-3"
                    aria-label="Next order"
                    title="Next order"
                  >

                    <ArrowRight className="size-3" />
                  </Button>
                </>
              )}
              {onBack && (
                <Button
                  size="sm"
                  onClick={onBack}
                  className="h-9 bg-primaryColor px-2.5 text-xs text-white hover:bg-primaryColor/90 sm:px-3"
                  aria-label="Back to Order List"
                  title="Back to Order List"
                >
                  <List className="size-3" />
                  <span className="hidden sm:inline">Order List</span>
                </Button>
              )}
            </div>
          )}
        </div>
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
    </section>
  );
}
