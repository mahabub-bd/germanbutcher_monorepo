import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './unit.service';

describe('UnitService', () => {
  let service: UnitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitsService],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});














