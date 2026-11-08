import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesPoint } from './entities/sales-point.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { SalesPointService } from './sales-point.service';

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

describe('SalesPointService', () => {
  let target: SalesPointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesPointService,
      { provide: getRepositoryToken(SalesPoint), useValue: createMockRepository() },
      { provide: getRepositoryToken(Attachment), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<SalesPointService>(SalesPointService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
