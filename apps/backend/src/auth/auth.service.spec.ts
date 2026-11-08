import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserActivityService } from '../user-activity/user-activity.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';

const createMock = () => ({});


describe('AuthService', () => {
  let target: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
      { provide: UserService, useValue: createMock() },
      { provide: JwtService, useValue: createMock() },
      { provide: ConfigService, useValue: createMock() },
      { provide: OtpService, useValue: createMock() },
      { provide: SmsService, useValue: createMock() },
      { provide: UserActivityService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
