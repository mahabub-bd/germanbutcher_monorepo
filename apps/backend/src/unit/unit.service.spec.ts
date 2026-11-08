import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { User } from 'src/user/entities/user.entity';
import { UnitsService } from './unit.service';

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

describe('UnitsService', () => {
  let target: UnitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
      { provide: getRepositoryToken(Unit), useValue: createMockRepository() },
      { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<UnitsService>(UnitsService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
