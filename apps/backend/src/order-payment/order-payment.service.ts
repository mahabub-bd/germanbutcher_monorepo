import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus, PaymentStatus, PaymentType } from '../common/enums';
import { OrderPaymentMethod } from '../order-payment-method/entities/order-payment-method.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { OrderPayment } from './entities/order-payment.entity';
import { resolveReportRange } from 'src/common/utils/report-date-range.util';

@Injectable()
export class OrderPaymentService {
  constructor(
    @InjectRepository(OrderPayment)
    private paymentRepository: Repository<OrderPayment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderPaymentMethod)
    private paymentMethodRepository: Repository<OrderPaymentMethod>,
  ) {}

  async create(createPaymentDto: CreateOrderPaymentDto, user: User) {
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
      relations: ['paymentMethod'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot add payment to completed order');
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createPaymentDto.paymentMethodId },
    });
    if (!paymentMethod) throw new NotFoundException('Payment Method not found');

    const payment = await this.savePaymentWithRetry((paymentNumber) =>
      this.paymentRepository.create({
        ...createPaymentDto,
        order,
        paymentMethod,
        createdBy: user?.userId,
        updatedBy: user?.userId,
        paymentNumber,
      }),
    );

    // Keep the order-level method in sync with how the money actually
    // arrived. If a customer picked SSLCommerz at checkout but never
    // completed the payment and the admin records a manual (e.g. cash)
    // payment, the order must stop showing the online method. The SSL
    // success path is unaffected: it already sets the order method to the
    // SSL method before calling create(), so this is a no-op there.
    if (order.paymentMethod?.id !== paymentMethod.id) {
      order.paymentMethod = paymentMethod;
      await this.orderRepository.save(order);
    }

    await this.updateOrderPaymentStatus(order.id);

    return payment;
  }

  async findAllForOrder(orderId: number) {
    return this.paymentRepository.find({
      where: { order: { id: orderId } },
      relations: ['order', 'paymentMethod', 'createdBy', 'updatedBy'],
    });
  }
  async findAll(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: string,
    orderStatus?: OrderStatus,
    search?: string,
  ) {
    // Dhaka (UTC+6) bounds via the shared report date-range helper
    const { from, to } = resolveReportRange(fromDate, toDate, dateRangePreset);

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      // Order's customer — the payment report shows customer name + mobile
      .leftJoin('order.user', 'customer')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('payment.createdBy', 'createdBy')
      .leftJoinAndSelect('payment.updatedBy', 'updatedBy')
      .select([
        'payment.id',
        'payment.paymentNumber',
        'payment.amount',
        'payment.paymentDate',
        'payment.sslPaymentId',
        'payment.bankTranId',
        'order.id',
        'order.orderNo',
        'order.orderStatus',
        'order.paymentStatus',
        'order.totalValue',
        'order.paidAmount',
        'customer.id',
        'customer.name',
        'customer.mobileNumber',
        'paymentMethod.name',
        'paymentMethod.code',
        'paymentMethod.description',
        'createdBy.name',
        'createdBy.email',
        'createdBy.mobileNumber',
        'updatedBy.name',
        'updatedBy.email',
        'updatedBy.mobileNumber',
      ])
      .orderBy('payment.id', 'DESC');

    // Apply date range filters
    if (from && to) {
      query.andWhere('payment.paymentDate BETWEEN :from AND :to', {
        from,
        to,
      });
    } else if (from) {
      query.andWhere('payment.paymentDate >= :from', { from });
    } else if (to) {
      query.andWhere('payment.paymentDate <= :to', { to });
    }

    // Apply order status filter
    if (orderStatus) {
      query.andWhere('order.orderStatus = :orderStatus', { orderStatus });
    }

    // Free-text search across order no, customer name and mobile number
    if (search?.trim()) {
      query.andWhere(
        `(order.orderNo ILIKE :search
          OR customer.name ILIKE :search
          OR customer.mobileNumber ILIKE :search)`,
        { search: `%${search.trim()}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'paymentMethod', 'createdBy', 'updatedBy'],
    });
    if (!payment)
      throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  async update(id: number, updateDto: UpdateOrderPaymentDto, user: User) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Cannot modify payment for completed order',
      );
    }

    Object.assign(payment, updateDto);
    payment.updatedBy = user;

    await this.paymentRepository.save(payment);
    await this.updateOrderPaymentStatus(payment.order.id);

    return payment;
  }

  async remove(id: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const orderId = payment.order.id;
    await this.paymentRepository.remove(payment);
    await this.updateOrderPaymentStatus(orderId);

    return { message: 'Payment deleted successfully' };
  }

  private async updateOrderPaymentStatus(orderId: number) {
    const row = await this.getOrderPaidTotal(orderId);
    if (!row) throw new NotFoundException('Order not found');

    const totalPaid = parseFloat(row.paid) || 0;
    const totalValue = parseFloat(row.totalValue) || 0;

    await this.orderRepository.update(orderId, {
      paidAmount: totalPaid,
      paymentStatus: this.calculatePaymentStatus(totalPaid, totalValue),
    });
  }

  /**
   * One aggregate row for the order total and the sum of its payments.
   * The old code loaded the order with every payment row — plus each
   * payment's eager order/method/user relations — just to add the amounts.
   */
  private async getOrderPaidTotal(
    orderId: number,
  ): Promise<{ totalValue: string; paid: string } | null> {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.payments', 'payment')
      .select('order.totalValue', 'totalValue')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'paid')
      .where('order.id = :orderId', { orderId })
      .groupBy('order.id')
      .getRawOne<{ totalValue: string; paid: string }>();
  }

  /**
   * Insert a payment/refund row with a generated `YYYY-NNNN` number,
   * retrying when a concurrent insert takes the same number (unique
   * violation on paymentNumber — e.g. SSLCommerz firing the success
   * redirect and the IPN callback at the same time).
   */
  private async savePaymentWithRetry(
    build: (paymentNumber: string) => OrderPayment,
    attempts = 3,
  ): Promise<OrderPayment> {
    const isUniqueViolation = (error: unknown): boolean => {
      const err = error as {
        code?: string;
        driverError?: { code?: string };
        message?: string;
      };
      return (
        err?.code === '23505' ||
        err?.driverError?.code === '23505' ||
        (err?.message ?? '').includes('duplicate key')
      );
    };

    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const currentYear = new Date().getFullYear();
      const nextNumber = await this.getNextPaymentNumber(currentYear);
      const paymentNumber = `${currentYear}-${nextNumber.toString().padStart(6, '0')}`;
      try {
        return await this.paymentRepository.save(build(paymentNumber));
      } catch (error) {
        lastError = error;
        // 23505 = Postgres unique violation — number taken by a concurrent
        // insert; regenerate from the (now updated) max and try again
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw lastError;
  }

  /**
   * Next number for payment/refund rows: `YYYY-NNNNNN`, one shared sequence
   * across both types (they live in the same table and column, so type
   * prefixes were dropped — paymentType distinguishes refund rows). Rows
   * from before the 2026-11 6-digit migration keep 4-digit tails; the
   * lookup sorts by the zero-padded numeric tail, so mixed widths are safe.
   */
  private async getNextPaymentNumber(year: number): Promise<number> {
    const last = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentNumber', 'paymentNumber')
      // Prefix patterns (current `YYYY-`, legacy `PAY-YYYY-` / `REF-YYYY-`)
      // keep the unique paymentNumber index usable instead of scanning the
      // whole table with a leading wildcard.
      .where(
        `(payment.paymentNumber LIKE :currentPattern
          OR payment.paymentNumber LIKE :paymentPattern
          OR payment.paymentNumber LIKE :refundPattern)`,
        {
          currentPattern: `${year}-%`,
          paymentPattern: `PAY-${year}-%`,
          refundPattern: `REF-${year}-%`,
        },
      )
      // Strip to the last `-` segment and pad to a fixed width for a plain
      // numeric max — length-then-lexicographic breaks on mixed prefix
      // lengths, and RIGHT(paymentNumber, 4) truncates longer tails
      .orderBy(
        "lpad(REGEXP_REPLACE(payment.paymentNumber, '^.*-', ''), 10, '0')::bigint",
        'DESC',
      )
      .getRawOne();
    return (
      (last ? parseInt(last.paymentNumber.split('-').pop(), 10) || 0 : 0) + 1
    );
  }

  private calculatePaymentStatus(paid: number, total: number): PaymentStatus {
    if (paid >= total) return PaymentStatus.PAID;
    if (paid > 0) return PaymentStatus.PARTIAL;
    return PaymentStatus.PENDING;
  }

  async createRefund(
    originalPaymentId: number,
    refundAmount: number,
    refundRemarks?: string,
    user?: User,
  ): Promise<OrderPayment> {
    const originalPayment = await this.paymentRepository.findOne({
      where: { id: originalPaymentId },
      relations: ['order', 'paymentMethod'],
    });

    if (!originalPayment) {
      throw new NotFoundException('Original payment not found');
    }

    if (originalPayment.paymentType === PaymentType.REFUND) {
      throw new BadRequestException('Cannot refund a refund transaction');
    }

    if (refundAmount > Number(originalPayment.amount)) {
      throw new BadRequestException(
        'Refund amount cannot exceed original payment amount',
      );
    }

    const refund = await this.savePaymentWithRetry((refundNumber) =>
      this.paymentRepository.create({
        paymentNumber: refundNumber,
        order: originalPayment.order,
        amount: -Math.abs(refundAmount),
        paymentDate: new Date(),
        paymentMethod: originalPayment.paymentMethod,
        notes:
          refundRemarks ||
          `Refund for payment ${originalPayment.paymentNumber}`,
        paymentType: PaymentType.REFUND,
        originalPayment: originalPayment,
        originalPaymentId: originalPayment.id,
        createdBy: user,
        updatedBy: user,
      }),
    );

    // Update order payment status after refund
    await this.updateOrderPaymentStatusAfterRefund(originalPayment.order.id);

    return refund;
  }

  private async updateOrderPaymentStatusAfterRefund(orderId: number) {
    const row = await this.getOrderPaidTotal(orderId);
    if (!row) return;

    const totalPaid = parseFloat(row.paid) || 0;
    const totalValue = parseFloat(row.totalValue) || 0;
    const paidAmount = Math.max(0, totalPaid); // Don't allow negative paid amount

    // Update payment status based on refund status
    let paymentStatus: PaymentStatus;
    if (totalPaid <= 0) {
      // Fully refunded
      paymentStatus = PaymentStatus.REFUND_COMPLETE;
    } else if (totalPaid < totalValue) {
      // Partially refunded
      paymentStatus = PaymentStatus.PARTIAL_REFUND;
    } else {
      // Still has remaining paid amount
      paymentStatus = PaymentStatus.PAID;
    }

    await this.orderRepository.update(orderId, { paidAmount, paymentStatus });
  }
}
