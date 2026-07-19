import { Test, TestingModule } from '@nestjs/testing';
import { SalesPointShopService } from './sales-point-shop.service';

describe('SalesPointShopService', () => {
  let service: SalesPointShopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesPointShopService],
    }).compile();

    service = module.get<SalesPointShopService>(SalesPointShopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
