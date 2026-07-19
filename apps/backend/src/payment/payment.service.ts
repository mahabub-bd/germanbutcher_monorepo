import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentMethod } from 'src/payment-method/entities/payment-method.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,

    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, user: User) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id: createPaymentDto.purchaseId },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createPaymentDto.paymentMethodId },
    });
    if (!paymentMethod) {
      throw new NotFoundException('Payment Method not found');
    }
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      purchase,
      paymentMethod,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });

    await this.paymentRepository.save(payment);

    await this.updatePurchasePaymentStatus(purchase.id);

    return payment;
  }

  async findAll() {
    return this.paymentRepository.find({
      relations: ['purchase', 'createdBy', 'updatedBy', 'paymentMethod'],
    });
  }

  async findOne(id: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['purchase', 'createdBy', 'updatedBy', 'paymentMethod'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto, user: User) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['purchase'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    payment.updatedBy = user?.userId;
    Object.assign(payment, updatePaymentDto);

    await this.paymentRepository.save(payment);

    // Update purchase payment status if amount changed
    if (updatePaymentDto.amount) {
      await this.updatePurchasePaymentStatus(payment.purchase.id);
    }

    return payment;
  }

  async remove(id: number) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['purchase'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    const purchaseId = payment.purchase.id;
    await this.paymentRepository.remove(payment);

    await this.updatePurchasePaymentStatus(purchaseId);

    return { message: 'Payment deleted successfully' };
  }

  private async updatePurchasePaymentStatus(purchaseId: number) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id: purchaseId },
      relations: ['payments'],
    });

    if (!purchase) return;

    const totalPaid = purchase.payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount.toString()),
      0,
    );

    if (totalPaid >= parseFloat(purchase.totalValue.toString())) {
      purchase.paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      purchase.paymentStatus = 'partial';
    } else {
      purchase.paymentStatus = 'due';
    }

    purchase.amountPaid = totalPaid;

    await this.purchaseRepository.save(purchase);
  }
}
