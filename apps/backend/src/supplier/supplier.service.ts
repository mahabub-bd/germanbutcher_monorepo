import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}
@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(
    createSupplierDto: CreateSupplierDto,
    user: User,
  ): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      ...createSupplierDto,
      isActive: true,
      createdBy: user?.userId,
      updatedBy: user?.userId,
    });
    return this.supplierRepository.save(supplier);
  }

  async findAll(options: FindAllOptions): Promise<[Supplier[], number]> {
    const {
      page = 1,
      limit = 50,
      search,
      sortOrder = 'asc',
      isActive,
    } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.attachment', 'attachment')
      .leftJoinAndSelect('supplier.createdBy', 'createdBy')
      .leftJoinAndSelect('supplier.updatedBy', 'updatedBy')
      // Add product relation with its attachment
      .leftJoinAndSelect('supplier.products', 'products')
      .leftJoinAndSelect('products.attachment', 'productAttachment');

    if (search) {
      queryBuilder.where(
        '(supplier.name LIKE :search OR supplier.email LIKE :search OR supplier.phone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('supplier.isActive = :isActive', { isActive });
    }

    queryBuilder.orderBy(
      'supplier.name',
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    );

    queryBuilder.skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'updatedBy',
        'products',
        'products.attachment', // Include product attachments
      ],
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(
    id: number,
    updateSupplierDto: UpdateSupplierDto,
    user: User,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, {
      ...updateSupplierDto,
      updatedBy: user,
    });
    return this.supplierRepository.save(supplier);
  }

  async remove(id: number): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.remove(supplier);
  }
}
