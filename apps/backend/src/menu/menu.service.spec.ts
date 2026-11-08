import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { MenuService } from './menu.service';

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

describe('MenuService', () => {
  let target: MenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
      { provide: getRepositoryToken(Menu), useValue: createMockRepository() },
      { provide: getRepositoryToken(Menu), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
