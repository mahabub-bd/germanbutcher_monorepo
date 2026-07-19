import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DateRangePreset } from 'src/common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { TopCustomersQueryDto } from './dto/top-customers-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth('token')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Get('customers')
  @ApiOperation({
    summary: 'Retrieve all customer users with pagination and search',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, or mobile number',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order by creation date',
  })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findCustomers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('sort') sort: 'ASC' | 'DESC' = 'ASC',
  ) {
    return this.userService.findCustomers(page, limit, search, sort);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Get('users')
  @ApiOperation({
    summary:
      'Retrieve non-customer users (staff, admins, etc.) with pagination and filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter by role name (e.g., admin, staff)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, or mobile number',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order by creation date',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findOtherUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('sort') sort: 'ASC' | 'DESC' = 'ASC',
  ) {
    return this.userService.findOtherUsers(page, limit, role, search, sort);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Get('customers/top')
  @ApiOperation({
    summary: 'Get top customers by orders or spending',
    description:
      'Returns a list of top customers ranked by total orders or total spending amount. Can be filtered by time period.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top customers to return (1-100, default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['orders', 'spending'],
    description: 'Sort by total orders or total spending (default: orders)',
    example: 'orders',
  })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: ['this_month', 'last_3_months', 'last_6_months', 'last_year', 'this_year', 'all_time'],
    description: 'Filter by time period (default: all_time)',
    example: 'this_month',
  })
  @ApiResponse({
    status: 200,
    description: 'Top customers retrieved successfully',
    schema: {
      example: {
        message: 'Top customers retrieved successfully',
        statusCode: 200,
        data: [
          {
            id: 1,
            name: 'Mahabub Hossain',
            email: 'palashmahabub@gmail.com',
            mobileNumber: '+8801711852202',
            isVerified: true,
            createdAt: '2025-04-10T10:15:18.583Z',
            lastLoginAt: '2025-11-05T06:11:41.445Z',
            profilePhoto: {
              id: 31,
              url: 'https://purepacbd.s3.ap-southeast-1.amazonaws.com/photo.jpg',
            },
            statistics: {
              totalOrders: 15,
              totalSpent: 25000,
              averageOrderValue: 1666.67,
              completedOrders: 12,
              pendingOrders: 3,
            },
          },
        ],
      },
    },
  })
  async getTopCustomers(@Query() query: TopCustomersQueryDto) {
    return this.userService.findTopCustomers(query.limit, query.sortBy, query.timeFilter);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Get('reports/customer-list')
  @ApiOperation({
    summary: 'Get customer list report',
    description:
      'Returns customer list with registration date, order numbers, and order amounts. Supports custom date range or presets (today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year) based on registration date.',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    example: '2025-11-01',
    description: 'Start date (inclusive) - use with toDate for custom range',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    example: '2025-11-10',
    description: 'End date (inclusive) - use with fromDate for custom range',
  })
  @ApiQuery({
    name: 'preset',
    required: false,
    enum: DateRangePreset,
    description: 'Date range preset - use instead of fromDate/toDate',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer list report retrieved successfully',
    schema: {
      example: {
        message: 'Customer list report retrieved successfully',
        statusCode: 200,
        data: {
          from: '2025-11-01',
          to: '2025-11-10',
          summary: {
            totalCustomers: 5,
            totalOrders: 12,
            totalOrderValue: 15000.5,
          },
          customers: [
            {
              name: 'John Doe',
              email: 'john@example.com',
              mobileNumber: '+8801712345678',
              registrationDate: '2025-11-01T10:00:00.000Z',
              orderCount: 3,
              totalOrderAmount: 3750.5,
            },
          ],
        },
      },
    },
  })
  async getCustomerListReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('preset') preset?: DateRangePreset,
  ) {
    return this.userService.getCustomerListReport(fromDate, toDate, preset);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID', example: 1 })
  @ApiResponse({ status: 200, description: 'User found and returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin', 'admin')
  @Post()
  @ApiOperation({
    summary: 'Create new user',
    description: 'Register a new user account',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - email already exists or invalid data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Update an existing user account',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID', example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('superadmin')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently remove a user account',
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID', example: 1 })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({
    description: 'Mobile number for password reset request',
    schema: {
      type: 'object',
      properties: {
        mobileNumber: { type: 'string', example: '017xxxxxxxx' },
      },
      required: ['mobileNumber'],
    },
  })
  @Post('password/reset-request')
  async requestPasswordReset(
    @Body() { mobileNumber }: { mobileNumber: string },
  ) {
    return this.userService.requestPasswordReset(mobileNumber);
  }
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({
    description: 'Password reset data',
    schema: {
      type: 'object',
      properties: {
        mobileNumber: { type: 'string', example: '017xxxxxxxx' },
        otp: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: 'NewStrongPass123' },
      },
      required: ['mobileNumber', 'otp', 'newPassword'],
    },
  })
  @Post('password/reset')
  async resetPassword(
    @Body()
    {
      mobileNumber,
      otp,
      newPassword,
    }: {
      mobileNumber: string;
      otp: string;
      newPassword: string;
    },
  ) {
    return this.userService.resetPassword(mobileNumber, otp, newPassword);
  }
}
