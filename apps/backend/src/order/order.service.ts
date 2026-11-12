import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/address/entities/address.entity';
import {
  applyBogoDiscount,
  BogoCampaignsService,
} from 'src/bogo-campaigns/bogo-campaigns.service';
import { BogoUsageLogService } from 'src/bogo-usage-log/bogo-usage-log.service';
import { CancellationReason, OrderStatus, PaymentStatus } from 'src/common/enums';
import { formatDhakaDate, getDateRangeFromPreset, parseReportDate, } from 'src/common/utils/report-date-range.util';
import { CouponService } from 'src/coupon/coupon.service';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { DeliveryMan } from 'src/delivery-man/entities/delivery-man.entity';
import {
  computeFlashPrice,
  FlashSaleCampaignsService,
} from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
import { FlashSaleUsageLogService } from 'src/flash-sale-usage-log/flash-sale-usage-log.service';
import { FreeDeliveryCampaignsService } from 'src/free-delivery-campaigns/free-delivery-campaigns.service';
import { FreeDeliveryUsageLogService } from 'src/free-delivery-usage-log/free-delivery-usage-log.service';

import { SmsService } from 'src/auth/sms.service';
import { generateOrderConfirmationSMS } from 'src/auth/templates/order-confirmation-sms.template';
import { DiscountType } from 'src/common/enums';
import { CouponUsageLogService } from 'src/coupon-usage-log/coupon-usage-log.service';
import { EmailService } from 'src/email/email.service';
import { NotificationService } from 'src/notification/notification.service';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { OrderPaymentService } from 'src/order-payment/order-payment.service';
import { Product } from 'src/product/entities/product.entity';
import { ShippingMethod } from 'src/shipping-methods/entities/shipping-method.entity';
import { StockMovementType } from 'src/stock-movement/entities/stock-movement.entity';
import { StockMovementService } from 'src/stock-movement/stock-movement.service';
import { User } from 'src/user/entities/user.entity';
import {
  LessThan,
  MoreThan,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderNote } from './entities/order-note.entity';
import { OrderStatusTrack } from './entities/order-status-track.entity';
import { Order } from './entities/order.entity';

/** System identifier of the offline payment method (order_payment_method.code) */
const CASH_ON_DELIVERY_CODE = 'cash_on_delivery';

export interface FindAllOrdersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'date_asc' | 'date_desc';
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethodId?: number;
  shippingMethodId?: number;
  area?: string;
  division?: string;
  city?: string;
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
    @InjectRepository(OrderNote)
    private readonly orderNoteRepository: Repository<OrderNote>,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    private readonly smsService: SmsService,
    private readonly couponUsageLogService: CouponUsageLogService,
    private readonly couponService: CouponService,
    private readonly freeDeliveryCampaignsService: FreeDeliveryCampaignsService,
    private readonly freeDeliveryUsageLogService: FreeDeliveryUsageLogService,
    private readonly flashSaleCampaignsService: FlashSaleCampaignsService,
    private readonly flashSaleUsageLogService: FlashSaleUsageLogService,
    private readonly bogoCampaignsService: BogoCampaignsService,
    private readonly bogoUsageLogService: BogoUsageLogService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const currentYear = new Date().getFullYear();

    // Order numbers are `YYYY-NNNNNN` (6-digit sequence since the 2026-11
    // migration; rows from before keep 4-digit tails — both are unique and
    // the lookup below sorts by the zero-padded numeric tail, so mixed
    // widths are safe). Stripping to the last `-` segment and padding it to
    // a fixed width gives a plain numeric max: `RIGHT(orderNo, 4)` would
    // truncate longer tails (`RIGHT('2026-10000', 4)` = '0000') and
    // regenerate the same number, hitting the unique constraint.
    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderNo', 'orderNo')
      .where('order.orderNo LIKE :pattern', { pattern: `%${currentYear}-%` })
      .orderBy(
        "lpad(REGEXP_REPLACE(order.orderNo, '^.*-', ''), 10, '0')::bigint",
        'DESC',
      )
      .getRawOne();

    let lastNumber = 0;
    if (lastOrder) {
      lastNumber = parseInt(lastOrder.orderNo.split('-').pop(), 10) || 0;
    }

    const orderNo = `${currentYear}-${(lastNumber + 1).toString().padStart(6, '0')}`;

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
    if (
      shippingMethod.requiresOnlinePayment &&
      paymentMethod.code === CASH_ON_DELIVERY_CODE
    ) {
      throw new BadRequestException(
        `Cash on delivery is not available for the ${shippingMethod.name} shipping method. Please pay online.`,
      );
    }
    if (couponId && !coupon)
      throw new NotFoundException(`Coupon ${couponId} not found`);

    // Service-area restriction: methods limited to certain cities/areas are
    // rejected for addresses outside them. Address fields are free text, so
    // matching uses the same normalization/alias rules as the coverage
    // pricing. An empty config means unrestricted.
    if (shippingMethod.serviceAreas) {
      const { mode = 'include', cities = [], areas = [] } =
        shippingMethod.serviceAreas;
      if (cities.length > 0 || areas.length > 0) {
        const locationAliases: Record<string, string> = { barishal: 'barisal' };
        const normalizeLocation = (value: string): string => {
          const trimmed = value.trim().toLowerCase().replace(/\s+/g, ' ');
          return locationAliases[trimmed] ?? trimmed;
        };
        const cityKey = address.city ? normalizeLocation(address.city) : '';
        const areaKey = address.area ? normalizeLocation(address.area) : '';
        const cityAllowed = cities.some(
          (city) => normalizeLocation(city) === cityKey,
        );
        const areaAllowed = areas.some(
          (area) => normalizeLocation(area) === areaKey,
        );
        const matched = cityAllowed || areaAllowed;
        const isAllowed =
          mode === 'exclude' ? !matched : matched;
        if (!isAllowed) {
          throw new BadRequestException(
            mode === 'exclude'
              ? `${shippingMethod.name} is not available for delivery to ${address.city}.`
              : `${shippingMethod.name} is only available in selected cities and areas.`,
          );
        }
      }
    }

    let totalValue = 0;
    let totalDiscount = 0;

    // Store item pricing details for later use
    const itemPricingDetails = [];

    // Flash sale resolves once per order: a campaign matching any item
    // overrides that item's product discount (no stacking).
    const flashCampaigns =
      await this.flashSaleCampaignsService.getActiveCampaigns();
    /** campaignId -> { campaign, discount } for campaigns that priced ≥1 item */
    const flashUsage = new Map<
      number,
      { campaign: (typeof flashCampaigns)[number]; discount: number }
    >();

    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (!product)
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );

      // Inactive products must not be orderable (e.g. stale links / old carts)
      if (!product.isActive)
        throw new BadRequestException(
          `${product.name} is no longer available.`,
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

      // Flash sale wins over the product's own discount — never stacked
      const flashCampaign =
        this.flashSaleCampaignsService.resolveForProductFromList(
          flashCampaigns,
          product.id,
          product.category?.id,
        );
      if (flashCampaign) {
        price = computeFlashPrice(Number(product.sellingPrice), flashCampaign);
        productDiscount = Number(product.sellingPrice) - price;
        const entry = flashUsage.get(flashCampaign.id);
        if (entry) {
          entry.discount += productDiscount;
        } else {
          flashUsage.set(flashCampaign.id, {
            campaign: flashCampaign,
            discount: productDiscount,
          });
        }
      }
      // Apply product discount if valid
      else if (product.discountStartDate && product.discountEndDate) {
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
      const stockBefore = product.stock;
      product.stock -= item.quantity;
      product.saleCount += item.quantity;
      await this.productRepository.save(product);

      // The order row is saved later, so reference by order number here
      await this.stockMovementService.record({
        product,
        type: StockMovementType.ORDER_SALE,
        quantity: -item.quantity,
        stockBefore,
        stockAfter: product.stock,
        referenceType: 'order',
        note: `Order ${orderNo}`,
        user,
      });

      // Store pricing details for this item
      itemPricingDetails.push({
        productId: item.productId,
        categoryId: product.category?.id,
        quantity: item.quantity,
        unitPrice: price,
        unitDiscount: productDiscount,
        totalPrice: itemTotal,
      });
    }

    // BOGO: for every (buyQuantity + getQuantity) eligible units, the
    // getQuantity cheapest become free. Applied after per-item pricing (so
    // free units are valued at flash/product-discount prices) and before the
    // coupon block (so coupon % never discounts the free units).
    let bogoResult: ReturnType<typeof applyBogoDiscount> | null = null;
    try {
      const bogoCampaigns = await this.bogoCampaignsService.getActiveCampaigns();
      if (bogoCampaigns.length > 0) {
        // Per-user lifetime caps (maxFreePerUser) are counted from the usage
        // log so a customer can't farm the same campaign across orders.
        const perUserFreeUsed = user?.id
          ? await this.bogoUsageLogService.sumFreeUnitsByUser(
              user.id,
              bogoCampaigns.map((campaign) => campaign.id),
            )
          : undefined;
        bogoResult = applyBogoDiscount(
          itemPricingDetails,
          bogoCampaigns,
          perUserFreeUsed,
        );
        if (bogoResult.totalDiscount > 0) {
          totalValue -= bogoResult.totalDiscount;
          totalDiscount += bogoResult.totalDiscount;
        }
      }
    } catch (error) {
      this.logger.error(`BOGO evaluation failed for ${orderNo}: ${error}`);
    }

    let couponDiscountAmount = 0;
    if (coupon) {
      // Re-validate at order creation — the checkout-time apply check may be
      // stale (coupon deactivated/expired/limit-reached since it was applied).
      // A lapsed coupon must fail the order, not silently charge full price.
      this.couponService.assertUsable(coupon);

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

      // Same minimum-order rule the checkout apply-check enforces. Checked
      // here (not in assertUsable) because the eligible basis is order-side:
      // post-product/flash/BOGO item totals, not raw cart prices.
      if (
        coupon.minOrderAmount != null &&
        eligibleTotal < Number(coupon.minOrderAmount)
      ) {
        throw new BadRequestException(
          `Coupon ${coupon.code} requires a minimum eligible order amount of ${Number(coupon.minOrderAmount)}`,
        );
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

    // Add shipping cost — waived when a free-delivery campaign matches the
    // payable subtotal (after product + coupon discounts)
    const payableSubtotal = totalValue;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    let freeDeliveryEligible = false;
    let matchedCampaignId: number | null = null;
    let matchedCampaign: import('src/free-delivery-campaigns/entities/free-delivery-campaign.entity').FreeDeliveryCampaign | null = null;
    try {
      const evaluation = await this.freeDeliveryCampaignsService.evaluate({
        payableSubtotal,
        totalQuantity,
        items: itemPricingDetails.map(({ productId, categoryId }) => ({
          productId,
          categoryId,
        })),
        userId: user.id,
      });
      freeDeliveryEligible = evaluation.eligible;
      matchedCampaignId = evaluation.campaign?.id ?? null;
      matchedCampaign = evaluation.campaign ?? null;
    } catch (error) {
      this.logger.error(
        `Free delivery campaign evaluation failed for ${orderNo}: ${error}`,
      );
    }

    // Methods excluded from free delivery (e.g. express) always pay their
    // full cost, even when a campaign matches.
    const freeDeliveryApplied =
      freeDeliveryEligible && !shippingMethod.isExcludedFromFreeDelivery;

    // Shipping-method minimum order amount — checked against the payable
    // subtotal (after product and coupon discounts), matching the checkout
    // display. Coverage no longer carries minimums.
    const methodMinOrderAmount =
      shippingMethod.minOrderAmount != null
        ? Number(shippingMethod.minOrderAmount)
        : null;
    if (
      methodMinOrderAmount != null &&
      !shippingMethod.isPickup &&
      payableSubtotal < methodMinOrderAmount
    ) {
      throw new BadRequestException(
        `Minimum order amount for ${shippingMethod.name} is ৳${methodMinOrderAmount}.`,
      );
    }

    // Free-delivery campaigns waive the shipping method's base cost
    // (pickup methods never carry a charge).
    const chargedShipping = freeDeliveryApplied
      ? 0
      : Number(shippingMethod.cost);

    if (matchedCampaignId && freeDeliveryApplied) {
      try {
        await this.freeDeliveryCampaignsService.incrementUsage(matchedCampaignId);
      } catch (error) {
        this.logger.error(
          `Failed to increment free delivery campaign usage: ${error}`,
        );
      }
    }

    // Flash sale usage: once per distinct campaign that priced at least one
    // item. Atomic conditional UPDATE — silently caps at maxUsage.
    for (const campaignId of flashUsage.keys()) {
      try {
        await this.flashSaleCampaignsService.incrementUsage(campaignId);
      } catch (error) {
        this.logger.error(
          `Failed to increment flash sale campaign usage: ${error}`,
        );
      }
    }

    // BOGO usage: once per distinct campaign that freed at least one unit.
    // Atomic conditional UPDATE — silently caps at maxUsage.
    if (bogoResult) {
      for (const usage of bogoResult.usages) {
        try {
          await this.bogoCampaignsService.incrementUsage(usage.campaign.id);
        } catch (error) {
          this.logger.error(
            `Failed to increment BOGO campaign usage: ${error}`,
          );
        }
      }
    }

    totalValue += chargedShipping;

    // Round final values
    totalValue = Math.round(totalValue * 100) / 100;
    totalDiscount = Math.round(totalDiscount * 100) / 100;

    // Create order
    const order = this.orderRepository.create({
      ...orderDetails,
      totalValue,
      totalDiscount,
      shippingCost: chargedShipping,
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

    // Log free delivery campaign usage — which customer used which campaign
    if (matchedCampaignId && freeDeliveryApplied && matchedCampaign) {
      try {
        await this.freeDeliveryUsageLogService.create({
          campaign: matchedCampaign,
          campaignName: matchedCampaign.name,
          order,
          user,
          shippingWaived: Number(shippingMethod.cost),
          orderTotal: totalValue,
        });
      } catch (error) {
        this.logger.error(
          `Failed to log free delivery usage for order ${orderNo}: ${error}`,
        );
      }
    }

    // Log flash sale usage — one row per campaign that priced at least one
    // item, with the total discount that campaign gave on this order.
    for (const [campaignId, usage] of flashUsage) {
      if (usage.discount <= 0) continue;
      try {
        await this.flashSaleUsageLogService.create({
          campaign: usage.campaign,
          campaignName: usage.campaign.name,
          order,
          user,
          discountAmount: Math.round(usage.discount * 100) / 100,
          orderTotal: totalValue,
        });
      } catch (error) {
        this.logger.error(
          `Failed to log flash sale usage for order ${orderNo} (campaign ${campaignId}): ${error}`,
        );
      }
    }

    // Log BOGO usage — one row per campaign that freed at least one unit,
    // with the total discount that campaign gave on this order.
    if (bogoResult) {
      for (const usage of bogoResult.usages) {
        if (usage.discount <= 0) continue;
        try {
          await this.bogoUsageLogService.create({
            campaign: usage.campaign,
            campaignName: usage.campaign.name,
            order,
            user,
            discountAmount: Math.round(usage.discount * 100) / 100,
            freeUnits: usage.freeUnits,
            orderTotal: totalValue,
          });
        } catch (error) {
          this.logger.error(
            `Failed to log BOGO usage for order ${orderNo} (campaign ${usage.campaign.id}): ${error}`,
          );
        }
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

    // Send order confirmation email — the charged fee comes from the order
    // itself so a free-delivery order doesn't show the method's base cost
    const orderShippingCost = Number(
      completeOrder.shippingCost ?? completeOrder.shippingMethod?.cost ?? 0,
    );
    try {
      await this.emailService.sendOrderConfirmationEmail({
        orderNo: completeOrder.orderNo,
        customerName: user.name,
        customerEmail: user.email,
        subtotal: Number(completeOrder.totalValue) - orderShippingCost,
        shippingFee: orderShippingCost,
        totalValue: Number(completeOrder.totalValue),
        shippingMethod: shippingMethod.name,
        paymentMethod: paymentMethod.name,
        items: completeOrder.items.map((item) => ({
          productName: item.product?.name || 'Product',
          quantity: item.quantity,
          price: Number(item.unitPrice),
          unitDiscount: Number(item.unitDiscount) || 0,
          productImage: item.product?.attachment?.url ?? null,
        })),
        ...(coupon && {
          coupon: {
            code: coupon.code,
            discountAmount: couponDiscountAmount,
          },
        }),
        ...(bogoResult &&
          bogoResult.usages.length > 0 && {
            bogo: bogoResult.usages.map((usage) => ({
              campaignName: usage.campaign.name,
              discountAmount: Math.round(usage.discount * 100) / 100,
              freeUnits: usage.freeUnits,
            })),
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

    // Admin notification — fire-and-forget, never blocks order creation
    void this.emailService.sendNewOrderAdminEmail({
      orderNo: completeOrder.orderNo,
      customerName: user.name,
      totalAmount: Number(completeOrder.totalValue).toFixed(2),
      itemCount: completeOrder.items?.length ?? 0,
      items: completeOrder.items?.map((item) => ({
        productName: item.product?.name || 'Product',
        quantity: item.quantity,
        price: Number(item.unitPrice),
        unitDiscount: Number(item.unitDiscount) || 0,
        productImage: item.product?.attachment?.url ?? null,
      })),
      ...(bogoResult &&
        bogoResult.usages.length > 0 && {
          bogo: bogoResult.usages.map((usage) => ({
            campaignName: usage.campaign.name,
            discountAmount: Math.round(usage.discount * 100) / 100,
            freeUnits: usage.freeUnits,
          })),
        }),
    });

    // Send order confirmation SMS
    if (user.mobileNumber) {
      try {
        const smsMessage = generateOrderConfirmationSMS({
          orderNo: completeOrder.orderNo,
          customerName: user.name,
          totalValue: Number(completeOrder.totalValue),
          itemCount: completeOrder.items.length,
        });
        await this.smsService.sendSms(user.mobileNumber, smsMessage, 'ORDER-CONFIRMATION');
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

  /** Relations for the full order-detail payload (view page, PDF, etc.).
   *  Bulky nested rows the UI never reads (serviceAreas, supplier, audit
   *  users) are stripped by stripDetailBloat before the response is sent. */
  private static readonly DETAIL_RELATIONS = [
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
    'coupon',
    'statusTracks',
    'statusTracks.updatedBy',
    'notes',
    'notes.createdBy',
    'deliveryMan',
  ];

  /**
   * Remove fields the order-detail consumers never render: the ~270-entry
   * shipping serviceAreas list, nested createdBy/updatedBy user objects on
   * shipping/payment methods, units and products, and the long product
   * marketing text. Cuts the payload by an order of magnitude.
   */
  private stripDetailBloat(order: Order): Order {
    if (order.shippingMethod) {
      const sm = order.shippingMethod as unknown as Record<string, unknown>;
      delete sm.serviceAreas;
      delete sm.createdBy;
      delete sm.updatedBy;
    }

    const stripMethodAudit = (pm: unknown) => {
      if (pm) {
        delete (pm as Record<string, unknown>).createdBy;
        delete (pm as Record<string, unknown>).updatedBy;
      }
    };
    stripMethodAudit(order.paymentMethod);
    order.payments?.forEach((p) => stripMethodAudit(p.paymentMethod));

    order.items?.forEach((item) => {
      const product = item.product as unknown as Record<string, unknown> | undefined;
      if (!product) return;
      delete product.description;
      delete product.productDetails;
      delete product.totalValueBySalePrice;
      delete product.totalValueByPurchasePrice;
      delete product.createdBy;
      delete product.updatedBy;
      if (product.unit) {
        delete (product.unit as Record<string, unknown>).createdBy;
        delete (product.unit as Record<string, unknown>).updatedBy;
      }
    });

    return order;
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.findOrderDetail({ id }, `Order with ID ${id} not found`);
  }

  /** Accepts a numeric PK or an orderNo (`2026-002365`) — the admin routes
   * address orders by their human-readable number. */
  async getOrderByIdOrNo(idOrNo: string): Promise<Order | null> {
    if (/^\d+$/.test(idOrNo)) {
      return this.getOrderById(Number(idOrNo));
    }
    const orderNo = decodeURIComponent(idOrNo);
    return this.findOrderDetail(
      { orderNo },
      `Order with number ${orderNo} not found`,
    );
  }

  private async findOrderDetail(
    where: { id: number } | { orderNo: string },
    notFoundMessage: string,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where,
      relations: OrderService.DETAIL_RELATIONS,
    });

    if (!order) {
      throw new NotFoundException(notFoundMessage);
    }

    this.stripDetailBloat(order);

    // Attach BOGO usage for the confirmation display — plain prop on the
    // returned object, never persisted. Failure must not break the fetch.
    try {
      (order as Order & { bogoUsage?: unknown }).bogoUsage =
        await this.bogoUsageLogService.findByOrder(order.id);
    } catch (error) {
      this.logger.warn(`Failed to load BOGO usage for order ${order.id}: ${error}`);
    }

    return order;
  }

  /** Revenue share per payment method (delivered orders only — matches the
   * Total Sales KPI so the dashboard reconciles). */
  async getPaymentMethodShare(): Promise<
    { name: string; orderCount: number; totalValue: number }[]
  > {
    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select('paymentMethod.name', 'name')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('SUM(order.totalValue)', 'totalValue')
      .leftJoin('order.paymentMethod', 'paymentMethod')
      .where('order.orderStatus = :status', { status: OrderStatus.DELIVERED })
      .groupBy('paymentMethod.id')
      .addGroupBy('paymentMethod.name')
      .orderBy('SUM(order.totalValue)', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      name: row.name ?? 'Unknown',
      orderCount: parseInt(row.orderCount, 10) || 0,
      totalValue: parseFloat(row.totalValue) || 0,
    }));
  }

  /** Revenue share per product category (delivered orders only, item-level
   * totals — excludes delivery fees, so it lands slightly below the
   * order-level Total Sales KPI). */
  async getCategorySales(): Promise<
    { name: string; quantity: number; totalValue: number }[]
  > {
    const rows = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('category.name', 'name')
      .addSelect('SUM(item.totalPrice)', 'totalValue')
      .addSelect('SUM(item.quantity)', 'quantity')
      .innerJoin('item.product', 'product')
      .innerJoin('product.category', 'category')
      .innerJoin('item.order', 'order')
      .where('order.orderStatus = :status', { status: OrderStatus.DELIVERED })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('SUM(item.totalPrice)', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      name: row.name ?? 'Unknown',
      quantity: parseInt(row.quantity, 10) || 0,
      totalValue: parseFloat(row.totalValue) || 0,
    }));
  }

  /** Customers active this month, split by whether their first-ever order
   * was also this month (new) or earlier (returning). "This month" follows
   * Dhaka time (UTC+6): createdAt stores UTC wall-clock, and the DB server
   * runs in UTC so CURRENT_DATE would bucket orders by GMT months. */
  async getCustomerTypeShare(): Promise<{
    newCustomers: number;
    returningCustomers: number;
  }> {
    const result: Record<string, string>[] = await this.orderRepository.query(
      `WITH user_orders AS (
         SELECT "userId",
                MIN("createdAt") AS first_order,
                BOOL_OR("createdAt" + INTERVAL '6 hours' >=
                        date_trunc('month', (now() AT TIME ZONE 'UTC') + INTERVAL '6 hours')
                ) AS ordered_this_month
         FROM "order"
         WHERE "userId" IS NOT NULL
         GROUP BY "userId"
       )
       SELECT
         COUNT(*) FILTER (
           WHERE date_trunc('month', first_order + INTERVAL '6 hours') =
                 date_trunc('month', (now() AT TIME ZONE 'UTC') + INTERVAL '6 hours')
         ) AS new_customers,
         COUNT(*) FILTER (
           WHERE ordered_this_month = true
             AND date_trunc('month', first_order + INTERVAL '6 hours') <
                 date_trunc('month', (now() AT TIME ZONE 'UTC') + INTERVAL '6 hours')
         ) AS returning_customers
       FROM user_orders`,
    );

    const row = result[0] ?? {};
    return {
      newCustomers: parseInt(row.new_customers, 10) || 0,
      returningCustomers: parseInt(row.returning_customers, 10) || 0,
    };
  }

  /** Orders received today vs yesterday (cancelled excluded). Day
   * boundaries follow Bangladesh time (UTC+6, no DST) because the DB server
   * runs in UTC — using CURRENT_DATE would bucket orders by GMT days. */
  async getTodaySnapshot(): Promise<{
    todayOrders: number;
    todayValue: number;
    yesterdayOrders: number;
    yesterdayValue: number;
  }> {
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;
    const bdtNow = new Date(Date.now() + BDT_OFFSET_MS);
    const bdtDayStartUtcMs =
      Date.UTC(
        bdtNow.getUTCFullYear(),
        bdtNow.getUTCMonth(),
        bdtNow.getUTCDate(),
      ) - BDT_OFFSET_MS;

    const yesterdayStart = new Date(bdtDayStartUtcMs - 24 * 60 * 60 * 1000);
    const todayStart = new Date(bdtDayStartUtcMs);
    const tomorrowStart = new Date(bdtDayStartUtcMs + 24 * 60 * 60 * 1000);

    const result: Record<string, string>[] = await this.orderRepository.query(
      `SELECT
         COUNT(*) FILTER (
           WHERE "createdAt" >= $2 AND "createdAt" < $3
         ) AS today_orders,
         COALESCE(SUM("totalValue") FILTER (
           WHERE "createdAt" >= $2 AND "createdAt" < $3
         ), 0) AS today_value,
         COUNT(*) FILTER (
           WHERE "createdAt" >= $1 AND "createdAt" < $2
         ) AS yesterday_orders,
         COALESCE(SUM("totalValue") FILTER (
           WHERE "createdAt" >= $1 AND "createdAt" < $2
         ), 0) AS yesterday_value
       FROM "order"
       WHERE "orderStatus" != $4`,
      [yesterdayStart, todayStart, tomorrowStart, OrderStatus.CANCELLED],
    );

    const row = result[0] ?? {};
    return {
      todayOrders: parseInt(row.today_orders, 10) || 0,
      todayValue: parseFloat(row.today_value) || 0,
      yesterdayOrders: parseInt(row.yesterday_orders, 10) || 0,
      yesterdayValue: parseFloat(row.yesterday_value) || 0,
    };
  }

  /** Everything the admin dashboard needs in one round trip — fans the
   * existing report queries out in parallel behind a single request so the
   * frontend stops paying 8 separate guard + network round trips. */
  async getDashboardReports() {
    const [
      statistics,
      monthlyReport,
      monthlyAllTime,
      last30DaysDelivered,
      paymentMethodShare,
      categorySales,
      customerType,
      todaySnapshot,
      paymentDue,
      deliveryPerformance,
    ] = await Promise.all([
      this.getOrderStatistics(),
      // Rolling 12-month window for the dashboard chart
      this.getMonthlyOrderReport(undefined, { last12Months: true }),
      // Unbounded monthly data so the "Total Sales" cards can show true
      // all-time totals while the chart stays capped at 12 bars.
      this.getMonthlyOrderReport(),
      this.getLast30DaysDeliveredOrders(),
      this.getPaymentMethodShare(),
      this.getCategorySales(),
      this.getCustomerTypeShare(),
      this.getTodaySnapshot(),
      this.getPaymentDue(),
      this.getDeliveryPerformanceSummary(),
    ]);

    return {
      statistics,
      
      monthly: monthlyReport.monthlyData,
      monthlyAllTime: monthlyAllTime.monthlyData,
      last30DaysDelivered,
      paymentMethodShare,
      categorySales,
      customerType,
      todaySnapshot,
      paymentDue,
      deliveryPerformance,
    };
  }


  async getDeliveryPerformanceSummary(): Promise<{
    avgDeliveryHours: number | null;
    deliveredOrders30d: number;
    topDeliveryMen: Array<{
      name: string;
      deliveries: number;
      deliveredValue: number;
    }>;
  }> {
    const [timingRow, topRows] = await Promise.all([
      this.orderRepository.query(
        `SELECT COUNT(DISTINCT o.id) AS delivered_orders,
                AVG(EXTRACT(EPOCH FROM (d.delivered_at - o."createdAt")) / 3600) AS avg_hours
         FROM "order" o
         JOIN (
           SELECT ost."orderId",
                  MAX(ost."createdAt") AS delivered_at
           FROM order_status_track ost
           WHERE ost."status" = 'delivered'
           GROUP BY ost."orderId"
           HAVING MAX(ost."createdAt") >= NOW() - INTERVAL '30 days'
         ) d ON d."orderId" = o.id`,
      ),
      this.orderRepository.query(
        `SELECT dm.name,
                COUNT(o.id) AS deliveries,
                COALESCE(SUM(o."totalValue"), 0) AS delivered_value
         FROM delivery_man dm
         JOIN "order" o
           ON o."deliveryManId" = dm.id
          AND o."orderStatus" = 'delivered'
          AND o."createdAt" >= NOW() - INTERVAL '30 days'
         GROUP BY dm.id, dm.name
         ORDER BY COUNT(o.id) DESC, dm.name ASC
         LIMIT 5`,
      ),
    ]);

    const row = timingRow[0] ?? {};
    return {
      avgDeliveryHours:
        row.avg_hours === null || row.avg_hours === undefined
          ? null
          : Math.round(parseFloat(row.avg_hours) * 10) / 10,
      deliveredOrders30d: parseInt(row.delivered_orders, 10) || 0,
      topDeliveryMen: (topRows as Array<Record<string, unknown>>).map((r) => ({
        name: String(r.name),
        deliveries: parseInt(String(r.deliveries), 10) || 0,
        deliveredValue: parseFloat(String(r.delivered_value)) || 0,
      })),
    };
  }

  /** Delivered orders that are not fully paid (outstanding amount). */
  async getPaymentDue(): Promise<{ dueOrders: number; dueAmount: number }> {
    const result: Record<string, string>[] = await this.orderRepository.query(
      `SELECT COUNT(*) AS due_orders,
              COALESCE(SUM("totalValue" - "paidAmount"), 0) AS due_amount
       FROM "order"
       WHERE "orderStatus" = $1 AND "paidAmount" < "totalValue"`,
      [OrderStatus.DELIVERED],
    );

    const row = result[0] ?? {};
    return {
      dueOrders: parseInt(row.due_orders, 10) || 0,
      dueAmount: parseFloat(row.due_amount) || 0,
    };
  }

  /** Prev/next neighbors addressed by numeric PK or orderNo. Returns both
   * ids and orderNos so the admin UI can build orderNo URLs while older
   * clients keep working with the id fields. */
  async getNeighborOrders(
    idOrNo: string,
  ): Promise<{
    prevId: number | null;
    nextId: number | null;
    prevNo: string | null;
    nextNo: string | null;
  }> {
    const id = /^\d+$/.test(idOrNo)
      ? Number(idOrNo)
      : (
          await this.orderRepository.findOne({
            where: { orderNo: decodeURIComponent(idOrNo) },
            select: { id: true },
          })
        )?.id;

    if (!id) {
      throw new NotFoundException(`Order ${idOrNo} not found`);
    }

    const [prev, next] = await Promise.all([
      this.orderRepository.findOne({
        where: { id: LessThan(id) },
        order: { id: 'DESC' },
        select: { id: true, orderNo: true },
      }),
      this.orderRepository.findOne({
        where: { id: MoreThan(id) },
        order: { id: 'ASC' },
        select: { id: true, orderNo: true },
      }),
    ]);

    return {
      prevId: prev?.id ?? null,
      nextId: next?.id ?? null,
      prevNo: prev?.orderNo ?? null,
      nextNo: next?.orderNo ?? null,
    };
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

  private applyOrderFilters(
    qb: SelectQueryBuilder<Order>,
    {
      search,
      orderStatus,
      paymentStatus,
      paymentMethodId,
      shippingMethodId,
      area,
      division,
      city,
    }: Pick<
      FindAllOrdersOptions,
      | 'search'
      | 'orderStatus'
      | 'paymentStatus'
      | 'paymentMethodId'
      | 'shippingMethodId'
      | 'area'
      | 'division'
      | 'city'
    >,
  ): void {
    if (search) {
      qb.andWhere(
        '(order.orderNo LIKE :search OR user.name LIKE :search OR user.mobileNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (orderStatus) {
      qb.andWhere('order.orderStatus = :orderStatus', { orderStatus });
    }
    if (paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }
    // FK column, so no join is needed and the count query stays join-free
    if (paymentMethodId) {
      qb.andWhere('order.paymentMethodId = :paymentMethodId', {
        paymentMethodId,
      });
    }
    if (shippingMethodId) {
      qb.andWhere('order.shippingMethodId = :shippingMethodId', {
        shippingMethodId,
      });
    }
    // Free-text location fields on the joined address row; ILIKE for
    // case-insensitive matching since Postgres LIKE is case-sensitive
    if (area) {
      qb.andWhere('address.area ILIKE :area', { area: `%${area}%` });
    }
    if (division) {
      qb.andWhere('address.division ILIKE :division', {
        division: `%${division}%`,
      });
    }
    if (city) {
      qb.andWhere('address.city ILIKE :city', { city: `%${city}%` });
    }
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
      paymentMethodId,
      shippingMethodId,
      area,
      division,
      city,
      sort,
    } = options;

    const skip = (page - 1) * limit;

    // The list table only shows order no, customer name, date, statuses,
    // payment method and totals. Edit/payment modals fetch orders/:id for the
    // full detail, so heavy relations (items, statusTracks, product, address,
    // coupon, deliveryMan) are deliberately not loaded here.
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select([
        'order.id',
        'order.orderNo',
        'order.createdAt',
        'order.orderStatus',
        'order.paymentStatus',
        'order.deliveredAt',
        'order.cancelledAt',
        'order.totalValue',
        'order.paidAmount',
        'user.id',
        'user.name',
        'user.mobileNumber',
        'paymentMethod.id',
        'paymentMethod.name',
        'shippingMethod.id',
        'shippingMethod.name',
        'address.id',
        'address.area',
      ])
      .leftJoin('order.user', 'user')
      .leftJoin('order.paymentMethod', 'paymentMethod')
      .leftJoin('order.shippingMethod', 'shippingMethod')
      .leftJoin('order.address', 'address')
      .orderBy('order.createdAt', 'DESC');

    this.applyOrderFilters(queryBuilder, {
      search,
      orderStatus,
      paymentStatus,
      paymentMethodId,
      shippingMethodId,
      area,
      division,
      city,
    });

    if (sort === 'date_asc') {
      queryBuilder.orderBy('order.createdAt', 'ASC');
    } else if (sort === 'date_desc') {
      queryBuilder.orderBy('order.createdAt', 'DESC');
    }
    queryBuilder.skip(skip).take(limit);

    // Count query mirrors the list query's joins: the search filter references
    // user columns and the area filter references address columns, and a
    // many-to-one left join cannot duplicate rows.
    const countBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .leftJoin('order.address', 'address');
    this.applyOrderFilters(countBuilder, {
      search,
      orderStatus,
      paymentStatus,
      paymentMethodId,
      shippingMethodId,
      area,
      division,
      city,
    });

    const [data, total] = await Promise.all([
      queryBuilder.getMany(),
      countBuilder.getCount(),
    ]);
    return { data, total };
  }

  async updateOrderStatus(
    id: number,
    status: OrderStatus,
    user: User,
    note?: string,
  ): Promise<Order> {
    // Cancelling via the edit modal runs the full cancel flow (payment status
    // → NEED_REFUND for paid orders, stock restore) so it stays consistent
    // with the dedicated Cancel action.
    if (status === OrderStatus.CANCELLED) {
      const existing = await this.orderRepository.findOneBy({ id });
      if (!existing) throw new NotFoundException(`Order with ID ${id} not found`);

      // Already cancelled: nothing to cancel again, just record the note.
      if (existing.orderStatus === OrderStatus.CANCELLED) {
        return this.recordStatusTrack(id, status, user, note);
      }

      return this.cancelOrder(
        id,
        { reason: CancellationReason.OTHER, notes: note },
        user,
      );
    }

    // Stamp/clear the terminal timestamps so order→delivery / order→cancel
    // spans stay exact. CANCELLED never reaches here (routed to cancelOrder
    // above); this clear only fires when an order is un-cancelled.
    await this.orderRepository.update(id, {
      orderStatus: status,
      deliveredAt: status === OrderStatus.DELIVERED ? new Date() : null,
      cancelledAt: null,
    });

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

  /** Create a status-track entry and return the reloaded order. */
  private async recordStatusTrack(
    id: number,
    status: OrderStatus,
    user: User,
    note?: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    const statusTrack = this.orderStatusTrackRepository.create({
      order,
      status,
      note,
      updatedBy: user?.userId,
    });
    await this.orderStatusTrackRepository.save(statusTrack);

    return this.orderRepository.findOne({
      where: { id },
      relations: ['statusTracks', 'items', 'user', 'address', 'deliveryMan'],
    });
  }

  /**
   * Append a free-form note to an order. Notes are independent of status
   * changes, so an order can accumulate any number of them over time.
   */
  async addOrderNote(id: number, note: string, user: User): Promise<OrderNote> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    const saved = await this.orderNoteRepository.save(
      this.orderNoteRepository.create({
        order,
        note,
        orderStatus: order.orderStatus,
        createdBy: user?.userId,
      }),
    );

    // save() returns the raw entity (createdBy is just the FK number), so
    // reload with the relation so callers get the author's name.
    return this.orderNoteRepository.findOneOrFail({
      where: { id: saved.id },
      relations: { createdBy: true },
    });
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
  /** Resolves a report date-range preset to concrete from/to bounds. */
  private getDateRangeFromPreset(
    preset: string,
  ): { from: Date; to: Date } | null {
    return getDateRangeFromPreset(preset);
  }

  /** Parses a YYYY-MM-DD report date; endOfDay sets 23:59:59.999. */
  private parseReportDate(
    dateStr?: string,
    endOfDay = false,
  ): Date | undefined {
    return parseReportDate(dateStr, endOfDay);
  }

  async getOrderReportByDateRange(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
    orderStatus?: OrderStatus,
    paymentStatus?: PaymentStatus,
    shippingMethodId?: number,
    paymentMethodId?: number,
    page = 1,
    limit = 50,
  ) {
    // --- Determine date range ---
    let from: Date | undefined;
    let to: Date | undefined;

    // Use date range preset if provided
    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (presetRange) {
        from = presetRange.from;
        to = presetRange.to;
      } else {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
    } else {
      from = this.parseReportDate(fromDate);
      to = this.parseReportDate(toDate, true);
    }

    // --- Summary: single grouped SQL query so totals never load orders ---
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`"createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`"createdAt" <= $${params.length}`);
    }
    if (orderStatus) {
      params.push(orderStatus);
      conditions.push(`"orderStatus" = $${params.length}`);
    }
    if (paymentStatus) {
      params.push(paymentStatus);
      conditions.push(`"paymentStatus" = $${params.length}`);
    }
    if (shippingMethodId) {
      params.push(shippingMethodId);
      conditions.push(`"shippingMethodId" = $${params.length}`);
    }
    if (paymentMethodId) {
      params.push(paymentMethodId);
      conditions.push(`"paymentMethodId" = $${params.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const [summaryRow]: Record<string, string>[] =
      await this.orderRepository.query(
        `SELECT
           COUNT(*) AS total_orders,
           COALESCE(SUM("totalValue"), 0) AS total_value,
           COALESCE(SUM("totalDiscount"), 0) AS total_discount,
           COALESCE(SUM("paidAmount"), 0) AS total_paid
         FROM "order"
         ${whereClause}`,
        params,
      );

    // --- Orders list: one paginated page of the rows the report renders.
    // Only to-one joins here (no items/product/coupon) so skip/take is safe
    // and a page stays cheap regardless of how many line items orders have.
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.shippingMethod', 'shippingMethod')
      .leftJoinAndSelect('order.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.payments', 'payments')
      .orderBy('order.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

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

    // Apply payment status filter
    if (paymentStatus) {
      query.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    // Apply shipping/payment method filters
    if (shippingMethodId) {
      query.andWhere('order.shippingMethodId = :shippingMethodId', {
        shippingMethodId,
      });
    }
    if (paymentMethodId) {
      query.andWhere('order.paymentMethodId = :paymentMethodId', {
        paymentMethodId,
      });
    }

    const orders = await query.getMany();

    // --- Transform ---
    const formattedOrders = orders.map((order) => ({
      id:order.id,
      orderNo: order.orderNo,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalValue: Number(order.totalValue || 0),
      totalDiscount: parseFloat(order.totalDiscount?.toString() || '0'),
      paidAmount: Number(order.paidAmount || 0),
      orderDate: order.createdAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
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
      // Latest SSLCommerz transaction id on the order (Excel export column).
      sslPaymentId:
        [...(order.payments ?? [])]
          .filter((p) => p.sslPaymentId)
          .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
          .pop()?.sslPaymentId ?? null,
    }));

    // --- Return report ---
    const totalOrders = parseInt(summaryRow.total_orders, 10) || 0;
    return {
      from: from ? formatDhakaDate(from) : null,
      to: to ? formatDhakaDate(to) : null,
      totalOrders,
      totalValue:
        Math.round(parseFloat(summaryRow.total_value) * 100) / 100 || 0,
      totalDiscount:
        Math.round(parseFloat(summaryRow.total_discount) * 100) / 100 || 0,
      totalPaid: Math.round(parseFloat(summaryRow.total_paid) * 100) / 100 || 0,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalOrders / limit)),
      orders: formattedOrders,
    };
  }

  /**
   * Day-by-day order summary for a date range: order counts and values,
   * delivered, cancelled, paid and due per day, plus range totals. Single
   * grouped query — exists so the daily summary report needs one round trip.
   */
  async getDailySummaryReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`"createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`"createdAt" <= $${params.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const rows: Record<string, string>[] = await this.orderRepository.query(
      `SELECT
         -- createdAt is stored in UTC; +6h buckets rows by the Dhaka calendar day
         TO_CHAR("createdAt" + INTERVAL '6 hours', 'YYYY-MM-DD') AS date,
         COUNT(*) AS order_count,
         COALESCE(SUM("totalValue"), 0) AS order_value,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'delivered' THEN 1 END), 0) AS delivered_count,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'delivered' THEN "totalValue" END), 0) AS delivered_value,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'cancelled' THEN 1 END), 0) AS cancelled_count,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'cancelled' THEN "totalValue" END), 0) AS cancelled_value,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'pending' THEN 1 END), 0) AS pending_count,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'pending' THEN "totalValue" END), 0) AS pending_value,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'processing' THEN 1 END), 0) AS processing_count,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'processing' THEN "totalValue" END), 0) AS processing_value,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'on_hold' THEN 1 END), 0) AS on_hold_count,
         COALESCE(SUM(CASE WHEN "orderStatus" = 'on_hold' THEN "totalValue" END), 0) AS on_hold_value,
         COALESCE(SUM("paidAmount"), 0) AS paid_amount,
         COALESCE(SUM("totalValue" - "paidAmount"), 0) AS due_amount
       FROM "order"
       ${whereClause}
       GROUP BY 1
       ORDER BY 1 DESC`,
      params,
    );

    const daily = rows.map((row) => ({
      date: row.date,
      orderCount: parseInt(row.order_count, 10) || 0,
      orderValue: parseFloat(row.order_value) || 0,
      deliveredCount: parseInt(row.delivered_count, 10) || 0,
      deliveredValue: parseFloat(row.delivered_value) || 0,
      cancelledCount: parseInt(row.cancelled_count, 10) || 0,
      cancelledValue: parseFloat(row.cancelled_value) || 0,
      pendingCount: parseInt(row.pending_count, 10) || 0,
      pendingValue: parseFloat(row.pending_value) || 0,
      processingCount: parseInt(row.processing_count, 10) || 0,
      processingValue: parseFloat(row.processing_value) || 0,
      onHoldCount: parseInt(row.on_hold_count, 10) || 0,
      onHoldValue: parseFloat(row.on_hold_value) || 0,
      paidAmount: parseFloat(row.paid_amount) || 0,
      dueAmount: parseFloat(row.due_amount) || 0,
    }));

    const summary = daily.reduce(
      (acc, d) => ({
        totalOrders: acc.totalOrders + d.orderCount,
        totalValue: acc.totalValue + d.orderValue,
        deliveredOrders: acc.deliveredOrders + d.deliveredCount,
        deliveredValue: acc.deliveredValue + d.deliveredValue,
        cancelledOrders: acc.cancelledOrders + d.cancelledCount,
        pendingOrders: acc.pendingOrders + d.pendingCount,
        pendingValue: acc.pendingValue + d.pendingValue,
        processingOrders: acc.processingOrders + d.processingCount,
        processingValue: acc.processingValue + d.processingValue,
        onHoldOrders: acc.onHoldOrders + d.onHoldCount,
        onHoldValue: acc.onHoldValue + d.onHoldValue,
        paidAmount: acc.paidAmount + d.paidAmount,
        dueAmount: acc.dueAmount + d.dueAmount,
      }),
      {
        totalOrders: 0,
        totalValue: 0,
        deliveredOrders: 0,
        deliveredValue: 0,
        cancelledOrders: 0,
        pendingOrders: 0,
        pendingValue: 0,
        processingOrders: 0,
        processingValue: 0,
        onHoldOrders: 0,
        onHoldValue: 0,
        paidAmount: 0,
        dueAmount: 0,
      },
    );

    return {
      from: from ? formatDhakaDate(from) : null,
      to: to ? formatDhakaDate(to) : null,
      summary,
      daily,
    };
  }

  /** Builds parameterized createdAt range conditions for raw report queries. */
  private buildCreatedAtRange(
    from?: Date,
    to?: Date,
    column = '"createdAt"',
  ): { whereClause: string; params: unknown[] } {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`${column} >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`${column} <= $${params.length}`);
    }
    return {
      whereClause: conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '',
      params,
    };
  }

  /**
   * Cancelled/refunded orders for a date range with per-order rows and
   * totals: cancelled count, cancelled value and refunded money.
   */
  async getRefundReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const { whereClause, params } = this.buildCreatedAtRange(from, to);
    // buildCreatedAtRange emits unqualified "createdAt"; the user/address
    // joins below also have that column, so it must be table-qualified.
    const filterClause = whereClause
      ? `${whereClause.replace(/"createdAt"/g, 'o."createdAt"')} AND o."orderStatus" = 'cancelled'`
      : 'WHERE o."orderStatus" = \'cancelled\'';

    const rows: Record<string, string>[] = await this.orderRepository.query(
      `SELECT o.id, o."orderNo",
              -- createdAt is stored in UTC; +6h shows the Dhaka calendar day
              TO_CHAR(o."createdAt" + INTERVAL '6 hours', 'YYYY-MM-DD') AS date,
              o."totalValue", o."paidAmount", o."paymentStatus",
              pm.name AS payment_method,
              u.name AS customer_name, u."mobileNumber",
              COALESCE(NULLIF(a.area, ''), 'Unknown') AS area,
              t.note AS reason
       FROM "order" o
       LEFT JOIN (
         SELECT "orderId", note,
                ROW_NUMBER() OVER (PARTITION BY "orderId" ORDER BY id DESC) AS rn
         FROM order_status_track
         WHERE status = 'cancelled'
       ) t ON t."orderId" = o.id AND t.rn = 1
       LEFT JOIN "user" u ON o."userId" = u.id
       LEFT JOIN address a ON o."addressId" = a.id
       LEFT JOIN order_payment_method pm ON o."paymentMethodId" = pm.id
       ${filterClause}
       ORDER BY o."createdAt" DESC`,
      params,
    );

    const orders = rows.map((row) => ({
      id: parseInt(row.id, 10),
      orderNo: row.orderNo,
      date: row.date,
      totalValue: parseFloat(row.totalValue) || 0,
      paidAmount: parseFloat(row.paidAmount) || 0,
      paymentStatus: row.paymentStatus,
      paymentMethod: row.payment_method ?? 'Unknown',
      customerName: row.customer_name ?? 'Unknown',
      mobileNumber: row.mobileNumber ?? null,
      area: row.area,
      reason: row.reason || null,
      refundedAmount: 0,
    }));

    // Refunded money lives in the order_payment table as paymentType='refund'
    // rows with negative amounts — paidAmount is zeroed once a refund
    // completes, so it can't be used as the refund figure.
    const refundRows: Record<string, string>[] =
      await this.orderRepository.query(
        `SELECT op."orderId", ABS(SUM(op.amount)) AS refunded
         FROM order_payment op
         WHERE op."paymentType" = 'refund'
         GROUP BY op."orderId"`,
      );
    const refundedByOrder = new Map(
      refundRows.map((row) => [
        parseInt(row.orderId, 10),
        parseFloat(row.refunded) || 0,
      ]),
    );
    for (const order of orders) {
      order.refundedAmount = refundedByOrder.get(order.id) ?? 0;
    }

    const summary = {
      cancelledOrders: orders.length,
      cancelledValue: orders.reduce((sum, o) => sum + o.totalValue, 0),
      refundedAmount: orders.reduce((sum, o) => sum + o.refundedAmount, 0),
    };

    return { summary, orders };
  }

  /**
   * Per-deliveryman delivered order counts and value for a date range.
   * Delivery men with no deliveries in range are included with zeros so the
   * report doubles as an activity overview.
   */
  async getDeliverymanPerformanceReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [`o."deliveryManId" = dm.id`];
    if (from) {
      params.push(from);
      conditions.push(`o."createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."createdAt" <= $${params.length}`);
    }

    const rows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT dm.id, dm.name, dm."mobileNumber", dm."isActive",
              COUNT(o.id) AS assigned,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'delivered') AS deliveries,
              COUNT(o.id) FILTER (WHERE o."orderStatus" IN ('pending', 'processing', 'on_hold', 'shipped')) AS in_progress,
              COALESCE(SUM(o."totalValue") FILTER (WHERE o."orderStatus" = 'delivered'), 0) AS delivered_value
       FROM delivery_man dm
       LEFT JOIN "order" o ON ${conditions.join(' AND ')}
       GROUP BY dm.id, dm.name, dm."mobileNumber", dm."isActive"
       ORDER BY COUNT(o.id) FILTER (WHERE o."orderStatus" = 'delivered') DESC, dm.name ASC`,
      params,
    );

    const deliveryMen = rows.map((row) => ({
      id: parseInt(row.id, 10),
      name: row.name,
      mobileNumber: row.mobileNumber,
      isActive:
        row.isActive === true ||
        row.isActive === 'true' ||
        row.isActive === 't',
      assigned: parseInt(row.assigned, 10) || 0,
      deliveries: parseInt(row.deliveries, 10) || 0,
      inProgress: parseInt(row.in_progress, 10) || 0,
      deliveredValue: parseFloat(row.delivered_value) || 0,
    }));

    const summary = {
      totalAssigned: deliveryMen.reduce((sum, d) => sum + d.assigned, 0),
      totalDeliveries: deliveryMen.reduce((sum, d) => sum + d.deliveries, 0),
      totalDeliveredValue: deliveryMen.reduce(
        (sum, d) => sum + d.deliveredValue,
        0,
      ),
      activeDeliveryMen: deliveryMen.filter((d) => d.deliveries > 0).length,
    };

    return { summary, deliveryMen };
  }

  /**
   * Date-wise delivery report: delivered orders grouped by the Dhaka
   * calendar day they were delivered and by the delivery man who handled
   * them, with an optional delivery-man filter. Only delivered orders with
   * a non-null deliveredAt count, so "delivery date" always means when the
   * order was actually delivered (not when it was placed). Cash and online
   * amounts come from order_payment transactions (refunds excluded), split
   * by the payment method code ('cash_on_delivery' vs everything else).
   * Orders whose delivery man was later removed fall under "Unassigned".
   */
  async getDateWiseDeliveryReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
    deliveryManId?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [
      `o."orderStatus" = 'delivered'`,
      `o."deliveredAt" IS NOT NULL`,
    ];
    if (from) {
      params.push(from);
      conditions.push(`o."deliveredAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."deliveredAt" <= $${params.length}`);
    }
    const requestedDeliveryManId = parseInt(deliveryManId ?? '', 10);
    if (!Number.isNaN(requestedDeliveryManId)) {
      params.push(requestedDeliveryManId);
      conditions.push(`o."deliveryManId" = $${params.length}`);
    }

    const rows: Record<string, any>[] = await this.orderRepository.query(
      `WITH delivered AS (
         SELECT o.id, o."deliveryManId", o."totalValue", o."deliveredAt",
                EXTRACT(EPOCH FROM (o."deliveredAt" - o."createdAt")) / 3600.0 AS hours,
                CASE
                  WHEN sm.name ILIKE '%express%' THEN 6
                  WHEN sm.name ILIKE '%outside%' THEN 120
                  WHEN sm.name ILIKE '%inside%' THEN 48
                  ELSE $${params.length + 1}
                END AS threshold
         FROM "order" o
         LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
         WHERE ${conditions.join(' AND ')}
       )
       SELECT (d."deliveredAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka')::date AS delivery_date,
              dm.id AS delivery_man_id,
              COALESCE(dm.name, 'Unassigned') AS delivery_man_name,
              COUNT(d.id) AS deliveries,
              COALESCE(ROUND(AVG(d.hours)::numeric, 1), 0) AS avg_hours,
              COUNT(d.id) FILTER (WHERE d.hours > d.threshold) AS late_orders,
              COALESCE(SUM(d.hours), 0) AS hours_sum,
              COALESCE(SUM(d."totalValue"), 0) AS delivered_value,
              COALESCE(SUM(pay.cash), 0) AS cash_collected,
              COALESCE(SUM(pay.online), 0) AS online_amount
       FROM delivered d
       LEFT JOIN delivery_man dm ON d."deliveryManId" = dm.id
       LEFT JOIN (
         -- Net payments per order, split cash vs online by the payment
         -- method code. Only 'payment' transactions count — refunds are
         -- excluded so collection figures match what actually changed hands.
         SELECT op."orderId",
                SUM(op.amount) FILTER (WHERE pm.code = 'cash_on_delivery') AS cash,
                SUM(op.amount) FILTER (WHERE pm.code <> 'cash_on_delivery') AS online
         FROM order_payment op
         JOIN order_payment_method pm ON op."paymentMethodId" = pm.id
         WHERE op."paymentType" = 'payment'
         GROUP BY op."orderId"
       ) pay ON pay."orderId" = d.id
       GROUP BY 1, dm.id, dm.name
       ORDER BY 1 DESC, delivered_value DESC`,
      [...params, 24],
    );

    // Group the flat (date × delivery man) rows into one block per day.
    const dayMap = new Map<string, {
      date: string;
      totalDeliveries: number;
      totalValue: number;
      totalCash: number;
      totalOnline: number;
      totalLate: number;
      totalHours: number;
      deliveryMen: {
        id: number | null;
        name: string;
        deliveries: number;
        avgHours: number;
        lateOrders: number;
        deliveredValue: number;
        cashCollected: number;
        onlineAmount: number;
      }[];
    }>();
    for (const row of rows) {
      // DATE columns may come back as Date objects or strings depending on
      // the driver; normalize to yyyy-mm-dd either way.
      const parsed = row.delivery_date instanceof Date
        ? row.delivery_date
        : new Date(String(row.delivery_date));
      const date = Number.isNaN(parsed.getTime())
        ? String(row.delivery_date).slice(0, 10)
        : parsed.toISOString().slice(0, 10);
      let day = dayMap.get(date);
      if (!day) {
        day = {
          date,
          totalDeliveries: 0,
          totalValue: 0,
          totalCash: 0,
          totalOnline: 0,
          totalLate: 0,
          totalHours: 0,
          deliveryMen: [],
        };
        dayMap.set(date, day);
      }
      const entry = {
        id: row.delivery_man_id == null ? null : parseInt(row.delivery_man_id, 10),
        name: row.delivery_man_name,
        deliveries: parseInt(row.deliveries, 10) || 0,
        avgHours: parseFloat(row.avg_hours) || 0,
        lateOrders: parseInt(row.late_orders, 10) || 0,
        deliveredValue: parseFloat(row.delivered_value) || 0,
        cashCollected: parseFloat(row.cash_collected) || 0,
        onlineAmount: parseFloat(row.online_amount) || 0,
      };
      day.deliveryMen.push(entry);
      day.totalDeliveries += entry.deliveries;
      day.totalValue += entry.deliveredValue;
      day.totalCash += entry.cashCollected;
      day.totalOnline += entry.onlineAmount;
      day.totalLate += entry.lateOrders;
      day.totalHours += parseFloat(row.hours_sum) || 0;
    }
    const days = [...dayMap.values()];
    const totalDeliveriesAll = days.reduce((s, d) => s + d.totalDeliveries, 0);
    const totalHoursAll = days.reduce((s, d) => s + d.totalHours, 0);

    const summary = {
      totalDeliveries: totalDeliveriesAll,
      totalDeliveredValue: days.reduce((sum, d) => sum + d.totalValue, 0),
      totalCashCollected: days.reduce((sum, d) => sum + d.totalCash, 0),
      totalOnlineAmount: days.reduce((sum, d) => sum + d.totalOnline, 0),
      deliveryDays: days.length,
      activeDeliveryMen: new Set(
        rows.map((row) => row.delivery_man_name),
      ).size,
      avgPerDay: days.length
        ? Math.round(totalDeliveriesAll / days.length)
        : 0,
      /** Overall avg placement→delivery hours and late count, using the
       *  per-shipping-method timelines (same rules as the late-delivery
       *  report). */
      avgHours: totalDeliveriesAll
        ? Math.round((totalHoursAll / totalDeliveriesAll) * 10) / 10
        : 0,
      totalLate: days.reduce((sum, d) => sum + d.totalLate, 0),
    };

    return { summary, days };
  }

  /**
   * Order counts and value grouped by payment method for a date range.
   * Orders whose payment method was removed (or never set) fall under
   * "Unknown" so nothing drops out of the totals. Cash/online amounts come
   * from order_payment transactions, refunds excluded.
   */
  async getPaymentMethodReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`o."createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."createdAt" <= $${params.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const rows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT COALESCE(pm.name, 'Unknown') AS method_name,
              COALESCE(pm.code, '') AS method_code,
              COUNT(o.id) AS orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'pending') AS pending_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'processing') AS processing_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'on_hold') AS on_hold_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'delivered') AS delivered_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'cancelled') AS cancelled_orders,
              COALESCE(SUM(o."totalValue"), 0) AS total_value,
              COALESCE(SUM(o."paidAmount"), 0) AS paid_amount,
              COALESCE(SUM(pay.cash), 0) AS cash_collected,
              COALESCE(SUM(pay.online), 0) AS online_amount
       FROM "order" o
       LEFT JOIN order_payment_method pm ON o."paymentMethodId" = pm.id
       LEFT JOIN (
         -- Net payments per order split cash vs online, refunds excluded
         -- (same definition as the date-wise delivery report).
         SELECT op."orderId",
                SUM(op.amount) FILTER (WHERE pm2.code = 'cash_on_delivery') AS cash,
                SUM(op.amount) FILTER (WHERE pm2.code <> 'cash_on_delivery') AS online
         FROM order_payment op
         JOIN order_payment_method pm2 ON op."paymentMethodId" = pm2.id
         WHERE op."paymentType" = 'payment'
         GROUP BY op."orderId"
       ) pay ON pay."orderId" = o.id
       ${whereClause}
       GROUP BY 1, 2
       ORDER BY COUNT(o.id) DESC, 1 ASC`,
      params,
    );

    const methods = rows.map((row) => ({
      name: row.method_name,
      code: row.method_code ?? '',
      orders: parseInt(row.orders, 10) || 0,
      pendingOrders: parseInt(row.pending_orders, 10) || 0,
      processingOrders: parseInt(row.processing_orders, 10) || 0,
      onHoldOrders: parseInt(row.on_hold_orders, 10) || 0,
      deliveredOrders: parseInt(row.delivered_orders, 10) || 0,
      cancelledOrders: parseInt(row.cancelled_orders, 10) || 0,
      totalValue: parseFloat(row.total_value) || 0,
      paidAmount: parseFloat(row.paid_amount) || 0,
      cashCollected: parseFloat(row.cash_collected) || 0,
      onlineAmount: parseFloat(row.online_amount) || 0,
    }));

    const totalOrders = methods.reduce((sum, m) => sum + m.orders, 0);
    const summary = {
      totalOrders,
      totalValue: methods.reduce((sum, m) => sum + m.totalValue, 0),
      totalPaid: methods.reduce((sum, m) => sum + m.paidAmount, 0),
      totalCashCollected: methods.reduce((sum, m) => sum + m.cashCollected, 0),
      totalOnlineAmount: methods.reduce((sum, m) => sum + m.onlineAmount, 0),
      avgOrderValue: totalOrders
        ? Math.round(
            methods.reduce((sum, m) => sum + m.totalValue, 0) / totalOrders,
          )
        : 0,
      methodCount: methods.filter((m) => m.name !== 'Unknown').length,
    };

    return { summary, methods };
  }

  /**
   * Shipping-method report: order counts per status (pending/processing/
   * on-hold/delivered/cancelled), order value and delivery performance
   * grouped by shipping method. Delivery performance uses the per-method
   * timelines from the late-delivery report (Inside 48h / Outside 120h /
   * Express 6h / other → fallback threshold) — only delivered orders with a
   * known placement→delivery span count. Orders without a method fall under
   * "Unknown".
   */
  async getShippingMethodReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`o."createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."createdAt" <= $${params.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const fallbackThresholdIndex = params.length + 1;

    const rows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT COALESCE(sm.name, 'Unknown') AS method_name,
              COUNT(o.id) AS orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'pending') AS pending_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'processing') AS processing_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'on_hold') AS on_hold_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'shipped') AS shipped_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'delivered') AS delivered_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'cancelled') AS cancelled_orders,
              COALESCE(SUM(o."totalValue"), 0) AS total_value,
              COALESCE(ROUND(AVG(d.hours)::numeric, 1), 0) AS avg_hours,
              COUNT(d.id) FILTER (WHERE d.hours > d.threshold) AS late_deliveries
       FROM "order" o
       LEFT JOIN shipping_method sm ON o."shippingMethodId" = sm.id
       LEFT JOIN (
         -- Placement→delivery hours + per-method timeline threshold; only
         -- delivered orders with both timestamps produce a row (mirrors the
         -- late-delivery report).
         SELECT o2.id, o2."shippingMethodId",
                EXTRACT(EPOCH FROM (o2."deliveredAt" - o2."createdAt")) / 3600.0 AS hours,
                CASE
                  WHEN sm2.name ILIKE '%express%' THEN 6
                  WHEN sm2.name ILIKE '%outside%' THEN 120
                  WHEN sm2.name ILIKE '%inside%' THEN 48
                  ELSE $${fallbackThresholdIndex}
                END AS threshold
         FROM "order" o2
         LEFT JOIN shipping_method sm2 ON sm2.id = o2."shippingMethodId"
         WHERE o2."orderStatus" = 'delivered' AND o2."deliveredAt" IS NOT NULL
       ) d ON d.id = o.id
       ${whereClause}
       GROUP BY 1
       ORDER BY COUNT(o.id) DESC, 1 ASC`,
      [...params, 24],
    );

    const methods = rows.map((row) => ({
      name: row.method_name,
      code: row.method_code ?? '',
      orders: parseInt(row.orders, 10) || 0,
      pendingOrders: parseInt(row.pending_orders, 10) || 0,
      processingOrders: parseInt(row.processing_orders, 10) || 0,
      onHoldOrders: parseInt(row.on_hold_orders, 10) || 0,
      shippedOrders: parseInt(row.shipped_orders, 10) || 0,
      deliveredOrders: parseInt(row.delivered_orders, 10) || 0,
      cancelledOrders: parseInt(row.cancelled_orders, 10) || 0,
      totalValue: parseFloat(row.total_value) || 0,
      avgHours: parseFloat(row.avg_hours) || 0,
      lateDeliveries: parseInt(row.late_deliveries, 10) || 0,
    }));

    const totalOrders = methods.reduce((sum, m) => sum + m.orders, 0);
    const totalDelivered = methods.reduce((sum, m) => sum + m.deliveredOrders, 0);
    const totalLate = methods.reduce((sum, m) => sum + m.lateDeliveries, 0);
    const summary = {
      totalOrders,
      totalDelivered,
      totalLate,
      lateRate: totalDelivered
        ? Math.round((totalLate / totalDelivered) * 100)
        : 0,
      totalValue: methods.reduce((sum, m) => sum + m.totalValue, 0),
      avgOrderValue: totalOrders
        ? Math.round(
            methods.reduce((sum, m) => sum + m.totalValue, 0) / totalOrders,
          )
        : 0,
      methodCount: methods.filter((m) => m.name !== 'Unknown').length,
    };

    return { summary, methods };
  }

  /**
   * Cancellation analysis: order volume, cancelled count, cancellation rate
   * and lost value for a date range, broken down by shipping method and by
   * delivery area, plus the most recent cancelled orders. Rates and lost
   * value are judged against every order placed in the range. Orders without
   * a method/area fall under "Unknown" so nothing drops out of the totals.
   */
  async getCancellationReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`o."createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."createdAt" <= $${params.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const [summaryRow]: Record<string, string>[] =
      await this.orderRepository.query(
        `SELECT COUNT(*) AS total_orders,
                COUNT(*) FILTER (WHERE o."orderStatus" = 'cancelled') AS cancelled_orders,
                COALESCE(SUM(o."totalValue") FILTER (WHERE o."orderStatus" = 'cancelled'), 0) AS lost_value,
                COALESCE(SUM(o."paidAmount") FILTER (WHERE o."orderStatus" = 'cancelled'), 0) AS paid_on_cancelled,
                COALESCE(ROUND(AVG(
                  EXTRACT(EPOCH FROM (o."cancelledAt" - o."createdAt")) / 3600.0
                ) FILTER (WHERE o."orderStatus" = 'cancelled' AND o."cancelledAt" IS NOT NULL), 1), 0) AS avg_cancel_hours,
                COUNT(*) FILTER (WHERE o."orderStatus" = 'cancelled'
                  AND o."cancelledAt" - o."createdAt" < INTERVAL '24 hours') AS same_day_cancellations
         FROM "order" o
         ${whereClause}`,
        params,
      );

    // Cancellations grouped by shipping method and by delivery area share the
    // same shape: orders placed, how many died, lost value — worst first.
    // Groups with no cancellations are excluded so the tables only list
    // where orders actually died.
    const breakdown = (
      groupExpr: string,
      joinClause: string,
      label: 'method_name' | 'area',
    ) =>
      this.orderRepository.query(
        `SELECT ${groupExpr} AS ${label},
                COUNT(o.id) AS total_orders,
                COUNT(o.id) FILTER (WHERE o."orderStatus" = 'cancelled') AS cancelled_orders,
                COALESCE(SUM(o."totalValue") FILTER (WHERE o."orderStatus" = 'cancelled'), 0) AS lost_value
         FROM "order" o
         ${joinClause}
         ${whereClause}
         GROUP BY 1
         HAVING COUNT(*) FILTER (WHERE o."orderStatus" = 'cancelled') > 0
         ORDER BY COUNT(o.id) FILTER (WHERE o."orderStatus" = 'cancelled') DESC,
                  COUNT(o.id) DESC, 1 ASC`,
        params,
      );

    const methodRows: Record<string, any>[] = await breakdown(
      `COALESCE(sm.name, 'Unknown')`,
      `LEFT JOIN shipping_method sm ON o."shippingMethodId" = sm.id`,
      'method_name',
    );
    const areaRows: Record<string, any>[] = await breakdown(
      `COALESCE(NULLIF(a.area, ''), 'Unknown')`,
      `LEFT JOIN address a ON o."addressId" = a.id`,
      'area',
    );

    // Recent cancellations, newest first, for follow-up calls — joined the
    // same way as the breakdowns plus customer contact.
    const recentConditions = [...conditions, `o."orderStatus" = 'cancelled'`];
    const recentWhere = `WHERE ${recentConditions.join(' AND ')}`;
    const recentRows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT o.id, o."orderNo", o."totalValue", o."paidAmount", o."paymentStatus",
              o."createdAt", o."cancelledAt",
              EXTRACT(EPOCH FROM (o."cancelledAt" - o."createdAt")) / 3600.0 AS cancel_hours,
              u.name AS customer_name, u."mobileNumber",
              COALESCE(NULLIF(a.area, ''), 'Unknown') AS area,
              COALESCE(sm.name, 'Unknown') AS method_name
       FROM "order" o
       LEFT JOIN "user" u ON o."userId" = u.id
       LEFT JOIN address a ON o."addressId" = a.id
       LEFT JOIN shipping_method sm ON o."shippingMethodId" = sm.id
       ${recentWhere}
       ORDER BY o."cancelledAt" DESC NULLS LAST
       LIMIT 50`,
      params,
    );

    const mapBreakdown = (
      rows: Record<string, any>[],
      label: 'method_name' | 'area',
    ) =>
      rows.map((row) => {
        const totalOrders = parseInt(row.total_orders, 10) || 0;
        const cancelledOrders = parseInt(row.cancelled_orders, 10) || 0;
        return {
          name: row[label],
          totalOrders,
          cancelledOrders,
          cancelRate: totalOrders
            ? Math.round((cancelledOrders / totalOrders) * 100)
            : 0,
          lostValue: parseFloat(row.lost_value) || 0,
        };
      });

    const totalOrders = parseInt(summaryRow.total_orders, 10) || 0;
    const cancelledOrders = parseInt(summaryRow.cancelled_orders, 10) || 0;
    const summary = {
      totalOrders,
      cancelledOrders,
      cancelRate: totalOrders
        ? Math.round((cancelledOrders / totalOrders) * 100)
        : 0,
      lostValue: parseFloat(summaryRow.lost_value) || 0,
      /** Paid amounts on cancelled orders — refund exposure. */
      paidOnCancelled: parseFloat(summaryRow.paid_on_cancelled) || 0,
      avgCancelHours: parseFloat(summaryRow.avg_cancel_hours) || 0,
      sameDayCancellations:
        parseInt(summaryRow.same_day_cancellations, 10) || 0,
    };

    return {
      summary,
      byMethod: mapBreakdown(methodRows, 'method_name'),
      byArea: mapBreakdown(areaRows, 'area'),
      recent: recentRows.map((row) => ({
        id: parseInt(row.id, 10),
        orderNo: row.orderNo,
        customerName: row.customer_name ?? 'Unknown',
        mobileNumber: row.mobileNumber ?? null,
        area: row.area,
        method: row.method_name,
        // pg preserves the quoted camelCase identifiers ("totalValue"),
        // so the row keys are camelCase here — snake_case reads undefined.
        totalValue: parseFloat(row.totalValue) || 0,
        paidAmount: parseFloat(row.paidAmount) || 0,
        paymentStatus: row.paymentStatus,
        placedAt: row.createdAt,
        cancelledAt: row.cancelledAt,
        cancelHours:
          row.cancel_hours == null ? null : parseFloat(row.cancel_hours),
      })),
    };
  }

  /**
   * Repeat-buyer report: every customer who ordered in the range, with
   * order count, spend, first/last order, and whether they are new (no
   * orders before the range start) or returning (prior orders, or several
   * orders inside the range). Orders without a user account are excluded —
   * repeat behaviour needs an identity to track.
   */
  async getRepeatBuyerReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [`o."userId" IS NOT NULL`];
    if (from) {
      params.push(from);
      conditions.push(`o."createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."createdAt" <= $${params.length}`);
    }

    // "Had orders before the range" — only meaningful when a range start
    // exists; with an open-ended range every customer counts as new.
    // $1 is always the range start when present (see the params pushes above).
    const priorCondition = from ? `AND o2."createdAt" < $1` : `AND false`;

    const rows: Record<string, any>[] = await this.orderRepository.query(
      `WITH range_orders AS (
         SELECT o."userId",
                COUNT(o.id) AS orders,
                COALESCE(SUM(o."totalValue"), 0) AS spend,
                MIN(o."createdAt") AS first_order,
                MAX(o."createdAt") AS last_order
         FROM "order" o
         WHERE ${conditions.join(' AND ')}
         GROUP BY o."userId"
       )
       SELECT r."userId", r.orders, r.spend, r.first_order, r.last_order,
              u.name AS user_name, u."mobileNumber",
              EXISTS (
                SELECT 1 FROM "order" o2
                WHERE o2."userId" = r."userId" ${priorCondition}
              ) AS prior_orders
       FROM range_orders r
       JOIN "user" u ON u.id = r."userId"
       ORDER BY r.orders DESC, r.spend DESC, u.name ASC`,
      params,
    );

    const customers = rows.map((row) => ({
      id: parseInt(row.userId, 10),
      name: row.user_name ?? 'Unknown',
      mobileNumber: row.mobileNumber ?? null,
      orders: parseInt(row.orders, 10) || 0,
      spend: parseFloat(row.spend) || 0,
      firstOrder: row.first_order,
      lastOrder: row.last_order,
      hadPriorOrders:
        row.prior_orders === true ||
        row.prior_orders === 'true' ||
        row.prior_orders === 't',
    }));

    const newCustomers = customers.filter((c) => !c.hadPriorOrders).length;
    const repeatCustomers = customers.filter(
      (c) => c.hadPriorOrders || c.orders > 1,
    ).length;
    const totalOrders = customers.reduce((sum, c) => sum + c.orders, 0);

    const summary = {
      totalCustomers: customers.length,
      newCustomers,
      repeatCustomers,
      repeatRate: customers.length
        ? Math.round((repeatCustomers / customers.length) * 100)
        : 0,
      totalSpend: customers.reduce((sum, c) => sum + c.spend, 0),
      avgOrdersPerCustomer: customers.length
        ? Math.round((totalOrders / customers.length) * 10) / 10
        : 0,
    };

    return { summary, customers };
  }

  /**
   * Discount impact report: date-wise order counts and value with the
   * discount given, broken down by source (coupon / BOGO / flash sale) from
   * the usage logs. Discounts recorded on the order (o.totalDiscount) and
   * the per-source amounts may overlap (e.g. product-level + coupon), so
   * the source columns don't necessarily sum to the order total.
   */
  async getDiscountImpactReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`o."createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."createdAt" <= $${params.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Dhaka calendar day of the order's creation, shared by the main query
    // and the per-source usage-log aggregates so rows line up.
    const dhakaDay = `(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka')::date`;

    const rows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT ${dhakaDay} AS order_date,
              COUNT(o.id) AS orders,
              COUNT(o.id) FILTER (WHERE o."totalDiscount" > 0) AS discounted_orders,
              COALESCE(SUM(o."totalDiscount"), 0) AS discount_amount,
              COALESCE(SUM(o."totalValue"), 0) AS order_value,
              COALESCE(MAX(src.coupon_amount), 0) AS coupon_amount,
              COALESCE(MAX(src.coupon_uses), 0) AS coupon_uses,
              COALESCE(MAX(src.bogo_amount), 0) AS bogo_amount,
              COALESCE(MAX(src.bogo_uses), 0) AS bogo_uses,
              COALESCE(MAX(src.flash_amount), 0) AS flash_amount,
              COALESCE(MAX(src.flash_uses), 0) AS flash_uses
       FROM "order" o
       LEFT JOIN (
         SELECT order_day.day,
                SUM(coupon.amount) AS coupon_amount,
                SUM(coupon.uses) AS coupon_uses,
                SUM(bogo.amount) AS bogo_amount,
                SUM(bogo.uses) AS bogo_uses,
                SUM(flash.amount) AS flash_amount,
                SUM(flash.uses) AS flash_uses
         FROM (SELECT DISTINCT ${dhakaDay} AS day FROM "order" o) order_day
         LEFT JOIN (
           SELECT (cu."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka')::date AS day,
                  SUM(cu."discountAmount") AS amount, COUNT(*) AS uses
           FROM coupon_usage_log cu GROUP BY 1
         ) coupon USING (day)
         LEFT JOIN (
           SELECT (bu."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka')::date AS day,
                  SUM(bu."discountAmount") AS amount, COUNT(*) AS uses
           FROM bogo_usage_log bu GROUP BY 1
         ) bogo USING (day)
         LEFT JOIN (
           SELECT (fu."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka')::date AS day,
                  SUM(fu."discountAmount") AS amount, COUNT(*) AS uses
           FROM flash_sale_usage_log fu GROUP BY 1
         ) flash USING (day)
         GROUP BY 1
       ) src ON src.day = ${dhakaDay}
       ${whereClause}
       GROUP BY 1
       ORDER BY 1 DESC`,
      params,
    );

    // Parse rows defensively — DATE columns come back as ISO strings.
    const days = rows.map((row) => {
      const orderValue = parseFloat(row.order_value) || 0;
      const discountAmount = parseFloat(row.discount_amount) || 0;
      return {
        // Same normalization as the date-wise delivery report: the driver
        // may hand back a Date object, not a string.
        date: (() => {
          const parsed = row.order_date instanceof Date
            ? row.order_date
            : new Date(String(row.order_date));
          return Number.isNaN(parsed.getTime())
            ? String(row.order_date).slice(0, 10)
            : parsed.toISOString().slice(0, 10);
        })(),
        orders: parseInt(row.orders, 10) || 0,
        discountedOrders: parseInt(row.discounted_orders, 10) || 0,
        discountAmount,
        orderValue,
        couponAmount: parseFloat(row.coupon_amount) || 0,
        couponUses: parseInt(row.coupon_uses, 10) || 0,
        bogoAmount: parseFloat(row.bogo_amount) || 0,
        bogoUses: parseInt(row.bogo_uses, 10) || 0,
        flashAmount: parseFloat(row.flash_amount) || 0,
        flashUses: parseInt(row.flash_uses, 10) || 0,
        discountSharePct: orderValue
          ? Math.round((discountAmount / orderValue) * 100)
          : 0,
      };
    });

    const summary = {
      totalOrders: days.reduce((sum, d) => sum + d.orders, 0),
      discountedOrders: days.reduce((sum, d) => sum + d.discountedOrders, 0),
      totalDiscount: days.reduce((sum, d) => sum + d.discountAmount, 0),
      totalOrderValue: days.reduce((sum, d) => sum + d.orderValue, 0),
      totalCouponAmount: days.reduce((sum, d) => sum + d.couponAmount, 0),
      totalCouponUses: days.reduce((sum, d) => sum + d.couponUses, 0),
      totalBogoAmount: days.reduce((sum, d) => sum + d.bogoAmount, 0),
      totalBogoUses: days.reduce((sum, d) => sum + d.bogoUses, 0),
      totalFlashAmount: days.reduce((sum, d) => sum + d.flashAmount, 0),
      totalFlashUses: days.reduce((sum, d) => sum + d.flashUses, 0),
      discountSharePct: 0,
    };
    summary.discountSharePct = summary.totalOrderValue
      ? Math.round((summary.totalDiscount / summary.totalOrderValue) * 100)
      : 0;

    return { summary, days };
  }

  /**
   * Late-delivery report: delivered orders measured from placement to
   * delivery (deliveredAt - createdAt, Dhaka calendar day of delivery),
   * grouped per delivery man with an on-time threshold in hours (default
   * 24). Includes the slowest deliveries in the range for follow-up.
   */
  async getLateDeliveryReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
    thresholdHoursParam?: string,
    pendingPageParam?: string,
    pendingLimitParam?: string,
    deliveredPageParam?: string,
    deliveredLimitParam?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const thresholdHours = (() => {
      const parsed = parseFloat(thresholdHoursParam ?? '');
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
    })();

    const params: unknown[] = [];
    const conditions: string[] = [
      `o."orderStatus" = 'delivered'`,
      `o."deliveredAt" IS NOT NULL`,
      // Store-collection orders (e.g. "Gulshan Store Collection") are picked
      // up by the customer, not delivered by a man — exclude them entirely.
      `COALESCE(sm.name, '') <> 'Gulshan Store Collection'`,
    ];
    if (from) {
      params.push(from);
      conditions.push(`o."deliveredAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."deliveredAt" <= $${params.length}`);
    }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Placement→delivery hours; computed once per order in a CTE both the
    // per-man aggregate and the slowest-orders list reuse. The lateness
    // threshold is per shipping method, matching its promised timeline:
    //   Inside Dhaka  → 2 days  (48h)
    //   Outside Dhaka → 5 working days (approximated as 120h)
    //   Express       → 6 hours
    // Any other method falls back to the configured thresholdHours.
    const methodThresholdExpr = `CASE
           WHEN sm.name ILIKE '%express%' THEN 6
           WHEN sm.name ILIKE '%outside%' THEN 120
           WHEN sm.name ILIKE '%inside%' THEN 48
           ELSE $${params.length + 1}
         END`;
    const hoursExpr = `EXTRACT(EPOCH FROM (o."deliveredAt" - o."createdAt")) / 3600.0`;

    const manRows: Record<string, any>[] = await this.orderRepository.query(
      `WITH delivered AS (
         SELECT o.id, o."deliveryManId", ${hoursExpr} AS hours,
                ${methodThresholdExpr} AS threshold
         FROM "order" o
         LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
         ${whereClause}
       )
       SELECT dm.id AS delivery_man_id,
              COALESCE(dm.name, 'Unassigned') AS delivery_man_name,
              COUNT(d.id) AS delivered,
              COUNT(d.id) FILTER (WHERE d.hours > d.threshold) AS late,
              COALESCE(ROUND(AVG(d.hours)::numeric, 1), 0) AS avg_hours,
              COALESCE(ROUND(MAX(d.hours)::numeric, 1), 0) AS worst_hours
       FROM delivered d
       LEFT JOIN delivery_man dm ON d."deliveryManId" = dm.id
       GROUP BY dm.id, dm.name
       ORDER BY late DESC, delivered DESC, dm.name ASC`,
      [...params, thresholdHours],
    );

    const slowLimitIndex = params.length + 2;
    const slowRows: Record<string, any>[] = await this.orderRepository.query(
      `WITH delivered AS (
         SELECT o.id, o."deliveryManId", ${hoursExpr} AS hours,
                ${methodThresholdExpr} AS threshold
         FROM "order" o
         LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
         ${whereClause}
       )
       SELECT d.id AS order_id, d.hours, d.threshold,
              o."orderNo", o."totalValue", o."createdAt" AS order_date, o."deliveredAt",
              c.name AS customer_name, c."mobileNumber",
              sm.name AS shipping_method_name,
              COALESCE(dm.name, 'Unassigned') AS delivery_man_name
       FROM delivered d
       JOIN "order" o ON o.id = d.id
       LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
       LEFT JOIN "user" c ON o."userId" = c.id
       LEFT JOIN delivery_man dm ON d."deliveryManId" = dm.id
       WHERE d.hours > d.threshold
       ORDER BY d.hours DESC
       LIMIT $${slowLimitIndex}`,
      [...params, thresholdHours, 50],
    );

    const deliveryMen = manRows.map((row) => ({
      id: row.delivery_man_id == null ? null : parseInt(row.delivery_man_id, 10),
      name: row.delivery_man_name,
      delivered: parseInt(row.delivered, 10) || 0,
      late: parseInt(row.late, 10) || 0,
      avgHours: parseFloat(row.avg_hours) || 0,
      worstHours: parseFloat(row.worst_hours) || 0,
    }));

    // Long-pending list: orders placed in the range that are still open
    // (pending / processing / on hold / shipped) and have waited longer
    // than their shipping method's promised timeline since placement
    // (fallback thresholdHours). Oldest first, paginated.
    const pendingPage = Math.max(1, parseInt(pendingPageParam ?? '1', 10) || 1);
    const pendingLimit = Math.min(
      200,
      Math.max(1, parseInt(pendingLimitParam ?? '25', 10) || 25),
    );

    // Same per-method timelines as the delivered/late logic above — an
    // Inside Dhaka order only turns "long pending" after 48h, not the flat
    // fallback. $3 is the fallback threshold for unnamed methods.
    const pendingThresholdExpr = `CASE
           WHEN sm.name ILIKE '%express%' THEN 6
           WHEN sm.name ILIKE '%outside%' THEN 120
           WHEN sm.name ILIKE '%inside%' THEN 48
           ELSE $3
         END`;

    // Count first so the UI can page and show true totals. Paid/Unpaid are
    // counted separately so the two "Long pending" sections can show their
    // own totals, not just the current page's share.
    const pendingCountRows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT COUNT(o.id) AS count,
              COALESCE(SUM(o."totalValue"), 0) AS total_value,
              COUNT(o.id) FILTER (WHERE o."paymentStatus" = 'paid') AS paid_count,
              COALESCE(SUM(o."totalValue") FILTER (WHERE o."paymentStatus" = 'paid'), 0) AS paid_value,
              COUNT(o.id) FILTER (WHERE o."paymentStatus" <> 'paid') AS unpaid_count,
              COALESCE(SUM(o."totalValue") FILTER (WHERE o."paymentStatus" <> 'paid'), 0) AS unpaid_value
       FROM "order" o
       LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
       WHERE o."orderStatus" NOT IN ('delivered', 'cancelled')
         AND o."createdAt" >= COALESCE($1::timestamptz, '1900-01-01'::timestamptz)
         AND o."createdAt" <= COALESCE($2::timestamptz, '2999-01-01'::timestamptz)
         AND EXTRACT(EPOCH FROM (NOW() - o."createdAt")) / 3600.0 > ${pendingThresholdExpr}`,
      [from ?? null, to ?? null, thresholdHours],
    );
    const pendingTotal = parseInt(pendingCountRows[0]?.count, 10) || 0;
    const pendingValue = parseFloat(pendingCountRows[0]?.total_value) || 0;
    const pendingPaidTotal = parseInt(pendingCountRows[0]?.paid_count, 10) || 0;
    const pendingPaidValue = parseFloat(pendingCountRows[0]?.paid_value) || 0;
    const pendingUnpaidTotal =
      parseInt(pendingCountRows[0]?.unpaid_count, 10) || 0;
    const pendingUnpaidValue =
      parseFloat(pendingCountRows[0]?.unpaid_value) || 0;

    const pendingRows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT o.id, o."orderNo", o."orderStatus", o."paymentStatus", o."totalValue",
              o."createdAt" AS order_date,
              EXTRACT(EPOCH FROM (NOW() - o."createdAt")) / 3600.0 AS hours,
              ${pendingThresholdExpr} AS threshold,
              c.name AS customer_name, c."mobileNumber",
              sm.name AS shipping_method_name,
              COALESCE(dm.name, 'Unassigned') AS delivery_man_name
       FROM "order" o
       LEFT JOIN "user" c ON o."userId" = c.id
       LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
       LEFT JOIN delivery_man dm ON o."deliveryManId" = dm.id
       WHERE o."orderStatus" NOT IN ('delivered', 'cancelled')
         AND o."createdAt" >= COALESCE($1::timestamptz, '1900-01-01'::timestamptz)
         AND o."createdAt" <= COALESCE($2::timestamptz, '2999-01-01'::timestamptz)
         AND EXTRACT(EPOCH FROM (NOW() - o."createdAt")) / 3600.0 > ${pendingThresholdExpr}
       ORDER BY o."createdAt" ASC
       LIMIT $4 OFFSET $5`,
      [
        from ?? null,
        to ?? null,
        thresholdHours,
        pendingLimit,
        (pendingPage - 1) * pendingLimit,
      ],
    );

    // Full delivered list for the range. Longest time taken first,
    // paginated. Each row carries its method's promised timeline so the UI
    // can flag deliveries that ran over it.
    const deliveredPage = Math.max(1, parseInt(deliveredPageParam ?? '1', 10) || 1);
    const deliveredLimit = Math.min(
      200,
      Math.max(1, parseInt(deliveredLimitParam ?? '25', 10) || 25),
    );

    const deliveredCountRows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT COUNT(o.id) AS count, COALESCE(SUM(o."totalValue"), 0) AS total_value
       FROM "order" o
       LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
       WHERE o."orderStatus" = 'delivered'
         AND o."deliveredAt" IS NOT NULL
         AND o."deliveredAt" >= COALESCE($1::timestamptz, '1900-01-01'::timestamptz)
         AND o."deliveredAt" <= COALESCE($2::timestamptz, '2999-01-01'::timestamptz)
         AND COALESCE(sm.name, '') <> 'Gulshan Store Collection'`,
      [from ?? null, to ?? null],
    );
    const deliveredTotal = parseInt(deliveredCountRows[0]?.count, 10) || 0;

    const deliveredRows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT o.id, o."orderNo", o."totalValue",
              o."createdAt" AS order_date, o."deliveredAt",
              EXTRACT(EPOCH FROM (o."deliveredAt" - o."createdAt")) / 3600.0 AS hours,
              CASE
                WHEN sm.name ILIKE '%express%' THEN 6
                WHEN sm.name ILIKE '%outside%' THEN 120
                WHEN sm.name ILIKE '%inside%' THEN 48
                ELSE $3
              END AS threshold,
              c.name AS customer_name, c."mobileNumber",
              sm.name AS shipping_method_name,
              COALESCE(dm.name, 'Unassigned') AS delivery_man_name
       FROM "order" o
       LEFT JOIN "user" c ON o."userId" = c.id
       LEFT JOIN shipping_method sm ON sm.id = o."shippingMethodId"
       LEFT JOIN delivery_man dm ON o."deliveryManId" = dm.id
       WHERE o."orderStatus" = 'delivered'
         AND o."deliveredAt" IS NOT NULL
         AND o."deliveredAt" >= COALESCE($1::timestamptz, '1900-01-01'::timestamptz)
         AND o."deliveredAt" <= COALESCE($2::timestamptz, '2999-01-01'::timestamptz)
         AND COALESCE(sm.name, '') <> 'Gulshan Store Collection'
       ORDER BY EXTRACT(EPOCH FROM (o."deliveredAt" - o."createdAt")) DESC
       LIMIT $4 OFFSET $5`,
      [
        from ?? null,
        to ?? null,
        thresholdHours,
        deliveredLimit,
        (deliveredPage - 1) * deliveredLimit,
      ],
    );

    const lateOrders = slowRows.map((row) => ({
      orderId: parseInt(row.order_id, 10),
      orderNo: row.orderNo,
      customerName: row.customer_name ?? 'Unknown',
      mobileNumber: row.mobileNumber ?? null,
      deliveryMan: row.delivery_man_name,
      shippingMethod: row.shipping_method_name ?? null,
      totalValue: parseFloat(row.totalValue) || 0,
      orderDate: row.order_date,
      deliveredAt: row.deliveredAt,
      hours: Math.round((parseFloat(row.hours) || 0) * 10) / 10,
    }));

    const totalDelivered = deliveryMen.reduce((sum, d) => sum + d.delivered, 0);
    const totalLate = deliveryMen.reduce((sum, d) => sum + d.late, 0);
    const summary = {
      totalDelivered,
      totalLate,
      lateRate: totalDelivered
        ? Math.round((totalLate / totalDelivered) * 100)
        : 0,
      onTimeRate: totalDelivered
        ? Math.round(((totalDelivered - totalLate) / totalDelivered) * 100)
        : 0,
      thresholdHours,
      /** Human-readable per-method timelines used by the report UI instead of
       *  the single fallback threshold. */
      thresholdNote: 'Inside Dhaka 48h · Outside Dhaka 5 days · Express 6h',
      lateMenCount: deliveryMen.filter((d) => d.late > 0).length,
      /** True totals for the two paginated lists below. */
      pendingTotal,
      pendingValue,
      /** Paid/Unpaid split of the long-pending list for its two sections. */
      pendingPaidTotal,
      pendingPaidValue,
      pendingUnpaidTotal,
      pendingUnpaidValue,
      deliveredTotal,
    };

    const deliveredOrders = deliveredRows.map((row) => ({
      orderId: parseInt(row.id, 10),
      orderNo: row.orderNo,
      customerName: row.customer_name ?? 'Unknown',
      mobileNumber: row.mobileNumber ?? null,
      deliveryMan: row.delivery_man_name,
      shippingMethod: row.shipping_method_name ?? null,
      totalValue: parseFloat(row.totalValue) || 0,
      orderDate: row.order_date,
      deliveredAt: row.deliveredAt,
      hours: Math.round((parseFloat(row.hours) || 0) * 10) / 10,
      threshold: parseFloat(row.threshold) || 0,
      late:
        (parseFloat(row.hours) || 0) > (parseFloat(row.threshold) || 0),
    }));

    const pendingOrders = pendingRows.map((row) => ({
      orderId: parseInt(row.id, 10),
      orderNo: row.orderNo,
      status: row.orderStatus,
      paymentStatus: row.paymentStatus,
      customerName: row.customer_name ?? 'Unknown',
      mobileNumber: row.mobileNumber ?? null,
      deliveryMan: row.delivery_man_name,
      shippingMethod: row.shipping_method_name ?? null,
      totalValue: parseFloat(row.totalValue) || 0,
      orderDate: row.order_date,
      hours: Math.round((parseFloat(row.hours) || 0) * 10) / 10,
      threshold: parseFloat(row.threshold) || 0,
    }));

    return {
      summary,
      deliveryMen,
      lateOrders,
      pendingOrders,
      deliveredOrders,
      /** Pagination state echoed back so the UI can render controls. */
      pending: { page: pendingPage, limit: pendingLimit, total: pendingTotal },
      delivered: { page: deliveredPage, limit: deliveredLimit, total: deliveredTotal },
    };
  }

  /**
   * Order counts and value grouped by shipping address area for a date
   * range. Orders without an area (or with no address) fall under
   * "Unknown" so nothing drops out of the totals.
   */
  async getAreaWiseOrderReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
  ) {
    let from = this.parseReportDate(fromDate);
    let to = this.parseReportDate(toDate, true);

    if (dateRangePreset) {
      const presetRange = this.getDateRangeFromPreset(dateRangePreset);
      if (!presetRange) {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
      from = presetRange.from;
      to = presetRange.to;
    }

    const params: unknown[] = [];
    const conditions: string[] = [];
    if (from) {
      params.push(from);
      conditions.push(`o."createdAt" >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`o."createdAt" <= $${params.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const rows: Record<string, any>[] = await this.orderRepository.query(
      `SELECT COALESCE(NULLIF(a.area, ''), 'Unknown') AS area,
              COUNT(o.id) AS total_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'delivered') AS delivered_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'cancelled') AS cancelled_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'pending') AS pending_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'processing') AS processing_orders,
              COUNT(o.id) FILTER (WHERE o."orderStatus" = 'on_hold') AS on_hold_orders,
              COALESCE(SUM(o."totalValue"), 0) AS total_value,
              COALESCE(SUM(o."totalValue") FILTER (WHERE o."orderStatus" = 'delivered'), 0) AS delivered_value
       FROM "order" o
       LEFT JOIN address a ON o."addressId" = a.id
       ${whereClause}
       GROUP BY 1
       ORDER BY COUNT(o.id) DESC, 1 ASC`,
      params,
    );

    const areas = rows.map((row) => ({
      area: row.area,
      totalOrders: parseInt(row.total_orders, 10) || 0,
      deliveredOrders: parseInt(row.delivered_orders, 10) || 0,
      cancelledOrders: parseInt(row.cancelled_orders, 10) || 0,
      pendingOrders: parseInt(row.pending_orders, 10) || 0,
      processingOrders: parseInt(row.processing_orders, 10) || 0,
      onHoldOrders: parseInt(row.on_hold_orders, 10) || 0,
      totalValue: parseFloat(row.total_value) || 0,
      deliveredValue: parseFloat(row.delivered_value) || 0,
    }));

    const summary = {
      totalOrders: areas.reduce((sum, a) => sum + a.totalOrders, 0),
      deliveredOrders: areas.reduce((sum, a) => sum + a.deliveredOrders, 0),
      cancelledOrders: areas.reduce((sum, a) => sum + a.cancelledOrders, 0),
      pendingOrders: areas.reduce((sum, a) => sum + a.pendingOrders, 0),
      processingOrders: areas.reduce((sum, a) => sum + a.processingOrders, 0),
      onHoldOrders: areas.reduce((sum, a) => sum + a.onHoldOrders, 0),
      totalValue: areas.reduce((sum, a) => sum + a.totalValue, 0),
      deliveredValue: areas.reduce((sum, a) => sum + a.deliveredValue, 0),
      totalAreas: areas.filter((a) => a.area !== 'Unknown').length,
    };

    return { summary, areas };
  }

  async getMonthlyOrderReport(
    year?: number,
    opts?: { last12Months?: boolean },
  ) {
    // Group by the Dhaka (UTC+6) calendar month, not UTC, so months align
    // with the Dhaka-based bounds the other report endpoints filter by.
    // createdAt stores UTC wall-clock in a timezone-less column.
    const dhakaCreatedAt =
      "(order.createdAt AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka')";
    // Optional year filter applied to all three queries
    const withYearFilter = (qb: SelectQueryBuilder<Order>) => {
      if (year) {
        return qb.andWhere(`EXTRACT(YEAR FROM ${dhakaCreatedAt}) = :year`, {
          year,
        });
      }
      // Only the dashboard chart asks for the rolling last 12 months
      // (current Dhaka month plus the 11 before it), so it never grows
      // past 12 bars. The report endpoints default to all time.
      if (opts?.last12Months) {
        const dhakaNow = new Date(Date.now() + 6 * 3600_000);
        const startYear = dhakaNow.getUTCFullYear();
        const startMonth = dhakaNow.getUTCMonth() - 11;
        const startUtc = new Date(
          Date.UTC(startYear, startMonth, 1) - 6 * 3600_000,
        );
        return qb.andWhere('order.createdAt >= :from', {
          from: startUtc.toISOString(),
        });
      }
      return qb;
    };

    // Query for all orders (regardless of status)
    const allOrdersResult = await withYearFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          `EXTRACT(YEAR FROM ${dhakaCreatedAt}) AS year`,
          `TO_CHAR(${dhakaCreatedAt}, 'Month') AS month_name`,
          `EXTRACT(MONTH FROM ${dhakaCreatedAt}) AS month_number`,
          'COUNT(order.id) AS all_order_count',
          'SUM(order.totalValue) AS all_order_value',
        ]),
    )
      .groupBy('year, month_name, month_number')
      .orderBy('year, month_number', 'ASC')
      .getRawMany();

    // Query for delivered orders
    // Note: base .where() must come before withYearFilter so the year
    // filter is appended via andWhere (a later .where() would replace it)
    const deliveredResult = await withYearFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          `EXTRACT(YEAR FROM ${dhakaCreatedAt}) AS year`,
          `TO_CHAR(${dhakaCreatedAt}, 'Month') AS month_name`,
          `EXTRACT(MONTH FROM ${dhakaCreatedAt}) AS month_number`,
          'COUNT(order.id) AS order_count',
          'SUM(order.totalValue) AS total_value',
        ])
        .where('order.orderStatus = :status', { status: OrderStatus.DELIVERED }),
    )
      .groupBy('year, month_name, month_number')
      .orderBy('year, month_number', 'ASC')
      .getRawMany();

    // Query for cancelled orders
    const cancelledResult = await withYearFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          `EXTRACT(YEAR FROM ${dhakaCreatedAt}) AS year`,
          `TO_CHAR(${dhakaCreatedAt}, 'Month') AS month_name`,
          `EXTRACT(MONTH FROM ${dhakaCreatedAt}) AS month_number`,
          'COUNT(order.id) AS cancel_order_count',
          'SUM(order.totalValue) AS cancel_value',
        ])
        .where('order.orderStatus = :status', { status: OrderStatus.CANCELLED }),
    )
      .groupBy('year, month_name, month_number')
      .orderBy('year, month_number', 'ASC')
      .getRawMany();

    // Single grouped query for pending, processing and on-hold orders
    const statusResult = await withYearFilter(
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          `EXTRACT(YEAR FROM ${dhakaCreatedAt}) AS year`,
          `TO_CHAR(${dhakaCreatedAt}, 'Month') AS month_name`,
          `EXTRACT(MONTH FROM ${dhakaCreatedAt}) AS month_number`,
          `COUNT(order.id) FILTER (WHERE order.orderStatus = '${OrderStatus.PENDING}') AS pending_order_count`,
          `COALESCE(SUM(order.totalValue) FILTER (WHERE order.orderStatus = '${OrderStatus.PENDING}'), 0) AS pending_value`,
          `COUNT(order.id) FILTER (WHERE order.orderStatus = '${OrderStatus.PROCESSING}') AS processing_order_count`,
          `COALESCE(SUM(order.totalValue) FILTER (WHERE order.orderStatus = '${OrderStatus.PROCESSING}'), 0) AS processing_value`,
          `COUNT(order.id) FILTER (WHERE order.orderStatus = '${OrderStatus.ON_HOLD}') AS on_hold_order_count`,
          `COALESCE(SUM(order.totalValue) FILTER (WHERE order.orderStatus = '${OrderStatus.ON_HOLD}'), 0) AS on_hold_value`,
        ])
        .where('order.orderStatus IN (:...statuses)', {
          statuses: [
            OrderStatus.PENDING,
            OrderStatus.PROCESSING,
            OrderStatus.ON_HOLD,
          ],
        }),
    )
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

    const statusMap = new Map();
    statusResult.forEach((row) => {
      const key = `${row.year}-${row.month_number}`;
      statusMap.set(key, {
        pendingOrderCount: parseInt(row.pending_order_count) || 0,
        pendingValue: parseFloat(row.pending_value || 0),
        processingOrderCount: parseInt(row.processing_order_count) || 0,
        processingValue: parseFloat(row.processing_value || 0),
        onHoldOrderCount: parseInt(row.on_hold_order_count) || 0,
        onHoldValue: parseFloat(row.on_hold_value || 0),
      });
    });

    // Get all unique month keys from all queries
    const allKeys = new Set([
      ...allOrdersMap.keys(),
      ...deliveredMap.keys(),
      ...cancelledMap.keys(),
      ...statusMap.keys(),
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
        const statusData = statusMap.get(key) || {
          pendingOrderCount: 0,
          pendingValue: 0,
          processingOrderCount: 0,
          processingValue: 0,
          onHoldOrderCount: 0,
          onHoldValue: 0,
        };

        return {
          year: parseInt(year),
          month: allOrdersResult.find((r) => `${r.year}-${r.month_number}` === key)?.month_name.trim() ||
               deliveredResult.find((r) => `${r.year}-${r.month_number}` === key)?.month_name.trim() ||
               cancelledResult.find((r) => `${r.year}-${r.month_number}` === key)?.month_name.trim() ||
               statusResult.find((r) => `${r.year}-${r.month_number}` === key)?.month_name.trim(),
          allOrderCount: allData.allOrderCount,
          allOrderValue: allData.allOrderValue,
          orderCount: deliveredData.orderCount,
          totalValue: deliveredData.totalValue,
          cancelOrderCount: cancelData.cancelOrderCount,
          cancelValue: cancelData.cancelValue,
          pendingOrderCount: statusData.pendingOrderCount,
          pendingValue: statusData.pendingValue,
          processingOrderCount: statusData.processingOrderCount,
          processingValue: statusData.processingValue,
          onHoldOrderCount: statusData.onHoldOrderCount,
          onHoldValue: statusData.onHoldValue,
        };
      })
      .sort((a, b) => {
        // Newest first, so the current month sits at the top of the table
        if (a.year !== b.year) return b.year - a.year;
        const monthA = new Date(`${a.month} 1, 2000`).getMonth();
        const monthB = new Date(`${b.month} 1, 2000`).getMonth();
        return monthB - monthA;
      });

    return { monthlyData: formattedData };
  }

  async getMonthlyOrderReportYears() {
    // Dhaka (UTC+6) years, matching getMonthlyOrderReport's grouping.
    const dhakaCreatedAt =
      "(order.createdAt AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka')";
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select(`DISTINCT EXTRACT(YEAR FROM ${dhakaCreatedAt})`, 'year')
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
      onHold: 0,
      onHoldValue: 0,
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
        case OrderStatus.ON_HOLD:
          statistics.onHold = count;
          statistics.onHoldValue = value;
          break;
      }
    });

    return statistics;
  }

  async getLast30DaysDeliveredOrders() {
    // Dhaka (UTC+6) day boundaries so the daily series matches the other
    // reports; createdAt stores UTC wall-clock in a timezone-less column.
    const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
    const DAY_MS = 24 * 60 * 60 * 1000;
    const bdtNow = new Date(Date.now() + DHAKA_OFFSET_MS);
    const todayStartUtcMs =
      Date.UTC(
        bdtNow.getUTCFullYear(),
        bdtNow.getUTCMonth(),
        bdtNow.getUTCDate(),
      ) - DHAKA_OFFSET_MS;
    const from = new Date(todayStartUtcMs - 30 * DAY_MS);
    const to = new Date(todayStartUtcMs + DAY_MS - 1);

    // Use order creation date for grouping, not delivery date from status tracks
    const query = `
      SELECT
        TO_CHAR("order"."createdAt" + INTERVAL '6 hours', 'YYYY-MM-DD') as date,
        COUNT("order".id) as "orderCount",
        SUM("order"."totalValue") as "totalValue"
      FROM "order"
      WHERE "order"."orderStatus" = 'delivered'
        AND "order"."createdAt" BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const dailyResults = await this.orderRepository.query(query, [from, to]);

    // Create a map for quick lookup
    const dailyDataMap = new Map<string, { orderCount: number; totalValue: number }>();
    dailyResults.forEach((row: any) => {
      dailyDataMap.set(row.date, {
        orderCount: parseInt(row.orderCount) || 0,
        totalValue: parseFloat(row.totalValue) || 0,
      });
    });

    // Generate all Dhaka dates for the last 30 days (including today);
    // the ISO date of each Dhaka midnight instant is that Dhaka day's date.
    const result = [];
    for (let i = 30; i >= 0; i--) {
      const dateString = new Date(todayStartUtcMs - i * DAY_MS)
        .toISOString()
        .split('T')[0]; // YYYY-MM-DD format
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
      order.orderStatus !== OrderStatus.PROCESSING &&
      order.orderStatus !== OrderStatus.ON_HOLD
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
        const stockBefore = item.product.stock;
        item.product.stock += item.quantity;
        item.product.saleCount = Math.max(0, item.product.saleCount - item.quantity);
        await this.productRepository.save(item.product);

        await this.stockMovementService.record({
          product: item.product,
          type: StockMovementType.ORDER_CANCEL,
          quantity: item.quantity,
          stockBefore,
          stockAfter: item.product.stock,
          referenceType: 'order',
          referenceId: order.id,
          note: `Order ${order.orderNo} cancelled: ${reason}`,
          user,
        });

        this.logger.log(
          `Restored ${item.quantity} units of product ${item.product.name} (ID: ${item.product.id})`,
        );
      }
    }

    // UPDATE ORDER STATUSES
    await this.orderRepository.update(id, {
      orderStatus: OrderStatus.CANCELLED,
      paymentStatus: newPaymentStatus,
      cancelledAt: new Date(),
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
