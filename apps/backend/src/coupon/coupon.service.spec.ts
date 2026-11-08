import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Product } from 'src/product/entities/product.entity';
import { CouponService } from './coupon.service';

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

describe('CouponService', () => {
  let target: CouponService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
      { provide: getRepositoryToken(Coupon), useValue: createMockRepository() },
      { provide: getRepositoryToken(Product), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<CouponService>(CouponService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
