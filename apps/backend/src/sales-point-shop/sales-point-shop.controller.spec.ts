import { Test, TestingModule } from '@nestjs/testing';
import { SalesPointShopController } from './sales-point-shop.controller';
import { SalesPointShopService } from './sales-point-shop.service';

describe('SalesPointShopController', () => {
  let controller: SalesPointShopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesPointShopController],
      providers: [SalesPointShopService],
    }).compile();

    controller = module.get<SalesPointShopController>(SalesPointShopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
