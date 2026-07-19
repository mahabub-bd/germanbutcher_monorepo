import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchase.controller';
import { PurchasesService } from './purchase.service';

describe('PurchaseController', () => {
  let controller: PurchasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [PurchasesService],
    }).compile();

    controller = module.get<PurchasesController>(PurchasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
