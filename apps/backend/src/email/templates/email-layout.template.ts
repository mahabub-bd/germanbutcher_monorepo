/**
 * Shared email header/footer matching the invoice (order confirmation)
 * template: logo + company info header with the dark-red rule, and the
 * contact/social footer.
 */

const LOGO_URL =
  'https://germanbutcher.s3.ap-southeast-1.amazonaws.com/31ab7b72-a761-47d5-9d79-33b6a68227e4.webp';

export function generateEmailHeader(rightTitle: string, rightSubtitle: string): string {
  return `
              <!-- Header -->
              <tr>
                <td style="padding: 32px; border-bottom: 3px solid #8B0000; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="60%" style="vertical-align: top;">
                        <!-- Logo and Company Info -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-right: 15px; vertical-align: top;">
                              <img src="${LOGO_URL}"
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
                        <div style="font-size: 14px; font-weight: bold; color: #333333; margin-bottom: 4px;">${rightTitle}</div>
                        <div style="font-size: 12px; color: #666666;">${rightSubtitle}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
  `;
}

export function generateEmailFooter(): string {
  return `
              <!-- Footer -->
              <tr>
                <td style="padding: 28px 32px; border-top: 3px solid #8B0000; background-color: #fafafa;">
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
  `;
}
