import {
  EMAIL_RESPONSIVE_STYLES,
  generateEmailFooter,
  generateEmailHeader,
} from './email-layout.template';

export interface NewReviewAlertData {
  customerName: string;
  productName: string;
  rating: number;
  title?: string | null;
  comment: string;
}

export interface NewOrderAlertData {
  orderNo: string;
  customerName: string;
  totalAmount: number | string;
  itemCount: number;
  /** Same item shape as the customer confirmation email (invoice-style table). */
  items?: Array<{
    productName: string;
    quantity: number;
    price: number;
    unitDiscount?: number;
    productImage?: string | null;
  }>;
  /** BOGO campaigns applied to this order (name snapshot + amounts) */
  bogo?: Array<{
    campaignName: string;
    discountAmount: number;
    freeUnits: number;
  }>;
}

const wrap = (rightTitle: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${rightTitle}</title>
    ${EMAIL_RESPONSIVE_STYLES}
  </head>
  <body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;background-color:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            ${generateEmailHeader(rightTitle, 'Admin Notification')}
            <tr>
              <td class="em-content" style="padding:24px 32px;font-size:14px;color:#3f3f46;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            ${generateEmailFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

export const generateNewReviewAlertHTML = (data: NewReviewAlertData) =>
  wrap(
    'New Product Review Awaiting Approval',
    `
    <p><strong>${data.customerName}</strong> left a <strong>${data.rating}-star</strong> review (${stars(data.rating)}) on <strong>${data.productName}</strong>.</p>
    ${data.title ? `<p><strong>Title:</strong> ${data.title}</p>` : ''}
    <p style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:12px 16px;">${data.comment}</p>
    <p>Approve or reject it in the admin panel: <a href="https://germanbutcherbd.com/admin/review/review-list" style="color:#8B0000;">Review moderation</a></p>
    `,
  );

export const generateNewOrderAlertHTML = (data: NewOrderAlertData) => {
  // Invoice-style items table, matching the customer confirmation email
  const itemsHTML = (data.items ?? [])
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

  return wrap(
    'New Order Received',
    `
    <p>New order <strong>${data.orderNo}</strong> was placed by <strong>${data.customerName}</strong>.</p>
    <p><strong>Items:</strong> ${data.itemCount} &nbsp;•&nbsp; <strong>Total:</strong> ৳${data.totalAmount}</p>
    ${itemsHTML ? `
    <div style="margin-bottom: 24px;">
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
    ` : ''}
    ${(data.bogo ?? []).length > 0 ? `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: bold; color: #8B0000; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">BOGO Deals Applied</div>
      ${data.bogo!
        .map(
          (usage) => `
      <div style="padding: 8px 12px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px; margin-bottom: 6px; font-size: 12px; color: #333333;">
        <strong>${usage.campaignName}</strong> — ${usage.freeUnits} free unit${usage.freeUnits !== 1 ? 's' : ''} given, discount <strong style="color: #16a34a;">৳${usage.discountAmount.toFixed(2)}</strong>
      </div>
      `,
        )
        .join('')}
    </div>
    ` : ''}
    <p>Manage it in the admin panel: <a href="https://germanbutcherbd.com/admin/orders" style="color:#8B0000;">Orders</a></p>
    `,
  );
};
