import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductHistoryService } from 'src/product-history/product-history.service';
import { StockMovementService } from 'src/stock-movement/stock-movement.service';
import { ProductController } from './product.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('ProductController', () => {
  let target: ProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        ProductController,
      { provide: ProductService, useValue: createMock() },
      { provide: ProductHistoryService, useValue: createMock() },
      { provide: StockMovementService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<ProductController>(ProductController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
