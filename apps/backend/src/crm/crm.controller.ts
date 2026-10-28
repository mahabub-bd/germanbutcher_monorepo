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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { CrmService } from './crm.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CrmCustomersQueryDto } from './dto/crm-customers-query.dto';

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

  @Get('customers/:id')
  @ApiOperation({ summary: 'Customer 360 view' })
  async getCustomer360(@Param('id', ParseIntPipe) id: number) {
    const result = await this.crmService.getCustomer360(id);
    return result;
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
