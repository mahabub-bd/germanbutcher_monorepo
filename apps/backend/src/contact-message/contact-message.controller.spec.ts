import { Test, TestingModule } from '@nestjs/testing';
import { ContactMessageService } from './contact-message.service';
import { ContactMessageController } from './contact-message.controller';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('ContactMessageController', () => {
  let target: ContactMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactMessageController],
      providers: [
        ContactMessageController,
      { provide: ContactMessageService, useValue: createMock() },
      ],
    })
      .overrideGuard(OptionalJwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<ContactMessageController>(ContactMessageController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
