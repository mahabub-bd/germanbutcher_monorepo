import {
  Controller,
  Get,
  Post,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { UserActivity, UserType, AuditStatus } from './entities/user-activity.entity';
import { UserActivityService } from './user-activity.service';
@ApiBearerAuth('token')
@ApiTags('User Activities')
@Controller('user-activities')
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  @ApiOperation({
    summary: 'Get all user activities with pagination and filters',
    description:
      'Retrieves user activities for POST, PATCH, and DELETE operations only. GET requests are not logged. Supports filtering by multiple criteria.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    example: 'POST',
    description: 'Filter by action type (POST, PATCH, DELETE)',
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    type: String,
    example: 'product',
    description: 'Filter by entity type (table or resource affected)',
  })
  @ApiQuery({
    name: 'userType',
    required: false,
    enum: UserType,
    example: UserType.CUSTOMER,
    description: 'Filter by user type (admin, customer, system)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AuditStatus,
    example: AuditStatus.SUCCESS,
    description: 'Filter by status (success, failure)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    example: 1,
    description: 'Filter by specific user ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of user activities retrieved successfully',
    schema: {
      example: {
        message: 'User activities retrieved successfully',
        statusCode: 200,
        data: [
          {
            id: 1,
            action: 'POST',
            entityType: 'product',
            entityId: 123,
            oldValue: null,
            newValue: { name: 'New Product', price: 29.99 },
            ipAddress: '::1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            requestId: 'req-12345',
            sessionId: 'sess-67890',
            userType: 'admin',
            status: 'success',
            message: 'Created product',
            createdAt: '2025-08-05T21:06:44.952Z',
            user: { id: 1, name: 'Mahabub Hossain', email: 'admin@example.com' },
          },
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5,
      },
    },
  })
  async getAllActivities(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('userType') userType?: UserType,
    @Query('status') status?: AuditStatus,
    @Query('userId') userId?: number,
  ): Promise<ApiResponseDto<any>> {
    const activitiesData =
      await this.userActivityService.getActivitiesPaginated(
        Number(page),
        Number(limit),
        {
          action,
          entityType,
          userType,
          status,
          userId,
        },
      );

    return {
      message: 'User activities retrieved successfully',
      statusCode: HttpStatus.OK,
      data: activitiesData.data,
      total: activitiesData.total,
      page: activitiesData.page,
      limit: activitiesData.limit,
      totalPages: activitiesData.totalPages,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('audit-trail/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get audit trail for a specific entity',
    description:
      'Retrieves complete audit history for any entity (product, order, user, etc.) showing all changes made.',
  })
  @ApiParam({
    name: 'entityType',
    type: String,
    example: 'product',
    description: 'Type of entity (table name)',
  })
  @ApiParam({
    name: 'entityId',
    type: Number,
    example: 123,
    description: 'ID of the entity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit trail retrieved successfully',
  })
  async getAuditTrail(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ): Promise<ApiResponseDto<UserActivity[]>> {
    const auditTrail =
      await this.userActivityService.getAuditTrail(entityType, entityId);

    return {
      message: `Audit trail for ${entityType} ${entityId} retrieved successfully`,
      statusCode: HttpStatus.OK,
      data: auditTrail,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('details/:id')
  @ApiOperation({
    summary: 'Get a specific user activity by ID',
    description:
      'Retrieves detailed information about a single user activity record by its ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID of the activity record',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity retrieved successfully',
    schema: {
      example: {
        message: 'Activity retrieved successfully',
        statusCode: 200,
        data: {
          id: 1,
          action: 'POST',
          entityType: 'product',
          entityId: 123,
          oldValue: null,
          newValue: { name: 'New Product', price: 29.99 },
          ipAddress: '::1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestId: 'req-12345',
          sessionId: 'sess-67890',
          userType: 'admin',
          status: 'success',
          message: 'Created product',
          createdAt: '2025-08-05T21:06:44.952Z',
          user: { id: 1, name: 'Mahabub Hossain', email: 'admin@example.com' },
        },
      },
    },
  })
  async getActivityById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<UserActivity>> {
    const activity = await this.userActivityService.getActivityById(id);

    return {
      message: 'Activity retrieved successfully',
      statusCode: HttpStatus.OK,
      data: activity,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  @ApiOperation({
    summary: 'Get all activities by user ID',
    description:
      'Retrieves activities for a specific user. Only POST, PATCH, and DELETE operations are logged.',
  })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activities for the specified user retrieved successfully',
    schema: {
      example: {
        message: 'Activities for user 1 retrieved successfully',
        statusCode: 200,
        data: [
          {
            id: 1,
            action: 'POST',
            entityType: 'order',
            entityId: 456,
            oldValue: null,
            newValue: { status: 'pending', total: 99.99 },
            ipAddress: '::1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            requestId: 'req-12345',
            sessionId: 'sess-67890',
            userType: 'customer',
            status: 'success',
            message: 'Created order',
            createdAt: '2025-08-05T21:06:44.952Z',
            user: { id: 1, name: 'John Doe', email: 'john@example.com' },
          },
        ],
      },
    },
  })
  async getActivitiesByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ApiResponseDto<UserActivity[]>> {
    const activities =
      await this.userActivityService.getActivitiesByUserId(userId);

    return {
      message: `Activities for user ${userId} retrieved successfully`,
      statusCode: HttpStatus.OK,
      data: activities,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('retention/cleanup')
  @ApiOperation({
    summary: 'Manually trigger cleanup of old audit logs',
    description:
      'Deletes user activity records older than the specified number of days (default: 90 days). This helps manage database size.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 90,
    description: 'Number of days to keep (default: 90)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old records deleted successfully',
    schema: {
      example: {
        message: 'Old records cleaned up successfully',
        statusCode: 200,
        data: {
          deletedCount: 1250,
        },
      },
    },
  })
  async cleanupOldRecords(
    @Query('days') days: number = 90,
  ): Promise<ApiResponseDto<{ deletedCount: number }>> {
    const result = await this.userActivityService.deleteOldRecords(days);

    return {
      message: `${result.deletedCount} old records (older than ${days} days) deleted successfully`,
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('retention/stats')
  @ApiOperation({
    summary: 'Get statistics about old audit log records',
    description:
      'Returns information about records that would be deleted by the retention policy, including count and estimated size.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 90,
    description: 'Number of days to keep (default: 90)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        message: 'Old records statistics retrieved successfully',
        statusCode: 200,
        data: {
          count: 1250,
          cutoffDate: '2025-12-09T10:30:00.000Z',
          oldestRecord: '2025-08-15T14:20:00.000Z',
          sizeInMB: 1.25,
        },
      },
    },
  })
  async getOldRecordsStats(
    @Query('days') days: number = 90,
  ): Promise<ApiResponseDto<any>> {
    const stats = await this.userActivityService.getOldRecordsStats(days);

    return {
      message: 'Old records statistics retrieved successfully',
      statusCode: HttpStatus.OK,
      data: stats,
    };
  }
}
