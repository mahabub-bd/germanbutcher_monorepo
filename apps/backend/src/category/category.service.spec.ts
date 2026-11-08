import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { CategoryService } from './category.service';

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

describe('CategoryService', () => {
  let target: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
      { provide: getRepositoryToken(Category), useValue: createMockRepository() },
      { provide: AttachmentService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
