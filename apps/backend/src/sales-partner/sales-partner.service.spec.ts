import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesPartner } from './entities/sales-partner.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { SalesPartnerService } from './sales-partner.service';

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

describe('SalesPartnerService', () => {
  let target: SalesPartnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesPartnerService,
      { provide: getRepositoryToken(SalesPartner), useValue: createMockRepository() },
      { provide: getRepositoryToken(Attachment), useValue: createMockRepository() },
      { provide: AttachmentService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<SalesPartnerService>(SalesPartnerService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
