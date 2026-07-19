// src/order-payment-method/order-payment-method.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderPaymentMethodDto } from './dto/create-order-payment-method.dto';
import { UpdateOrderPaymentMethodDto } from './dto/update-order-payment-method.dto';
import { OrderPaymentMethod } from './entities/order-payment-method.entity';

@Injectable()
export class OrderPaymentMethodService {
  constructor(
    @InjectRepository(OrderPaymentMethod)
    private readonly paymentMethodRepository: Repository<OrderPaymentMethod>,
  ) {}

  async create(
    createDto: CreateOrderPaymentMethodDto,
  ): Promise<OrderPaymentMethod> {
    const exists = await this.paymentMethodRepository.findOne({
      where: [{ code: createDto.code }, { name: createDto.name }],
    });

    if (exists) {
      throw new ConflictException(
        'Payment method with this code or name already exists',
      );
    }

    return this.paymentMethodRepository.save(createDto);
  }

  async findAll(): Promise<OrderPaymentMethod[]> {
    return this.paymentMethodRepository.find({
      select: ['id', 'code', 'name', 'description', 'isActive'],
    });
  }

  async findOne(id: number): Promise<OrderPaymentMethod> {
    return this.paymentMethodRepository.findOneByOrFail({ id });
  }

  async update(
    id: number,
    updateDto: UpdateOrderPaymentMethodDto,
  ): Promise<OrderPaymentMethod> {
    await this.paymentMethodRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async toggleStatus(id: number): Promise<OrderPaymentMethod> {
    const method = await this.findOne(id);
    method.isActive = !method.isActive;
    return this.paymentMethodRepository.save(method);
  }
}
