import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('CouponController', () => {
  let target: CouponController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponController],
      providers: [
        CouponController,
      { provide: CouponService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<CouponController>(CouponController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
