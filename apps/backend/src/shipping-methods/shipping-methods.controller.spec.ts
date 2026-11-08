import { Test, TestingModule } from '@nestjs/testing';
import { ShippingMethodsService } from './shipping-methods.service';
import { ShippingMethodsController } from './shipping-methods.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('ShippingMethodsController', () => {
  let target: ShippingMethodsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingMethodsController],
      providers: [
        ShippingMethodsController,
      { provide: ShippingMethodsService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<ShippingMethodsController>(ShippingMethodsController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
