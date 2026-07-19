import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserActivity, UserType, AuditStatus } from './entities/user-activity.entity';

export { UserType, AuditStatus };

export interface LogActionOptions {
  userId: number;
  action: string;
  entityType?: string;
  entityId?: number;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  userType?: UserType;
  status?: AuditStatus;
  message?: string;
}

@Injectable()
export class UserActivityService {
  private readonly logger = new Logger(UserActivityService.name);

  constructor(
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async logAction(options: LogActionOptions): Promise<UserActivity> {
    const activity = this.userActivityRepository.create({
      user: { id: options.userId } as any,
      userId: options.userId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      oldValue: options.oldValue,
      newValue: options.newValue,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      requestId: options.requestId,
      sessionId: options.sessionId,
      userType: options.userType || UserType.CUSTOMER,
      status: options.status || AuditStatus.SUCCESS,
      message: options.message || options.action,
    });

    return this.userActivityRepository.save(activity);
  }

  async getActivitiesPaginated(
    page: number,
    limit: number,
    filters?: {
      action?: string;
      entityType?: string;
      userType?: UserType;
      status?: AuditStatus;
      userId?: number;
    },
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .orderBy('activity.createdAt', 'DESC')
      .select([
        'activity.id',
        'activity.action',
        'activity.entityType',
        'activity.entityId',
        'activity.oldValue',
        'activity.newValue',
        'activity.ipAddress',
        'activity.userAgent',
        'activity.requestId',
        'activity.sessionId',
        'activity.userType',
        'activity.status',
        'activity.message',
        'activity.createdAt',
        'user.id',
        'user.name',
        'user.email',
      ]);

    if (filters?.action) {
      query.andWhere('activity.action = :action', { action: filters.action });
    }

    if (filters?.entityType) {
      query.andWhere('activity.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters?.userType) {
      query.andWhere('activity.userType = :userType', {
        userType: filters.userType,
      });
    }

    if (filters?.status) {
      query.andWhere('activity.status = :status', { status: filters.status });
    }

    if (filters?.userId) {
      query.andWhere('activity.userId = :userId', { userId: filters.userId });
    }

    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async getActivityById(id: number): Promise<UserActivity> {
    const activity = await this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.id = :id', { id })
      .select([
        'activity',
        'user.id',
        'user.name',
        'user.email',
      ])
      .getOne();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  async getActivitiesByUserId(userId: number): Promise<UserActivity[]> {
    return this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.userId = :userId', { userId })
      .select([
        'activity',
        'user.id',
        'user.name',
        'user.email',
      ])
      .orderBy('activity.createdAt', 'DESC')
      .getMany();
  }

  async getAuditTrail(
    entityType: string,
    entityId: number,
  ): Promise<UserActivity[]> {
    return this.userActivityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.entityType = :entityType', { entityType })
      .andWhere('activity.entityId = :entityId', { entityId })
      .select([
        'activity',
        'user.id',
        'user.name',
        'user.email',
      ])
      .orderBy('activity.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Data Retention Policy: Delete records older than specified days
   * Default: 90 days
   * Returns the number of deleted records
   */
  async deleteOldRecords(daysToKeep: number = 90): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.userActivityRepository
      .createQueryBuilder('activity')
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return {
      deletedCount: result.affected || 0,
    };
  }

  /**
   * Get statistics about old records that would be deleted
   */
  async getOldRecordsStats(daysToKeep: number = 90): Promise<{
    count: number;
    cutoffDate: Date;
    oldestRecord: Date | null;
    sizeInMB: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const count = await this.userActivityRepository
      .createQueryBuilder('activity')
      .where('activity.createdAt < :cutoffDate', { cutoffDate })
      .getCount();

    // Get oldest record
    const oldestRecord = await this.userActivityRepository
      .createQueryBuilder('activity')
      .select('MIN(activity.createdAt)', 'minDate')
      .getRawOne();

    // Estimate size (rough calculation: average record size ~1KB)
    const sizeInMB = Math.round((count * 0.001) * 100) / 100;

    return {
      count,
      cutoffDate,
      oldestRecord: oldestRecord?.minDate ? new Date(oldestRecord.minDate) : null,
      sizeInMB,
    };
  }

  /**
   * Scheduled task: Automatically cleanup old records daily at 2 AM
   * Runs every day at 02:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledCleanup(): Promise<void> {
    try {
      const stats = await this.getOldRecordsStats(90);

      if (stats.count > 0) {
        this.logger.log(
          `Starting scheduled cleanup of ${stats.count} old audit logs (older than 90 days). Estimated size to free: ${stats.sizeInMB} MB`,
        );

        const result = await this.deleteOldRecords(90);

        this.logger.log(
          `Scheduled cleanup completed: ${result.deletedCount} old audit logs deleted successfully`,
        );
      } else {
        this.logger.log('Scheduled cleanup: No old records to delete');
      }
    } catch (error) {
      this.logger.error('Error during scheduled cleanup:', error);
    }
  }
}
