import {
  EMAIL_RESPONSIVE_STYLES,
  generateEmailFooter,
  generateEmailHeader,
} from './email-layout.template';

export interface AbandonedCartReminderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AbandonedCartReminderEmailData {
  customerName: string;
  customerEmail: string;
  items: AbandonedCartReminderItem[];
  subtotal: number;
  cartUrl: string;
}

/** formats a BDT amount without the ৳ glyph for maximum client support */
function taka(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** "You left something behind" reminder for an abandoned cart: lists the
 * exact line items still in the cart with a CTA back to it. */
export function generateAbandonedCartReminderHTML(
  data: AbandonedCartReminderEmailData,
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const itemRows = data.items
    .map(
      (item) => `
                <tr>
                  <td class="em-items" style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151;">
                    ${item.name}
                  </td>
                  <td class="em-items" style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center;">
                    ${item.quantity}
                  </td>
                  <td class="em-items" style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; text-align: right;">
                    ৳${taka(item.lineTotal)}
                  </td>
                </tr>`,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${EMAIL_RESPONSIVE_STYLES}
      <title>Your cart is waiting for you</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 8px;">

              ${generateEmailHeader('Your cart is waiting', currentDate)}

              <!-- Content -->
              <tr>
                <td class="em-content" style="padding: 32px;">
                  <p style="font-size: 14px; color: #374151; margin: 0 0 8px 0;">
                    Dear <strong style="color: #1f2937;">${data.customerName}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0;">
                    You left some items in your cart at German Butcher. They are still available — complete your order before they run out of stock.
                  </p>

                  <!-- Items table -->
                  <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: bold; color: #8B0000; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px;">Items in your cart</div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #f8fafc;">
                          <th class="em-items" align="left" style="padding: 10px 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Product</th>
                          <th class="em-items" align="center" style="padding: 10px 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Qty</th>
                          <th class="em-items" align="right" style="padding: 10px 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Total</th>
                        </tr>
                      </thead>
                      <tbody>${itemRows}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td class="em-items" colspan="2" style="padding: 12px 8px; font-size: 13px; font-weight: bold; color: #1f2937; text-align: right;">Subtotal</td>
                          <td class="em-items" style="padding: 12px 8px; font-size: 14px; font-weight: bold; color: #8B0000; text-align: right;">৳${taka(data.subtotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 8px 0 4px 0;">
                        <a href="${data.cartUrl}" style="display: inline-block; background-color: #8B0000; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 36px; border-radius: 6px;">
                          Return to Your Cart
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; color: #9ca3af; margin: 24px 0 0 0; text-align: center;">
                    If the button does not work, copy this link into your browser:<br>
                    <a href="${data.cartUrl}" style="color: #8B0000; word-break: break-all;">${data.cartUrl}</a>
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
