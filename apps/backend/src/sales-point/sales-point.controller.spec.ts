import { Test, TestingModule } from '@nestjs/testing';
import { SalesPointService } from './sales-point.service';
import { SalesPointController } from './sales-point.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('SalesPointController', () => {
  let target: SalesPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesPointController],
      providers: [
        SalesPointController,
      { provide: SalesPointService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<SalesPointController>(SalesPointController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
