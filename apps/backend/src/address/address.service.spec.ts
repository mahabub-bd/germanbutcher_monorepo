import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { User } from 'src/user/entities/user.entity';
import { AddressesService } from './address.service';

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

describe('AddressesService', () => {
  let target: AddressesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
      { provide: getRepositoryToken(Address), useValue: createMockRepository() },
      { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
