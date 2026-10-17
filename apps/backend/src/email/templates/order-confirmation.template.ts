import {
  EMAIL_RESPONSIVE_STYLES,
  generateEmailFooter,
  generateEmailHeader,
} from './email-layout.template';

export interface OrderEmailData {
  orderNo: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  shippingFee: number;
  totalValue: number;
  shippingMethod: string;
  paymentMethod: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    unitDiscount?: number;
    productImage?: string | null;
  }>;
  shippingAddress?: {
    address: string;
    city: string;
    phone: string;
  };
  coupon?: {
    code: string;
    discountAmount: number;
  };
  bogo?: Array<{
    campaignName: string;
    discountAmount: number;
    freeUnits: number;
  }>;
}

export function generateOrderConfirmationHTML(
  orderData: OrderEmailData,
): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHTML = orderData.items
    .map(
      (item, index) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <table cellpadding="0" cellspacing="0">
            <tr>
              ${item.productImage ? `
              <td style="padding-right: 10px; vertical-align: middle;">
                <img src="${item.productImage}"
                     alt="${item.productName}"
                     width="40"
                     height="40"
                     style="display: block; border-radius: 4px; border: 1px solid #e5e7eb; object-fit: cover;" />
              </td>
              ` : ''}
              <td style="vertical-align: middle;">
                <strong style="color: #1f2937;">${item.productName}</strong>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 12px; text-align: center; color: #374151; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; color: #374151; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; white-space: nowrap;">
          ${(item.unitDiscount ?? 0) > 0
            ? `<span style="text-decoration: line-through; color: #9ca3af; margin-right: 6px;">৳${(item.price + Number(item.unitDiscount)).toFixed(2)}</span>৳${item.price.toFixed(2)}`
            : `৳${item.price.toFixed(2)}`}
        </td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: #374151; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">৳${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `,
    )
    .join('');

  const shippingInfoHTML = orderData.shippingAddress
    ? `
    <!-- Customer & Shipping Info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td class="em-half" width="48%" style="vertical-align: top; padding-right: 2%;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-left: 4px solid #8B0000; border-radius: 6px;">
            <tr>
              <td style="padding: 18px;">
                <div style="font-size: 12px; font-weight: bold; color: #8B0000; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Information</div>
                <div style="font-size: 12px; color: #666666; margin-bottom: 6px;">
                  <strong style="color: #333333; display: inline-block; width: 70px;">Name:</strong>
                  <span style="color: #333333;">${orderData.customerName}</span>
                </div>
                <div style="font-size: 12px; color: #666666; margin-bottom: 6px;">
                  <strong style="color: #333333; display: inline-block; width: 70px;">Email:</strong>
                  <span style="color: #333333;">${orderData.customerEmail}</span>
                </div>
                <div style="font-size: 12px; color: #666666;">
                  <strong style="color: #333333; display: inline-block; width: 70px;">Phone:</strong>
                  <span style="color: #333333;">${orderData.shippingAddress.phone}</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td class="em-half" width="48%" style="vertical-align: top; padding-left: 2%;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-left: 4px solid #8B0000; border-radius: 6px;">
            <tr>
              <td style="padding: 18px;">
                <div style="font-size: 12px; font-weight: bold; color: #8B0000; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</div>
                <div style="font-size: 12px; color: #666666; margin-bottom: 6px;">
                  <strong style="color: #333333; display: inline-block; width: 70px;">Address:</strong>
                  <span style="color: #333333;">${orderData.shippingAddress.address}</span>
                </div>
                <div style="font-size: 12px; color: #666666;">
                  <strong style="color: #333333; display: inline-block; width: 70px;">City:</strong>
                  <span style="color: #333333;">${orderData.shippingAddress.city}</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${EMAIL_RESPONSIVE_STYLES}
      <title>Order Confirmation - ${orderData.orderNo}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              ${generateEmailHeader(orderData.orderNo, currentDate)}

              <!-- Content -->
              <tr>
                <td class="em-content" style="padding: 32px;">
                  <!-- Greeting -->
                  <p style="font-size: 14px; color: #374151; margin: 0 0 8px 0;">
                    Dear <strong style="color: #1f2937;">${orderData.customerName}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 28px 0;">
                    Thank you for your order! We're pleased to confirm that we've received your order successfully. Below are the details of your purchase.
                  </p>

                  ${shippingInfoHTML}

                  <!-- Order Items -->
                  <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: bold; color: #8B0000; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px;">Order Items</div>
                    <table class="em-items" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #d1d5db; border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #8B0000;">
                          <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase;">Product Details</th>
                          <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase;">Quantity</th>
                          <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase;">Unit Price</th>
                          <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: bold; color: #ffffff; text-transform: uppercase;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                    </table>
                  </div>

                  <!-- Order Summary -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="45%"></td>
                      <td class="em-summary" width="55%">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                          <tr>
                            <td style="padding: 18px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Subtotal:</td>
                                  <td style="padding: 6px 0; font-size: 12px; color: #1e293b; text-align: right; font-weight: 500;">৳${orderData.subtotal.toFixed(2)}</td>
                                </tr>
                                ${
                                  (orderData.bogo ?? [])
                                    .map(
                                      (usage) => `
                                <tr>
                                  <td style="padding: 6px 0; font-size: 12px; color: #16a34a;">BOGO — ${usage.campaignName} (${usage.freeUnits} free):</td>
                                  <td style="padding: 6px 0; font-size: 12px; color: #16a34a; text-align: right; font-weight: 500;">-৳${usage.discountAmount.toFixed(2)}</td>
                                </tr>
                                `,
                                    )
                                    .join('')
                                }
                                ${
                                  orderData.coupon
                                    ? `
                                <tr>
                                  <td style="padding: 6px 0; font-size: 12px; color: #16a34a;">Coupon (${orderData.coupon.code}):</td>
                                  <td style="padding: 6px 0; font-size: 12px; color: #16a34a; text-align: right; font-weight: 500;">-৳${orderData.coupon.discountAmount.toFixed(2)}</td>
                                </tr>
                                `
                                    : ''
                                }
                                <tr>
                                  <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Shipping (${orderData.shippingMethod}):</td>
                                  ${
                                    Number(orderData.shippingFee) > 0
                                      ? `<td style="padding: 6px 0; font-size: 12px; color: #1e293b; text-align: right; font-weight: 500;">৳${orderData.shippingFee.toFixed(2)}</td>`
                                      : `<td style="padding: 6px 0; font-size: 12px; color: #16a34a; text-align: right; font-weight: 500;">Free Delivery</td>`
                                  }
                                </tr>
                                <tr>
                                  <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Payment Method:</td>
                                  <td style="padding: 6px 0; font-size: 12px; color: #1e293b; text-align: right; font-weight: 500;">${orderData.paymentMethod}</td>
                                </tr>
                                <tr>
                                  <td colspan="2" style="padding: 12px 0;">
                                    <div style="height: 1px; background-color: #cbd5e1;"></div>
                                  </td>
                                </tr>
                                <tr>
                                  <td colspan="2">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #8B0000; border-radius: 6px;">
                                      <tr>
                                        <td style="padding: 16px; font-size: 14px; font-weight: bold; color: #ffffff;">TOTAL AMOUNT</td>
                                        <td style="padding: 16px; font-size: 18px; font-weight: bold; color: #ffffff; text-align: right;">৳${orderData.totalValue.toFixed(2)}</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
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
