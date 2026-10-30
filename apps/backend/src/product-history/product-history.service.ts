import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

export interface ProductHistoryFilters {
  productId?: number;
  action?: ProductHistoryAction;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductHistorySummary {
  /** Counts per action, ignoring the action filter so the filter tabs can
   * show every action's total from a single request. */
  byAction: Record<ProductHistoryAction, number>;
  total: number;
  /** Distinct products touched by the filtered events. */
  products: number;
  /** Distinct users who produced the filtered events. */
  users: number;
}

export interface PaginatedProductHistory {
  data: ProductHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: ProductHistorySummary;
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
    filters: ProductHistoryFilters = {},
  ): Promise<PaginatedProductHistory> {
    const queryBuilder = this.historyRepository
      .createQueryBuilder('history')
      .orderBy('history.createdAt', 'DESC')
      .addOrderBy('history.id', 'DESC')
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

  /** Shared WHERE clauses; `includeAction` is false for the per-action counts. */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<ProductHistory>,
    filters: ProductHistoryFilters,
    includeAction: boolean,
  ): SelectQueryBuilder<ProductHistory> {
    if (filters.productId) {
      queryBuilder.andWhere('history.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (includeAction && filters.action) {
      queryBuilder.andWhere('history.action = :action', {
        action: filters.action,
      });
    }

    const search = filters.search?.trim();
    if (search) {
      queryBuilder.andWhere('history.productName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const dateFrom = this.toValidDate(filters.dateFrom);
    if (dateFrom) {
      queryBuilder.andWhere('history.createdAt >= :dateFrom', { dateFrom });
    }

    const dateTo = this.toValidDate(filters.dateTo);
    if (dateTo) {
      queryBuilder.andWhere('history.createdAt <= :dateTo', { dateTo });
    }

    return queryBuilder;
  }

  private toValidDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async getSummary(
    filters: ProductHistoryFilters,
  ): Promise<ProductHistorySummary> {
    const empty = this.emptySummary();
    try {
      // One grouped query for the per-action counts (action filter ignored) ...
      const rows = await this.applyFilters(
        this.historyRepository
          .createQueryBuilder('history')
          .select('history.action', 'action')
          .addSelect('COUNT(*)', 'count')
          .groupBy('history.action'),
        filters,
        false,
      ).getRawMany<{ action: ProductHistoryAction; count: string }>();

      const byAction = { ...empty.byAction };
      let total = 0;
      for (const row of rows) {
        const count = Number(row.count) || 0;
        if (row.action in byAction) byAction[row.action] = count;
        total += count;
      }

      // ... and one aggregate for the distinct products / users in the set.
      const distinct = await this.applyFilters(
        this.historyRepository
          .createQueryBuilder('history')
          .select(
            'COUNT(DISTINCT COALESCE(history."productId"::text, history."productName"))',
            'products',
          )
          .addSelect('COUNT(DISTINCT history."userName")', 'users'),
        filters,
        true,
      ).getRawOne<{ products: string; users: string }>();

      return {
        byAction,
        total,
        products: Number(distinct?.products ?? 0),
        users: Number(distinct?.users ?? 0),
      };
    } catch (error) {
      this.logger.error('Failed to build product history summary:', error);
      return empty;
    }
  }

  private emptySummary(): ProductHistorySummary {
    const byAction = Object.values(ProductHistoryAction).reduce(
      (acc, action) => ({ ...acc, [action]: 0 }),
      {} as Record<ProductHistoryAction, number>,
    );
    return { byAction, total: 0, products: 0, users: 0 };
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
