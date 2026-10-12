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

export const generateNewOrderAlertHTML = (data: NewOrderAlertData) =>
  wrap(
    'New Order Received',
    `
    <p>New order <strong>${data.orderNo}</strong> was placed by <strong>${data.customerName}</strong>.</p>
    <p><strong>Items:</strong> ${data.itemCount} &nbsp;•&nbsp; <strong>Total:</strong> ৳${data.totalAmount}</p>
    <p>Manage it in the admin panel: <a href="https://germanbutcherbd.com/admin/orders" style="color:#8B0000;">Orders</a></p>
    `,
  );
