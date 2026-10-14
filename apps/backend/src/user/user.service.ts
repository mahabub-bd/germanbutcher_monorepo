import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

import { DeepPartial, Repository } from 'typeorm';

import { instanceToPlain } from 'class-transformer';
import { OtpService } from 'src/auth/otp.service';
import { SmsService } from 'src/auth/sms.service';
import { EmailService } from 'src/email/email.service';
import { DateRangePreset } from 'src/common/enums';
import { Role } from 'src/roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  // async findAll(
  //   page: number = 1,
  //   limit: number = 10,
  //   roleFilter?: string,
  //   search?: string,
  //   sort: 'ASC' | 'DESC' = 'ASC',
  // ): Promise<any> {
  //   const skip = (page - 1) * limit;

  //   let query = this.userRepository
  //     .createQueryBuilder('user')
  //     .leftJoinAndSelect('user.role', 'role')
  //     .leftJoinAndSelect('user.profilePhoto', 'profilePhoto')
  //     .leftJoinAndSelect('user.addresses', 'addresses')
  //     .select([
  //       'user.id',
  //       'user.name',
  //       'user.email',
  //       'user.otp',
  //       'user.otpExpiresAt',
  //       'user.mobileNumber',
  //       'user.isVerified',
  //       'user.lastLoginAt',
  //       'user.createdAt',
  //       'user.updatedAt',
  //       'role.id',
  //       'role.rolename',
  //       'role.isActive',
  //       'profilePhoto.id',
  //       'profilePhoto.url',
  //       'addresses.id',
  //       'addresses.address',
  //       'addresses.area',
  //       'addresses.division',
  //       'addresses.city',
  //       'addresses.type',
  //       'addresses.isDefault',
  //     ])
  //     .orderBy('user.createdAt', sort)
  //     .skip(skip)
  //     .take(limit);

  //   if (roleFilter) {
  //     query = query.where('role.rolename = :role', { role: roleFilter });
  //   }

  //   if (search) {
  //     query = query.andWhere(
  //       '(user.name LIKE :search OR user.email LIKE :search OR user.mobileNumber LIKE :search)',
  //       { search: `%${search}%` },
  //     );
  //   }

  //   const [users, total] = await query.getManyAndCount();

  //   const customers = users.filter((user) => user.role?.id === 3);
  //   const others = users.filter((user) => user.role?.id !== 3);

  //   return {
  //     message: 'Users retrieved successfully',
  //     statusCode: HttpStatus.OK,
  //     data: {
  //       customers: instanceToPlain(customers),
  //       others: instanceToPlain(others),
  //       pagination: {
  //         total,
  //         page,
  //         limit,
  //         totalPages: Math.ceil(total / limit),
  //       },
  //     },
  //   };
  // }
  // user.service.ts
  async findCustomers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sort: 'ASC' | 'DESC' = 'ASC',
  ): Promise<any> {
    const skip = (page - 1) * limit;

    let query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.profilePhoto', 'profilePhoto')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .leftJoinAndSelect('user.orders', 'orders')
      .leftJoinAndSelect('orders.items', 'orderItems')
      .leftJoinAndSelect('orders.shippingMethod', 'shippingMethod')
      .leftJoinAndSelect('orders.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('orders.address', 'orderAddress')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.otp',
        'user.otpExpiresAt',
        'user.mobileNumber',
        'user.isVerified',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
        'role.id',
        'role.rolename',
        'role.isActive',
        'profilePhoto.id',
        'profilePhoto.url',
        'addresses.id',
        'addresses.address',
        'addresses.area',
        'addresses.division',
        'addresses.city',
        'addresses.type',
        'addresses.isDefault',
      ])
      .where('role.id = :roleId', { roleId: 3 }) // Filter for customers
      .orderBy('user.createdAt', sort)
      .skip(skip)
      .take(limit);

    if (search) {
      query = query.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.mobileNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [customers, total] = await query.getManyAndCount();

    return {
      message: 'Customers retrieved successfully',
      statusCode: HttpStatus.OK,
      data: {
        customers: instanceToPlain(customers),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOtherUsers(
    page: number = 1,
    limit: number = 10,
    roleFilter?: string,
    search?: string,
    sort: 'ASC' | 'DESC' = 'ASC',
  ): Promise<any> {
    const skip = (page - 1) * limit;

    let query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.profilePhoto', 'profilePhoto')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.otp',
        'user.otpExpiresAt',
        'user.mobileNumber',
        'user.isVerified',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
        'role.id',
        'role.rolename',
        'role.isActive',
        'profilePhoto.id',
        'profilePhoto.url',
        'addresses.id',
        'addresses.address',
        'addresses.area',
        'addresses.division',
        'addresses.city',
        'addresses.type',
        'addresses.isDefault',
      ])
      .where('role.id != :roleId', { roleId: 3 }) // Exclude customers
      .orderBy('user.createdAt', sort)
      .skip(skip)
      .take(limit);

    if (roleFilter) {
      query = query.andWhere('role.rolename = :role', { role: roleFilter });
    }

    if (search) {
      query = query.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.mobileNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await query.getManyAndCount();

    return {
      message: 'Users retrieved successfully',
      statusCode: HttpStatus.OK,
      data: {
        users: instanceToPlain(users),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
  async findOne(
    id: number,
  ): Promise<{ message: string; statusCode: number; data: User | null }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.addresses', 'addresses')
      .leftJoinAndSelect('user.profilePhoto', 'profilePhoto')
      .leftJoinAndSelect('user.orders', 'orders', "orders.orderStatus = 'delivered'")

      .leftJoinAndSelect('orders.items', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('orders.shippingMethod', 'shippingMethod')
      .leftJoinAndSelect('orders.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('orders.address', 'orderAddress')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.mobileNumber',
        'user.isVerified',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
        'user.roleId',
        // Role fields
        'role.id',
        'role.rolename',
        'role.description',
        'role.isActive',
        // Profile photo
        'profilePhoto.id',
        'profilePhoto.url',
        'profilePhoto.fileName',
        // Addresses
        'addresses.id',
        'addresses.address',
        'addresses.area',
        'addresses.division',
        'addresses.city',
        'addresses.type',
        'addresses.isDefault',
        // Orders
        'orders.id',
        'orders.orderNo',
        'orders.orderStatus',
        'orders.paymentStatus',
        'orders.totalValue',
        'orders.totalDiscount',
        'orders.paidAmount',
        'orders.createdAt',
        'orders.updatedAt',
        // Order items
        'orderItems.id',
        'orderItems.productId',
        'orderItems.quantity',
        'orderItems.unitPrice',
        'orderItems.totalPrice',
        'orderItems.unitDiscount',
        'product.id',
        'product.name',
        'product.slug',
        // Shipping method
        'shippingMethod.id',
        'shippingMethod.name',
        'shippingMethod.cost',
        'shippingMethod.deliveryTime',
        // Payment method
        'paymentMethod.id',
        'paymentMethod.name',
        'paymentMethod.code',
        // Order address
        'orderAddress.id',
        'orderAddress.address',
        'orderAddress.area',
        'orderAddress.division',
        'orderAddress.city',
        'orderAddress.type',
      ])
      .where('user.id = :id', { id })
      .orderBy('orders.createdAt', 'DESC')
      .getOne();

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      });
    }

    return {
      message: 'Data retrieved successfully',
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  async findTopCustomers(
    limit: number = 10,
    sortBy: 'orders' | 'spending' = 'orders',
    timeFilter: string = 'all_time',
  ): Promise<{
    message: string;
    statusCode: number;
    data: any[];
  }> {
    // Calculate date range based on time filter
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (timeFilter) {
      case 'last_month':
        // Previous calendar month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this_month':
        // First day of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_3_months':
        // 3 months ago from today
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'last_6_months':
        // 6 months ago from today
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'last_year':
        // 1 year ago from today
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'this_year':
        // First day of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all_time':
      default:
        startDate = null;
        break;
    }

    const orderJoinCondition = endDate
      ? "orders.orderStatus = 'delivered' AND orders.createdAt >= :startDate AND orders.createdAt < :endDate"
      : startDate
        ? "orders.orderStatus = 'delivered' AND orders.createdAt >= :startDate"
        : "orders.orderStatus = 'delivered'";
    const orderJoinParams = startDate
      ? endDate
        ? { startDate, endDate }
        : { startDate }
      : undefined;

    // Build the base query
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin('user.orders', 'orders', orderJoinCondition, orderJoinParams)
      .leftJoin('user.profilePhoto', 'profilePhoto')
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('user.email', 'email')
      .addSelect('user.mobileNumber', 'mobileNumber')
      .addSelect('user.isVerified', 'isVerified')
      .addSelect('user.createdAt', 'createdAt')
      .addSelect('user.lastLoginAt', 'lastLoginAt')
      .addSelect('profilePhoto.id', 'profilePhotoId')
      .addSelect('profilePhoto.url', 'profilePhotoUrl')
      .addSelect('COUNT(DISTINCT orders.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(orders.totalValue), 0)', 'totalSpent')
      .addSelect('COALESCE(AVG(orders.totalValue), 0)', 'averageOrderValue')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN orders.orderStatus = 'delivered' THEN orders.id END)`,
        'completedOrders',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN orders.orderStatus = 'pending' THEN orders.id END)`,
        'pendingOrders',
      )
      .where('role.id = :roleId', { roleId: 3 })
      .groupBy('user.id')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .addGroupBy('user.mobileNumber')
      .addGroupBy('user.isVerified')
      .addGroupBy('user.createdAt')
      .addGroupBy('user.lastLoginAt')
      .addGroupBy('profilePhoto.id')
      .addGroupBy('profilePhoto.url');

    // Add ordering based on sortBy parameter
    if (sortBy === 'orders') {
      baseQuery.orderBy('COUNT(DISTINCT orders.id)', 'DESC');
    } else {
      baseQuery.orderBy('COALESCE(SUM(orders.totalValue), 0)', 'DESC');
    }

    baseQuery.limit(limit);

    const rawResults = await baseQuery.getRawMany();

    const topCustomers = rawResults.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      mobileNumber: row.mobileNumber,
      isVerified: row.isVerified,
      createdAt: row.createdAt,
      lastLoginAt: row.lastLoginAt,
      profilePhoto: row.profilePhotoId
        ? {
            id: row.profilePhotoId,
            url: row.profilePhotoUrl,
          }
        : null,
      statistics: {
        totalOrders: parseInt(row.totalOrders) || 0,
        totalSpent: parseFloat(row.totalSpent) || 0,
        averageOrderValue: parseFloat(row.averageOrderValue) || 0,
        completedOrders: parseInt(row.completedOrders) || 0,
        pendingOrders: parseInt(row.pendingOrders) || 0,
      },
    }));

    const timeFilterText = timeFilter !== 'all_time'
      ? ` for ${timeFilter.replace(/_/g, ' ')}`
      : '';

    return {
      message: `Top customers retrieved successfully${timeFilterText}`,
      statusCode: HttpStatus.OK,
      data: topCustomers,
    };
  }

  async getCustomerListReport(
    fromDate?: string,
    toDate?: string,
    dateRangePreset?: DateRangePreset,
  ) {
    // --- Helper function to get date range from preset ---
    const getDateRangeFromPreset = (
      preset: DateRangePreset,
    ): { from: Date; to: Date } | null => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      switch (preset) {
        case DateRangePreset.TODAY:
          return { from: startOfDay, to: endOfDay };

        case DateRangePreset.THIS_WEEK: {
          const dayOfWeek = today.getDay();
          const from = new Date(today);
          from.setDate(today.getDate() - dayOfWeek);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case DateRangePreset.LAST_WEEK: {
          const dayOfWeek = today.getDay();
          const from = new Date(today);
          from.setDate(today.getDate() - dayOfWeek - 7);
          from.setHours(0, 0, 0, 0);
          const to = new Date(from);
          to.setDate(from.getDate() + 6);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }

        case DateRangePreset.THIS_MONTH: {
          const from = new Date(now.getFullYear(), now.getMonth(), 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case DateRangePreset.LAST_MONTH: {
          const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          from.setHours(0, 0, 0, 0);
          const to = new Date(now.getFullYear(), now.getMonth(), 0);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }

        case DateRangePreset.LAST_3_MONTHS: {
          const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case DateRangePreset.LAST_6_MONTHS: {
          const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        case DateRangePreset.LAST_YEAR: {
          const from = new Date(now.getFullYear() - 1, 0, 1);
          from.setHours(0, 0, 0, 0);
          const to = new Date(now.getFullYear() - 1, 11, 31);
          to.setHours(23, 59, 59, 999);
          return { from, to };
        }

        case DateRangePreset.THIS_YEAR: {
          const from = new Date(now.getFullYear(), 0, 1);
          from.setHours(0, 0, 0, 0);
          return { from, to: endOfDay };
        }

        default:
          return null;
      }
    };

    // --- Determine date range ---
    let from: Date | undefined;
    let to: Date | undefined;

    // Use date range preset if provided
    if (dateRangePreset) {
      const presetRange = getDateRangeFromPreset(dateRangePreset);
      if (presetRange) {
        from = presetRange.from;
        to = presetRange.to;
      } else {
        throw new Error(
          `Invalid date range preset: "${dateRangePreset}". Valid values are: today, this_week, last_week, this_month, last_month, last_3_months, last_6_months, last_year, this_year.`,
        );
      }
    } else {
      // Parse and validate date inputs
      const parseDate = (
        dateStr?: string,
        endOfDay = false,
      ): Date | undefined => {
        if (!dateStr) return undefined;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: "${dateStr}". Use YYYY-MM-DD.`);
        }
        if (endOfDay) date.setHours(23, 59, 59, 999);
        return date;
      };

      from = parseDate(fromDate);
      to = parseDate(toDate, true);
    }

    // --- Build query ---
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .leftJoin('user.orders', 'orders')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.mobileNumber',
        'user.createdAt',
        'orders.id',
        'orders.orderNo',
        'orders.totalValue',
      ])
      .where('role.id = :roleId', { roleId: 3 }) // Filter for customers only
      .orderBy('user.id', 'DESC');

    // Apply date range filters on registration date
    if (from && to) {
      query.andWhere('user.createdAt BETWEEN :from AND :to', { from, to });
    } else if (from) {
      query.andWhere('user.createdAt >= :from', { from });
    } else if (to) {
      query.andWhere('user.createdAt <= :to', { to });
    }

    const users = await query.getMany();

    // --- Transform data ---
    const customerList = users.map((user) => {
      const orders = user.orders || [];
      const orderCount = orders.length;
      const totalOrderAmount = orders.reduce(
        (sum, order) => sum + Number(order.totalValue || 0),
        0,
      );

      return {
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        registrationDate: user.createdAt,
        orderCount,
        totalOrderAmount: Math.round(totalOrderAmount * 100) / 100,
      };
    });

    // --- Aggregate summary ---
    const totalCustomers = users.length;
    const totalOrders = customerList.reduce((sum, c) => sum + c.orderCount, 0);
    const totalOrderValue = customerList.reduce(
      (sum, c) => sum + c.totalOrderAmount,
      0,
    );

    return {
      message: 'Customer list report retrieved successfully',
      statusCode: HttpStatus.OK,
      data: {
        from: from ? from.toISOString().split('T')[0] : null,
        to: to ? to.toISOString().split('T')[0] : null,
        summary: {
          totalCustomers,
          totalOrders,
          totalOrderValue: Math.round(totalOrderValue * 100) / 100,
        },
        customers: customerList,
      },
    };
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ message: string; statusCode: number; data: User }> {
    const { email, name, password, mobileNumber } = createUserDto;

    let roleId = createUserDto.roleId ? Number(createUserDto.roleId) : null;

    if (!roleId || isNaN(roleId)) {
      roleId = 3;
    }

    let role = await this.validateRole(roleId);
    if (!role) {
      if (roleId !== 3) {
        roleId = 3;
        role = await this.validateRole(3);
      }

      if (!role) {
        throw new NotFoundException({
          message: 'Default role not found',
          statusCode: 404,
          data: null,
        });
      }
    }

    const existingUserByEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new BadRequestException({
        message: 'Email already exists',
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
      });
    }

    // Check for existing mobile number
    const existingUserByMobile = await this.userRepository.findOne({
      where: { mobileNumber },
    });

    if (existingUserByMobile) {
      throw new BadRequestException({
        message: 'Mobile number already registered',
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = this.userRepository.create({
      email,
      name,
      mobileNumber,
      role,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    return {
      message: 'User created successfully',
      statusCode: HttpStatus.CREATED,
      data: savedUser,
    };
  }
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; statusCode: number; data: User }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      });
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new BadRequestException({
          message: 'Email already exists',
          statusCode: HttpStatus.BAD_REQUEST,
          data: null,
        });
      }
    }

    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    const updateData: DeepPartial<User> = {
      ...updateUserDto,
    };

    // profilePhoto is an eager relation owning the profilePhotoId FK —
    // setting the scalar alone is clobbered by the loaded relation on save.
    // Assign the relation (or null to clear) instead.
    if (updateUserDto.profilePhotoId !== undefined) {
      if (updateUserDto.profilePhotoId === null) {
        updateData.profilePhoto = null;
      } else {
        const attachment = await this.userRepository.manager
          .getRepository('Attachment')
          .findOne({ where: { id: updateUserDto.profilePhotoId } });
        if (!attachment) {
          throw new BadRequestException({
            message: `Attachment with ID ${updateUserDto.profilePhotoId} not found`,
            statusCode: HttpStatus.BAD_REQUEST,
            data: null,
          });
        }
        updateData.profilePhoto = attachment as any;
      }
    }

    const updatedUser = this.userRepository.merge(user, updateData);
    await this.userRepository.save(updatedUser);

    // Reload: save() does not refresh the eager profilePhoto relation, so
    // the returned entity would carry the previous photo.
    const freshUser = await this.userRepository.findOne({
      where: { id: user.id },
    });
    if (!freshUser) {
      throw new NotFoundException({
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      });
    }

    // Never return credential / verification fields.
    const { password, otp, otpExpiresAt, ...safeUser } = freshUser;

    return {
      message: 'User updated successfully',
      statusCode: 200,
      data: safeUser as User,
    };
  }
  /**
   * Change the authenticated user's own password, verifying the current one.
   * The password column is select:false, so it is pulled explicitly.
   */
  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string; statusCode: number; data: null }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();

    if (!user || !user.password) {
      throw new NotFoundException({
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new BadRequestException({
        message: 'Current password is incorrect',
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
      });
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (isSameAsCurrent) {
      throw new BadRequestException({
        message: 'New password must be different from the current password',
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Fire-and-forget security confirmation — never blocks or fails the change.
    void this.emailService.sendPasswordChangedEmail({
      name: user.name,
      email: user.email,
      changedAt: new Date(),
    });

    return {
      message: 'Password changed successfully',
      statusCode: 200,
      data: null,
    };
  }

  async remove(id: number): Promise<{ message: string; statusCode: number }> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException({
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return {
      message: 'User deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async findByEmail(email: string): Promise<{
    message: string;
    statusCode: number;
    data: User | null;
  }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      return {
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      };
    }
    return {
      message: 'User found',
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // Include password explicitly
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .getOne();
  }
  async updateLastLogin(id: number): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async findByMobileNumber(mobile: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { mobileNumber: mobile },
      relations: ['role'],
    });

    return user;
  }
  async requestPasswordReset(
    mobileNumber: string,
    clientIp?: string,
  ): Promise<{ message: string; statusCode: number }> {
    const user = await this.findByMobileNumber(mobileNumber);
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    // Per-number cooldown: block resends within 60s of the last OTP send.
    // otpExpiresAt = lastSentAt + validity, so derive lastSentAt from it.
    const lastSentAt = user.otpExpiresAt
      ? new Date(user.otpExpiresAt).getTime() - this.otpService.getOtpValidityMs()
      : 0;
    if (Date.now() - lastSentAt < 60 * 1000) {
      this.logger.warn(
        `[PASSWORD-RESET] Resend blocked by 60s cooldown for ${mobileNumber} (IP: ${clientIp ?? 'unknown'})`,
      );
      return {
        message: 'A reset code was already sent. Please wait a minute before requesting again.',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      };
    }

    const otp = this.otpService.generateOtp();
    const otpExpiresAt = this.otpService.getOtpExpiration();

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await this.userRepository.save(user);

    const message = `Your German Butcher password reset code: ${otp}. Valid for 5 minutes. Thank you`;
    await this.smsService.sendSms(mobileNumber, message, 'PASSWORD-RESET');

    // Same code via email so the reset works even when SMS is undeliverable.
    if (user.email) {
      void this.emailService.sendPasswordResetOtpEmail({
        name: user.name,
        email: user.email,
        otp,
        expiresAt: otpExpiresAt,
      });
    }

    return {
      message: 'OTP has been sent to your mobile number and email',
      statusCode: HttpStatus.OK,
    };
  }

  async resetPassword(
    mobileNumber: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string; statusCode: number }> {
    const user = await this.findByMobileNumber(mobileNumber);
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException({
        message: 'OTP not generated for this user',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const isValid = this.otpService.verifyOtp(user.otp, otp, user.otpExpiresAt);
    if (!isValid) {
      throw new BadRequestException({
        message: 'Invalid OTP or expired',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiresAt = null;

    await this.userRepository.save(user);

    // Security confirmation via both channels — fire-and-forget so a mail/SMS
    // outage never fails the reset itself.
    if (user.email) {
      void this.emailService.sendPasswordChangedEmail({
        name: user.name,
        email: user.email,
        changedAt: new Date(),
      });
    }
    void this.smsService.sendSms(
      mobileNumber,
      'Your German Butcher account password has been reset successfully. If this was not you, contact support immediately.',
      'PASSWORD-RESET',
    );

    return {
      message: 'Password has been reset successfully',
      statusCode: HttpStatus.OK,
    };
  }

  private async validateRole(id: number): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }
}
