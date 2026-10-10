import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/user/entities/user.entity';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('token')
  @Get('admin')
  @ApiOperation({
    summary: 'Get admin notifications',
    description: 'Paginated admin feed (e.g. new-order alerts)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  async findForAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.findForAdmin(
      Number(page) || 1,
      Number(limit) || 15,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('token')
  @Get('admin/unread-count')
  @ApiOperation({ summary: 'Get admin unread notification count' })
  async getAdminUnreadCount() {
    const count = await this.notificationService.getAdminUnreadCount();
    return {
      message: 'Unread count retrieved successfully',
      statusCode: 200,
      data: { count },
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('token')
  @Patch('admin/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all admin notifications as read' })
  async markAllAdminRead() {
    return this.notificationService.markAllAdminRead();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('token')
  @Patch('admin/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one admin notification as read' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async markAdminRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAdminRead(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Get('my')
  @ApiOperation({
    summary: 'Get my notifications',
    description:
      'Paginated notifications for the authenticated user, including broadcasts',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  async findForUser(
    @GetUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.findForUser(
      user.userId,
      Number(page) || 1,
      Number(limit) || 15,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Get('my/unread-count')
  @ApiOperation({ summary: 'Get my unread notification count' })
  async getUnreadCount(@GetUser() user: User) {
    const count = await this.notificationService.getUnreadCount(user.userId);
    return {
      message: 'Unread count retrieved successfully',
      statusCode: 200,
      data: { count },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllRead(@GetUser() user: User) {
    return this.notificationService.markAllRead(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async markRead(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markRead(id, user.userId);
  }
}
