import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { TestimonialService } from './testimonial.service';

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

describe('TestimonialService', () => {
  let target: TestimonialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestimonialService,
      { provide: getRepositoryToken(Testimonial), useValue: createMockRepository() },
      { provide: getRepositoryToken(Attachment), useValue: createMockRepository() },
      ],
    }).compile();

    target = module.get<TestimonialService>(TestimonialService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
