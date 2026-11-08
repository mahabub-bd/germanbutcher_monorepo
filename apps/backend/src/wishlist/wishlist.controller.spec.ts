import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


const createMock = () => ({});


describe('WishlistController', () => {
  let target: WishlistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
      providers: [
        WishlistController,
      { provide: WishlistService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<WishlistController>(WishlistController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
