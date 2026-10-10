import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
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
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private notificationGateway: NotificationGateway,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // Notify admins about a new order: realtime emit plus a persisted row
  // in the admin feed (audience 'admin', no recipient user).
  async notifyNewOrder(order: OrderNotificationData) {
    this.notificationGateway.emitNewOrder(order);
    await this.persist({
      userId: null,
      audience: 'admin',
      type: 'newOrder',
      title: 'New order received',
      message: `New order ${order.orderNo} has been placed.`,
      data: order as any,
    });
  }

  // Notify user about order confirmation
  async notifyOrderConfirmation(userId: string, order: OrderNotificationData) {
    this.notificationGateway.emitOrderConfirmation(userId, order);
    await this.persist({
      userId: Number(userId),
      type: 'orderConfirmation',
      title: 'Order confirmed',
      message: `Your order ${order.orderNo} has been confirmed.`,
      data: order as any,
    });
  }

  // Notify user about order status change
  async notifyOrderStatusUpdate(userId: string, order: OrderNotificationData) {
    this.notificationGateway.emitOrderStatusUpdate(userId, order);
    await this.persist({
      userId: Number(userId),
      type: 'orderStatusUpdate',
      title: 'Order status updated',
      message: `Your order ${order.orderNo} status updated to ${order.orderStatus}.`,
      data: order as any,
    });
  }

  // Notify user about payment status change
  async notifyPaymentStatusUpdate(
    userId: string,
    order: OrderNotificationData,
  ) {
    this.notificationGateway.emitPaymentStatusUpdate(userId, order);
    await this.persist({
      userId: Number(userId),
      type: 'paymentStatusUpdate',
      title: 'Payment status updated',
      message: `Payment for order ${order.orderNo} is now ${order.paymentStatus}.`,
      data: order as any,
    });
  }

  // Send custom notification to user
  async notifyUser(userId: string, notification: any) {
    this.notificationGateway.emitUserNotification(userId, notification);
    await this.persist({
      userId: Number(userId),
      type: 'notification',
      title: notification?.title || 'Notification',
      message:
        notification?.message ||
        JSON.stringify(notification ?? {}).slice(0, 500),
      data: notification,
    });
  }

  // Send broadcast notification to all users (userId null = visible to everyone)
  async notifyBroadcast(notification: any) {
    this.notificationGateway.emitBroadcast(notification);
    await this.persist({
      userId: null,
      type: 'broadcast',
      title: notification?.title || 'Announcement',
      message:
        notification?.message ||
        JSON.stringify(notification ?? {}).slice(0, 500),
      data: notification,
    });
  }

  /**
   * Paginated notifications for a user: their own rows plus broadcasts.
   * Admin-feed rows (audience 'admin') never leak into the customer feed.
   */
  async findForUser(userId: number, page = 1, limit = 15) {
    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId OR notification.userId IS NULL', {
        userId,
      })
      .andWhere('notification.audience = :audience', { audience: 'user' })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      message: 'Notifications retrieved successfully',
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepository.count({
      where: [
        { userId, isRead: false },
        { userId: null, audience: 'user', isRead: false },
      ],
    });
  }

  async markAllRead(userId: number) {
    await this.notificationRepository.update(
      [
        { userId, isRead: false },
        { userId: null, audience: 'user', isRead: false },
      ],
      { isRead: true },
    );
    return {
      message: 'All notifications marked as read',
      statusCode: 200,
      data: null,
    };
  }

  async markRead(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    // Recipients mark their own rows; broadcasts (userId null, audience
    // 'user') are shared. Admin-feed rows are out of scope here — admins
    // use the dedicated admin endpoints.
    const isRecipient = notification.userId === userId;
    const isSharedBroadcast =
      notification.userId === null && notification.audience === 'user';
    if (!isRecipient && !isSharedBroadcast) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    await this.notificationRepository.save(notification);
    return {
      message: 'Notification marked as read',
      statusCode: 200,
      data: notification,
    };
  }

  /**
   * Paginated admin feed: new-order alerts and other admin notifications.
   */
  async findForAdmin(page = 1, limit = 15) {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { audience: 'admin' },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      message: 'Admin notifications retrieved successfully',
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getAdminUnreadCount() {
    return this.notificationRepository.count({
      where: { audience: 'admin', isRead: false },
    });
  }

  // Admin rows are shared across the admin team — marking read flips the
  // row for everyone, same semantics as broadcasts for users.
  async markAllAdminRead() {
    await this.notificationRepository.update(
      { audience: 'admin', isRead: false },
      { isRead: true },
    );
    return {
      message: 'All notifications marked as read',
      statusCode: 200,
      data: null,
    };
  }

  async markAdminRead(id: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, audience: 'admin' },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    await this.notificationRepository.save(notification);
    return {
      message: 'Notification marked as read',
      statusCode: 200,
      data: notification,
    };
  }

  /**
   * Save a notification row. Fail-open: a failed insert must never break
   * the order flow or the realtime emit that already happened.
   */
  private async persist(params: {
    userId: number | null;
    audience?: 'user' | 'admin';
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      const notification = this.notificationRepository.create(params);
      await this.notificationRepository.save(notification);
    } catch (error: any) {
      this.logger.error(
        `Failed to persist notification (type=${params.type}, userId=${params.userId}):`,
        error?.message || error,
      );
    }
  }
}
