import { Test, TestingModule } from '@nestjs/testing';
import { RolesService, type RoleWithUserCount } from './roles.service';
import { RolesController } from './roles.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';


const createMock = () => ({});


describe('RolesController', () => {
  let target: RolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        RolesController,
      { provide: RolesService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<RolesController>(RolesController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
