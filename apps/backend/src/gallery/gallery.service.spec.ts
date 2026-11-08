import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Gallery } from './entities/gallery.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { GalleryService } from './gallery.service';

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

describe('GalleryService', () => {
  let target: GalleryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryService,
      { provide: getRepositoryToken(Gallery), useValue: createMockRepository() },
      { provide: AttachmentService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<GalleryService>(GalleryService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
