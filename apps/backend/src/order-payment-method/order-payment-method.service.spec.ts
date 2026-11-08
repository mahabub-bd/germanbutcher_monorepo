import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderPaymentMethod } from './entities/order-payment-method.entity';
import { OrderPaymentMethodService } from './order-payment-method.service';

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

describe('OrderPaymentMethodService', () => {
  let target: OrderPaymentMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderPaymentMethodService,
      { provide: getRepositoryToken(OrderPaymentMethod), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<OrderPaymentMethodService>(OrderPaymentMethodService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
