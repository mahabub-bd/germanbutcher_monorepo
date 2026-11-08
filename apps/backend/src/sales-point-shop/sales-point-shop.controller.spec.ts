import { Test, TestingModule } from '@nestjs/testing';
import { SalesPointShopService } from './sales-point-shop.service';
import { SalesPointShopController } from './sales-point-shop.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('SalesPointShopController', () => {
  let target: SalesPointShopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesPointShopController],
      providers: [
        SalesPointShopController,
      { provide: SalesPointShopService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<SalesPointShopController>(SalesPointShopController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
