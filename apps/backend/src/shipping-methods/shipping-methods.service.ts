// src/shipping-methods/shipping-methods.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ): Promise<ShippingMethod> {
    const shippingMethod = this.shippingMethodRepository.create(
      createShippingMethodDto,
    );
    return await this.shippingMethodRepository.save(shippingMethod);
  }

  async findAll(isActive?: string): Promise<ShippingMethod[]> {
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    return await this.shippingMethodRepository.find({ where });
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
  ): Promise<ShippingMethod> {
    const shippingMethod = await this.findOne(id);
    Object.assign(shippingMethod, updateShippingMethodDto);
    return await this.shippingMethodRepository.save(shippingMethod);
  }

  async remove(id: number): Promise<void> {
    const result = await this.shippingMethodRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }
  }
}
