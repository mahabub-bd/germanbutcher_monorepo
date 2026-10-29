import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { CrmService } from './crm.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CrmCustomersQueryDto } from './dto/crm-customers-query.dto';
import { CrmSegment } from 'src/common/enums';

@ApiTags('CRM')
@Controller('crm')
@ApiBearerAuth('token')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ModulePermissions('/admin/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('customers')
  @ApiOperation({ summary: 'Customers with RFM stats and segment' })
  async getCustomers(@Query() query: CrmCustomersQueryDto) {
    return await this.crmService.getCustomers(query);
  }

  @Get('segment-rules')
  @ApiOperation({ summary: 'Effective CRM segment rules (Business Settings or defaults)' })
  async getSegmentRules() {
    const rules = await this.crmService.getSegmentRules();
    return {
      message: 'CRM segment rules retrieved successfully',
      statusCode: 200,
      data: rules,
    };
  }

  // Declared before 'customers/:id' so "export" is not captured as an id.
  @Post('campaigns')
  @ApiOperation({ summary: 'Create a draft SMS/email campaign' })
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @Request() req: { user: { id: number } },
  ) {
    return await this.crmService.createCampaign(dto, req.user.id);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List campaigns' })
  async getCampaigns(@Query() query: { page?: string; limit?: string }) {
    return await this.crmService.getCampaigns({
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  // Before 'campaigns/:id' so "recipients-preview" is not captured as an id.
  @Get('campaigns/recipients-preview')
  @ApiOperation({ summary: 'Count + sample of a segment for a new campaign' })
  async previewRecipients(@Query('segment') segment?: string) {
    return await this.crmService.previewCampaignRecipients(
      (segment as CrmSegment) || undefined,
    );
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Campaign detail with recipient log' })
  async getCampaign(@Param('id', ParseIntPipe) id: number) {
    return await this.crmService.getCampaign(id);
  }

  @Post('campaigns/:id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Queue a draft campaign for delivery' })
  async sendCampaign(@Param('id', ParseIntPipe) id: number) {
    return await this.crmService.sendCampaign(id);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a campaign and its recipient log' })
  async deleteCampaign(@Param('id', ParseIntPipe) id: number) {
    return await this.crmService.deleteCampaign(id);
  }

  @Get('customers/export')
  @ApiOperation({ summary: 'Export filtered customers as CSV' })
  async exportCustomers(
    @Query() query: CrmCustomersQueryDto,
    @Res() res: Response,
  ) {
    const customers = await this.crmService.exportCustomers(query);

    const escapeCsv = (value: unknown): string => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const asDate = (value: unknown): string =>
      value ? new Date(value as string).toISOString().slice(0, 10) : '';

    const header = [
      'ID',
      'Name',
      'Email',
      'Mobile',
      'Area',
      'Orders',
      'Total Spent',
      'Avg Order',
      'Last Order',
      'Segment',
      'Joined',
    ];
    const lines = [header.map(escapeCsv).join(',')];
    for (const customer of customers) {
      lines.push(
        [
          customer.id,
          customer.name,
          customer.email,
          customer.mobileNumber,
          customer.area,
          customer.rfm.orderCount,
          customer.rfm.totalSpent,
          customer.rfm.averageOrderValue,
          customer.rfm.lastOrderAt ? asDate(customer.rfm.lastOrderAt) : '',
          customer.segment,
          asDate(customer.createdAt),
        ]
          .map(escapeCsv)
          .join(','),
      );
    }
    // BOM so Excel renders any Bangla text correctly.
    const csv = '﻿' + lines.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="crm-customers.csv"',
    );
    res.send(csv);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Customer 360 view' })
  async getCustomer360(@Param('id', ParseIntPipe) id: number) {
    const result = await this.crmService.getCustomer360(id);
    return result;
  }

  // Declared before 'activities/:id'-style routes; "activities" is its own
  // literal segment so there is no capture conflict.
  @Get('activities')
  @ApiOperation({ summary: 'All activities across customers (global feed)' })
  async getAllActivities(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('overdue') overdue?: string,
  ) {
    return await this.crmService.getAllActivities({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      type,
      status,
      overdue: overdue === 'true',
    });
  }

  @Get('customers/:id/activities')
  @ApiOperation({ summary: 'Activities for one customer' })
  async getActivities(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return await this.crmService.getActivities(id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      type,
      status,
    });
  }

  @Post('customers/:id/activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a note/task/call/email log for a customer' })
  async createActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateActivityDto,
    @Request() req,
  ) {
    const activity = await this.crmService.createActivity(
      id,
      dto,
      req.user.userId,
    );
    return {
      message: 'Activity created successfully',
      statusCode: 201,
      data: activity,
    };
  }

  @Patch('activities/:id')
  @ApiOperation({ summary: 'Update an activity' })
  async updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
  ) {
    const activity = await this.crmService.updateActivity(id, dto);
    return {
      message: 'Activity updated successfully',
      statusCode: 200,
      data: activity,
    };
  }

  @Delete('activities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an activity' })
  async removeActivity(@Param('id', ParseIntPipe) id: number) {
    await this.crmService.removeActivity(id);
    return {
      message: 'Activity deleted successfully',
      statusCode: 204,
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'CRM landing-page stats' })
  async getDashboard() {
    const stats = await this.crmService.getDashboard();
    return {
      message: 'CRM dashboard retrieved successfully',
      statusCode: 200,
      data: stats,
    };
  }
}
