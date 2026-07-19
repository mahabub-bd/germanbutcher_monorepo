import { Test, TestingModule } from '@nestjs/testing';
import { OrderPaymentMethodController } from './order-payment-method.controller';
import { OrderPaymentMethodService } from './order-payment-method.service';

describe('OrderPaymentMethodController', () => {
  let controller: OrderPaymentMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderPaymentMethodController],
      providers: [OrderPaymentMethodService],
    }).compile();

    controller = module.get<OrderPaymentMethodController>(OrderPaymentMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
