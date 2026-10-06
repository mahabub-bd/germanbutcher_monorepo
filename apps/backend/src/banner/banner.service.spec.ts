import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Attachment } from '../attachment/entities/attachment.entity';
import { BannerService } from './banner.service';
import { Banner } from './entities/banner.entity';

describe('BannerService', () => {
  let service: BannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        {
          provide: getRepositoryToken(Banner),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Attachment),
          useValue: {},
        },
        {
          provide: CACHE_MANAGER,
          useValue: { del: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BannerService>(BannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
