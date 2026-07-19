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
      <title>Response to your inquiry - Ticket #${data.ticketId}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px;">

              <!-- Header -->
              <tr>
                <td style="padding: 32px; border-bottom: 3px solid #8B0000; background-color: #fafafa; border-radius: 8px 8px 0 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="60%" style="vertical-align: top;">
                        <!-- Logo and Company Info -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-right: 15px; vertical-align: top;">
                              <img src="https://germanbutcher.s3.ap-southeast-1.amazonaws.com/31ab7b72-a761-47d5-9d79-33b6a68227e4.webp"
                                   alt="German Butcher Logo"
                                   width="100"
                                   style="display: block; border-radius: 8px;" />
                            </td>
                            <td style="vertical-align: top;">
                              <div style="font-size: 24px; font-weight: bold; color: #8B0000; margin-bottom: 8px;">German Butcher</div>
                              <div style="font-size: 12px; color: #374151; margin-bottom: 3px;">House-56/B, Road-132, Gulshan-1, Dhaka</div>
                              <div style="font-size: 11px; color: #6b7280;">Mobile: 01404-009000</div>
                              <div style="font-size: 11px; color: #6b7280;">Email: support@germanbutcherbd.com</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td width="40%" style="text-align: right; vertical-align: top;">
                        <div style="font-size: 14px; font-weight: bold; color: #8B0000; margin-bottom: 4px;">Ticket #${data.ticketId}</div>
                        <div style="font-size: 12px; color: #666666;">${currentDate}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
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

              <!-- Footer -->
              <tr>
                <td style="padding: 28px 32px; border-top: 3px solid #8B0000; background-color: #fafafa; border-radius: 0 0 8px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="70%" style="vertical-align: bottom;">
                        <div style="font-size: 16px; font-weight: bold; color: #8B0000; margin-bottom: 12px;">🙏 Thank you for choosing German Butcher</div>
                        <div style="font-size: 12px; color: #4b5563; margin-bottom: 5px; font-weight: 500;">📍 House-56/B, Road-132, Gulshan-1, Dhaka</div>
                        <div style="font-size: 12px; color: #4b5563; margin-bottom: 5px; font-weight: 500;">📧 support@germanbutcherbd.com</div>
                        <div style="font-size: 12px; color: #4b5563; margin-bottom: 5px; font-weight: 500;">📞 +8809666791991 | +8801404-009000</div>
                        <div style="font-size: 12px; color: #4b5563; margin-bottom: 12px; font-weight: 500;">🌐 www.germanbutcherbd.com</div>
                        <div style="font-size: 11px; color: #6b7280; padding-top: 10px; border-top: 1px solid #e5e7eb; margin-bottom: 12px;">
                          Follow us on social media for exclusive offers!
                        </div>
                        <div style="margin-top: 12px;">
                          <a href="https://www.facebook.com/germanbutcherbd" target="_blank" style="display: inline-block; margin-right: 12px; text-decoration: none;">
                            <img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" alt="Facebook" width="32" height="32" style="display: block;" />
                          </a>
                          <a href="https://www.instagram.com/germanbutcherbd" target="_blank" style="display: inline-block; text-decoration: none;">
                            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="32" height="32" style="display: block;" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
