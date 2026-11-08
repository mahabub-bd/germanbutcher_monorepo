import { Test, TestingModule } from '@nestjs/testing';
import { OrderPaymentService } from './order-payment.service';
import { OrderPaymentController } from './order-payment.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';

const createMock = () => ({});


describe('OrderPaymentController', () => {
  let target: OrderPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderPaymentController],
      providers: [
        OrderPaymentController,
      { provide: OrderPaymentService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<OrderPaymentController>(OrderPaymentController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
