export enum AddressType {
  SHIPPING = 'shipping',
  BILLING = 'billing',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  NEED_REFUND = 'need_refund',
  REFUND_COMPLETE = 'refund_complete',
  PARTIAL_REFUND = 'partial_refund',
}

export enum PaymentType {
  PAYMENT = 'payment',
  REFUND = 'refund',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum ContactStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum ActionTaken {
  REPLIED_VIA_EMAIL = 'replied_via_email',
  CALLED_CUSTOMER = 'called_customer',
  PROVIDED_PRODUCT_INFO = 'provided_product_info',
  ISSUE_RESOLVED = 'issue_resolved',
  ORDER_PLACED = 'order_placed',
  REFUND_PROCESSED = 'refund_processed',
  OTHER = 'other',
}

export enum DateRangePreset {
  TODAY = 'today',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  THIS_YEAR = 'this_year',
}

export enum CancellationReason {
  CUSTOMER_REQUEST = 'customer_request',
  OUT_OF_STOCK = 'out_of_stock',
  PAYMENT_FAILED = 'payment_failed',
  FRAUDULENT_ORDER = 'fraudulent_order',
  SHIPPING_DELAY = 'shipping_delay',
  PRICE_ERROR = 'price_error',
  DUPLICATE_ORDER = 'duplicate_order',
  OTHER = 'other',
}
