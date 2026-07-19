import { Test, TestingModule } from '@nestjs/testing';
import { SalesPartnerService } from './sales-partner.service';

describe('SalesPartnerService', () => {
  let service: SalesPartnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesPartnerService],
    }).compile();

    service = module.get<SalesPartnerService>(SalesPartnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
