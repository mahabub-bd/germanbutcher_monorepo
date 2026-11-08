import { Test, TestingModule } from '@nestjs/testing';
import { TestimonialService } from './testimonial.service';
import { TestimonialController } from './testimonial.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('TestimonialController', () => {
  let target: TestimonialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestimonialController],
      providers: [
        TestimonialController,
      { provide: TestimonialService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<TestimonialController>(TestimonialController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
