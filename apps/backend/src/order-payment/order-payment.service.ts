import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { OrderStatus, PaymentStatus, PaymentType } from '../common/enums';
import { OrderPaymentMethod } from '../order-payment-method/entities/order-payment-method.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { OrderPayment } from './entities/order-payment.entity';

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
      relations: ['payments'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot add payment to completed order');
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createPaymentDto.paymentMethodId },
    });
    if (!paymentMethod) throw new NotFoundException('Payment Method not found');

    const currentYear = new Date().getFullYear();
    const lastPayment = await this.paymentRepository.findOne({
      where: {
        paymentNumber: Like(`PAY-${currentYear}-%`),
      },
      order: { paymentNumber: 'DESC' },
    });

    let lastNumber = 0;
    if (lastPayment) {
      const parts = lastPayment.paymentNumber.split('-');
      lastNumber = parseInt(parts[2]) || 0;
    }

    const paymentNumber = `PAY-${currentYear}-${(lastNumber + 1).toString().padStart(4, '0')}`;

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      order,
      paymentMethod,
      createdBy: user?.userId,
      updatedBy: user?.userId,
      paymentNumber,
    });

    await this.paymentRepository.save(payment);
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

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
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

    if (payment.order.paymentStatus === PaymentStatus.COMPLETED) {
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
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    order.paidAmount = totalPaid;
    order.paymentStatus = this.calculatePaymentStatus(
      totalPaid,
      order.totalValue,
    );

    await this.orderRepository.save(order);
  }

  private calculatePaymentStatus(paid: number, total: number): PaymentStatus {
    if (paid >= total) return PaymentStatus.COMPLETED;
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

    const currentYear = new Date().getFullYear();
    const lastRefund = await this.paymentRepository.findOne({
      where: {
        paymentNumber: Like(`REF-${currentYear}-%`),
      },
      order: { id: 'DESC' },
    });

    let lastNumber = 0;
    if (lastRefund) {
      const parts = lastRefund.paymentNumber.split('-');
      lastNumber = parseInt(parts[2]) || 0;
    }

    const refundNumber = `REF-${currentYear}-${(lastNumber + 1)
      .toString()
      .padStart(4, '0')}`;

    const refund = this.paymentRepository.create({
      paymentNumber: refundNumber,
      order: originalPayment.order,
      amount: -Math.abs(refundAmount),
      paymentDate: new Date(),
      paymentMethod: originalPayment.paymentMethod,
      notes: refundRemarks || `Refund for payment ${originalPayment.paymentNumber}`,
      paymentType: PaymentType.REFUND,
      originalPayment: originalPayment,
      originalPaymentId: originalPayment.id,
      createdBy: user,
      updatedBy: user,
    });

    await this.paymentRepository.save(refund);

    // Update order payment status after refund
    await this.updateOrderPaymentStatusAfterRefund(originalPayment.order.id);

    return refund;
  }

  private async updateOrderPaymentStatusAfterRefund(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) return;

    // Calculate total paid (including negative refund amounts)
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    order.paidAmount = Math.max(0, totalPaid); // Don't allow negative paid amount

    // Update payment status based on refund status
    if (totalPaid <= 0) {
      // Fully refunded
      order.paymentStatus = PaymentStatus.REFUND_COMPLETE;
    } else if (totalPaid < order.totalValue) {
      // Partially refunded
      order.paymentStatus = PaymentStatus.PARTIAL_REFUND;
    } else {
      // Still has remaining paid amount
      order.paymentStatus = PaymentStatus.PAID;
    }

    await this.orderRepository.save(order);
  }
}
