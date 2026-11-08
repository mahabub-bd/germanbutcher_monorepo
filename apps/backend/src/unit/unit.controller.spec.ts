import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './unit.service';
import { UnitsController } from './unit.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('UnitsController', () => {
  let target: UnitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [
        UnitsController,
      { provide: UnitsService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<UnitsController>(UnitsController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
