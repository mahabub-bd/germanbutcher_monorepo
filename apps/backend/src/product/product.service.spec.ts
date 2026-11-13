import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Brand } from 'src/brand/entities/brand.entity';
import { Gallery } from 'src/gallery/entities/gallery.entity';
import { Category } from 'src/category/entities/category.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { FlashSaleCampaignsService } from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
import { BogoCampaignsService } from 'src/bogo-campaigns/bogo-campaigns.service';
import { ProductHistoryService } from 'src/product-history/product-history.service';
import { StockMovementService } from 'src/stock-movement/stock-movement.service';
import { ProductService } from './product.service';

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

describe('ProductService', () => {
  let target: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
      { provide: getRepositoryToken(Product), useValue: createMockRepository() },
      { provide: getRepositoryToken(Brand), useValue: createMockRepository() },
      { provide: getRepositoryToken(Gallery), useValue: createMockRepository() },
      { provide: getRepositoryToken(Category), useValue: createMockRepository() },
      { provide: getRepositoryToken(Supplier), useValue: createMockRepository() },
      { provide: getRepositoryToken(Unit), useValue: createMockRepository() },
      { provide: getRepositoryToken(Attachment), useValue: createMockRepository() },
      { provide: AttachmentService, useValue: createMock() },
      { provide: FlashSaleCampaignsService, useValue: createMock() },
      { provide: BogoCampaignsService, useValue: createMock() },
      { provide: ProductHistoryService, useValue: createMock() },
      { provide: StockMovementService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
