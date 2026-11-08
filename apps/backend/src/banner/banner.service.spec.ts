import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Banner, BannerPosition, BannerType } from './entities/banner.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource, In, Repository } from 'typeorm';
import { BannerService } from './banner.service';

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

describe('BannerService', () => {
  let target: BannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
      { provide: getRepositoryToken(Banner), useValue: createMockRepository() },
      { provide: getRepositoryToken(Attachment), useValue: createMockRepository() },
      { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      { provide: DataSource, useValue: createMock() },
      ],
    }).compile();

    target = module.get<BannerService>(BannerService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
