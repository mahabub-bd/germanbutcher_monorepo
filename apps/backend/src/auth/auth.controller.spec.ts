import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

const createMock = () => ({});


describe('AuthController', () => {
  let target: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthController,
      { provide: AuthService, useValue: createMock() },
      { provide: UserService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtRefreshGuard).useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
