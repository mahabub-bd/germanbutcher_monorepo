import { Test, TestingModule } from '@nestjs/testing';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('GalleryController', () => {
  let target: GalleryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [
        GalleryController,
      { provide: GalleryService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<GalleryController>(GalleryController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
