import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

export interface OrderNotificationData {
  orderId: string;
  orderNo: string;
  userId: string;
  orderStatus: string;
  paymentStatus: string;
  totalValue: number;
  items?: any[];
  user?: any;
  address?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class NotificationService {
  constructor(private notificationGateway: NotificationGateway) {}

  // Notify admins about new order
  notifyNewOrder(order: OrderNotificationData) {
    this.notificationGateway.emitNewOrder(order);
  }

  // Notify user about order confirmation
  notifyOrderConfirmation(userId: string, order: OrderNotificationData) {
    this.notificationGateway.emitOrderConfirmation(userId, order);
  }

  // Notify user about order status change
  notifyOrderStatusUpdate(userId: string, order: OrderNotificationData) {
    this.notificationGateway.emitOrderStatusUpdate(userId, order);
  }

  // Notify user about payment status change
  notifyPaymentStatusUpdate(userId: string, order: OrderNotificationData) {
    this.notificationGateway.emitPaymentStatusUpdate(userId, order);
  }

  // Send custom notification to user
  notifyUser(userId: string, notification: any) {
    this.notificationGateway.emitUserNotification(userId, notification);
  }

  // Send broadcast notification to all users
  notifyBroadcast(notification: any) {
    this.notificationGateway.emitBroadcast(notification);
  }
}
