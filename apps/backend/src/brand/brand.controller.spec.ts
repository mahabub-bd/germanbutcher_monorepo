import { Test, TestingModule } from '@nestjs/testing';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('BrandController', () => {
  let target: BrandController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandController],
      providers: [
        BrandController,
      { provide: BrandService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<BrandController>(BrandController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
