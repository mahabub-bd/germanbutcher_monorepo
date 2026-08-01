import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MobileLoginDto, VerifyOtpDto } from './dto/mobile-login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
@ApiBearerAuth('token')
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account and returns authentication tokens',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      example: {
        message: 'User registered successfully',
        statusCode: 201,
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            name: 'John Doe',
            mobileNumber: '+8801712345678',
          },
          tokens: {
            accessToken: 'jwt.access.token',
            refreshToken: 'jwt.refresh.token',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Email already exists or invalid data',
    schema: {
      example: {
        message: 'Email already exists',
        statusCode: 400,
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.userService.create(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user and returns JWT tokens',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      example: {
        message: 'Login successful',
        statusCode: 200,
        data: {
          accessToken: 'jwt.access.token',
          refreshToken: 'jwt.refresh.token',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid credentials',
    schema: {
      example: {
        message: 'Invalid credentials',
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() loginDto: LoginDto, @Req() req) {
    return this.authService.login(loginDto, req);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('refresh-token') // Specifies this endpoint requires refresh token
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Generates new access and refresh tokens using valid refresh token',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        message: 'Tokens refreshed successfully',
        statusCode: 200,
        data: {
          accessToken: 'new.jwt.access.token',
          refreshToken: 'new.jwt.refresh.token',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or expired refresh token',
    schema: {
      example: {
        message: 'Invalid refresh token',
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  async refresh(@Req() req) {
    return this.authService.refreshTokens(req.user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('token') // Specifies this endpoint requires access token
  @ApiOperation({
    summary: 'User logout',
    description:
      'Invalidates the current access token (client should discard tokens)',
  })
  @ApiOkResponse({
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logout successful',
        statusCode: 200,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing access token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  async logout(@Req() req) {
    // Log logout activity
    const user = req.user;
    if (user && user.userId) {
      try {
        await this.authService.logLogout(user.userId, req);
      } catch (error) {
        console.error('Failed to log logout activity:', error);
      }
    }

    return {
      message: 'Logout successful',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('token')
  @ApiOperation({
    summary: 'Validate token',
    description: 'Checks if the current access token is valid',
  })
  @ApiOkResponse({
    description: 'Token is valid',
    schema: {
      example: {
        message: 'Token is valid',
        statusCode: 200,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or expired token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
        error: 'Unauthorized',
      },
    },
  })
  async validate() {
    return {
      message: 'Token is valid',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('mobile-login')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 OTPs per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate mobile login',
    description: 'Sends OTP to the provided mobile number',
  })
  @ApiBody({ type: MobileLoginDto })
  @ApiOkResponse({
    description: 'OTP sent successfully',
    schema: {
      example: {
        message: 'OTP sent successfully',
        statusCode: 200,
        data: {
          mobileNumber: '+8801712345678',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid mobile number',
  })
  async initiateMobileLogin(@Body() { mobileNumber }: MobileLoginDto) {
    return this.authService.initiateMobileLogin(mobileNumber);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verifies OTP and returns authentication tokens',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({
    description: 'Mobile login successful',
    schema: {
      example: {
        message: 'Mobile login successful',
        statusCode: 200,
        data: {
          accessToken: 'jwt.access.token',
          refreshToken: 'jwt.refresh.token',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid OTP',
  })
  async verifyOtp(@Body() { mobileNumber, otp, name }: VerifyOtpDto, @Req() req) {
    if (!mobileNumber || !otp) {
      throw new BadRequestException({
        message: 'Mobile number and OTP are required',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    return this.authService.verifyMobileOtp(mobileNumber, otp, req, name);
  }
}
