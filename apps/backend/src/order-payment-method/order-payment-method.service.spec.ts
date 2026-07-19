import { Test, TestingModule } from '@nestjs/testing';
import { OrderPaymentMethodService } from './order-payment-method.service';

describe('OrderPaymentMethodService', () => {
  let service: OrderPaymentMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderPaymentMethodService],
    }).compile();

    service = module.get<OrderPaymentMethodService>(OrderPaymentMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
