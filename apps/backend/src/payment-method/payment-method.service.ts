import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethod } from './entities/payment-method.entity';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createDto: CreatePaymentMethodDto, user: User) {
    const method = this.paymentMethodRepository.create({
      ...createDto,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });
    return this.paymentMethodRepository.save(method);
  }

  async findAll() {
    return this.paymentMethodRepository.find({
      where: { isActive: true },
    });
  }

  async findOne(id: number) {
    const method = await this.paymentMethodRepository.findOne({
      where: { id },
    });
    if (!method) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return method;
  }

  async update(id: number, updateDto: UpdatePaymentMethodDto, user: User) {
    const method = await this.findOne(id);
    Object.assign(method, updateDto);
    method.updatedBy = user;
    return this.paymentMethodRepository.save(method);
  }

  async remove(id: number) {
    const method = await this.findOne(id);
    return this.paymentMethodRepository.remove(method);
  }
}
