import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from 'src/product/entities/product.entity';
import { WishlistService } from './wishlist.service';

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

describe('WishlistService', () => {
  let target: WishlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
      { provide: getRepositoryToken(User), useValue: createMockRepository() },
      { provide: getRepositoryToken(Wishlist), useValue: createMockRepository() },
      { provide: getRepositoryToken(WishlistItem), useValue: createMockRepository() },
      { provide: getRepositoryToken(Product), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<WishlistService>(WishlistService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
