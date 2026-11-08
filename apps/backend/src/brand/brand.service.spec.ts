import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { BrandService } from './brand.service';

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

describe('BrandService', () => {
  let target: BrandService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
      { provide: getRepositoryToken(Brand), useValue: createMockRepository() },
      { provide: AttachmentService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<BrandService>(BrandService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
