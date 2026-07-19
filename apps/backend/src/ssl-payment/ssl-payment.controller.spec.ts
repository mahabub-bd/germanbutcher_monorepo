import { Test, TestingModule } from '@nestjs/testing';
import { SslPaymentController } from './ssl-payment.controller';
import { SslPaymentService } from './ssl-payment.service';

describe('SslPaymentController', () => {
  let controller: SslPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SslPaymentController],
      providers: [SslPaymentService],
    }).compile();

    controller = module.get<SslPaymentController>(SslPaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
