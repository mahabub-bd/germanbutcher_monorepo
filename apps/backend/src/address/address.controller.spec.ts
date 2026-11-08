import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './address.service';
import { AddressesController } from './address.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';


const createMock = () => ({});


describe('AddressesController', () => {
  let target: AddressesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        AddressesController,
      { provide: AddressesService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<AddressesController>(AddressesController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
