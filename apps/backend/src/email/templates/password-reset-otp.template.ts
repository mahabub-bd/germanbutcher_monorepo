import {
  EMAIL_RESPONSIVE_STYLES,
  generateEmailFooter,
  generateEmailHeader,
} from './email-layout.template';

export interface PasswordResetOtpEmailData {
  name: string;
  email: string;
  otp: string;
  expiresAt: Date;
}

export function generatePasswordResetOtpHTML(
  data: PasswordResetOtpEmailData,
): string {
  const expiresAt = new Date(data.expiresAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${EMAIL_RESPONSIVE_STYLES}
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              ${generateEmailHeader('Password Reset', expiresAt)}

              <!-- Content -->
              <tr>
                <td class="em-content" style="padding: 32px;">
                  <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 16px;">
                    Password reset code
                  </h2>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                    Dear <strong style="color: #1f2937;">${data.name}</strong>,
                  </p>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    Use the code below to reset your German Butcher account
                    password. It expires on <strong>${expiresAt}</strong>.
                  </p>

                  <div style="text-align: center; margin-bottom: 20px;">
                    <span style="display: inline-block; background-color: #fafafa; border: 1px solid #e5e7eb; border-left: 4px solid #8B0000; border-radius: 6px; padding: 14px 28px; font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">
                      ${data.otp}
                    </span>
                  </div>

                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    If you did not request a password reset, you can safely
                    ignore this email — your password will remain unchanged.
                  </p>

                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    This is an automated message — please do not reply.
                  </p>
                </td>
              </tr>

              ${generateEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
