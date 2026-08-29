import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/address/entities/address.entity';
import { OrderStatus, PaymentStatus, CancellationReason } from 'src/common/enums';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { DeliveryMan } from 'src/delivery-man/entities/delivery-man.entity';

import { EmailService } from 'src/email/email.service';
import { NotificationService } from 'src/notification/notification.service';
import { SmsService } from 'src/auth/sms.service';
import { generateOrderConfirmationSMS } from 'src/auth/templates/order-confirmation-sms.template';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { OrderPaymentService } from 'src/order-payment/order-payment.service';
import { Product } from 'src/product/entities/product.entity';
import { ShippingMethod } from 'src/shipping-methods/entities/shipping-method.entity';
import { User } from 'src/user/entities/user.entity';
import { Like, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusTrack } from './entities/order-status-track.entity';
import { Order } from './entities/order.entity';
import { CouponUsageLogService } from 'src/coupon-usage-log/coupon-usage-log.service';
import { DiscountType } from 'src/common/enums';
export interface FindAllOrdersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'date_asc' | 'date_desc';
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(ShippingMethod)
    private readonly shippingMethodRepository: Repository<ShippingMethod>,

    @InjectRepository(OrderPaymentMethod)
    private readonly orderpaymentMethodRepository: Repository<OrderPaymentMethod>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(DeliveryMan)
    private readonly deliveryManRepository: Repository<DeliveryMan>,

    private readonly orderPaymentService: OrderPaymentService,

    @InjectRepository(OrderStatusTrack)
    private readonly orderStatusTrackRepository: Repository<OrderStatusTrack>,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    private readonly smsService: SmsService,
    private readonly couponUsageLogService: CouponUsageLogService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const currentYear = new Date().getFullYear();

    const lastOrder = await this.orderRepository.findOne({
      where: {
        orderNo: Like(`ORD-${currentYear}-%`),
      },
      order: { orderNo: 'DESC' },
    });

    let lastNumber = 0;
    if (lastOrder) {
      const parts = lastOrder.orderNo.split('-');
      lastNumber = parseInt(parts[2]) || 0;
    }

    const orderNo = `ORD-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;

    const {
      items,
      userId,
      addressId,
      shippingMethodId,
      paymentMethodId,
      couponId,
      ...orderDetails
    } = createOrderDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const address = await this.addressRepository.findOne({
      where: { id: addressId },
    });
    const shippingMethod = await this.shippingMethodRepository.findOne({
      where: { id: shippingMethodId },
    });
    const paymentMethod = await this.orderpaymentMethodRepository.findOne({
      where: { id: paymentMethodId },
    });

    let coupon: Coupon | null = null;
    if (couponId) {
      coupon = await this.couponRepository.findOne({
        where: { id: couponId.toString() },
        relations: ['excludedItems'],
      });
      if (!coupon)
        throw new NotFoundException(`Coupon with ID ${couponId} not found`);
    }

    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (!address)
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    if (!shippingMethod)
      throw new NotFoundException(
        `Shipping method with ID ${shippingMethodId} not found`,
      );
    if (!paymentMethod)
      throw new NotFoundException(
        `Payment method with ID ${paymentMethodId} not found`,
      );
    if (couponId && !coupon)
      throw new NotFoundException(`Coupon ${couponId} not found`);

    let totalValue = 0;
    let totalDiscount = 0;

    // Store item pricing details for later use
    const itemPricingDetails = [];

    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (!product)
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );

      // Check stock first
      if (product.stock < item.quantity) {
        throw new NotFoundException(
          `${product.name} is out of stock. We're restocking soon!`,
        );
      }

      let price = product.sellingPrice;
      let productDiscount = 0;
      const now = new Date().getTime();

      // Apply product discount if valid
      if (product.discountStartDate && product.discountEndDate) {
        const start = new Date(product.discountStartDate).getTime();
        const end = new Date(product.discountEndDate).getTime();

        if (now >= start && now <= end) {
          switch (product.discountType) {
            case 'fixed':
              productDiscount = product.discountValue;
              price -= productDiscount;
              break;
            case 'percentage':
              productDiscount = price * (product.discountValue / 100);
              price -= productDiscount;
              break;
          }
          price = Math.max(price, 0);
        }
      }

      // Calculate totals
      const itemTotal = price * item.quantity;
      const itemTotalDiscount = productDiscount * item.quantity;

      totalValue += itemTotal;
      totalDiscount += itemTotalDiscount;

      // Update product stock and sale count
      product.stock -= item.quantity;
      product.saleCount += item.quantity;
      await this.productRepository.save(product);

      // Store pricing details for this item
      itemPricingDetails.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: price,
        unitDiscount: productDiscount,
        totalPrice: itemTotal,
      });
    }

    let couponDiscountAmount = 0;
    if (coupon) {
      const now = new Date().getTime();
      const couponStart = new Date(coupon.validFrom).getTime();
      const couponEnd = new Date(coupon.validUntil).getTime();

      if (now >= couponStart && now <= couponEnd) {
        // Get excluded product IDs
        const excludedProductIds = coupon.excludedItems
          ? coupon.excludedItems.map((p) => p.id)
          : [];

        // Calculate total eligible amount (excluding excluded items)
        let eligibleTotal = 0;
        for (const itemPricing of itemPricingDetails) {
          const isExcluded = excludedProductIds.includes(itemPricing.productId);
          if (!isExcluded) {
            eligibleTotal += itemPricing.totalPrice;
          }
        }

        switch (coupon.discountType) {
          case DiscountType.FIXED:
            couponDiscountAmount = Number(coupon.value);
            break;
          case DiscountType.PERCENTAGE:
            const roundedEligibleTotal = Math.round(eligibleTotal * 100) / 100;
            let couponDiscount =
              roundedEligibleTotal * (Number(coupon.value) / 100);

            if (
              coupon.maxDiscountAmount &&
              couponDiscount > Number(coupon.maxDiscountAmount)
            ) {
              couponDiscount = Number(coupon.maxDiscountAmount);
            }

            couponDiscountAmount = couponDiscount;
            break;
        }

        totalValue -= couponDiscountAmount;
        totalDiscount += couponDiscountAmount;
        totalValue = Math.max(totalValue, 0);
      }
    }

    // Add shipping cost
    totalValue += Number(shippingMethod.cost);

    // Round final values
    totalValue = Math.round(totalValue * 100) / 100;
    totalDiscount = Math.round(totalDiscount * 100) / 100;

    // Create order
    const order = this.orderRepository.create({
      ...orderDetails,
      totalValue,
      totalDiscount,
      user,
      address,
      shippingMethod,
      paymentMethod,
      coupon,
      orderNo,
      orderStatus: OrderStatus.PENDING,
    });
    await this.orderRepository.save(order);

    // Log coupon usage if a coupon was applied
    if (coupon && couponDiscountAmount > 0) {
      try {
        await this.couponUsageLogService.create({
          coupon,
          couponCode: coupon.code,
          order,
          user,
          discountAmount: couponDiscountAmount,
          orderTotal: totalValue + couponDiscountAmount, // Original total before discount
          discountType: coupon.discountType,
          discountValue: Number(coupon.value),
        });

        // Increment coupon usage count
        await this.couponRepository.update(coupon.id, {
          timesUsed: coupon.timesUsed + 1,
        });
      } catch (error) {
        // Log error but don't fail the order creation
        this.logger.error(
          `Failed to log coupon usage for order ${orderNo}: ${error}`,
        );
      }
    }

    // Create order status track
    await this.orderStatusTrackRepository.save(
      this.orderStatusTrackRepository.create({
        order,
        status: OrderStatus.PENDING,
        updatedBy: user?.userId,
      }),
    );

    for (const itemDetail of itemPricingDetails) {
      const orderItem = this.orderItemRepository.create({
        productId: itemDetail.productId,
        quantity: itemDetail.quantity,
        unitPrice: itemDetail.unitPrice,
        unitDiscount: itemDetail.unitDiscount,
        totalPrice: itemDetail.totalPrice,
        order,
      });
      await this.orderItemRepository.save(orderItem);
    }

    // Create payment if paid amount provided
    if (createOrderDto.paidAmount && createOrderDto.paidAmount > 0) {
      await this.orderPaymentService.create(
        {
          orderId: order.id,
          amount: createOrderDto.paidAmount,
          paymentMethodId: paymentMethod.id,
        },
        user,
      );
    }

    // Get the complete order with all relations for email
    const completeOrder = await this.getOrderById(order.id);

    // Send order confirmation email
    try {
      await this.emailService.sendOrderConfirmationEmail({
        orderNo: completeOrder.orderNo,
        customerName: user.name,
        customerEmail: user.email,
        subtotal: Number(completeOrder.totalValue) - Number(completeOrder.shippingMethod?.cost || 0),
        shippingFee: Number(completeOrder.shippingMethod?.cost || 0),
        totalValue: Number(completeOrder.totalValue),
        shippingMethod: shippingMethod.name,
        paymentMethod: paymentMethod.name,
        items: completeOrder.items.map((item) => ({
          productName: item.product?.name || 'Product',
          quantity: item.quantity,
          price: Number(item.unitPrice),
        })),
        ...(coupon && {
          coupon: {
            code: coupon.code,
            discountAmount: couponDiscountAmount,
          },
        }),
        shippingAddress: {
          address: `${address.address}, ${address.area}`,
          city: address.city,
          phone: user.mobileNumber || 'N/A',
        },
      });
    } catch (error) {
      // Log error but don't fail the order creation
      console.error('Failed to send order confirmation email:', error);
    }

    // Send order confirmation SMS
    if (user.mobileNumber) {
      try {
        const smsMessage = generateOrderConfirmationSMS({
          orderNo: completeOrder.orderNo,
          customerName: user.name,
          totalValue: Number(completeOrder.totalValue),
          itemCount: completeOrder.items.length,
        });
        await this.smsService.sendSms(user.mobileNumber, smsMessage);
        this.logger.log(
          `Order confirmation SMS sent successfully to ${user.mobileNumber} for order ${completeOrder.orderNo}`,
        );
      } catch (error) {
        // Log error but don't fail the order creation
        const err = error as Error;
        this.logger.error(
          `Failed to send order confirmation SMS: ${err.message}`,
          err.stack,
        );
      }
    } else {
      this.logger.warn(`No mobile number found for user ${user.id}, skipping SMS notification`);
    }

    // Send WebSocket notifications
    try {
      // Notify admins about new order
      this.notificationService.notifyNewOrder({
        orderId: completeOrder.id.toString(),
        orderNo: completeOrder.orderNo,
        userId: user.id.toString(),
        orderStatus: completeOrder.orderStatus,
        paymentStatus: completeOrder.paymentStatus,
        totalValue: Number(completeOrder.totalValue),
        items: completeOrder.items,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
        },
        address: completeOrder.address,
        createdAt: completeOrder.createdAt,
      });
    } catch (error) {
      // Log error but don't fail the order creation
      console.error('Failed to send WebSocket notifications:', error);
    }

    return completeOrder;
  }

  async getOrderById(id: number): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'user.profilePhoto',
        'address',
        'shippingMethod',
        'paymentMethod',
        'payments',
        'payments.paymentMethod',
        'items',
        'items.product',
        'items.product.attachment',
        'items.product.unit',
        'items.product.supplier',
        'coupon',
        'statusTracks',
        'statusTracks.updatedBy',
        'deliveryMan',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'address',
        'shippingMethod',
        'paymentMethod',
        'items',
        'items.product',
        'coupon',
        'payments',
        'statusTracks',
        'statusTracks.updatedBy',
        'deliveryMan',
      ],
    });
  }

  async getAllOrders(
    options: FindAllOrdersOptions = {},
  ): Promise<{ data: Order[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      search,
      orderStatus,
      paymentStatus,
      sort,
    } = options;

    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.shippingMethod', 'shippingMethod')
      .leftJoinAndSelect('order.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.statusTracks', 'statusTracks')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.coupon', 'coupon')
      .leftJoinAndSelect('order.deliveryMan', 'deliveryMan')
      .orderBy('order.createdAt', 'DESC');

    if (search) {
      queryBuilder.where('order.orderNo LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (orderStatus) {
      queryBuilder.andWhere('order.orderStatus = :orderStatus', {
        orderStatus,
      });
    }
    if (sort === 'date_asc') {
      queryBuilder.orderBy('order.createdAt', 'ASC');
    } else if (sort === 'date_desc') {
      queryBuilder.orderBy('order.createdAt', 'DESC');
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async updateOrderStatus(
    id: number,
    status: OrderStatus,
    user: User,
    note?: string,
  ): Promise<Order> {
    await this.orderRepository.update(id, { orderStatus: status });

    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new Error('Order not found');

    const statusTrack = this.orderStatusTrackRepository.create({
      order,
      status,
      note,
      updatedBy: user?.userId,
    });
    await this.orderStatusTrackRepository.save(statusTrack);

    const updatedOrder = await this.orderRepository.findOne({
      where: { id },
      relations: ['statusTracks', 'items', 'user', 'address', 'deliveryMan'],
    });

    // Update delivery man statistics when order is delivered
    if (status === OrderStatus.DELIVERED && updatedOrder.deliveryMan) {
      await this.updateDeliveryManStatistics(
        updatedOrder.deliveryMan.id,
        Number(updatedOrder.totalValue),
      );
    }

    // Send WebSocket notification about order status update
    try {
      if (updatedOrder && updatedOrder.user) {
        this.notificationService.notifyOrderStatusUpdate(
          updatedOrder.user.id.toString(),
          {
            orderId: updatedOrder.id.toString(),
            orderNo: updatedOrder.orderNo,
            userId: updatedOrder.user.id.toString(),
            orderStatus: updatedOrder.orderStatus,
            paymentStatus: updatedOrder.paymentStatus,
            totalValue: Number(updatedOrder.totalValue),
            items: updatedOrder.items,
            address: updatedOrder.address,
            updatedAt: new Date(),
          },
        );
      }
    } catch (error) {
      console.error('Failed to send order status update notification:', error);
    }

    return updatedOrder;
  }

  async assignDeliveryMan(
    orderId: number,
    deliveryManId: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id: orderId });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id: deliveryManId },
    });
    if (!deliveryMan) {
      throw new NotFoundException(
        `Delivery man with ID ${deliveryManId} not found`,
      );
    }

    if (!deliveryMan.isActive) {
      throw new NotFoundException(
        `Delivery man with ID ${deliveryManId} is not active`,
      );
    }

    order.deliveryMan = deliveryMan;
    await this.orderRepository.save(order);

    return this.getOrderById(orderId);
  }

  private async updateDeliveryManStatistics(
    deliveryManId: number,
    orderValue: number,
  ): Promise<void> {
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id: deliveryManId },
    });

    if (deliveryMan) {
      deliveryMan.totalDeliveries += 1;
      deliveryMan.totalEarnings = Math.round(
        (Number(deliveryMan.totalEarnings) + orderValue) * 100,
      ) / 100;
      await this.deliveryManRepository.save(deliveryMan);
    }
  }

  async updatePaymentStatus(id: number, status: PaymentStatus): Promise<Order> {
    await this.orderRepository.update(id, { paymentStatus: status });
    const updatedOrder = await this.getOrderById(id);

    // Send WebSocket notification about payment status update
    try {
      if (updatedOrder && updatedOrder.user) {
        this.notificationService.notifyPaymentStatusUpdate(
          updatedOrder.user.id.toString(),
          {
            orderId: updatedOrder.id.toString(),
            orderNo: updatedOrder.orderNo,
            userId: updatedOrder.user.id.toString(),
            orderStatus: updatedOrder.orderStatus,
            paymentStatus: updatedOrder.paymentStatus,
            totalValue: Number(updatedOrder.totalValue),
            updatedAt: new Date(),
          },
        );
      }
    } catch (error) {
      console.error('Failed to send payment status update notification:', error);
    }

    return updatedOrder;
  }
  async getOrderReportByDateRange(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
    orderStatus?: OrderStatus,
  ) {
    // --- Helper function to get date range from preset ---
    const getDateRangeFromPreset = (
      preset: string,
    ): { from: Date; to: Date } | null => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      switch (preset) {
        case 'today':
          return { from: startOfDay, to: endOfDay };

        case 'this_week': {
          const dayOfWeek = today.getDay();
          const from = new Date(today);
          from.setDate(today.getDate() - dayOfWeek);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case 'last_week': {
          const dayOfWeek = today.getDay();
          const from = new Date(today);
          from.setDate(today.getDate() - dayOfWeek - 7);
          from.setHours(0, 0, 0, 0);
          const to = new Date(from);
          to.setDate(from.getDate() + 6);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }

        case 'this_month': {
          const from = new Date(now.getFullYear(), now.getMonth(), 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case 'last_month': {
          const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          from.setHours(0, 0, 0, 0);
          const to = new Date(now.getFullYear(), now.getMonth(), 0);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }

        case 'last_3_months': {
          const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case 'last_6_months': {
          const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case 'last_year': {
          const from = new Date(now.getFullYear() - 1, 0, 1);
          from.setHours(0, 0, 0, 0);
          const to = new Date(now.getFullYear() - 1, 11, 31);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }

        case 'this_year': {
          const from = new Date(now.getFullYear(), 0, 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        default:
          return null;
      }
    };

    // --- Determine date range ---
    let from: Date | undefined;
    let to: Date | undefined;

    // Use date range preset if provided
    if (dateRangePreset) {
      const presetRange = getDateRangeFromPreset(dateRangePreset);
      if (presetRange) {
        from = presetRange.from;
        to = presetRange.to;
      } else {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
    } else {
      // Parse and validate date inputs
      const parseDate = (
        dateStr?: string,
        endOfDay = false,
      ): Date | undefined => {
        if (!dateStr) return undefined;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: "${dateStr}". Use YYYY-MM-DD.`);
        }
        if (endOfDay) date.setHours(23, 59, 59, 999);
        return date;
      };

      from = parseDate(fromDate);
      to = parseDate(toDate, true);
    }

    // --- Build query ---
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.shippingMethod', 'shippingMethod')
      .leftJoinAndSelect('order.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.coupon', 'coupon')
      .orderBy('order.id', 'DESC');

    // --- Apply conditional filters ---
    if (from && to) {
      query.andWhere('order.createdAt BETWEEN :from AND :to', { from, to });
    } else if (from) {
      query.andWhere('order.createdAt >= :from', { from });
    } else if (to) {
      query.andWhere('order.createdAt <= :to', { to });
    }

    // Apply order status filter
    if (orderStatus) {
      query.andWhere('order.orderStatus = :orderStatus', { orderStatus });
    }

    const orders = await query.getMany();

    // --- Transform and aggregate data ---
    const formattedOrders = orders.map((order) => ({
      id:order.id,
      orderNo: order.orderNo,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalValue: Number(order.totalValue || 0),
      totalDiscount: parseFloat(order.totalDiscount?.toString() || '0'),
      paidAmount: Number(order.paidAmount || 0),
      orderDate: order.createdAt,
      customer: order.user
        ? {
            name: order.user.name,
            mobileNumber: order.user.mobileNumber || null,
            email: order.user.email || null,
          }
        : null,
      shippingAddress: order.address
        ? {
            address: order.address.address,
            area: order.address.area,
            city: order.address.city,
            division: order.address.division,
          }
        : null,
      shippingMethod: order.shippingMethod?.name || null,
      paymentMethod: order.paymentMethod?.name || null,
      items:
        order.items?.map((item) => ({
          productName: item.product?.name || 'N/A',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice || 0),
          totalPrice: Number(item.totalPrice || 0),
        })) || [],
    }));

    // --- Aggregate summary ---
    const totals = formattedOrders.reduce(
      (acc, o) => {
        acc.totalOrders += 1;
        acc.totalValue += o.totalValue;
        acc.totalDiscount += o.totalDiscount;
        acc.totalPaid += o.paidAmount;
        return acc;
      },
      { totalOrders: 0, totalValue: 0, totalDiscount: 0, totalPaid: 0 },
    );

    // --- Return report ---
    return {
      from: from ? from.toISOString().split('T')[0] : null,
      to: to ? to.toISOString().split('T')[0] : null,
      totalOrders: totals.totalOrders,
      totalValue: Math.round(totals.totalValue * 100) / 100,
      totalDiscount: Math.round(totals.totalDiscount * 100) / 100,
      totalPaid: Math.round(totals.totalPaid * 100) / 100,
      orders: formattedOrders,
    };
  }

  async getMonthlyOrderReport(year?: number) {
    // Optional year filter applied to all three queries
    const withYearFilter = (qb: SelectQueryBuilder<Order>) =>
      year
        ? qb.andWhere('EXTRACT(YEAR FROM order.createdAt) = :year', { year })
        : qb;

    // Query for all orders (regardless of status)
    const allOrdersResult = await withYearFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          'EXTRACT(YEAR FROM order.createdAt) AS year',
          "TO_CHAR(order.createdAt, 'Month') AS month_name",
          'EXTRACT(MONTH FROM order.createdAt) AS month_number',
          'COUNT(order.id) AS all_order_count',
          'SUM(order.totalValue) AS all_order_value',
        ]),
    )
      .groupBy('year, month_name, month_number')
      .orderBy('year, month_number', 'ASC')
      .getRawMany();

    // Query for delivered orders
    const deliveredResult = await withYearFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          'EXTRACT(YEAR FROM order.createdAt) AS year',
          "TO_CHAR(order.createdAt, 'Month') AS month_name",
          'EXTRACT(MONTH FROM order.createdAt) AS month_number',
          'COUNT(order.id) AS order_count',
          'SUM(order.totalValue) AS total_value',
        ]),
    )
      .where('order.orderStatus = :status', { status: OrderStatus.DELIVERED })
      .groupBy('year, month_name, month_number')
      .orderBy('year, month_number', 'ASC')
      .getRawMany();

    // Query for cancelled orders
    const cancelledResult = await withYearFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          'EXTRACT(YEAR FROM order.createdAt) AS year',
          "TO_CHAR(order.createdAt, 'Month') AS month_name",
          'EXTRACT(MONTH FROM order.createdAt) AS month_number',
          'COUNT(order.id) AS cancel_order_count',
          'SUM(order.totalValue) AS cancel_value',
        ]),
    )
      .where('order.orderStatus = :status', { status: OrderStatus.CANCELLED })
      .groupBy('year, month_name, month_number')
      .orderBy('year, month_number', 'ASC')
      .getRawMany();

    // Create maps for each query result
    const allOrdersMap = new Map();
    allOrdersResult.forEach((row) => {
      const key = `${row.year}-${row.month_number}`;
      allOrdersMap.set(key, {
        allOrderCount: parseInt(row.all_order_count),
        allOrderValue: parseFloat(row.all_order_value || 0),
      });
    });

    const deliveredMap = new Map();
    deliveredResult.forEach((row) => {
      const key = `${row.year}-${row.month_number}`;
      deliveredMap.set(key, {
        orderCount: parseInt(row.order_count),
        totalValue: parseFloat(row.total_value || 0),
      });
    });

    const cancelledMap = new Map();
    cancelledResult.forEach((row) => {
      const key = `${row.year}-${row.month_number}`;
      cancelledMap.set(key, {
        cancelOrderCount: parseInt(row.cancel_order_count),
        cancelValue: parseFloat(row.cancel_value || 0),
      });
    });

    // Get all unique month keys from all queries
    const allKeys = new Set([
      ...allOrdersMap.keys(),
      ...deliveredMap.keys(),
      ...cancelledMap.keys(),
    ]);

    // Combine the results
    const formattedData = Array.from(allKeys)
      .map((key) => {
        const [year, _monthNumber] = key.split('-');
        const allData = allOrdersMap.get(key) || {
          allOrderCount: 0,
          allOrderValue: 0,
        };
        const deliveredData = deliveredMap.get(key) || {
          orderCount: 0,
          totalValue: 0,
        };
        const cancelData = cancelledMap.get(key) || {
          cancelOrderCount: 0,
          cancelValue: 0,
        };

        return {
          year: parseInt(year),
          month: allOrdersResult.find((r) => `${r.year}-${r.month_number}` === key)?.month_name.trim() ||
               deliveredResult.find((r) => `${r.year}-${r.month_number}` === key)?.month_name.trim() ||
               cancelledResult.find((r) => `${r.year}-${r.month_number}` === key)?.month_name.trim(),
          allOrderCount: allData.allOrderCount,
          allOrderValue: allData.allOrderValue,
          orderCount: deliveredData.orderCount,
          totalValue: deliveredData.totalValue,
          cancelOrderCount: cancelData.cancelOrderCount,
          cancelValue: cancelData.cancelValue,
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const monthA = new Date(`${a.month} 1, 2000`).getMonth();
        const monthB = new Date(`${b.month} 1, 2000`).getMonth();
        return monthA - monthB;
      });

    return { monthlyData: formattedData };
  }

  async getMonthlyOrderReportYears() {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('DISTINCT EXTRACT(YEAR FROM order.createdAt)', 'year')
      .orderBy('year', 'DESC')
      .getRawMany();

    return result.map((row) => parseInt(row.year));
  }

  async getOrderStatistics() {
    const totalOrders = await this.orderRepository.count();

    const statusCounts = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderStatus', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.totalValue)', 'totalValue')
      .groupBy('order.orderStatus')
      .getRawMany();

    const statistics = {
      totalOrders,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      pendingValue: 0,
      processingValue: 0,
      shippedValue: 0,
      deliveredValue: 0,
      cancelledValue: 0,
    };

    statusCounts.forEach((row) => {
      const count = parseInt(row.count);
      const value = parseFloat(row.totalValue || 0);

      switch (row.status) {
        case OrderStatus.PENDING:
          statistics.pending = count;
          statistics.pendingValue = value;
          break;
        case OrderStatus.PROCESSING:
          statistics.processing = count;
          statistics.processingValue = value;
          break;
        case OrderStatus.SHIPPED:
          statistics.shipped = count;
          statistics.shippedValue = value;
          break;
        case OrderStatus.DELIVERED:
          statistics.delivered = count;
          statistics.deliveredValue = value;
          break;
        case OrderStatus.CANCELLED:
          statistics.cancelled = count;
          statistics.cancelledValue = value;
          break;
      }
    });

    return statistics;
  }

  async getLast30DaysDeliveredOrders() {
    // Calculate the date 30 days ago from today (using UTC to avoid timezone issues)
    const now = new Date();
    const thirtyDaysAgoUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
    const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Use order creation date for grouping, not delivery date from status tracks
    const query = `
      SELECT
        TO_CHAR("order"."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') as date,
        COUNT("order".id) as "orderCount",
        SUM("order"."totalValue") as "totalValue"
      FROM "order"
      WHERE "order"."orderStatus" = 'delivered'
        AND "order"."createdAt" AT TIME ZONE 'UTC' BETWEEN $1 AND $2
      GROUP BY TO_CHAR("order"."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')
      ORDER BY TO_CHAR("order"."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') ASC
    `;

    const dailyResults = await this.orderRepository.query(query, [
      thirtyDaysAgoUTC,
      endOfTodayUTC,
    ]);

    // Create a map for quick lookup
    const dailyDataMap = new Map<string, { orderCount: number; totalValue: number }>();
    dailyResults.forEach((row: any) => {
      dailyDataMap.set(row.date, {
        orderCount: parseInt(row.orderCount) || 0,
        totalValue: parseFloat(row.totalValue) || 0,
      });
    });

    // Generate all dates for the last 30 days (including today) in UTC
    const result = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const data = dailyDataMap.get(dateString) || { orderCount: 0, totalValue: 0 };

      result.push({
        date: dateString,
        orderCount: data.orderCount,
        totalValue: Math.round(data.totalValue * 100) / 100,
      });
    }

    return result;
  }

  /**
   * Cancel an order with proper validation and status updates
   * Handles both paid and unpaid orders
   * @param id Order ID
   * @param cancelOrderDto Cancellation details including reason and notes
   * @param user User performing the cancellation
   * @returns Updated order with cancelled status
   */
  async cancelOrder(
    id: number,
    cancelOrderDto: CancelOrderDto,
    user: User,
  ): Promise<Order> {
    const { reason, notes } = cancelOrderDto;

    // Fetch order with all necessary relations
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.product',
        'user',
        'payments',
        'address',
        'statusTracks',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // VALIDATION RULES
    // Check if order can be cancelled based on current status
    if (order.orderStatus === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Order is already cancelled',
      );
    }

    if (order.orderStatus === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Cannot cancel a delivered order',
      );
    }

    if (order.orderStatus === OrderStatus.SHIPPED) {
      throw new BadRequestException(
        'Cannot cancel a shipped order. Please contact support for returns.',
      );
    }

    // Only PENDING and PROCESSING orders can be cancelled
    if (
      order.orderStatus !== OrderStatus.PENDING &&
      order.orderStatus !== OrderStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.orderStatus}`,
      );
    }

    // DETERMINE PAYMENT STATUS BASED ON ORDER STATE
    let newPaymentStatus: PaymentStatus;

    if (order.paidAmount > 0 || order.paymentStatus === PaymentStatus.PAID) {
      // Paid order: Mark as NEED_REFUND (refund needs to be processed)
      newPaymentStatus = PaymentStatus.NEED_REFUND;
    } else if (order.paymentStatus === PaymentStatus.PARTIAL) {
      // Partially paid order: Mark as PARTIAL_REFUND
      newPaymentStatus = PaymentStatus.PARTIAL_REFUND;
    } else {
      // Unpaid order: Mark as FAILED
      newPaymentStatus = PaymentStatus.FAILED;
    }

    // RESTORE STOCK
    // Increment product stock for each item in the cancelled order
    for (const item of order.items) {
      if (item.product) {
        item.product.stock += item.quantity;
        item.product.saleCount = Math.max(0, item.product.saleCount - item.quantity);
        await this.productRepository.save(item.product);

        this.logger.log(
          `Restored ${item.quantity} units of product ${item.product.name} (ID: ${item.product.id})`,
        );
      }
    }

    // UPDATE ORDER STATUSES
    await this.orderRepository.update(id, {
      orderStatus: OrderStatus.CANCELLED,
      paymentStatus: newPaymentStatus,
    });

    // CREATE STATUS TRACK ENTRY WITH CANCELLATION REASON
    const cancellationNote = `Cancellation reason: ${reason}${notes ? `. Notes: ${notes}` : ''}`;

    const statusTrack = this.orderStatusTrackRepository.create({
      order,
      status: OrderStatus.CANCELLED,
      note: cancellationNote,
      updatedBy: user?.userId,
    });
    await this.orderStatusTrackRepository.save(statusTrack);

    this.logger.log(
      `Order ${order.orderNo} (ID: ${id}) cancelled by ${user?.name || 'system'}. Reason: ${reason}. Payment status: ${newPaymentStatus}`,
    );

    // SEND NOTIFICATIONS
    try {
      if (order.user) {
        this.notificationService.notifyOrderStatusUpdate(
          order.user.id.toString(),
          {
            orderId: order.id.toString(),
            orderNo: order.orderNo,
            userId: order.user.id.toString(),
            orderStatus: OrderStatus.CANCELLED,
            paymentStatus: newPaymentStatus,
            totalValue: Number(order.totalValue),
            items: order.items,
            address: order.address,
            updatedAt: new Date(),
          },
        );
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send cancellation notification for order ${order.orderNo}: ${err.message}`,
      );
    }

    // SEND EMAIL NOTIFICATION
    // TODO: Implement sendOrderCancellationEmail in EmailService
    // try {
    //   await this.emailService.sendOrderCancellationEmail({
    //     orderNo: order.orderNo,
    //     customerName: order.user.name,
    //     customerEmail: order.user.email,
    //     cancellationReason: reason,
    //     totalValue: Number(order.totalValue),
    //     paidAmount: Number(order.paidAmount),
    //     willBeRefunded: newPaymentStatus === PaymentStatus.REFUNDED,
    //   });
    // } catch (error) {
    //   this.logger.error(
    //     `Failed to send cancellation email for order ${order.orderNo}: ${error.message}`,
    //   );
    // }

    // RETURN UPDATED ORDER
    return this.getOrderById(id);
  }
}
