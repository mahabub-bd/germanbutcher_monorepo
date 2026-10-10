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

const wrap = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="background-color:#8B0000;padding:20px 32px;">
                <h1 style="margin:0;color:#ffffff;font-size:18px;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;font-size:14px;color:#3f3f46;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:11px;color:#a1a1aa;">German Butcher admin notification</p>
              </td>
            </tr>
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
