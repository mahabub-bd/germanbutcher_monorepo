import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/address/entities/address.entity';
import { BusinessSetting } from 'src/business-settings/entities/business-setting.entity';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { ContactMessage } from 'src/contact-message/entities/contact-message.entity';
import { EmailModule } from 'src/email/email.module';
import { Menu } from 'src/menu/entities/menu.entity';
import { Order } from 'src/order/entities/order.entity';
import { ProductReview } from 'src/product-review/entities/product-review.entity';
import { User } from 'src/user/entities/user.entity';
import { WishlistItem } from 'src/wishlist/entities/wishlist-item.entity';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import { SmsModule } from 'src/auth/sms.module';
import { CrmMenuSeeder } from './crm-menu-seeder';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmActivity } from './entities/crm-activity.entity';
import { CrmCampaign } from './entities/crm-campaign.entity';
import { CrmCampaignRecipient } from './entities/crm-campaign-recipient.entity';

@Module({
  imports: [
    SmsModule,
    EmailModule,
    TypeOrmModule.forFeature([
      Address,
      BusinessSetting,
      CrmActivity,
      CrmCampaign,
      CrmCampaignRecipient,
      User,
      Order,
      Cart,
      CartItem,
      Wishlist,
      WishlistItem,
      ProductReview,
      ContactMessage,
      Menu,
    ]),
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmMenuSeeder],
  exports: [CrmService],
})
export class CrmModule {}
