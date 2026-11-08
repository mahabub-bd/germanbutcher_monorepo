import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('MenuController', () => {
  let target: MenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [
        MenuController,
      { provide: MenuService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<MenuController>(MenuController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
