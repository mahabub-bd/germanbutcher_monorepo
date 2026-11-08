import { Test, TestingModule } from '@nestjs/testing';
import { MenuPermissionService } from './menu-permission.service';
import { MenuPermissionController } from './menu-permission.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

const createMock = () => ({});


describe('MenuPermissionController', () => {
  let target: MenuPermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuPermissionController],
      providers: [
        MenuPermissionController,
      { provide: MenuPermissionService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<MenuPermissionController>(MenuPermissionController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
