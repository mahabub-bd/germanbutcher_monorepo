import { CheckCircle, Clock, XCircle } from "lucide-react";
import { PaymentStatusConfig, PaymentStatusOption } from "./types";

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatusOption, PaymentStatusConfig> =
  {
    success: {
      title: "Payment Successful!",
      description:
        "Thank you for your order. Your payment has been processed successfully.",
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgGradient: "from-green-50 to-blue-50",
      cardBg: "bg-green-50/50",
      cardBorder: "border-green-200",
      badgeClass: "bg-green-100 text-green-800 border-green-200",
      actionText: "Continue Shopping",
    },
    failed: {
      title: "Payment Failed",
      description:
        "We're sorry, but your payment could not be processed. Please try again or use a different payment method.",
      icon: XCircle,
      iconColor: "text-red-600",
      bgGradient: "from-red-50 to-orange-50",
      cardBg: "bg-red-50/50",
      cardBorder: "border-red-200",
      badgeClass: "bg-red-100 text-red-800 border-red-200",
      actionText: "Try Again",
    },
    canceled: {
      title: "Payment Canceled",
      description:
        "Your payment was canceled. You can try again whenever you're ready, or choose a different payment method.",
      icon: Clock,
      iconColor: "text-orange-600",
      bgGradient: "from-orange-50 to-yellow-50",
      cardBg: "bg-orange-50/50",
      cardBorder: "border-orange-200",
      badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
      actionText: "Try Again",
    },
  };
