import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SkipAnalytics } from 'src/common/decorators/skip-analytics.decorator';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { getClientIp } from 'src/common/utils/ip-extractor.util';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { OnlineUsersService } from './online-users.service';

@ApiTags('Online Users')
@Controller('online-users')
export class OnlineUsersController {
  constructor(private readonly onlineUsersService: OnlineUsersService) {}

  @Post('heartbeat')
  @UseGuards(OptionalJwtAuthGuard)
  @SkipAnalytics()
  @ApiOperation({
    summary: 'Register a visitor heartbeat',
    description:
      'Called periodically by the storefront browser. Tracks how many visitors are online. Anonymous calls are fine; a Bearer token tags the visitor as logged in.',
  })
  heartbeat(@Req() req: any, @Body() dto: HeartbeatDto) {
    const visitorId = dto.visitorId || `ip:${getClientIp(req)}`;
    this.onlineUsersService.heartbeat(visitorId, getClientIp(req), {
      userId: req.user?.userId,
      page: dto.page,
      userAgent: req.headers['user-agent'],
    });

    return {
      message: 'Heartbeat received',
      statusCode: HttpStatus.OK,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('token')
  @SkipAnalytics()
  @ApiOperation({
    summary: 'Get current online users count (admin)',
    description:
      'Returns how many visitors have sent a heartbeat in the last 5 minutes, split into authenticated users and guests',
  })
  @ApiQuery({
    name: 'window',
    required: false,
    description: 'Online window in minutes (default 5, max 60)',
    example: 5,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Online users summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 12 },
        authenticated: { type: 'number', example: 3 },
        guests: { type: 'number', example: 9 },
        pages: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { '/': 5, '/products/fresh-sausage': 2 },
        },
      },
    },
  })
  getOnlineUsers(@Query('window') window?: number) {
    const windowMinutes = Math.min(Math.max(Number(window) || 5, 1), 60);
    const windowMs = windowMinutes * 60 * 1000;

    return {
      message: 'Online users summary retrieved successfully',
      statusCode: HttpStatus.OK,
      data: {
        ...this.onlineUsersService.getSummary(windowMs),
        pages: this.onlineUsersService.getOnlinePages(windowMs),
      },
    };
  }
}
