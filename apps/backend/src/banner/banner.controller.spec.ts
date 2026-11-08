import { Test, TestingModule } from '@nestjs/testing';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('BannerController', () => {
  let target: BannerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannerController],
      providers: [
        BannerController,
      { provide: BannerService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<BannerController>(BannerController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
