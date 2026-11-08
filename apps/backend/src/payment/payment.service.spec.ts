import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { PaymentMethod } from 'src/payment-method/entities/payment-method.entity';
import { PaymentService } from './payment.service';

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

describe('PaymentService', () => {
  let target: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
      { provide: getRepositoryToken(Payment), useValue: createMockRepository() },
      { provide: getRepositoryToken(Purchase), useValue: createMockRepository() },
      { provide: getRepositoryToken(PaymentMethod), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
