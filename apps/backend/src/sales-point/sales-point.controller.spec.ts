import { Test, TestingModule } from '@nestjs/testing';
import { SalesPointController } from './sales-point.controller';
import { SalesPointService } from './sales-point.service';

describe('SalesPointController', () => {
  let controller: SalesPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesPointController],
      providers: [SalesPointService],
    }).compile();

    controller = module.get<SalesPointController>(SalesPointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
