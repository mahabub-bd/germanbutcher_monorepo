import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

/** Filters accepted by the movement ledger listing. */
export interface StockMovementFilters {
  productId?: number;
  type?: StockMovementType;
  /** Case-insensitive match against the product-name snapshot. */
  search?: string;
  /** ISO timestamp, inclusive lower bound on createdAt. */
  dateFrom?: string;
  /** ISO timestamp, inclusive upper bound on createdAt. */
  dateTo?: string;
}

export interface StockMovementSummary {
  /** Movement count per type (computed without the type filter). */
  byType: Record<StockMovementType, number>;
  /** Total movements matching the summary filters, ignoring the type filter. */
  total: number;
  /** Units added to stock (sum of positive quantities), respecting the type filter. */
  unitsIn: number;
  /** Units removed from stock (sum of negative quantities), respecting the type filter. */
  unitsOut: number;
}

export interface PaginatedStockMovements {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: StockMovementSummary;
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
    filters: StockMovementFilters = {},
  ): Promise<PaginatedStockMovements> {
    const queryBuilder = this.movementRepository
      .createQueryBuilder('movement')
      .orderBy('movement.createdAt', 'DESC')
      .addOrderBy('movement.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyFilters(queryBuilder, filters, true);

    const [data, total] = await queryBuilder.getManyAndCount();
    const summary = await this.getSummary(filters);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  async getProductMovements(productId: number): Promise<StockMovement[]> {
    return this.movementRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Shared WHERE clauses so the list and its summary stay in sync. */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<StockMovement>,
    filters: StockMovementFilters,
    includeType: boolean,
  ): void {
    if (filters.productId) {
      queryBuilder.andWhere('movement.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (includeType && filters.type) {
      queryBuilder.andWhere('movement.type = :type', { type: filters.type });
    }

    const search = filters.search?.trim();
    if (search) {
      queryBuilder.andWhere('movement.productName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const dateFrom = this.toValidDate(filters.dateFrom);
    if (dateFrom) {
      queryBuilder.andWhere('movement.createdAt >= :dateFrom', { dateFrom });
    }

    const dateTo = this.toValidDate(filters.dateTo);
    if (dateTo) {
      queryBuilder.andWhere('movement.createdAt <= :dateTo', { dateTo });
    }
  }

  private toValidDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /** Counts per movement type plus units in/out. Type counts ignore the
   * type filter so the chips can show how many rows each filter would
   * return; the unit totals respect it so they match the visible ledger. */
  private async getSummary(
    filters: StockMovementFilters,
  ): Promise<StockMovementSummary> {
    const summary = this.emptySummary();

    try {
      const queryBuilder = this.movementRepository.createQueryBuilder('movement');
      this.applyFilters(queryBuilder, filters, false);

      const rows = await queryBuilder
        .select('movement.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(GREATEST(movement.quantity, 0)), 0)', 'unitsIn')
        .addSelect('COALESCE(SUM(LEAST(movement.quantity, 0)), 0)', 'unitsOut')
        .groupBy('movement.type')
        .getRawMany<{
          type: StockMovementType;
          count: string;
          unitsIn: string;
          unitsOut: string;
        }>();

      for (const row of rows) {
        const count = Number(row.count) || 0;
        const unitsIn = Number(row.unitsIn) || 0;
        const unitsOut = Math.abs(Number(row.unitsOut) || 0);

        if (row.type in summary.byType) {
          summary.byType[row.type] = count;
        }

        summary.total += count;

        if (!filters.type || filters.type === row.type) {
          summary.unitsIn += unitsIn;
          summary.unitsOut += unitsOut;
        }
      }
    } catch (error) {
      this.logger.error('Failed to build stock movement summary:', error);
    }

    return summary;
  }

  private emptySummary(): StockMovementSummary {
    return {
      byType: {
        [StockMovementType.PURCHASE]: 0,
        [StockMovementType.PURCHASE_REVERSAL]: 0,
        [StockMovementType.ORDER_SALE]: 0,
        [StockMovementType.ORDER_CANCEL]: 0,
        [StockMovementType.ADJUSTMENT]: 0,
      },
      total: 0,
      unitsIn: 0,
      unitsOut: 0,
    };
  }
}
