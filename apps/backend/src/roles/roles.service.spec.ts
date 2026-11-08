import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { User } from 'src/user/entities/user.entity';
import { RolesService } from './roles.service';

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

describe('RolesService', () => {
  let target: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
      { provide: getRepositoryToken(Role), useValue: createMockRepository() },
      { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
