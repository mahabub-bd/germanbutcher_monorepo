import {
  generateEmailFooter,
  generateEmailHeader,
} from './email-layout.template';

export interface PasswordChangedEmailData {
  name: string;
  email: string;
  changedAt: Date;
}

export function generatePasswordChangedHTML(
  data: PasswordChangedEmailData,
): string {
  const changedAt = new Date(data.changedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
  <!DOCTYPE html>
  <html>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              ${generateEmailHeader('Security Alert', changedAt)}

              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 16px;">
                    Your password has been changed
                  </h2>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
                    Dear <strong style="color: #1f2937;">${data.name}</strong>,
                  </p>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
                    The password for your German Butcher account
                    (<strong style="color: #1f2937;">${data.email}</strong>) was
                    changed successfully on <strong>${changedAt}</strong>.
                  </p>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    If you made this change, no further action is needed. If you
                    did <strong>not</strong> change your password, please contact
                    our support team immediately — your account may be at risk.
                  </p>

                  <div style="background-color: #fef2f2; border-left: 4px solid #8B0000; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
                    <p style="color: #7f1d1d; font-size: 13px; margin: 0;">
                      Security tip: never share your password with anyone.
                      German Butcher will never ask for it by email or phone.
                    </p>
                  </div>

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
