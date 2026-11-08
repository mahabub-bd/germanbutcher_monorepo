import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShippingMethod } from './entities/shipping-method.entity';
import { ShippingMethodsService } from './shipping-methods.service';

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

describe('ShippingMethodsService', () => {
  let target: ShippingMethodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingMethodsService,
      { provide: getRepositoryToken(ShippingMethod), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<ShippingMethodsService>(ShippingMethodsService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
