import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './supplier.controller';
import { SuppliersService } from './supplier.service';

describe('SupplierController', () => {
  let controller: SuppliersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [SuppliersService],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
