import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesPointShop } from './entities/sales-point-shop.entity';
import { SalesPoint } from 'src/sales-point/entities/sales-point.entity';
import { SalesPointShopService } from './sales-point-shop.service';

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

describe('SalesPointShopService', () => {
  let target: SalesPointShopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesPointShopService,
      { provide: getRepositoryToken(SalesPointShop), useValue: createMockRepository() },
      { provide: getRepositoryToken(SalesPoint), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<SalesPointShopService>(SalesPointShopService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
