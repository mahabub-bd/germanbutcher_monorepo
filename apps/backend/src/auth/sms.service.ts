// sms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  async sendSms(mobileNumber: string, message: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('SMS_API_KEY');
    const senderId = this.configService.get<string>('SMS_SENDER_NUMBER');
    const apiUrl = this.configService.get<string>('SMS_SEND_URL');

    if (!apiUrl || !apiKey || !senderId) {
      this.logger.warn('SMS configuration is missing. Please check SMS_API_KEY, SMS_SENDER_NUMBER, and SMS_SEND_URL env variables.');
      return false;
    }

    try {
      const response = await axios.post(apiUrl, {
        api_key: apiKey,
        senderid: senderId,
        number: mobileNumber,
        message: message,
      });

      if (response.data?.status === 'success' || response.status === 200) {
        this.logger.log(`SMS sent successfully to ${mobileNumber}`);
        return true;
      } else {
        this.logger.warn(`SMS API response: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send SMS to ${mobileNumber}: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }
}
