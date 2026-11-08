import { Test, TestingModule } from '@nestjs/testing';
import { UserActivityService } from './user-activity.service';
import { UserActivityController } from './user-activity.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('UserActivityController', () => {
  let target: UserActivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserActivityController],
      providers: [
        UserActivityController,
      { provide: UserActivityService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<UserActivityController>(UserActivityController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
