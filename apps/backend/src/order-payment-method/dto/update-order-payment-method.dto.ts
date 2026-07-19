import { PartialType } from '@nestjs/swagger';
import { CreateOrderPaymentMethodDto } from './create-order-payment-method.dto';

export class UpdateOrderPaymentMethodDto extends PartialType(CreateOrderPaymentMethodDto) {}
