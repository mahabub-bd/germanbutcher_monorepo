import { Test, TestingModule } from '@nestjs/testing';
import { SalesPointService } from './sales-point.service';

describe('SalesPointService', () => {
  let service: SalesPointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesPointService],
    }).compile();

    service = module.get<SalesPointService>(SalesPointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
