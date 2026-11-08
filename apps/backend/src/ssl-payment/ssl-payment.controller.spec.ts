import { Test, TestingModule } from '@nestjs/testing';
import { SslPaymentService } from './ssl-payment.service';
import { SslPaymentController } from './ssl-payment.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('SslPaymentController', () => {
  let target: SslPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SslPaymentController],
      providers: [
        SslPaymentController,
      { provide: SslPaymentService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<SslPaymentController>(SslPaymentController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
