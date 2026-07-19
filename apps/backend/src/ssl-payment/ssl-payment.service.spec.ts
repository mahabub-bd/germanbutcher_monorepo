import { Test, TestingModule } from '@nestjs/testing';
import { SslPaymentService } from './ssl-payment.service';

describe('SslPaymentService', () => {
  let service: SslPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SslPaymentService],
    }).compile();

    service = module.get<SslPaymentService>(SslPaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
