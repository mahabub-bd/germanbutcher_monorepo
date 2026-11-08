import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenuPermission } from './entities/menu-permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { MenuPermissionService } from './menu-permission.service';

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

describe('MenuPermissionService', () => {
  let target: MenuPermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuPermissionService,
      { provide: getRepositoryToken(MenuPermission), useValue: createMockRepository() },
      { provide: getRepositoryToken(Role), useValue: createMockRepository() },
      { provide: getRepositoryToken(Menu), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<MenuPermissionService>(MenuPermissionService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
