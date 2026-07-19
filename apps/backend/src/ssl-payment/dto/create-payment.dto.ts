import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber({}, { message: 'Amount must be a valid number' })
  @IsPositive({ message: 'Amount must be positive' })
  @IsNotEmpty()
  total_amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsString()
  @IsNotEmpty()
  product_category: string;

  @IsString()
  @IsNotEmpty()
  cus_name: string;

  @IsString()
  @IsNotEmpty()
  cus_email: string;

  @IsString()
  @IsNotEmpty()
  cus_phone: string;
}
