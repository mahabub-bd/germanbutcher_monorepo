import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';

export interface StockMovementInput {
  product: { id: number; name: string };
  type: StockMovementType;
  /** Signed quantity change (+in / -out). */
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceType?: string;
  referenceId?: number;
  note?: string;
  user?: { userId?: number; name?: string } | null;
}

@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name);

  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
  ) {}

  /** Record one stock movement. Failures are logged, never thrown —
   * the ledger must not break the stock operation it tracks. */
  async record(input: StockMovementInput): Promise<void> {
    try {
      const record = this.movementRepository.create({
        productId: input.product.id,
        productName: input.product.name,
        type: input.type,
        quantity: input.quantity,
        stockBefore: input.stockBefore,
        stockAfter: input.stockAfter,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        note: input.note ?? null,
        userId: input.user?.userId ?? null,
        userName: input.user?.name ?? null,
      });
      await this.movementRepository.save(record);
    } catch (error) {
      this.logger.error(
        `Failed to record stock movement for product ${input.product.id}:`,
        error,
      );
    }
  }

  async getMovementsPaginated(
    page: number = 1,
    limit: number = 15,
    productId?: number,
    type?: StockMovementType,
  ): Promise<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.movementRepository
      .createQueryBuilder('movement')
      .orderBy('movement.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (productId) {
      queryBuilder.andWhere('movement.productId = :productId', { productId });
    }

    if (type) {
      queryBuilder.andWhere('movement.type = :type', { type });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProductMovements(productId: number): Promise<StockMovement[]> {
    return this.movementRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }
}
