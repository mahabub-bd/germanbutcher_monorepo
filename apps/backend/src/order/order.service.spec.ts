import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from 'src/product/entities/product.entity';
import { Address } from 'src/address/entities/address.entity';
import { ShippingMethod } from 'src/shipping-methods/entities/shipping-method.entity';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { User } from 'src/user/entities/user.entity';
import { Coupon } from 'src/coupon/entities/coupon.entity';
import { DeliveryMan } from 'src/delivery-man/entities/delivery-man.entity';
import { OrderPaymentService } from 'src/order-payment/order-payment.service';
import { OrderStatusTrack } from './entities/order-status-track.entity';
import { OrderNote } from './entities/order-note.entity';
import { EmailService } from 'src/email/email.service';
import { NotificationService } from 'src/notification/notification.service';
import { SmsService } from 'src/auth/sms.service';
import { CouponUsageLogService } from 'src/coupon-usage-log/coupon-usage-log.service';
import { CouponService } from 'src/coupon/coupon.service';
import { FreeDeliveryCampaignsService } from 'src/free-delivery-campaigns/free-delivery-campaigns.service';
import { FreeDeliveryUsageLogService } from 'src/free-delivery-usage-log/free-delivery-usage-log.service';
import { computeFlashPrice, FlashSaleCampaignsService } from 'src/flash-sale-campaigns/flash-sale-campaigns.service';
import { FlashSaleUsageLogService } from 'src/flash-sale-usage-log/flash-sale-usage-log.service';
import { applyBogoDiscount, BogoCampaignsService } from 'src/bogo-campaigns/bogo-campaigns.service';
import { BogoUsageLogService } from 'src/bogo-usage-log/bogo-usage-log.service';
import { StockMovementService } from 'src/stock-movement/stock-movement.service';
import { OrderService } from './order.service';

const createMock = () => ({});

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  merge: jest.fn((...args) => Object.assign({}, ...args)),
});

describe('OrderService', () => {
  let target: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
      { provide: getRepositoryToken(Order), useValue: createMockRepository() },
      { provide: getRepositoryToken(OrderItem), useValue: createMockRepository() },
      { provide: getRepositoryToken(Product), useValue: createMockRepository() },
      { provide: getRepositoryToken(Address), useValue: createMockRepository() },
      { provide: getRepositoryToken(ShippingMethod), useValue: createMockRepository() },
      { provide: getRepositoryToken(OrderPaymentMethod), useValue: createMockRepository() },
      { provide: getRepositoryToken(User), useValue: createMockRepository() },
      { provide: getRepositoryToken(Coupon), useValue: createMockRepository() },
      { provide: getRepositoryToken(DeliveryMan), useValue: createMockRepository() },
      { provide: OrderPaymentService, useValue: createMock() },
      { provide: getRepositoryToken(OrderStatusTrack), useValue: createMockRepository() },
      { provide: getRepositoryToken(OrderNote), useValue: createMockRepository() },
      { provide: EmailService, useValue: createMock() },
      { provide: NotificationService, useValue: createMock() },
      { provide: SmsService, useValue: createMock() },
      { provide: CouponUsageLogService, useValue: createMock() },
      { provide: CouponService, useValue: createMock() },
      { provide: FreeDeliveryCampaignsService, useValue: createMock() },
      { provide: FreeDeliveryUsageLogService, useValue: createMock() },
      { provide: FlashSaleCampaignsService, useValue: createMock() },
      { provide: FlashSaleUsageLogService, useValue: createMock() },
      { provide: BogoCampaignsService, useValue: createMock() },
      { provide: BogoUsageLogService, useValue: createMock() },
      { provide: StockMovementService, useValue: createMock() },
      ],
    }).compile();

    target = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });
});
