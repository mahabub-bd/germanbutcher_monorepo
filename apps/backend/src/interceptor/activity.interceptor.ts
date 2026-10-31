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
import { Address } from 'src/address/entities/address.entity';
import { Banner } from 'src/banner/entities/banner.entity';
import { BogoCampaign } from 'src/bogo-campaigns/entities/bogo-campaign.entity';
import { Brand } from 'src/brand/entities/brand.entity';
import { Category } from 'src/category/entities/category.entity';
import { Client } from 'src/client/entities/client.entity';
import { ContactMessage } from 'src/contact-message/entities/contact-message.entity';
import { getClientIp } from 'src/common/utils/ip-extractor.util';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { DeliveryMan } from 'src/delivery-man/entities/delivery-man.entity';
import { FlashSaleCampaign } from 'src/flash-sale-campaigns/entities/flash-sale-campaign.entity';
import { FreeDeliveryCampaign } from 'src/free-delivery-campaigns/entities/free-delivery-campaign.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { Order } from 'src/order/entities/order.entity';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentMethod } from 'src/payment-method/entities/payment-method.entity';
import { Product } from 'src/product/entities/product.entity';
import { ProductReview } from 'src/product-review/entities/product-review.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { Role } from 'src/roles/entities/role.entity';
import { SalesPartner } from 'src/sales-partner/entities/sales-partner.entity';
import { SalesPoint } from 'src/sales-point/entities/sales-point.entity';
import { SalesPointShop } from 'src/sales-point-shop/entities/sales-point-shop.entity';
import { ShippingMethod } from 'src/shipping-methods/entities/shipping-method.entity';
import { Supplier } from 'src/supplier/entities/supplier.entity';
import { Testimonial } from 'src/testimonial/entities/testimonial.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { AuditStatus, UserActivityService, UserType } from 'src/user-activity/user-activity.service';
import { User } from 'src/user/entities/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {

  private readonly LOGGED_METHODS = ['POST', 'PATCH', 'DELETE'];

  // Routes that should never be recorded in the activity log (e.g. high-frequency heartbeats)
  private readonly EXCLUDED_PATHS = [
    '/v1/online-users/heartbeat',
    '/v1/free-delivery-campaigns/check',
  ];

  constructor(
    private readonly userActivityService: UserActivityService,
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    // Skip excluded routes (matched on the path without query string)
    const requestPath = (req.originalUrl || '').split('?')[0];
    if (this.EXCLUDED_PATHS.includes(requestPath)) {
      return next.handle();
    }

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
        case 'banners':
          entityClass = Banner;
          break;
        case 'addresses':
          entityClass = Address;
          break;
        case 'bogo-campaigns':
          entityClass = BogoCampaign;
          break;
        case 'brands':
          entityClass = Brand;
          break;
        case 'clients':
          entityClass = Client;
          break;
        case 'contact-messages':
          entityClass = ContactMessage;
          break;
        case 'delivery-man':
          entityClass = DeliveryMan;
          break;
        case 'flash-sale-campaigns':
          entityClass = FlashSaleCampaign;
          break;
        case 'free-delivery-campaigns':
          entityClass = FreeDeliveryCampaign;
          break;
        case 'menu':
          entityClass = Menu;
          break;
        case 'order-payment-methods':
          entityClass = OrderPaymentMethod;
          break;
        case 'payments':
          entityClass = Payment;
          break;
        case 'payment-methods':
          entityClass = PaymentMethod;
          break;
        case 'reviews':
          entityClass = ProductReview;
          break;
        case 'purchases':
          entityClass = Purchase;
          break;
        case 'recipes':
          entityClass = Recipe;
          break;
        case 'roles':
          entityClass = Role;
          break;
        case 'sales-partners':
          entityClass = SalesPartner;
          break;
        case 'sales-points':
          entityClass = SalesPoint;
          break;
        case 'sales-point-shops':
          entityClass = SalesPointShop;
          break;
        case 'shipping-methods':
          entityClass = ShippingMethod;
          break;
        case 'suppliers':
          entityClass = Supplier;
          break;
        case 'testimonials':
          entityClass = Testimonial;
          break;
        case 'units':
          entityClass = Unit;
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

      // Get all column names, including foreign key columns (unitId, brandId, ...)
      // so the old record mirrors the shape of the incoming PATCH body
      const columns = metadata.columns.map(col => col.databaseName);

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
      // Serialize dates so timestamp columns (discountStartDate, ...) survive
      else if (value instanceof Date && !isNaN(value.getTime())) {
        sanitized[key] = value.toISOString();
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

    if (action === 'PATCH' && req.body && Object.keys(req.body).length > 0) {
      oldValue = this.buildMatchingOldValue(req.oldRecord, req.body, entityType, req.originalUrl); // Same keys as the new value
      // The body may consist only of computed/DTO-only fields (e.g. cancel's
      // reason) that match no column — fall back to the full old record
      if (oldValue === null && req.oldRecord) {
        oldValue = req.oldRecord;
      }
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

  /**
   * Build the old value with the same keys as the incoming PATCH body so
   * oldValue and newValue are directly comparable in the activity log.
   */
  private buildMatchingOldValue(oldRecord: any, body: any, entityType: string, requestUrl: string): any {
    if (!oldRecord || typeof oldRecord !== 'object') return null;
    if (!body || typeof body !== 'object') return null;

    const aligned: any = {};

    for (const key of Object.keys(body)) {
      // The body may send a relation as `attachment` while the DB column is `attachmentId`
      const oldKey = this.resolveOldKey(key, oldRecord, entityType, requestUrl);

      if (oldKey === null) continue; // Computed fields (hasDiscount, imageUrl, ...) have no column

      aligned[key] = this.coerceOldValue(oldRecord[oldKey], body[key]);
    }

    return Object.keys(aligned).length > 0 ? aligned : null;
  }

  /**
   * Map a PATCH body key to the DB column that holds its old value.
   * Handles relations sent without the Id suffix and the order DTOs that
   * send `status` while the column is `orderStatus`/`paymentStatus`.
   */
  private resolveOldKey(key: string, oldRecord: any, entityType: string, requestUrl: string): string | null {
    if (key in oldRecord) return key;
    if (`${key}Id` in oldRecord) return `${key}Id`;

    if (entityType === 'orders' && key === 'status') {
      if (requestUrl.includes('/payment-status')) {
        return 'paymentStatus' in oldRecord ? 'paymentStatus' : null;
      }
      return 'orderStatus' in oldRecord ? 'orderStatus' : null;
    }

    return null;
  }

  /**
   * Match the old value's type to the new value's type so unchanged fields
   * compare equal (Postgres decimal columns come back as "270.00").
   */
  private coerceOldValue(oldValue: any, newValue: any): any {
    if (oldValue === null || oldValue === undefined) return null;

    if (
      typeof newValue === 'number' &&
      typeof oldValue === 'string' &&
      oldValue.trim() !== '' &&
      !isNaN(Number(oldValue))
    ) {
      return Number(oldValue);
    }

    return oldValue;
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /** Best-effort singular form of a URL segment for log messages. */
  private singularize(segment: string): string {
    if (segment.endsWith('ies')) return `${segment.slice(0, -3)}y`;
    if (/(ses|xes|ches|shes)$/.test(segment)) return segment.slice(0, -2);
    if (segment.endsWith('s') && !segment.endsWith('ss') && !segment.endsWith('us')) {
      return segment.slice(0, -1);
    }
    return segment;
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

  private async fetchOrderNo(orderId: number | null): Promise<string | null> {
    try {
      if (!orderId || isNaN(orderId) || orderId <= 0) {
        return null;
      }
      const result = await this.dataSource.query(
        `SELECT "orderNo" FROM "order" WHERE "id" = $1 LIMIT 1`,
        [orderId]
      );
      return result && result.length > 0 ? result[0].orderNo : null;
    } catch (error) {
      console.error('Error fetching order number:', error);
      return null;
    }
  }

  private async fetchDeliveryManName(
    deliveryManId: number | null,
  ): Promise<string | null> {
    try {
      if (!deliveryManId || isNaN(deliveryManId) || deliveryManId <= 0) {
        return null;
      }
      const result = await this.dataSource.query(
        `SELECT name FROM "delivery_man" WHERE "id" = $1 LIMIT 1`,
        [deliveryManId]
      );
      return result && result.length > 0 ? result[0].name : null;
    } catch (error) {
      console.error('Error fetching delivery man name:', error);
      return null;
    }
  }

  private async getActionMessage(req: any, action: string, entityType: string, entityId: number | null): Promise<string> {
    const routePath = req.route?.path || req.originalUrl;

    // Handle specific order-related routes for more descriptive messages
    if (entityType === 'orders') {
      const orderNo = await this.fetchOrderNo(entityId);
      const orderLabel = orderNo ?? (entityId ? `#${entityId}` : '');

      if (routePath.includes('/payments')) {
        if (action === 'POST') {
          // Root-level /orders/payments carries the order in the body
          const bodyOrderId = req.body?.orderId;
          const paymentOrderNo =
            orderNo ?? (bodyOrderId ? await this.fetchOrderNo(bodyOrderId) : null);
          const paymentOrderLabel = paymentOrderNo ?? (bodyOrderId ? `#${bodyOrderId}` : orderLabel);
          return `Created payment for order ${paymentOrderLabel}`.trim();
        }
      } else if (routePath.includes('/assign-delivery-man')) {
        const deliveryManId = req.body?.deliveryManId;
        const deliveryManName = await this.fetchDeliveryManName(deliveryManId);
        const deliveryManLabel = deliveryManName
          ? ` "${deliveryManName}"`
          : deliveryManId
            ? ` ${deliveryManId}`
            : '';
        return `Assigned delivery man${deliveryManLabel} to order ${orderLabel}`;
      } else if (routePath.includes('/order-status')) {
        const newStatus = req.body?.status;
        return `Updated order status to ${newStatus || 'new status'} for order ${orderLabel}`;
      } else if (routePath.includes('/payment-status')) {
        const newStatus = req.body?.status;
        return `Updated payment status to ${newStatus || 'new status'} for order ${orderLabel}`;
      } else if (routePath.includes('/cancel')) {
        return `Cancelled order ${orderLabel}`;
      } else if (routePath.includes('/notes')) {
        return action === 'POST'
          ? `Added note to order ${orderLabel}`
          : `Removed note from order ${orderLabel}`;
      } else if (action === 'POST') {
        return `Created new order${orderNo ? ` ${orderNo}` : orderLabel}`;
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

    // CRM routes share the /crm prefix, so entityType is just 'crm' —
    // name the real sub-entity from the route path.
    if (entityType === 'crm') {
      if (routePath.includes('/activities')) {
        return action === 'POST'
          ? `Added activity for customer ${entityId ?? ''}`.trim()
          : action === 'PATCH'
            ? `Updated activity ${entityId ?? ''}`.trim()
            : `Deleted activity ${entityId ?? ''}`.trim();
      }
      if (routePath.includes('/campaigns')) {
        if (routePath.includes('/send') && action === 'POST') {
          return `Sent campaign ${entityId ?? ''}`.trim();
        }
        if (action === 'POST') {
          const name = req.body?.name;
          return `Created campaign${name ? ` "${name}"` : ''}`;
        }
        if (action === 'DELETE') {
          return `Deleted campaign ${entityId ?? ''}`.trim();
        }
        if (action === 'PATCH') {
          return `Updated campaign ${entityId ?? ''}`.trim();
        }
      }
      if (routePath.includes('/customers') && action === 'PATCH') {
        return `Updated customer ${entityId ?? ''}`.trim();
      }
    }

    // POST /reviews/product/:productId — the extracted ID is the product,
    // not the review.
    if (entityType === 'reviews' && action === 'POST' && routePath.includes('/product/')) {
      const productName = entityId ? await this.fetchProductName(entityId) : null;
      return `Reviewed product${productName ? ` "${productName}"` : entityId ? ` ${entityId}` : ''}`;
    }

    if (entityType === 'contact-messages' && routePath.includes('/reply')) {
      return `Replied to contact message ${entityId ?? ''}`.trim();
    }

    if (entityType === 'galleries' && routePath.includes('/attachments') && action === 'POST') {
      return `Uploaded attachments to gallery ${entityId ?? ''}`.trim();
    }

    if (entityType === 'wishlist' && action === 'POST') {
      const productId = req.body?.productId;
      const productName = productId ? await this.fetchProductName(productId) : null;
      return `Added product${productName ? ` "${productName}"` : productId ? ` ${productId}` : ''} to wishlist`;
    }

    if (entityType === 'coupons') {
      const couponCode = req.body?.code ? ` "${req.body.code}"` : '';
      if (routePath.includes('/apply')) {
        return `Applied coupon${couponCode}`;
      }
      if (routePath.includes('/validate')) {
        return `Validated coupon${couponCode}`;
      }
    }

    // SSL payment gateway routes live under /payment
    if (entityType === 'payment') {
      if (routePath.includes('/refund')) {
        const amount = req.body?.refund_amount;
        return `Requested refund${amount ? ` of ${amount}` : ''}${req.body?.paymentId ? ` for payment ${req.body.paymentId}` : ''}`.trim();
      }
      if (routePath.includes('/init')) {
        return `Initiated online payment`;
      }
    }

    if (entityType === 'auth' && routePath.includes('/logout')) {
      return `Logged out`;
    }

    if (entityType === 'user-activities' && routePath.includes('/retention')) {
      return `Ran activity log retention cleanup`;
    }

    if (entityType === 'bogo-campaigns' && routePath.includes('/preview')) {
      return `Previewed BOGO campaign discount`;
    }

    if (entityType === 'attachment' && routePath.includes('/upload-multiple')) {
      return `Uploaded attachments`;
    }

    // Handle product-related routes for more descriptive messages
    if (entityType === 'products') {
      if (routePath.includes('/stock-adjust')) {
        const productName = entityId
          ? await this.fetchProductName(Number(entityId))
          : null;
        const quantity = req.body?.quantity;
        const qtyLabel =
          typeof quantity === 'number' && quantity !== 0
            ? ` by ${quantity > 0 ? '+' : ''}${quantity}`
            : '';
        return `Adjusted stock${qtyLabel} for product${productName ? ` "${productName}"` : entityId ? ` ${entityId}` : ''}`;
      } else if (action === 'POST') {
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

    // Default action messages (entity type is the URL segment, so
    // singularize it for readable copy: banners → banner, categories → category)
    const entityLabel = this.singularize(entityType ?? 'record');
    const actionMap = {
      POST: `Created ${entityLabel}${entityId ? ` with ID ${entityId}` : ''}`,
      PATCH: `Updated ${entityLabel}${entityId ? ` ${entityId}` : ''}`,
      DELETE: `Deleted ${entityLabel}${entityId ? ` ${entityId}` : ''}`,
    };

    return actionMap[action] || `${action} ${entityType}`;
  }
}
