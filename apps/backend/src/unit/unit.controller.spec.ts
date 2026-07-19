import { Test, TestingModule } from '@nestjs/testing';
import { UnitsController } from './unit.controller';
import { UnitsService } from './unit.service';

describe('UnitController', () => {
  let controller: UnitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [UnitsService],
    }).compile();

    controller = module.get<UnitsController>(UnitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
