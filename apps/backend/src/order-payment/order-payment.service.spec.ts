import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderPayment } from './entities/order-payment.entity';
import { Order } from '../order/entities/order.entity';
import { OrderPaymentMethod } from '../order-payment-method/entities/order-payment-method.entity';
import { OrderPaymentService } from './order-payment.service';

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

describe('OrderPaymentService', () => {
  let target: OrderPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderPaymentService,
      { provide: getRepositoryToken(OrderPayment), useValue: createMockRepository() },
      { provide: getRepositoryToken(Order), useValue: createMockRepository() },
      { provide: getRepositoryToken(OrderPaymentMethod), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<OrderPaymentService>(OrderPaymentService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
