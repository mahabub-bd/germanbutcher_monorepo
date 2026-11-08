import { Test, TestingModule } from '@nestjs/testing';
import { FindAllOrdersOptions, OrderService } from './order.service';
import { OrderController } from './order.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('OrderController', () => {
  let target: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderController,
      { provide: OrderService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
