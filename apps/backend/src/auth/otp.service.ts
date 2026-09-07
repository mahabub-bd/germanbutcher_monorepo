import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  constructor(private configService: ConfigService) {}

  generateOtp(): string {
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getOtpExpiration(): Date {
    const date = new Date();
    date.setMilliseconds(date.getMilliseconds() + this.getOtpValidityMs());
    return date;
  }

  getOtpValidityMs(): number {
    const expiresInMinutes = parseInt(
      this.configService.get<string>('OTP_EXPIRES_IN') || '5',
    );
    return expiresInMinutes * 60 * 1000;
  }

  verifyOtp(userOtp: string, inputOtp: string, otpExpiresAt: Date): boolean {
    if (new Date() > otpExpiresAt) {
      return false;
    }
    return userOtp === inputOtp;
  }
}
