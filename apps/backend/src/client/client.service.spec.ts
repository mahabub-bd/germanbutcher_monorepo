import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { AttachmentService } from 'src/attachment/attachment.service';
import { ClientService } from './client.service';

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

describe('ClientService', () => {
  let target: ClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
      { provide: getRepositoryToken(Client), useValue: createMockRepository() },
      { provide: getRepositoryToken(Attachment), useValue: createMockRepository() },
      { provide: AttachmentService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<ClientService>(ClientService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
