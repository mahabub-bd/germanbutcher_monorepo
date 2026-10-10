import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { SendMailClient } from 'zeptomail';
import { Repository } from 'typeorm';
import { BusinessSetting } from 'src/business-settings/entities/business-setting.entity';
import { generateOrderConfirmationHTML, OrderEmailData } from './templates/order-confirmation.template';
import { generateContactResponseHTML, ContactResponseEmailData } from './templates/contact-response.template';
import {
  generateNewOrderAlertHTML,
  generateNewReviewAlertHTML,
  NewOrderAlertData,
  NewReviewAlertData,
} from './templates/admin-alert.template';

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

  constructor(
    private configService: ConfigService,
    @InjectRepository(BusinessSetting)
    private businessSettingsRepository: Repository<BusinessSetting>,
  ) {
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

  // Admin recipients from Business Settings (comma-separated), falling back
  // to ADMIN_NOTIFICATION_EMAIL for environments without seeded settings.
  private async getAdminRecipients(): Promise<string[]> {
    let raw: string | null = null;
    try {
      const settings = await this.businessSettingsRepository.findOneBy({
        id: 1,
      });
      raw = settings?.adminNotificationEmail ?? null;
    } catch (error) {
      this.logger.warn(
        `Could not load business settings for admin email: ${(error as Error).message}`,
      );
    }

    if (!raw) {
      raw = this.configService.get<string>('ADMIN_NOTIFICATION_EMAIL') ?? null;
    }
    if (!raw) return [];

    return raw
      .split(/[,;]/)
      .map((address) => address.trim())
      .filter(Boolean);
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

  // Admin notification inbox from Business Settings → adminNotificationEmail
  // (comma-separated for multiple recipients). Skips with a warn when unset
  // so flows never break on it.
  private async sendAdminNotificationEmail(
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    const recipients = await this.getAdminRecipients();
    if (recipients.length === 0) {
      this.logger.warn(
        'No admin notification email configured (Business Settings or ADMIN_NOTIFICATION_EMAIL) — skipping',
      );
      return;
    }

    try {
      await this.client.sendMail({
        from: {
          address: this.fromAddress,
          name: this.fromName,
        },
        to: recipients.map((address) => ({
          email_address: {
            address,
            name: 'German Butcher Admin',
          },
        })),
        subject,
        htmlbody: htmlBody,
      });
      this.logger.log(
        `Admin notification email sent to ${recipients.join(', ')}`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send admin notification email: ${err.message}`,
        err.stack,
      );
      // Don't throw — admin alerts must never break the main flow
    }
  }

  async sendNewReviewAdminEmail(data: NewReviewAlertData): Promise<void> {
    await this.sendAdminNotificationEmail(
      `New Review on ${data.productName} (${data.rating}★)`,
      generateNewReviewAlertHTML(data),
    );
  }

  async sendNewOrderAdminEmail(data: NewOrderAlertData): Promise<void> {
    await this.sendAdminNotificationEmail(
      `New Order ${data.orderNo} — ৳${data.totalAmount}`,
      generateNewOrderAlertHTML(data),
    );
  }
}
