// src/shipping-methods/shipping-methods.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { ShippingMethod } from './entities/shipping-method.entity';

@Injectable()
export class ShippingMethodsService {
  constructor(
    @InjectRepository(ShippingMethod)
    private readonly shippingMethodRepository: Repository<ShippingMethod>,
  ) {}

  async create(
    createShippingMethodDto: CreateShippingMethodDto,
    userId?: number,
  ): Promise<ShippingMethod> {
    const shippingMethod = this.shippingMethodRepository.create(
      createShippingMethodDto,
    );
    if (userId) {
      shippingMethod.createdBy = { id: userId } as User;
      shippingMethod.updatedBy = { id: userId } as User;
    }
    return await this.shippingMethodRepository.save(shippingMethod);
  }

  async findAll(isActive?: string): Promise<ShippingMethod[]> {
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    return await this.shippingMethodRepository.find({
      where,
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ShippingMethod> {
    const shippingMethod = await this.shippingMethodRepository.findOne({
      where: { id },
    });
    if (!shippingMethod) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }
    return shippingMethod;
  }

  async update(
    id: number,
    updateShippingMethodDto: UpdateShippingMethodDto,
    userId?: number,
  ): Promise<ShippingMethod> {
    const shippingMethod = await this.findOne(id);
    Object.assign(shippingMethod, updateShippingMethodDto);
    if (userId) {
      shippingMethod.updatedBy = { id: userId } as User;
    }
    return await this.shippingMethodRepository.save(shippingMethod);
  }

  async remove(id: number): Promise<void> {
    const result = await this.shippingMethodRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }
  }
}
