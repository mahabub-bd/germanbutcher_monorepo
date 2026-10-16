import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Request } from 'express';
import { SkipAnalytics } from 'src/common/decorators/skip-analytics.decorator';
import { getClientIp } from 'src/common/utils/ip-extractor.util';
import { PRODUCT_PAGE_PATH_REGEX } from './analytics.service';
import { AnalyticsService } from './analytics.service';

class TrackPageViewDto {
  @IsString()
  @IsNotEmpty()
  path: string;
}

/**
 * Public page-view beacon for the storefront. Server-rendered product pages
 * are served from Next's fetch cache, so most visits never reach a tracked
 * API route — this endpoint records real browser page views instead.
 * Relies on the global ThrottlerGuard for abuse protection.
 */
@ApiTags('Analytics')
@Controller('analytics/track')
@SkipAnalytics()
export class AnalyticsTrackController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('page-view')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Record a storefront page view',
    description:
      'Called by the storefront client on product detail page loads. Only product page paths are accepted; anything else is ignored.',
  })
  trackPageView(
    @Body() dto: TrackPageViewDto,
    @Req() req: Request,
  ): void {
    if (!PRODUCT_PAGE_PATH_REGEX.test(dto.path)) return;

    // Same log shape the interceptor records for a page "request"
    this.analyticsService.logRequest({
      endpoint: 'page-view',
      method: 'GET',
      statusCode: 200,
      responseTime: 0,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'],
      requestPath: dto.path,
      isAuthenticated: false,
    });
  }
}
