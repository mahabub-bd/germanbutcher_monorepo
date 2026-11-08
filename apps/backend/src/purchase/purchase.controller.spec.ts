import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchase.service';
import { PurchasesController } from './purchase.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('PurchasesController', () => {
  let target: PurchasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        PurchasesController,
      { provide: PurchasesService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<PurchasesController>(PurchasesController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
