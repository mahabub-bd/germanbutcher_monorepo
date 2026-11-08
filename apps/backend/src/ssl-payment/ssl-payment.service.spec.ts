import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from 'src/order/entities/order.entity';
import { OrderPayment } from 'src/order-payment/entities/order-payment.entity';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { OrderPaymentService } from 'src/order-payment/order-payment.service';
import { AuditStatus, UserActivityService, UserType } from 'src/user-activity/user-activity.service';
import { SslPaymentService } from './ssl-payment.service';

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

describe('SslPaymentService', () => {
  let target: SslPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SslPaymentService,
      { provide: ConfigService, useValue: createMock() },
      { provide: getRepositoryToken(Order), useValue: createMockRepository() },
      { provide: getRepositoryToken(OrderPayment), useValue: createMockRepository() },
      { provide: getRepositoryToken(OrderPaymentMethod), useValue: createMockRepository() },
      { provide: OrderPaymentService, useValue: createMock() },
      { provide: UserActivityService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<SslPaymentService>(SslPaymentService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
