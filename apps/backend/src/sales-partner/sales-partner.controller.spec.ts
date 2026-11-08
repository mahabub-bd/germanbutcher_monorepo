import { Test, TestingModule } from '@nestjs/testing';
import { SalesPartnerService } from './sales-partner.service';
import { SalesPartnerController } from './sales-partner.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

const createMock = () => ({});


describe('SalesPartnerController', () => {
  let target: SalesPartnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesPartnerController],
      providers: [
        SalesPartnerController,
      { provide: SalesPartnerService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<SalesPartnerController>(SalesPartnerController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
