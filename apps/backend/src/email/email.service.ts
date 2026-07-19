import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailClient } from 'zeptomail';
import { generateOrderConfirmationHTML, OrderEmailData } from './templates/order-confirmation.template';
import { generateContactResponseHTML, ContactResponseEmailData } from './templates/contact-response.template';

interface EmailAddress {
  address: string;
  name: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: SendMailClient;
  private fromAddress: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('ZEPTOMAIL_API_URL');
    const token = this.configService.get<string>('ZEPTOMAIL_API_KEY');
    this.fromAddress =
      this.configService.get<string>('ZEPTOMAIL_FROM_EMAIL') ||
      'noreply@germanbutcherbd.com';
    this.fromName =
      this.configService.get<string>('ZEPTOMAIL_FROM_NAME') || 'German Butcher';

    if (url && token) {
      this.client = new SendMailClient({ url, token });
    } else {
      this.logger.warn(
        'ZeptoMail configuration is missing. Email service will not work properly.',
      );
    }
  }

  async sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<void> {
    try {
      const htmlBody = generateOrderConfirmationHTML(orderData);

      await this.client.sendMail({
        from: {
          address: this.fromAddress,
          name: this.fromName,
        },
        to: [
          {
            email_address: {
              address: orderData.customerEmail,
              name: orderData.customerName,
            },
          },
        ],
        subject: `Order Confirmation - ${orderData.orderNo}`,
        htmlbody: htmlBody,
      });

      this.logger.log(
        `Order confirmation email sent successfully to ${orderData.customerEmail} for order ${orderData.orderNo}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send order confirmation email: ${err.message}`,
        err.stack,
      );
      // Don't throw error to prevent order creation from failing
    }
  }

  async sendContactResponseEmail(
    contactData: ContactResponseEmailData,
  ): Promise<void> {
    try {
      const htmlBody = generateContactResponseHTML(contactData);

      await this.client.sendMail({
        from: {
          address: this.fromAddress,
          name: this.fromName,
        },
        to: [
          {
            email_address: {
              address: contactData.recipientEmail,
              name: contactData.recipientName,
            },
          },
        ],
        subject: `Response to your inquiry - Ticket #${contactData.ticketId}`,
        htmlbody: htmlBody,
      });

      this.logger.log(
        `Contact response email sent successfully to ${contactData.recipientEmail} for ticket #${contactData.ticketId}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send contact response email: ${err.message}`,
        err.stack,
      );
      // Don't throw error to prevent contact update from failing
    }
  }
}
