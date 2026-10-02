import { Check, CheckCircle, Clock, X, XCircle } from "lucide-react";
import { PaymentStatusConfig, PaymentStatusOption } from "./types";

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatusOption, PaymentStatusConfig> =
  {
    success: {
      title: "Payment Successful!",
      description:
        "Thank you for your order. Your payment has been processed successfully.",
      icon: CheckCircle,
      iconColor: "text-white",
      iconFill: "fill-green-500",
      pingClass: "bg-green-400",
      badgeIcon: Check,
      badgeGradient: "bg-linear-to-br from-green-400 to-emerald-600",
      badgeShadow: "shadow-lg shadow-green-500/40",
      bgGradient: "from-emerald-50 via-white to-sky-50",
      cardBg: "bg-green-50/60",
      cardBorder: "border-green-200",
      badgeClass: "bg-green-100 text-green-700 border-green-200",
      actionText: "Continue Shopping",
    },
    failed: {
      title: "Payment Failed",
      description:
        "We're sorry, but your payment could not be processed. Please try again or use a different payment method.",
      icon: XCircle,
      iconColor: "text-white",
      iconFill: "fill-red-500",
      pingClass: "bg-red-400",
      badgeIcon: X,
      badgeGradient: "bg-linear-to-br from-red-400 to-rose-600",
      badgeShadow: "shadow-lg shadow-red-500/40",
      bgGradient: "from-red-50 via-white to-orange-50",
      cardBg: "bg-red-50/60",
      cardBorder: "border-red-200",
      badgeClass: "bg-red-100 text-red-700 border-red-200",
      actionText: "Try Again",
    },
    canceled: {
      title: "Payment Canceled",
      description:
        "Your payment was canceled. You can try again whenever you're ready, or choose a different payment method.",
      icon: Clock,
      iconColor: "text-white",
      iconFill: "fill-orange-400",
      pingClass: "bg-orange-400",
      badgeIcon: Clock,
      badgeGradient: "bg-linear-to-br from-orange-400 to-amber-500",
      badgeShadow: "shadow-lg shadow-orange-500/40",
      bgGradient: "from-orange-50 via-white to-yellow-50",
      cardBg: "bg-orange-50/60",
      cardBorder: "border-orange-200",
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
      actionText: "Try Again",
    },
  };
