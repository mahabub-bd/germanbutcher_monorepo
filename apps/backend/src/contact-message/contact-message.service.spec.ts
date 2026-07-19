import { Test, TestingModule } from '@nestjs/testing';
import { ContactMessageService } from './contact-message.service';

describe('ContactMessageService', () => {
  let service: ContactMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactMessageService],
    }).compile();

    service = module.get<ContactMessageService>(ContactMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
