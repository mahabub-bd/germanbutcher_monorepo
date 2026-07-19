import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { User } from '../user/entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Purchase } from './entities/purchase.entity';

export interface FindPurchasesOptions {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number;
  supplierId?: number;
  status?: string;
  paymentStatus?: 'due' | 'partial' | 'paid';
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepository: Repository<PurchaseItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(
    createPurchaseDto: CreatePurchaseDto,
    user: User,
  ): Promise<Purchase> {
    const supplier = await this.supplierRepository.findOneBy({
      id: createPurchaseDto.supplierId,
    });
    if (!supplier) {
      throw new NotFoundException(
        `Supplier with ID ${createPurchaseDto.supplierId} not found`,
      );
    }

    const purchase = this.purchaseRepository.create({
      ...createPurchaseDto,
      supplier,
      createdBy: user?.userId,
      updatedBy: user?.userId,
    });

    // Create purchase items
    purchase.items = await Promise.all(
      createPurchaseDto.items.map(async (itemDto) => {
        const product = await this.productRepository.findOneBy({
          id: itemDto.productId,
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${itemDto.productId} not found`,
          );
        }

        const unitPrice = itemDto.unitPrice ?? product.purchasePrice;
        const total = unitPrice * itemDto.quantity;

        return this.purchaseItemRepository.create({
          product,
          unitPrice,
          quantity: itemDto.quantity,
          total,
        });
      }),
    );

    // Calculate total value
    purchase.totalValue =
      createPurchaseDto.totalValue ??
      purchase.items.reduce((sum, item) => sum + item.total, 0);

    // Determine payment status
    const amountPaid = createPurchaseDto.amountPaid ?? 0;
    purchase.amountPaid = amountPaid;
    purchase.paymentStatus = this.calculatePaymentStatus(
      amountPaid,
      purchase.totalValue,
    );

    return this.purchaseRepository.save(purchase);
  }

  async findAll(
    options: FindPurchasesOptions,
  ): Promise<PaginatedResponseDto<Purchase>> {
    const {
      page = 1,
      limit = 50,
      search,
      productId,
      supplierId,
      status,
      startDate,
      endDate,
    } = options;

    const skip = (page - 1) * limit;
    const queryBuilder = this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('supplier.attachment', 'supplierAttachment')
      .leftJoinAndSelect('purchase.createdBy', 'createdBy')
      .leftJoinAndSelect('purchase.updatedBy', 'updatedBy')
      .leftJoinAndSelect('purchase.payments', 'payments')
      .take(limit)
      .skip(skip);

    if (search) {
      queryBuilder.where(
        '(product.name LIKE :search OR supplier.name LIKE :search OR purchase.purchaseNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (productId) {
      queryBuilder.andWhere('product.id = :productId', { productId });
    }

    if (supplierId) {
      queryBuilder.andWhere('supplier.id = :supplierId', { supplierId });
    }

    if (status) {
      queryBuilder.andWhere('purchase.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere({
        purchaseDate: Between(new Date(startDate), new Date(endDate)),
      });
    } else if (startDate) {
      queryBuilder.andWhere({
        purchaseDate: MoreThanOrEqual(new Date(startDate)),
      });
    } else if (endDate) {
      queryBuilder.andWhere({
        purchaseDate: LessThanOrEqual(new Date(endDate)),
      });
    }

    queryBuilder.orderBy('purchase.purchaseDate', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      message: 'Purchases retrieved successfully',
      statusCode: 200,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.product',
        'supplier',
        'supplier.attachment',
        'createdBy',
        'updatedBy',
        'payments',
      ],
    });

    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    return purchase;
  }

  async update(
    id: number,
    updatePurchaseDto: UpdatePurchaseDto,
    user: User,
  ): Promise<Purchase> {
    const purchase = await this.findOne(id);
    const originalStatus = purchase.status;

    // Handle supplier change
    if (
      updatePurchaseDto.supplierId &&
      updatePurchaseDto.supplierId !== purchase.supplier.id
    ) {
      const supplier = await this.supplierRepository.findOneBy({
        id: updatePurchaseDto.supplierId,
      });
      if (!supplier) {
        throw new NotFoundException(
          `Supplier with ID ${updatePurchaseDto.supplierId} not found`,
        );
      }
      purchase.supplier = supplier;
    }

    // Handle items update
    if (updatePurchaseDto.items) {
      await this.handleItemsUpdate(purchase, updatePurchaseDto.items);
    }

    // Handle total value update
    if (updatePurchaseDto.totalValue !== undefined) {
      purchase.totalValue = updatePurchaseDto.totalValue;
    } else if (updatePurchaseDto.items) {
      purchase.totalValue = purchase.items.reduce(
        (sum, item) => sum + item.total,
        0,
      );
    }

    // Handle amount paid changes
    if (updatePurchaseDto.amountPaid !== undefined) {
      if (updatePurchaseDto.amountPaid < 0) {
        throw new BadRequestException('Amount paid cannot be negative');
      }

      if (updatePurchaseDto.amountPaid > purchase.totalValue) {
        throw new BadRequestException('Amount paid cannot exceed total value');
      }

      purchase.amountPaid = updatePurchaseDto.amountPaid;
      purchase.paymentStatus = this.calculatePaymentStatus(
        purchase.amountPaid,
        purchase.totalValue,
      );
    }

    // Handle status change
    if (
      updatePurchaseDto.status &&
      updatePurchaseDto.status !== purchase.status
    ) {
      await this.handleStatusChange(
        purchase,
        originalStatus,
        updatePurchaseDto.status,
      );
    }

    purchase.updatedBy = user?.userId;

    return this.purchaseRepository.save(purchase);
  }

  async remove(id: number): Promise<void> {
    const purchase = await this.findOne(id);

    // Revert stock if purchase was delivered
    if (purchase.status === 'delivered') {
      await this.adjustStock(purchase.items, -1);
    }

    await this.purchaseRepository.remove(purchase);
  }

  private calculatePaymentStatus(
    amountPaid: number,
    totalValue: number,
  ): 'due' | 'partial' | 'paid' {
    if (amountPaid >= totalValue) return 'paid';
    if (amountPaid > 0) return 'partial';
    return 'due';
  }

  private async handleItemsUpdate(purchase: Purchase, newItems: any[]) {
    // Remove existing items
    await this.purchaseItemRepository.delete({ purchase: { id: purchase.id } });

    // Create new items
    purchase.items = await Promise.all(
      newItems.map(async (itemDto) => {
        const product = await this.productRepository.findOneBy({
          id: itemDto.productId,
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${itemDto.productId} not found`,
          );
        }

        const unitPrice = itemDto.unitPrice ?? product.purchasePrice;
        const total = unitPrice * itemDto.quantity;

        return this.purchaseItemRepository.create({
          product,
          unitPrice,
          quantity: itemDto.quantity,
          total,
        });
      }),
    );

    // Adjust stock if purchase was delivered
    if (purchase.status === 'delivered') {
      await this.adjustStock(purchase.items, 1);
    }
  }

  private async handleStatusChange(
    purchase: Purchase,
    originalStatus: string,
    newStatus: string,
  ) {
    purchase.status = newStatus;

    if (newStatus === 'delivered' && originalStatus !== 'delivered') {
      await this.adjustStock(purchase.items, 1);
    } else if (originalStatus === 'delivered' && newStatus !== 'delivered') {
      await this.adjustStock(purchase.items, -1);
    }
  }

  private async adjustStock(items: PurchaseItem[], multiplier: number) {
    for (const item of items) {
      const product = await this.productRepository.findOneBy({
        id: item.product.id,
      });
      if (product) {
        product.stock += item.quantity * multiplier;
        await this.productRepository.save(product);
      }
    }
  }
}
