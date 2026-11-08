import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('CartController', () => {
  let target: CartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        CartController,
      { provide: CartService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
