import { Test, TestingModule } from '@nestjs/testing';
import { MenuPermissionController } from './menu-permission.controller';
import { MenuPermissionService } from './menu-permission.service';

describe('MenuPermissionController', () => {
  let controller: MenuPermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuPermissionController],
      providers: [MenuPermissionService],
    }).compile();

    controller = module.get<MenuPermissionController>(MenuPermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
