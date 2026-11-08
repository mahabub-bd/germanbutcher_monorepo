import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';
import { OtpService } from 'src/auth/otp.service';
import { SmsService } from 'src/auth/sms.service';
import { EmailService } from 'src/email/email.service';
import { UserService } from './user.service';

const createMock = () => ({});

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  merge: jest.fn((...args) => Object.assign({}, ...args)),
});

describe('UserService', () => {
  let target: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
      { provide: getRepositoryToken(User), useValue: createMockRepository() },
      { provide: getRepositoryToken(Role), useValue: createMockRepository() },
      { provide: OtpService, useValue: createMock() },
      { provide: SmsService, useValue: createMock() },
      { provide: EmailService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
