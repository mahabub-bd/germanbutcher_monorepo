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
          <strong style="color: #1f2937;">${item.productName}</strong>
        </td>
        <td style="padding: 12px; text-align: center; color: #374151; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; color: #374151; background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">৳${item.price.toFixed(2)}</td>
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
        <td width="48%" style="vertical-align: top; padding-right: 2%;">
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
        <td width="48%" style="vertical-align: top; padding-left: 2%;">
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
      <title>Order Confirmation - ${orderData.orderNo}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

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
                        <!-- Invoice Header -->
                    
                        <div style="font-size: 14px; font-weight: bold; color: #333333; margin-bottom: 4px;">${orderData.orderNo}</div>
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
                    Dear <strong style="color: #1f2937;">${orderData.customerName}</strong>,
                  </p>
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 28px 0;">
                    Thank you for your order! We're pleased to confirm that we've received your order successfully. Below are the details of your purchase.
                  </p>

                  ${shippingInfoHTML}

                  <!-- Order Items -->
                  <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: bold; color: #8B0000; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px;">Order Items</div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #d1d5db; border-collapse: collapse;">
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
                      <td width="55%">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                          <tr>
                            <td style="padding: 18px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Subtotal:</td>
                                  <td style="padding: 6px 0; font-size: 12px; color: #1e293b; text-align: right; font-weight: 500;">৳${orderData.subtotal.toFixed(2)}</td>
                                </tr>
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
                                  <td style="padding: 6px 0; font-size: 12px; color: #1e293b; text-align: right; font-weight: 500;">৳${orderData.shippingFee.toFixed(2)}</td>
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

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
