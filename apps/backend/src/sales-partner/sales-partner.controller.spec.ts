import { Test, TestingModule } from '@nestjs/testing';
import { SalesPartnerController } from './sales-partner.controller';
import { SalesPartnerService } from './sales-partner.service';

describe('SalesPartnerController', () => {
  let controller: SalesPartnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesPartnerController],
      providers: [SalesPartnerService],
    }).compile();

    controller = module.get<SalesPartnerController>(SalesPartnerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
