import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Product } from '../product/entities/product.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { StockMovementService } from 'src/stock-movement/stock-movement.service';
import { PurchasesService } from './purchase.service';

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

describe('PurchasesService', () => {
  let target: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
      { provide: getRepositoryToken(Purchase), useValue: createMockRepository() },
      { provide: getRepositoryToken(PurchaseItem), useValue: createMockRepository() },
      { provide: getRepositoryToken(Product), useValue: createMockRepository() },
      { provide: getRepositoryToken(Supplier), useValue: createMockRepository() },
      { provide: StockMovementService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<PurchasesService>(PurchasesService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
