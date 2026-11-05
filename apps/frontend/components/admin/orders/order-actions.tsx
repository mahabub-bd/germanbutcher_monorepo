"use client";

import { AddPaymentModal } from "@/components/admin/orders/add-payment-modal";
import {
  CancelOrderModal,
  canCancelOrder,
} from "@/components/admin/orders/cancel-order-modal";
import { EditOrderModal } from "@/components/admin/orders/edit-order-modal";
import { RefundModal } from "@/components/admin/orders/refund-modal";

import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDateTime } from "@/lib/utils";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
  getStatusIcon,
} from "@/utils/order-helper";
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
  ShoppingCart,
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
      visible:
        can(MENU_URL, "canCreate") &&
        // Backend enforces the refunds module permission on POST /payment/refund
        can("/admin/reports/refunds", "canCreate") &&
        canRefund,
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

  // Mockup-style action tile: rounded icon square with the label underneath.
  const renderTile = (
    key: React.Key,
    icon: React.ReactNode,
    label: string,
    tileClass: string,
    props: {
      onClick?: () => void;
      disabled?: boolean;
      ariaLabel?: string;
    } = {}
  ) => (
    <div key={key} className="flex w-14 flex-col items-center gap-1 sm:w-16">
      <Button
        onClick={props.onClick}
        disabled={props.disabled}
        aria-label={props.ariaLabel ?? label}
        title={props.ariaLabel ?? label}
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl p-0 sm:size-12",
          tileClass
        )}
      >
        {icon}
      </Button>
      <span className="max-w-full truncate text-xs text-foreground">
        {label}
      </span>
    </div>
  );

  return (
    <section className="w-full overflow-hidden rounded-sm border bg-card shadow-sm">
      <div className="p-3 sm:p-4 lg:px-5">
        {/* Header: cart icon tile + order no + copy */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor sm:size-12">
            <ShoppingCart className="size-5 sm:size-6" />
          </div>
          <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-2xl">
            {order.orderNo}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyOrderId}
            className="size-8 shrink-0 rounded-lg bg-muted p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Copy order ID"
            title="Copy order ID"
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>

        {/* Status / Payment pills in two labeled columns; vertical divider
            on sm+ via border on the first column. */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 sm:gap-x-0">
          <div className="sm:border-r sm:border-border/70 sm:pr-6">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Order Status
            </p>
            <Badge
              className={cn(
                "mt-1 px-3 py-1 text-xs font-semibold sm:text-sm",
                getOrderStatusColor(order.orderStatus)
              )}
            >
              <span className="mr-1">{getStatusIcon(order.orderStatus)}</span>
              <span className="truncate capitalize">{order.orderStatus}</span>
            </Badge>
          </div>
          <div className="sm:pl-6">
            <p className="text-xs text-muted-foreground sm:text-sm">Payment</p>
            <Badge
              className={cn(
                "mt-1 px-3 py-1 text-xs font-semibold sm:text-sm",
                getPaymentStatusColor(order.paymentStatus)
              )}
            >
              <span className="mr-1">
                {getStatusIcon(order.paymentStatus)}
              </span>
              <span className="truncate capitalize">
                {order.paymentStatus}
              </span>
            </Badge>
            {order.createdAt && (
              <span className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
                Placed {formatDateTime(order.createdAt)}
              </span>
            )}
          </div>
        </div>

        <div className="my-3 h-px bg-border/70" />

        {/* Actions + navigation tiles, centered on mobile, right-aligned on lg */}
        <div className="flex flex-wrap items-start justify-center gap-x-1.5 gap-y-3 sm:gap-x-3 lg:justify-end">
          {visibleActions.length > 0 && (
            <>
              {/* md+: every action as a tile */}
              <div className="flex flex-wrap items-start gap-x-1.5 gap-y-3 max-md:hidden sm:gap-x-3">
                {visibleActions.map((action) =>
                  renderTile(
                    action.id,
                    actionIcon(action, "size-5"),
                    actionLabel(action),
                    action.danger
                      ? "bg-red-100 text-destructive hover:bg-red-100/80 dark:bg-red-950/50 dark:text-red-400"
                      : action.accent
                        ? accentButtonClasses[action.accent]
                        : "bg-muted text-foreground hover:bg-muted/70",
                    { onClick: action.onClick, disabled: action.disabled }
                  )
                )}
              </div>

              {/* Mobile: CTAs + More overflow */}
              <div className="flex items-start gap-1.5 md:hidden">
                {primaryActions.map((action) =>
                  renderTile(
                    action.id,
                    actionIcon(action, "size-5"),
                    actionLabel(action),
                    action.accent
                      ? accentButtonClasses[action.accent]
                      : "bg-muted text-foreground hover:bg-muted/70",
                    { onClick: action.onClick, disabled: action.disabled }
                  )
                )}

                {overflowActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex w-14 flex-col items-center gap-1">
                        <Button
                          className="flex size-11 items-center justify-center rounded-2xl bg-muted p-0 text-foreground hover:bg-muted/70 sm:size-12"
                          aria-label="More menu"
                          title="More menu"
                        >
                          <MoreHorizontal className="size-5" />
                        </Button>
                        <span className="text-xs text-foreground">More</span>
                      </div>
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
                "flex items-start gap-1.5 sm:gap-3",
                visibleActions.length > 0 &&
                "border-border/70 pl-1.5 sm:border-l sm:pl-3"
              )}
            >
              {(onPrevOrder || onNextOrder) && (
                <>
                  {renderTile(
                    "prev",
                    <ArrowLeft className="size-5" />,
                    "Previous",
                    "bg-red-100 text-red-600 hover:bg-red-100/80 dark:bg-red-950/50 dark:text-red-400",
                    { onClick: onPrevOrder, disabled: !onPrevOrder }
                  )}
                  {renderTile(
                    "next",
                    <ArrowRight className="size-5" />,
                    "Next",
                    "bg-red-100 text-red-600 hover:bg-red-100/80 dark:bg-red-950/50 dark:text-red-400",
                    { onClick: onNextOrder, disabled: !onNextOrder }
                  )}
                </>
              )}
              {onBack &&
                renderTile(
                  "list",
                  <List className="size-5" />,
                  "Order List",
                  "bg-red-700 text-white hover:bg-red-800",
                  { onClick: onBack }
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
