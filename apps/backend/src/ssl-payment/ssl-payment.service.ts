import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderPaymentMethod } from 'src/order-payment-method/entities/order-payment-method.entity';
import { CreateOrderPaymentDto } from 'src/order-payment/dto/create-order-payment.dto';
import { OrderPayment } from 'src/order-payment/entities/order-payment.entity';
import { OrderPaymentService } from 'src/order-payment/order-payment.service';
import { Order } from 'src/order/entities/order.entity';
import SSLCommerzPayment from 'sslcommerz-lts';
import { Repository } from 'typeorm';

@Injectable()
export class SslPaymentService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderPayment)
    private readonly paymentRepository: Repository<OrderPayment>,
    @InjectRepository(OrderPaymentMethod)
    private readonly paymentMethodRepository: Repository<OrderPaymentMethod>,
    private readonly orderPaymentService: OrderPaymentService,
  ) {}

  private getStoreConfig() {
    const storeId = this.configService.get<string>('SSLCOMMERZ_STORE_ID');
    const storePassword = this.configService.get<string>(
      'SSLCOMMERZ_STORE_PASSWORD',
    );
    const isLive =
      this.configService.get<string>('SSLCOMMERZ_IS_LIVE') === 'true';

    if (!storeId || !storePassword) {
      throw new Error('SSLCommerz credentials are not configured');
    }

    return { storeId, storePassword, isLive };
  }

  async initPayment(orderData: any): Promise<string> {
    const { storeId, storePassword, isLive } = this.getStoreConfig();

    const baseUrl = this.configService.get<string>('BASE_URL');
    const ipnUrl = this.configService.get<string>('PAYMENT_IPN_URL');

    const tranId = `${orderData.id}${Date.now()}`;

    const data = {
      total_amount: orderData.totalValue || 100,
      currency: 'BDT',
      tran_id: tranId,

      success_url: `${baseUrl}/v1/payment/success/${orderData?.id}`,
      fail_url: `${baseUrl}/v1/payment/fail/${orderData?.id}`,
      cancel_url: `${baseUrl}/v1/payment/cancel/${orderData?.id}`,
      ipn_url: ipnUrl,

      shipping_method: orderData.shippingMethod?.name || 'Courier',

      product_name:
        orderData.items?.length > 0
          ? orderData.items.map((item: any) => item.product.name).join(', ')
          : 'Order Items',
      product_category: 'General',
      product_profile: 'general',

      cus_name: orderData.user?.name || 'Customer Name',
      cus_email: orderData.user?.email || 'customer@example.com',
      cus_add1: orderData.address?.address || 'Dhaka',
      cus_add2: orderData.address?.area || 'Dhaka',
      cus_city: orderData.address?.city || 'Dhaka',
      cus_state: orderData.address?.division || 'Dhaka',
      cus_postcode: orderData.address?.postalCode || '1000',
      cus_country: orderData.address?.country || 'Bangladesh',
      cus_phone: orderData.user?.mobileNumber || '01711111111',
      cus_fax: orderData.user?.mobileNumber || '01711111111',

      ship_name: orderData.user?.name || 'Customer Name',
      ship_add1: orderData.address?.address || 'Dhaka',
      ship_add2: orderData.address?.area || 'Dhaka',
      ship_city: orderData.address?.city || 'Dhaka',
      ship_state: orderData.address?.division || 'Dhaka',
      ship_postcode: orderData.address?.postalCode || 1000,
      ship_country: orderData.address?.country || 'Bangladesh',

      value_a: orderData.id, // Store order ID for reference
      value_b: orderData.paymentMethod?.name || '',
      value_c: orderData.items?.length || 0,
      value_d: orderData.coupon?.code || '',
    };

    console.log('SSL Commerz payment data:', JSON.stringify(data, null, 2));

    try {
      const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);
      const apiResponse = await sslcz.init(data);
      console.log(apiResponse);
      if (!apiResponse.GatewayPageURL) {
        throw new BadRequestException('Failed to initialize payment');
      }

      return apiResponse.GatewayPageURL;
    } catch (error) {
      console.error('Payment initialization failed:', error);
      throw new BadRequestException('Payment initialization failed');
    }
  }

  async handlePaymentSuccess(
    orderId: number,
    sslPaymentData: any,
  ): Promise<{ success: boolean; redirectUrl: string; order: Order }> {
    try {
      console.log('Processing SSL payment success for order:', orderId);
      console.log('SSL Payment Data:', sslPaymentData);

      const isValidPayment = await this.verifyPayment(sslPaymentData);

      if (!isValidPayment) {
        throw new BadRequestException('Payment verification failed');
      }

      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: [
          'user',
          'paymentMethod',
          'payments',
          'address',
          'shippingMethod',
          'items',
          'items.product',
          'coupon',
        ],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      const existingPayment = await this.paymentRepository.findOne({
        where: { sslPaymentId: sslPaymentData.tran_id },
      });

      if (existingPayment) {
        console.log(
          'Payment already processed for transaction:',
          sslPaymentData.tran_id,
        );
        return {
          success: true,
          redirectUrl: `${process.env.FRONTEND_URL}/payment/success/${orderId}`,
          order,
        };
      }

      let sslPaymentMethod = await this.paymentMethodRepository.findOne({
        where: { name: 'SSLCOMMERZ' },
      });

      if (!sslPaymentMethod) {
        sslPaymentMethod = await this.paymentMethodRepository.findOne({
          where: { id: 2 },
        });
      }
      await this.orderRepository.update(order.id, {
        paymentMethod: sslPaymentMethod,
      });

      const paymentAmount = Number(sslPaymentData.amount) || order.totalValue;

      const createPaymentDto: CreateOrderPaymentDto = {
        orderId: order.id,
        amount: paymentAmount,
        paymentMethodId: sslPaymentMethod.id,
        referenceNumber: sslPaymentData.tran_id,
        notes: `SSLTransaction ID: ${sslPaymentData.tran_id}`,
      };

      const payment = await this.orderPaymentService.create(
        createPaymentDto,
        order.user,
      );

      await this.paymentRepository.update(payment.id, {
        sslPaymentId: sslPaymentData.tran_id,
        bankTranId: sslPaymentData.bank_tran_id,
      });

      const updatedOrder = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: [
          'user',
          'payments',
          'payments.paymentMethod',
          'address',
          'shippingMethod',
          'paymentMethod',
          'items',
          'items.product',
          'coupon',
        ],
      });

      console.log(`✅ Payment successful for Order ${orderId}`);
      console.log(`💳 Transaction ID: ${sslPaymentData.tran_id}`);
      console.log(`💰 Payment Amount: ৳${paymentAmount}`);
      console.log(`📊 Payment Status: ${updatedOrder.paymentStatus}`);
      console.log(`💵 Total Paid: ৳${updatedOrder.paidAmount}`);
      console.log(`📋 Payment Number: ${payment.paymentNumber}`);

      return {
        success: true,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/success/${orderId}`,
        order: updatedOrder,
      };
    } catch (error) {
      console.error('❌ Payment success handling failed:', error);
      const err = error as Error;
      throw new BadRequestException(
        `Payment processing failed: ${err.message}`,
      );
    }
  }

  async handlePaymentFailure(
    orderId: number,
    sslPaymentData: any,
  ): Promise<{ success: boolean; redirectUrl: string }> {
    try {
      console.log(`❌ Payment failed for Order ${orderId}:`, sslPaymentData);

      // Log the failure for tracking purposes
      console.log(`Failed Transaction ID: ${sslPaymentData.tran_id || 'N/A'}`);
      console.log(
        `Failure Reason: ${sslPaymentData.failedreason || 'Unknown'}`,
      );

      return {
        success: false,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/failed/${orderId}`,
      };
    } catch (error) {
      console.error('Payment failure handling failed:', error);
      const err = error as Error;
      throw new BadRequestException(
        `Payment failure processing failed: ${err.message}`,
      );
    }
  }

  private async verifyPayment(sslPaymentData: any): Promise<boolean> {
    try {
      const { storeId, storePassword, isLive } = this.getStoreConfig();
      const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);

      const validation = await sslcz.validate({
        val_id: sslPaymentData.val_id,
      });

      console.log('🔍 SSL Validation Response:', validation);

      const isValid =
        validation.status === 'VALID' &&
        validation.tran_id === sslPaymentData.tran_id &&
        Number(validation.amount) === Number(sslPaymentData.amount);

      if (!isValid) {
        console.log('❌ Payment verification failed:', {
          validationStatus: validation.status,
          expectedTranId: sslPaymentData.tran_id,
          actualTranId: validation.tran_id,
          expectedAmount: sslPaymentData.amount,
          actualAmount: validation.amount,
        });
      }

      return isValid;
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      return false;
    }
  }

  async handleIPN(ipnData: any): Promise<void> {
    try {
      console.log('📡 Received IPN:', ipnData);

      if (ipnData.status === 'VALID') {
        const orderId = ipnData.value_a;
        if (orderId) {
          console.log('🔄 Processing IPN for order:', orderId);
          await this.handlePaymentSuccess(parseInt(orderId), ipnData);
        }
      } else {
        console.log('⚠️ Invalid IPN status:', ipnData.status);
      }
    } catch (error) {
      console.error('❌ IPN handling failed:', error);
    }
  }

  async initiateRefund(refundData: {
    paymentId: number;
    refund_amount: number;
    refund_remarks?: string;
    bank_tran_id: string;
    tran_id: string;
  }): Promise<any> {
    try {
      const { storeId, storePassword, isLive } = this.getStoreConfig();
      const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);

      console.log('🔄 Initiating refund:', refundData);
      console.log('📝 Refund details:');
      console.log('   - Payment ID:', refundData.paymentId);
      console.log('   - Refund Amount:', refundData.refund_amount);
      console.log('   - Bank Transaction ID:', refundData.bank_tran_id);
      console.log('   - SSLCommerz Transaction ID (tran_id):', refundData.tran_id);

      // Validate that bank_tran_id and tran_id are different
      if (refundData.bank_tran_id === refundData.tran_id) {
        console.warn('⚠️  Warning: bank_tran_id and tran_id are the same!');
        console.warn('   These should be different values from the payment callback.');
      }

      const response = await sslcz.initiateRefund({
        refund_amount: refundData.refund_amount,
        refund_remarks: refundData.refund_remarks || '',
        bank_tran_id: refundData.bank_tran_id,
        refe_id: refundData.tran_id,
      });

      console.log('SSLCommerz refund response:', response);

      // Check for API connection errors
      if (
        response?.APIConnect?.includes('INVALID_SOURCE') ||
        response?.APIConnect?.includes('REQUEST_FROM_INVALID_SOURCE')
      ) {
        console.error('❌ SSLCommerz IP whitelist error:', response.APIConnect);
        console.error('   Please whitelist your server IP in SSLCommerz merchant panel');
        throw new BadRequestException(
          'Server IP not whitelisted in SSLCommerz. Please contact SSLCommerz support to add your IP to the whitelist.',
        );
      }

      // Create reversal posting after successful refund
      if (
        response &&
        (response.status === 'SUCCESS' || response.status === 'success')
      ) {
        console.log('✅ Refund successful, creating reversal posting...');
        const reversalPayment = await this.orderPaymentService.createRefund(
          refundData.paymentId,
          refundData.refund_amount,
          refundData.refund_remarks || `SSLCommerz refund: ${refundData.tran_id}`,
        );

        console.log('💰 Reversal posting created:', reversalPayment.paymentNumber);

        return {
          ...response,
          reversalPayment,
        };
      }

      // If refund failed, throw an error
      if (response?.status === 'failed' || response?.errorReason) {
        throw new BadRequestException(
          `Refund failed: ${response.errorReason || 'Unknown error'}`,
        );
      }

      return response;
    } catch (error) {
      console.error('❌ Refund initiation failed:', error);
      const err = error as Error;
      throw new BadRequestException(`Refund initiation failed: ${err.message}`);
    }
  }
}
