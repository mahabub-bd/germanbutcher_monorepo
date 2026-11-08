import { Test, TestingModule } from '@nestjs/testing';
import { OrderPaymentMethodService } from './order-payment-method.service';
import { OrderPaymentMethodController } from './order-payment-method.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('OrderPaymentMethodController', () => {
  let target: OrderPaymentMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderPaymentMethodController],
      providers: [
        OrderPaymentMethodController,
      { provide: OrderPaymentMethodService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<OrderPaymentMethodController>(OrderPaymentMethodController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
