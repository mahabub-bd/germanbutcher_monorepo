import { Test, TestingModule } from '@nestjs/testing';
import { MenuPermissionService } from './menu-permission.service';

describe('MenuPermissionService', () => {
  let service: MenuPermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuPermissionService],
    }).compile();

    service = module.get<MenuPermissionService>(MenuPermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
