import {
  EMAIL_RESPONSIVE_STYLES,
  generateEmailFooter,
  generateEmailHeader,
} from './email-layout.template';

export interface ContactResponseEmailData {
  recipientName: string;
  recipientEmail: string;
  originalMessage: string;
  responseNotes: string;
  ticketId: number;
}

export function generateContactResponseHTML(
  data: ContactResponseEmailData,
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
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
      <title>Response to your inquiry - Ticket #${data.ticketId}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px;">

              ${generateEmailHeader(`Ticket #${data.ticketId}`, currentDate)}

              <!-- Content -->
              <tr>
                <td class="em-content" style="padding: 32px;">
                  <!-- Greeting -->
                  <p style="font-size: 14px; color: #374151; margin: 0 0 8px 0;">
                    Dear <strong style="color: #1f2937;">${data.recipientName}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 28px 0;">
                    Thank you for reaching out to us! We've reviewed your inquiry and are pleased to provide you with a response.
                  </p>

                  <!-- Original Message -->
                  <div style="margin-bottom: 28px;">
                    <div style="font-size: 13px; font-weight: bold; color: #8B0000; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px;">Your Message</div>
                    <div style="background-color: #f8fafc; border-left: 4px solid #8B0000; padding: 18px; border-radius: 6px;">
                      <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6; font-style: italic;">
                        "${data.originalMessage}"
                      </p>
                    </div>
                  </div>

                  <!-- Response -->
                  <div style="margin-bottom: 28px;">
                    <div style="font-size: 13px; font-weight: bold; color: #8B0000; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px;">Our Response</div>
                    <div style="background-color: #ffffff; border: 1px solid #d1d5db; padding: 18px; border-radius: 6px;">
                      <p style="font-size: 13px; color: #1f2937; margin: 0; line-height: 1.6;">
                        ${data.responseNotes}
                      </p>
                    </div>
                  </div>

                  <!-- Call to Action -->
                  <div style="background-color: #8B0000; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                    <p style="font-size: 14px; color: #ffffff; margin: 0 0 16px 0; font-weight: 500;">
                      Need more assistance?
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="https://germanbutcherbd.com/contact" target="_blank" style="display: inline-block; padding: 12px 32px; background-color: #ffffff; color: #8B0000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
                            Contact Us Again
                          </a>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Additional Info -->
                  <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px 0;">
                    If you have any further questions or need additional clarification, please don't hesitate to reach out to us. We're here to help!
                  </p>
                  <p style="font-size: 13px; color: #6b7280; margin: 0;">
                    You can reply directly to this email or call us at <strong style="color: #1f2937;">+8801404-009000</strong>.
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
