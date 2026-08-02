// activity.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Category } from 'src/category/entities/category.entity';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { Order } from 'src/order/entities/order.entity';
import { Product } from 'src/product/entities/product.entity';
import { AuditStatus, UserActivityService, UserType } from 'src/user-activity/user-activity.service';
import { User } from 'src/user/entities/user.entity';
import { DataSource } from 'typeorm';
import { getClientIp } from 'src/common/utils/ip-extractor.util';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {

  private readonly LOGGED_METHODS = ['POST', 'PATCH', 'DELETE'];

  constructor(
    private readonly userActivityService: UserActivityService,
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    // Skip if no user
    if (!req.user) {
      return next.handle();
    }

    const action = req.method;

    // Skip if not a logged method
    if (!this.LOGGED_METHODS.includes(action)) {
      return next.handle();
    }

    const { entityType, entityId } = this.extractEntityInfo(req);

    // For PATCH requests, fetch old record before update
    // Only fetch if we have a valid numeric entityId and supported entityType
    if (action === 'PATCH' && entityId && entityType && !isNaN(entityId) && entityId > 0) {
      return from(this.fetchOldRecord(entityType, entityId)).pipe(
        switchMap((oldRecord) => {
          req.oldRecord = oldRecord;
          return this.logActivity(req, context, next);
        }),
      );
    }

    // For POST and DELETE, proceed normally
    return this.logActivity(req, context, next);
  }

  private async fetchOldRecord(entityType: string, entityId: number): Promise<any> {
    try {
      // Validate entityId before querying
      if (!entityId || isNaN(entityId) || entityId <= 0) {
        return null;
      }

      // Map entity types to their entity classes
      let entityClass: any = null;

      switch (entityType) {
        case 'products':
          entityClass = Product;
          break;
        case 'orders':
          entityClass = Order;
          break;
        case 'users':
          entityClass = User;
          break;
        case 'categories':
          entityClass = Category;
          break;
        case 'coupons':
          entityClass = Coupon;
          break;
        default:
          return null;
      }

      if (!entityClass) {
        return null;
      }

      // Use QueryBuilder to avoid loading relations
      const metadata = this.dataSource.getMetadata(entityClass);
      const tableName = metadata.tableName;

      // Get column names (excluding foreign keys)
      const columns = metadata.columns
        .filter(col => !col.relationMetadata) // Exclude relation columns
        .map(col => col.databaseName);

      // Build query with only direct columns
      const columnsList = columns.map(col => `"${col}"`).join(', ');
      const result = await this.dataSource.query(
        `SELECT ${columnsList} FROM "${tableName}" WHERE "id" = $1 LIMIT 1`,
        [entityId]
      );

      if (!result || result.length === 0) {
        return null;
      }

      // Sanitize to remove any objects/arrays and sensitive fields
      return this.sanitizeRecord(result[0]);
    } catch (error) {
      console.error('Error fetching old record:', error);
      return null;
    }
  }

  private sanitizeRecord(record: any): any {
    const sanitized: any = {};

    for (const key in record) {
      if (!record.hasOwnProperty(key)) {
        continue;
      }

      const value = record[key];
      const type = typeof value;

      // Skip functions
      if (type === 'function') {
        continue;
      }

      // Skip sensitive fields
      if (['password', 'otp', 'otpExpiresAt'].includes(key)) {
        continue;
      }

      // Keep primitives (strings, numbers, booleans, null)
      if (type === 'string' || type === 'number' || type === 'boolean' || value === null) {
        sanitized[key] = value;
      }
      // Keep empty arrays (like tags: [])
      else if (Array.isArray(value) && value.length === 0) {
        sanitized[key] = value;
      }
      // Keep non-empty arrays that contain only primitives
      else if (Array.isArray(value) && value.length > 0) {
        // Only include if all elements are primitives
        const allPrimitives = value.every(item =>
          typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
        );
        if (allPrimitives) {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  private logActivity(req: any, context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = req.method;
    const { entityType, entityId } = this.extractEntityInfo(req);

    const userId = req.user?.userId || 0;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = getClientIp(req);
    const requestId = req.headers['x-request-id'] || this.generateRequestId();
    const sessionId = req.sessionID || req.headers['x-session-id'] || null;

    // Determine user type from reflector or user object
    // Map roleId to UserType:
    // 1 = superadmin → ADMIN
    // 2 = admin → ADMIN
    // 3 = customer → CUSTOMER
    // 4 = StoreManager → ADMIN
    // 8 = moderator → ADMIN
    // 9 = product_manager → ADMIN
    const adminRoleIds = [1, 2, 4, 8, 9];
    const customerRoleIds = [3];

    const userType = this.reflector.get<UserType>('userType', context.getHandler()) ||
                    (adminRoleIds.includes(req.user?.roleId) ? UserType.ADMIN :
                     customerRoleIds.includes(req.user?.roleId) ? UserType.CUSTOMER :
                     UserType.SYSTEM);

    // Extract old and new values
    let oldValue = null;
    let newValue = null;

    if (action === 'PATCH' && req.body) {
      oldValue = req.oldRecord || null; // Now automatically populated for PATCH
      newValue = req.body;
    } else if (action === 'POST' && req.body) {
      newValue = req.body;
    } else if (action === 'DELETE' && entityId) {
      // For DELETE, oldRecord can be set by controller before deletion
      oldValue = req.oldRecord || null;
    }

    return next.handle().pipe(
      switchMap((data) => from((async () => {
        const message = await this.getActionMessage(req, action, entityType, entityId);
        await this.userActivityService.logAction({
          userId,
          action: `${action} ${req.route?.path || req.originalUrl}`,
          entityType,
          entityId,
          oldValue,
          newValue,
          ipAddress,
          userAgent,
          requestId,
          sessionId,
          userType,
          status: AuditStatus.SUCCESS,
          message,
        }).catch((error) => {
          console.error('Failed to log user activity:', error);
        });
        return data;
      })())),
    );
  }

  private extractEntityInfo(req: any): { entityType: string; entityId: number | null } {
    const urlParts = req.originalUrl.split('/').filter(Boolean);
    let entityType = null;
    let entityId = null;

    // Handle patterns like /v1/products/123 or /v1/orders/456
    if (urlParts.length >= 2) {
      // Entity type is usually the second segment after /v1/
      entityType = urlParts[1];

      // Entity ID is usually the next segment (for PATCH/DELETE)
      if (urlParts.length >= 3 && !isNaN(Number(urlParts[2]))) {
        entityId = Number(urlParts[2]);
      }
    }

    return { entityType, entityId };
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private async fetchProductName(productId: number): Promise<string | null> {
    try {
      if (!productId || isNaN(productId) || productId <= 0) {
        return null;
      }
      const metadata = this.dataSource.getMetadata(Product);
      const tableName = metadata.tableName;
      const result = await this.dataSource.query(
        `SELECT name FROM "${tableName}" WHERE "id" = $1 LIMIT 1`,
        [productId]
      );
      return result && result.length > 0 ? result[0].name : null;
    } catch (error) {
      console.error('Error fetching product name:', error);
      return null;
    }
  }

  private async getActionMessage(req: any, action: string, entityType: string, entityId: number | null): Promise<string> {
    const routePath = req.route?.path || req.originalUrl;

    // Handle specific order-related routes for more descriptive messages
    if (entityType === 'orders') {
      if (routePath.includes('/payments')) {
        if (action === 'POST') {
          return `Created payment for order${entityId ? ` ${entityId}` : ''}`;
        }
      } else if (routePath.includes('/assign-delivery-man')) {
        const deliveryManId = req.body?.deliveryManId;
        return `Assigned delivery man${deliveryManId ? ` ${deliveryManId}` : ''} to order${entityId ? ` ${entityId}` : ''}`;
      } else if (routePath.includes('/order-status')) {
        const newStatus = req.body?.status;
        return `Updated order status to ${newStatus || 'new status'} for order${entityId ? ` ${entityId}` : ''}`;
      } else if (routePath.includes('/payment-status')) {
        const newStatus = req.body?.status;
        return `Updated payment status to ${newStatus || 'new status'} for order${entityId ? ` ${entityId}` : ''}`;
      } else if (routePath.includes('/cancel')) {
        return `Cancelled order${entityId ? ` ${entityId}` : ''}`;
      } else if (action === 'POST') {
        return `Created new order${entityId ? ` with ID ${entityId}` : ''}`;
      }
    }

    // Handle cart-related routes for more descriptive messages
    if (entityType === 'cart') {
      if (routePath.includes('/items')) {
        if (action === 'POST') {
          const productId = req.body?.productId;
          const quantity = req.body?.quantity;
          const productName = productId ? await this.fetchProductName(productId) : null;
          return `Added product${productName ? ` "${productName}"` : (productId ? ` ${productId}` : '')}${quantity ? ` (qty: ${quantity})` : ''} to cart`;
        } else if (action === 'PATCH') {
          const quantity = req.body?.quantity;
          return `Updated cart item${entityId ? ` ${entityId}` : ''} quantity${quantity ? ` to ${quantity}` : ''}`;
        } else if (action === 'DELETE') {
          return `Removed item${entityId ? ` ${entityId}` : ''} from cart`;
        }
      } else if (action === 'DELETE') {
        return `Cleared cart`;
      }
    }

    // Handle product-related routes for more descriptive messages
    if (entityType === 'products') {
      if (action === 'POST') {
        const productName = req.body?.name;
        const categoryId = req.body?.categoryId;
        return `Created product${productName ? ` "${productName}"` : ''}${categoryId ? ` in category ${categoryId}` : ''}`;
      } else if (action === 'PATCH') {
        const productName = req.body?.name;
        const isActive = req.body?.isActive;
        const isFeatured = req.body?.isFeatured;
        const discountType = req.body?.discountType;
        const stock = req.body?.stock;

        // Build specific message based on what's being updated
        let updateDetails = [];

        if (productName) updateDetails.push(`name to "${productName}"`);
        if (typeof isActive === 'boolean') updateDetails.push(`active status to ${isActive}`);
        if (typeof isFeatured === 'boolean') updateDetails.push(`featured status to ${isFeatured}`);
        if (discountType) updateDetails.push(`discount type to ${discountType}`);
        if (stock !== undefined) updateDetails.push(`stock to ${stock}`);

        if (updateDetails.length > 0) {
          return `Updated product${entityId ? ` ${entityId}` : ''}: ${updateDetails.join(', ')}`;
        }
        return `Updated product${entityId ? ` ${entityId}` : ''}`;
      } else if (action === 'DELETE') {
        return `Deleted product${entityId ? ` ${entityId}` : ''}`;
      }
    }

    // Default action messages
    const actionMap = {
      POST: `Created ${entityType}${entityId ? ` with ID ${entityId}` : ''}`,
      PATCH: `Updated ${entityType}${entityId ? ` ${entityId}` : ''}`,
      DELETE: `Deleted ${entityType}${entityId ? ` ${entityId}` : ''}`,
    };

    return actionMap[action] || `${action} ${entityType}`;
  }
}
