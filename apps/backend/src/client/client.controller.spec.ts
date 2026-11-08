import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';


const createMock = () => ({});


describe('ClientController', () => {
  let target: ClientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        ClientController,
      { provide: ClientService, useValue: createMock() },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    target = module.get<ClientController>(ClientController);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
