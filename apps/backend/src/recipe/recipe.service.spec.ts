import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { Category } from 'src/category/entities/category.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { RecipeService } from './recipe.service';

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

describe('RecipeService', () => {
  let target: RecipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeService,
      { provide: getRepositoryToken(Recipe), useValue: createMockRepository() },
      { provide: getRepositoryToken(Category), useValue: createMockRepository() },
      { provide: AttachmentService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<RecipeService>(RecipeService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
