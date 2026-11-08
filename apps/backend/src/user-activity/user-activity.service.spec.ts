import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserActivity, UserType, AuditStatus } from './entities/user-activity.entity';
import { UserActivityService } from './user-activity.service';

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

describe('UserActivityService', () => {
  let target: UserActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityService,
      { provide: getRepositoryToken(UserActivity), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<UserActivityService>(UserActivityService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
