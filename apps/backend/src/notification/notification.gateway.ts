import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from '../user/user.service';

@WebSocketGateway({
  cors: {
    origin: [
      'https://germanbutcherbd.com',
      'https://www.germanbutcherbd.com',
      'https://admin.germanbutcherbd.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(private readonly userService: UserService) {}

  afterInit(_server: Server) {
    this.logger.log('[GATEWAY] WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    // Extract userId from handshake query or auth
    const userId = client.handshake.query.userId as string;
    const isAdmin = client.handshake.query.isAdmin === 'true';

    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      // Join admin room for admin users
      if (isAdmin) {
        client.join('admins');
      }

      // Fetch user details to get the name and log consistently
      try {
        const numericUserId = parseInt(userId as string, 10);
        if (isNaN(numericUserId)) {
          const role = isAdmin ? 'Admin' : 'User';
          this.logger.log(`Client (${role}, ID: ${userId}) joined with socket ${client.id} - Invalid userId`);
        } else {
          const userResponse = await this.userService.findOne(numericUserId);
          if (userResponse.data) {
            const userName = userResponse.data.name;
            const role = isAdmin ? 'Admin' : 'User';
            this.logger.log(`${userName} (${role}, ID: ${userId}) joined with socket ${client.id}`);
          } else {
            const role = isAdmin ? 'Admin' : 'User';
            this.logger.log(`Client (${role}, ID: ${userId}) joined with socket ${client.id}`);
          }
        }
      } catch (error) {
        const role = isAdmin ? 'Admin' : 'User';
        this.logger.log(`Client (${role}, ID: ${userId}) joined with socket ${client.id}`);
      }
    } else {
      // No userId provided - anonymous client
      this.logger.log(`Client (Anonymous) joined with socket ${client.id}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const isAdmin = client.handshake.query.isAdmin === 'true';

    // Fetch user details for consistent logging
    if (userId) {
      try {
        const numericUserId = parseInt(userId as string, 10);
        if (isNaN(numericUserId)) {
          const role = isAdmin ? 'Admin' : 'User';
          this.logger.log(`Client (${role}, ID: ${userId}) disconnected: socket ${client.id} - Invalid userId`);
        } else {
          const userResponse = await this.userService.findOne(numericUserId);
          if (userResponse.data) {
            const userName = userResponse.data.name;
            const role = isAdmin ? 'Admin' : 'User';
            this.logger.log(`${userName} (${role}, ID: ${userId}) disconnected: socket ${client.id}`);
          } else {
            const role = isAdmin ? 'Admin' : 'User';
            this.logger.log(`Client (${role}, ID: ${userId}) disconnected: socket ${client.id}`);
          }
        }
      } catch (error) {
        const role = isAdmin ? 'Admin' : 'User';
        this.logger.log(`Client (${role}, ID: ${userId}) disconnected: socket ${client.id}`);
      }
    } else {
      this.logger.log(`Client (Anonymous) disconnected: socket ${client.id}`);
    }

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);

      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
    this.logger.log(`[ROOM_JOIN] Socket ${client.id} joined room: ${room}`);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.leave(room);
    this.logger.log(`[ROOM_LEAVE] Socket ${client.id} left room: ${room}`);
    return { event: 'leftRoom', data: room };
  }

  // Emit new order notification to admins
  emitNewOrder(order: any) {
    this.logger.log(`[NEW_ORDER] Emitting new order notification: ${order.orderNo}`);
    this.server.to('admins').emit('newOrder', {
      event: 'newOrder',
      data: order,
      timestamp: new Date(),
    });
  }

  // Emit order status update to specific user
  emitOrderStatusUpdate(userId: string, order: any) {
    this.logger.log(
      `[ORDER_STATUS] Emitting order status update to user (ID: ${userId}): ${order.orderNo}`,
    );
    this.server.to(`user:${userId}`).emit('orderStatusUpdate', {
      event: 'orderStatusUpdate',
      data: order,
      timestamp: new Date(),
    });
  }

  // Emit payment status update to specific user
  emitPaymentStatusUpdate(userId: string, order: any) {
    this.logger.log(
      `[PAYMENT_STATUS] Emitting payment status update to user (ID: ${userId}): ${order.orderNo}`,
    );
    this.server.to(`user:${userId}`).emit('paymentStatusUpdate', {
      event: 'paymentStatusUpdate',
      data: order,
      timestamp: new Date(),
    });
  }

  // Emit order confirmation to specific user
  emitOrderConfirmation(userId: string, order: any) {
    this.logger.log(
      `[ORDER_CONFIRMATION] Emitting order confirmation to user (ID: ${userId}): ${order.orderNo}`,
    );
    this.server.to(`user:${userId}`).emit('orderConfirmation', {
      event: 'orderConfirmation',
      data: order,
      timestamp: new Date(),
    });
  }

  // Emit general notification to specific user
  emitUserNotification(userId: string, notification: any) {
    this.logger.log(`[NOTIFICATION] Emitting notification to user (ID: ${userId})`);
    this.server.to(`user:${userId}`).emit('notification', {
      event: 'notification',
      data: notification,
      timestamp: new Date(),
    });
  }

  // Emit broadcast notification to all connected clients
  emitBroadcast(notification: any) {
    this.logger.log('[BROADCAST] Emitting broadcast notification to all clients');
    this.server.emit('broadcast', {
      event: 'broadcast',
      data: notification,
      timestamp: new Date(),
    });
  }

  /**
   * Handle broadcast requests from admin users
   * Admins can send promotional offers and announcements to all users
   */
  @SubscribeMessage('sendBroadcast')
  async handleBroadcast(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = client.handshake.query;

    // Validate userId is provided
    if (!userId) {
      this.logger.warn(
        `[BROADCAST_ERROR] Broadcast attempt without userId from socket ${client.id}`,
      );
      client.emit('error', {
        message: 'Unauthorized: User ID is required',
      });
      return;
    }

    try {
      // Fetch user from database to verify admin status
      const numericUserId = parseInt(userId as string, 10);
      if (isNaN(numericUserId)) {
        this.logger.warn(
          `[BROADCAST_ERROR] Broadcast attempt with invalid userId ${userId} from socket ${client.id}`,
        );
        client.emit('error', {
          message: 'Unauthorized: Invalid userId',
        });
        return;
      }

      const userResponse = await this.userService.findOne(numericUserId);

      if (!userResponse.data) {
        this.logger.warn(
          `[BROADCAST_ERROR] Broadcast attempt with invalid userId ${userId} from socket ${client.id}`,
        );
        client.emit('error', {
          message: 'Unauthorized: User not found',
        });
        return;
      }

      const user = userResponse.data;

      // Check if user is superadmin (roleId 1) or admin (roleId 2)
      const isAdmin = user.roleId === 1 || user.roleId === 2;

      if (!isAdmin) {
        this.logger.warn(
          `[BROADCAST_ERROR] Unauthorized broadcast attempt from ${user.name} (User, ID: ${userId}, Role: ${user.roleId}) from socket ${client.id}`,
        );
        client.emit('error', {
          message: 'Unauthorized: Only admins can send broadcasts',
        });
        return;
      }

      // Validate data
      if (!data.data?.title || !data.data?.message) {
        this.logger.warn(
          `[BROADCAST_ERROR] Invalid broadcast data from ${user.name} (Admin, ID: ${userId}): missing title or message`,
        );
        client.emit('error', {
          message: 'Title and message are required',
        });
        return;
      }

      // Get recipient count - fetch all sockets and count them
      const sockets = await this.server.fetchSockets();
      const recipientCount = sockets.length;

      // Log the broadcast
      this.logger.log(
        `[BROADCAST] ${user.name} (Admin, ID: ${userId}) broadcasting to ${recipientCount} users: ${data.data.title}`,
      );

      // Broadcast to all connected users
      this.server.emit('broadcast', {
        event: 'broadcast',
        data: {
          title: data.data.title,
          message: data.data.message,
          discount: data.data.discount,
          offerId: data.data.offerId,
          type: data.data.type || 'offer',
        },
        timestamp: new Date(),
      });

      // Send confirmation back to the admin
      client.emit('broadcastSent', {
        success: true,
        message: `Broadcast sent to ${recipientCount} connected users`,
        recipientCount: recipientCount,
      });

      this.logger.log(
        `[BROADCAST_SUCCESS] Broadcast sent to ${recipientCount} users by ${user.name} (Admin, ID: ${userId})`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[BROADCAST_ERROR] Error processing broadcast from userId ${userId}: ${err.message}`,
      );
      client.emit('error', {
        message: 'Failed to process broadcast request',
      });
    }
  }
}
