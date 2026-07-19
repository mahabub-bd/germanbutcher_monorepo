// src/ssl-payment/ssl-payment.controller.ts
import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Redirect,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InitiateRefundDto } from './dto/initiate-refund.dto';
import { SslPaymentService } from './ssl-payment.service';

@Controller('payment')
export class SslPaymentController {
  constructor(private readonly sslPaymentService: SslPaymentService) {}

  @Post('init')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  @Header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With',
  )
  async initPayment(@Body() orderData: any, @Res() res: Response) {
    try {
      const sslcommerzURL = await this.sslPaymentService.initPayment(orderData);

      res.json({
        success: true,
        data: {
          redirectUrl: sslcommerzURL,
          GatewayPageURL: sslcommerzURL,
          orderId: orderData.id,
          orderNo: orderData.orderNo,
        },
        message: 'Payment initialized successfully',
      });
    } catch (error) {
      console.error('Payment controller error:', error);
      const err = error as Error;
      res.status(400).json({
        success: false,
        message: err.message || 'Payment initialization failed',
      });
    }
  }

  @Get('success/:orderId')
  @Redirect()
  async paymentSuccess(
    @Param('orderId') orderId: string,
    @Query() sslPaymentData: any,
  ) {
    try {
      console.log('SSL Payment Success - Order ID:', orderId);
      console.log('SSL Payment Data:', sslPaymentData);

      const orderIdNum = parseInt(orderId);

      if (isNaN(orderIdNum)) {
        throw new Error('Invalid order ID');
      }

      const result = await this.sslPaymentService.handlePaymentSuccess(
        orderIdNum,
        sslPaymentData,
      );

      return {
        url: result.redirectUrl,
        statusCode: 302,
      };
    } catch (error) {
      console.error('Payment success handling failed:', error);
      // Redirect to error page on failure
      return {
        url: `${process.env.FRONTEND_URL}/payment/error/${orderId}`,
        statusCode: 302,
      };
    }
  }

  @Post('success/:orderId')
  @Header('Access-Control-Allow-Origin', '*')
  @Redirect()
  async paymentSuccessPost(
    @Param('orderId') orderId: string,
    @Body() sslPaymentData: any,
  ) {
    try {
      console.log('SSL Payment Success POST - Order ID:', orderId);
      console.log('SSL Payment Data:', sslPaymentData);

      const orderIdNum = parseInt(orderId);

      if (isNaN(orderIdNum)) {
        throw new Error('Invalid order ID');
      }

      const result = await this.sslPaymentService.handlePaymentSuccess(
        orderIdNum,
        sslPaymentData,
      );

      return {
        url: result.redirectUrl,
        statusCode: 302,
      };
    } catch (error) {
      console.error('Payment success handling failed:', error);
      return {
        url: `${process.env.FRONTEND_URL}/payment/error/${orderId}`,
        statusCode: 302,
      };
    }
  }

  @Post('fail/:orderId')
  @Header('Access-Control-Allow-Origin', '*')
  @Redirect()
  async paymentFail(
    @Param('orderId') orderId: string,
    @Query() sslPaymentData: any,
  ) {
    try {
      console.log('SSL Payment Failed - Order ID:', orderId);
      console.log('SSL Payment Data:', sslPaymentData);

      const orderIdNum = parseInt(orderId);

      if (isNaN(orderIdNum)) {
        throw new Error('Invalid order ID');
      }

      const result = await this.sslPaymentService.handlePaymentFailure(
        orderIdNum,
        sslPaymentData,
      );

      return {
        url: result.redirectUrl,
        statusCode: 302,
      };
    } catch (error) {
      console.error('Payment failure handling failed:', error);
      return {
        url: `${process.env.FRONTEND_URL}/payment/error/${orderId}`,
        statusCode: 302,
      };
    }
  }

  @Post('cancel/:orderId')
  @Header('Access-Control-Allow-Origin', '*')
  @Redirect()
  async paymentCancel(
    @Param('orderId') orderId: string,
    @Query() sslPaymentData: any,
  ) {
    console.log('SSL Payment Cancelled - Order ID:', orderId);
    console.log('SSL Payment Data:', sslPaymentData);

    return {
      url: `${process.env.FRONTEND_URL}/payment/cancelled/${orderId}`,
      statusCode: 302,
    };
  }

  @Post('ipn')
  @Header('Access-Control-Allow-Origin', '*')
  async ipnHandler(@Body() ipnData: any) {
    try {
      console.log('Received IPN:', ipnData);
      await this.sslPaymentService.handleIPN(ipnData);
      return {
        status: 'success',
        message: 'IPN processed successfully',
      };
    } catch (error) {
      console.error('IPN processing failed:', error);
      const err = error as Error;
      return {
        status: 'error',
        message: 'IPN processing failed',
        error: err.message,
      };
    }
  }

  @Get('validate/:tranId')
  async validatePayment(@Param('tranId') tranId: string) {
    try {
      console.log('Manual validation request for transaction:', tranId);

      return {
        success: true,
        message: 'Validation endpoint - implementation depends on your needs',
        tranId,
      };
    } catch (error) {
      console.error('Payment validation failed:', error);
      const err = error as Error;
      return {
        success: false,
        message: 'Payment validation failed',
        error: err.message,
      };
    }
  }

  @Post('refund')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  @Header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With',
  )
  async initiateRefund(@Body() refundData: InitiateRefundDto, @Res() res: Response) {
    try {
      const response = await this.sslPaymentService.initiateRefund(refundData);

      res.json({
        success: true,
        data: response,
        message: 'Refund initiated successfully',
      });
    } catch (error) {
      console.error('Refund controller error:', error);
      const err = error as Error;
      res.status(400).json({
        success: false,
        message: err.message || 'Refund initiation failed',
      });
    }
  }
}
