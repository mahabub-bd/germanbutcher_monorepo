import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProductHistory,
  ProductHistoryAction,
} from './entities/product-history.entity';

export interface ProductHistoryEntryInput {
  productId: number | null;
  productName: string;
  action: ProductHistoryAction;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  snapshot?: Record<string, unknown> | null;
  user?: { userId?: number; name?: string } | null;
}

@Injectable()
export class ProductHistoryService {
  private readonly logger = new Logger(ProductHistoryService.name);

  /** Max history entries kept per product. */
  private static readonly KEEP_PER_PRODUCT = 100;

  constructor(
    @InjectRepository(ProductHistory)
    private readonly historyRepository: Repository<ProductHistory>,
  ) {}

  /** Record an event and trim the product's history to the newest
   * KEEP_PER_PRODUCT entries. Failures are logged, never thrown —
   * history must not break the operation that caused it. */
  async logEntry(entry: ProductHistoryEntryInput): Promise<void> {
    try {
      const record = this.historyRepository.create({
        productId: entry.productId,
        productName: entry.productName,
        action: entry.action,
        changes: entry.changes ?? null,
        snapshot: entry.snapshot ?? null,
        userId: entry.user?.userId ?? null,
        userName: entry.user?.name ?? null,
      });
      await this.historyRepository.save(record);
      await this.trimToKeep(entry.productId);
    } catch (error) {
      this.logger.error(
        `Failed to record product history for product ${entry.productId}:`,
        error,
      );
    }
  }

  async getHistoryPaginated(
    page: number = 1,
    limit: number = 15,
    action?: ProductHistoryAction,
  ): Promise<{
    data: ProductHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.historyRepository
      .createQueryBuilder('history')
      .orderBy('history.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (action) {
      queryBuilder.andWhere('history.action = :action', { action });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProductHistory(productId: number): Promise<ProductHistory[]> {
    return this.historyRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Delete everything but the newest KEEP_PER_PRODUCT entries of one
   * product. */
  private async trimToKeep(productId: number | null): Promise<void> {
    if (!productId) return;
    await this.historyRepository.query(
      `DELETE FROM "product_history"
        WHERE "productId" = $1
          AND "id" NOT IN (
            SELECT "id" FROM (
              SELECT "id" FROM "product_history"
              WHERE "productId" = $1
              ORDER BY "createdAt" DESC
              LIMIT $2
            ) kept
          )`,
      [productId, ProductHistoryService.KEEP_PER_PRODUCT],
    );
  }
}
