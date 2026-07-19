import {
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Smartphone,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";
import { OrderStatus } from "./types";

/**
 * Get badge color classes for order status
 */
const getOrderStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case OrderStatus.PENDING:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case OrderStatus.PROCESSING:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case OrderStatus.SHIPPED:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case OrderStatus.DELIVERED:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

/**
 * Get badge color classes for payment status
 */
const getPaymentStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "refunded":
    case "refund_complete":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "need_refund":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "partial":
    case "partial_refund":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

/**
 * Get icon for status (order or payment)
 */
const getStatusIcon = (status: string): React.ReactNode => {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
    case OrderStatus.DELIVERED:
      return <CheckCircle className="size-3" />;
    case OrderStatus.PENDING:
    case "pending":
      return <Clock className="size-3" />;
    case OrderStatus.PROCESSING:
      return <Package className="size-3" />;
    case OrderStatus.CANCELLED:
    case "failed":
      return <XCircle className="size-3" />;
    case OrderStatus.SHIPPED:
      return <Truck className="size-3" />;
    case "refunded":
    case "refund_complete":
    case "need_refund":
      return <RefreshCw className="size-3" />;
    default:
      return null;
  }
};

/**
 * Get dot color for status indicators
 */
const getStatusDotColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case OrderStatus.PENDING:
    case "pending":
      return "bg-yellow-500";
    case OrderStatus.PROCESSING:
      return "bg-blue-500";
    case OrderStatus.SHIPPED:
      return "bg-purple-500";
    case OrderStatus.DELIVERED:
    case "paid":
    case "completed":
      return "bg-green-500";
    case OrderStatus.CANCELLED:
    case "failed":
      return "bg-red-500";
    case "refunded":
    case "refund_complete":
      return "bg-orange-500";
    case "need_refund":
      return "bg-amber-500";
    case "partial":
    case "partial_refund":
      return "bg-cyan-500";
    default:
      return "bg-gray-500";
  }
};

/**
 * Get badge color classes for payment method
 */
const getPaymentMethodColor = (method: string): string => {
  if (!method) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

  switch (method.toLowerCase()) {
    case "cash on delivery":
    case "cod":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "sslcommerz":
    case "ssl_commarz":
    case "ssl commerz":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "bkash":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
    case "nagad":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "rocket":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

/**
 * Get icon for payment method
 */
const getPaymentMethodIcon = (method: string): React.ReactNode => {
  if (!method) return null;

  switch (method.toLowerCase()) {
    case "cash on delivery":
    case "cod":
      return <Banknote className="size-3" />;
    case "sslcommerz":
    case "ssl_commarz":
    case "ssl commerz":
      return <CreditCard className="size-3" />;
    case "bkash":
    case "nagad":
    case "rocket":
      return <Smartphone className="size-3" />;
    default:
      return <Wallet className="size-3" />;
  }
};

export {
  getOrderStatusColor,
  getPaymentMethodColor,
  getPaymentMethodIcon,
  getPaymentStatusColor,
  getStatusDotColor,
  getStatusIcon
};

