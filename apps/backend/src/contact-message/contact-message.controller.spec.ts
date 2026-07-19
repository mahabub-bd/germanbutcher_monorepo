import { Test, TestingModule } from '@nestjs/testing';
import { ContactMessageController } from './contact-message.controller';
import { ContactMessageService } from './contact-message.service';

describe('ContactMessageController', () => {
  let controller: ContactMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactMessageController],
      providers: [ContactMessageService],
    }).compile();

    controller = module.get<ContactMessageController>(ContactMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
