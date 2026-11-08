import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from 'src/product/entities/product.entity';
import { FlashSaleCampaignsService } from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
import { BogoCampaignsService } from 'src/bogo-campaigns/bogo-campaigns.service';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { CartService } from './cart.service';

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

describe('CartService', () => {
  let target: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
      { provide: getRepositoryToken(User), useValue: createMockRepository() },
      { provide: getRepositoryToken(Cart), useValue: createMockRepository() },
      { provide: getRepositoryToken(CartItem), useValue: createMockRepository() },
      { provide: getRepositoryToken(Product), useValue: createMockRepository() },
      { provide: FlashSaleCampaignsService, useValue: createMock() },
      { provide: BogoCampaignsService, useValue: createMock() },
      { provide: EmailService, useValue: createMock() },
      { provide: ConfigService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
