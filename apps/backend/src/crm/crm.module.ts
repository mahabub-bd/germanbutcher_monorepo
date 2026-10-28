import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { ContactMessage } from 'src/contact-message/entities/contact-message.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { OnlineUsersModule } from 'src/online-users/online-users.module';
import { Order } from 'src/order/entities/order.entity';
import { ProductReview } from 'src/product-review/entities/product-review.entity';
import { User } from 'src/user/entities/user.entity';
import { WishlistItem } from 'src/wishlist/entities/wishlist-item.entity';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import { CrmMenuSeeder } from './crm-menu-seeder';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmActivity } from './entities/crm-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrmActivity,
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
    OnlineUsersModule,
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmMenuSeeder],
  exports: [CrmService],
})
export class CrmModule {}
