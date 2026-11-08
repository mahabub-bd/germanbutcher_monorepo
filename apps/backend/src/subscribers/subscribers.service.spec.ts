import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { SubscribersService } from './subscribers.service';

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

describe('SubscribersService', () => {
  let target: SubscribersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscribersService,
      { provide: getRepositoryToken(Subscriber), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<SubscribersService>(SubscribersService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
