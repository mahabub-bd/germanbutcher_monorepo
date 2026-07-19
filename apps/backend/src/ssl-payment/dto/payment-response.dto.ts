export class PaymentResponseDto {
  tran_id: string;
  gateway_url: string;
  status: string;
  amount: number;
  currency: string;
}
