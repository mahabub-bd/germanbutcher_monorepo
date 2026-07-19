export interface OrderSmsData {
  orderNo: string;
  customerName: string;
  totalValue: number;
  itemCount: number;
}

export function generateOrderConfirmationSMS(data: OrderSmsData): string {
 return `Dear ${data.customerName}, Your order (${data.orderNo}) is confirmed. Total: ${data.totalValue}. We'll notify you once it ships. German Butcher.`;

}
