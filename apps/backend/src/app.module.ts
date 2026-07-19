import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AddressModule } from './address/address.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ActivityInterceptor } from './interceptor/activity.interceptor';
import { AttachmentModule } from './attachment/attachment.module';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { BannerModule } from './banner/banner.module';
import { BrandModule } from './brand/brand.module';
import { CartModule } from './cart/cart.module';
import { CategoryModule } from './category/category.module';
import { ClientModule } from './client/client.module';
import { DeliveryManModule } from './delivery-man/delivery-man.module';
import { ThrottlerGuard } from './common/guards/throttler.guard';
import { ContactMessageModule } from './contact-message/contact-message.module';
import { CouponModule } from './coupon/coupon.module';
import { CouponUsageLogModule } from './coupon-usage-log/coupon-usage-log.module';
import { GalleryModule } from './gallery/gallery.module';
import { MenuPermissionModule } from './menu-permission/menu-permission.module';
import { MenuModule } from './menu/menu.module';
import { NotificationModule } from './notification/notification.module';
import { OrderPaymentMethodModule } from './order-payment-method/order-payment-method.module';
import { OrderPaymentModule } from './order-payment/order-payment.module';
import { OrderModule } from './order/order.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { PaymentModule } from './payment/payment.module';
import { ProductModule } from './product/product.module';
import { PurchasesModule } from './purchase/purchase.module';
import { RecipeModule } from './recipe/recipe.module';
import { RolesModule } from './roles/roles.module';
import { SalesPartnerModule } from './sales-partner/sales-partner.module';
import { SalesPointShopModule } from './sales-point-shop/sales-point-shop.module';
import { SalesPointModule } from './sales-point/sales-point.module';
import { ShippingMethodsModule } from './shipping-methods/shipping-methods.module';
import { SslPaymentModule } from './ssl-payment/ssl-payment.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { SuppliersModule } from './supplier/supplier.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { UnitModule } from './unit/unit.module';
import { UserActivityModule } from './user-activity/user-activity.module';
import { UserModule } from './user/user.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.local',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 60000, // 1 minute
            limit: 600, // 60 requests per minute
          },
          {
            name: 'medium',
            ttl: 300000, // 5 minutes
            limit: 800, // 200 requests per 5 minutes
          },
          {
            name: 'long',
            ttl: 3600000, // 1 hour
            limit: 1000, // 1000 requests per hour
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    AddressModule,
    AnalyticsModule,
    AttachmentModule,
    AuthModule,
    BannerModule,
    BrandModule,
    CartModule,
    CategoryModule,
    ClientModule,
    ContactMessageModule,
    CouponModule,
    CouponUsageLogModule,
    DeliveryManModule,
    GalleryModule,
    MenuModule,
    MenuPermissionModule,
    NotificationModule,
    OrderModule,
    OrderPaymentModule,
    OrderPaymentMethodModule,
    PaymentModule,
    PaymentMethodModule,
    ProductModule,
    PurchasesModule,
    RecipeModule,
    RolesModule,
    SalesPartnerModule,
    SalesPointModule,
    SalesPointShopModule,
    ShippingMethodsModule,
    SslPaymentModule,
    SubscribersModule,
    SuppliersModule,
    TestimonialModule,
    UnitModule,
    UserModule,
    UserActivityModule,
    WishlistModule,
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityInterceptor,
    },
  ],
})
export class AppModule {}
