import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';

import { User } from 'src/user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { TokensDto } from './dto/tokens.dto';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';
import { UserActivityService, UserType, AuditStatus } from '../user-activity/user-activity.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
    private readonly userActivityService: UserActivityService,
  ) {}

  // async validateUser(email: string, password: string): Promise<User> {
  //   const user = await this.userService.findByEmailWithPassword(email);

  //   if (!user) {
  //     throw new UnauthorizedException({
  //       message: 'Invalid credentials',
  //       statusCode: HttpStatus.UNAUTHORIZED,
  //     });
  //   }

  //   const passwordValid = await argon2.verify(user.password, password);
  //   if (!passwordValid) {
  //     throw new UnauthorizedException({
  //       message: 'Invalid credentials',
  //       statusCode: HttpStatus.UNAUTHORIZED,
  //     });
  //   }

  //   return user;
  // }
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    return user;
  }
  // auth.service.ts
  async login(loginDto: LoginDto, req?: any): Promise<{
    message: string;
    statusCode: number;
    data: TokensDto;
  }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const sanitizedUser = this.sanitizeUser(user);

    const tokens = await this.generateTokens(sanitizedUser as User);
    await this.userService.updateLastLogin(user.id);

    // Log login activity
    await this.logLoginActivity(user, req);

    return {
      message: 'Login successful',
      statusCode: HttpStatus.OK,
      data: tokens,
    };
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, otp, otpExpiresAt, ...sanitized } = user;
    return sanitized;
  }

  async refreshTokens(refreshToken: string): Promise<{
    message: string;
    statusCode: number;
    data: TokensDto;
  }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (!payload.sub || isNaN(payload.sub)) {
        throw new UnauthorizedException({
          message: 'Invalid token payload',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      }

      const { data: user } = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException({
          message: 'User not found',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      }

      const tokens = await this.generateTokens(user);
      return {
        message: 'Tokens refreshed successfully',
        statusCode: HttpStatus.OK,
        data: tokens,
      };
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
  }

  private async generateTokens(user: User): Promise<TokensDto> {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      roles: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async initiateMobileLogin(mobileNumber: string): Promise<{
    message: string;
    statusCode: number;
    data: { mobileNumber: string };
  }> {
    if (!this.isValidMobileNumber(mobileNumber)) {
      throw new BadRequestException({
        message: 'Invalid mobile number format',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    let user = await this.userService.findByMobileNumber(mobileNumber);

    if (!user) {
      try {
        const { data: newUser } = await this.userService.create({
          mobileNumber,
          name: `${mobileNumber}`,
          email: `${mobileNumber}@email.com`,
          password: 'Password',
        });
        
        user = newUser;
      } catch (error) {
        throw new BadRequestException({
          message: 'Failed to create user account',
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }
    }

    const otp = this.otpService.generateOtp();
    const otpExpiresAt = this.otpService.getOtpExpiration();

    try {
      await this.userService.update(user.id, {
        otp,
        otpExpiresAt,
      });
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to generate OTP',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const message = `Your German Butcher sign-in code: ${otp}. Valid for 5 minutes. Thank you`;
    await this.smsService.sendSms(mobileNumber, message);

    return {
      message: 'OTP sent successfully',
      statusCode: HttpStatus.OK,
      data: { mobileNumber },
    };
  }

  async verifyMobileOtp(
    mobileNumber: string,
    otp: string,
    req?: any,
  ): Promise<{
    message: string;
    statusCode: number;
    data: TokensDto & { user: Partial<User> };
  }> {
    if (!this.isValidMobileNumber(mobileNumber)) {
      throw new BadRequestException({
        message: 'Invalid mobile number format',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException({
        message: 'OTP must be 6 digits',
        statusCode: 400,
      });
    }

    const user = await this.userService.findByMobileNumber(mobileNumber);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Mobile number not registered',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new UnauthorizedException({
        message: 'No OTP requested for this mobile number',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const isValid = this.otpService.verifyOtp(user.otp, otp, user.otpExpiresAt);

    if (!isValid) {
      throw new UnauthorizedException({
        message: 'Invalid OTP',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const data = await this.userService.update(user.id, {
      otp: null,
      otpExpiresAt: null,
      isVerified: true,
    });

    if (!data) {
      throw new BadRequestException({
        message: 'Failed to verify OTP',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    const sanitizedUser = this.sanitizeUser(user);

    const tokens = await this.generateTokens(sanitizedUser as User);

    await this.userService.updateLastLogin(user.id);

    // Log mobile login activity
    await this.logLoginActivity(user, req, 'mobile');

    const userResponse = {
      id: user.id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      roles: user.role,
      isVerified: true,
    };

    return {
      message: 'Mobile login successful',
      statusCode: HttpStatus.OK,
      data: {
        ...tokens,
        user: userResponse,
      },
    };
  }

  private isValidMobileNumber(mobileNumber: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(mobileNumber);
  }

  async logLogout(userId: number, req?: any): Promise<void> {
    try {
      if (!userId || isNaN(userId)) {
        console.warn('Invalid userId provided for logout logging');
        return;
      }

      const user = await this.userService.findOne(userId);
      if (!user || !user.data) {
        return;
      }

      await this.logLogoutActivity(user.data, req);
    } catch (error) {
      console.error('Failed to log logout activity:', error);
    }
  }

  private async logLoginActivity(user: User, req?: any, loginMethod: 'email' | 'mobile' = 'email'): Promise<void> {
    try {
      // Determine user type based on roleId
      const adminRoleIds = [1, 2, 4, 8, 9];
      const userType = adminRoleIds.includes(user.roleId) ? UserType.ADMIN : UserType.CUSTOMER;

      const loginIdentifier = loginMethod === 'mobile' ? user.mobileNumber : user.email;

      await this.userActivityService.logAction({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'auth',
        entityId: user.id,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.headers?.['user-agent'],
        requestId: req?.headers?.['x-request-id'],
        sessionId: req?.sessionID || req?.headers?.['x-session-id'],
        userType,
        status: AuditStatus.SUCCESS,
        message: `User ${loginIdentifier} logged in successfully via ${loginMethod}`,
        newValue: { loginMethod },
      });
    } catch (error) {
      console.error('Failed to log login activity:', error);
    }
  }

  private async logLogoutActivity(user: User, req?: any): Promise<void> {
    try {
      // Determine user type based on roleId
      const adminRoleIds = [1, 2, 4, 8, 9];
      const userType = adminRoleIds.includes(user.roleId) ? UserType.ADMIN : UserType.CUSTOMER;

      await this.userActivityService.logAction({
        userId: user.id,
        action: 'LOGOUT',
        entityType: 'auth',
        entityId: user.id,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.headers?.['user-agent'],
        requestId: req?.headers?.['x-request-id'],
        sessionId: req?.sessionID || req?.headers?.['x-session-id'],
        userType,
        status: AuditStatus.SUCCESS,
        message: `User ${user.email} logged out`,
      });
    } catch (error) {
      console.error('Failed to log logout activity:', error);
    }
  }
}
