import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactMessageReply, ReplySenderType } from './entities/contact-message-reply.entity';
import { EmailService } from 'src/email/email.service';
import { NotificationService } from 'src/notification/notification.service';
import { ContactMessageService } from './contact-message.service';

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

describe('ContactMessageService', () => {
  let target: ContactMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactMessageService,
      { provide: getRepositoryToken(ContactMessage), useValue: createMockRepository() },
      { provide: getRepositoryToken(ContactMessageReply), useValue: createMockRepository() },
      { provide: EmailService, useValue: createMock() },
      { provide: NotificationService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<ContactMessageService>(ContactMessageService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
