import { Coupon } from 'src/coupon/entities/coupon.entity';
import { Order } from 'src/order/entities/order.entity';
import { User } from 'src/user/entities/user.entity';

export class CreateCouponUsageLogDto {
  coupon: Coupon;
  couponCode: string;
  order: Order;
  user: User;
  discountAmount: number;
  orderTotal: number;
  discountType?: string;
  discountValue?: number;
}
