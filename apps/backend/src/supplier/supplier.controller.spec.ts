import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './supplier.service';
import { SuppliersController } from './supplier.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('SuppliersController', () => {
  let target: SuppliersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        SuppliersController,
      { provide: SuppliersService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<SuppliersController>(SuppliersController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
