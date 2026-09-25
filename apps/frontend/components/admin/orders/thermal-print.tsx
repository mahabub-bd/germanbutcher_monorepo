import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import type { Order, OrderItem } from "@/utils/types";

/**
 * Open a print window with an 80mm thermal invoice for the order.
 * Used by the Print action in the OrderActions header.
 */
export function printThermalInvoice(order: Order): void {
  // Create a new window for printing
  const printWindow = window.open("", "", "width=300,height=600");
  if (!printWindow) {
    throw new Error("Failed to open print window");
  }

  const orderSummary = calculateOrderSummary(order);

  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order #${order.orderNo}</title>
  <style>
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body { margin: 0; padding: 0; }
    }

    body {
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.3;
      color: #000;
      width: 80mm;
      margin: 0 auto;
      padding: 3mm;
      background: white;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .center { text-align: center; }
    .bold { font-weight: 700; }
    .large { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
    .small { font-size: 11px; fontWeight: 700; }

    img.logo {
      width: 50px;
      height: auto;
      display: block;
      margin: 0 auto 3px;
    }

    .separator {
      border-top: 1px dashed #000;
      margin: 5px 0;
      clear: both;
    }

    .double-separator {
      border-top: 2px solid #000;
      margin: 6px 0;
      clear: both;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      min-height: 17px;
    }

    .row span:first-child {
      flex-shrink: 1;
    }

    .row span:last-child {
      flex-shrink: 0;
      margin-left: 5px;
    }

    .item-row {
      margin: 5px 0;
    }

    .item-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .item-name {
      flex: 1;
      font-weight: 700;
      word-wrap: break-word;
      padding-right: 5px;
      font-size: 12px;
    }

    .item-qty {
      flex: 0 0 auto;
      text-align: right;
      min-width: 65px;
      font-size: 11px;
      font-weight: 700;
    }

    .item-price {
      flex: 0 0 auto;
      text-align: right;
      min-width: 60px;
      font-weight: 700;
      font-size: 12px;
    }

    .footer {
      margin-top: 12px;
      font-size: 11px;
      text-align: center;
      font-weight: 700;
    }

    strong {
      font-weight: 700;
    }

    span {
      font-weight: 700;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="center">
    <img class="logo" src="/images/logo3.png" alt="German Butcher Logo" title="German Butcher" />
    <div class="large">GERMAN BUTCHER</div>
    <div class="small" style="margin-top: 2px;">House-56/B, Road-132, Gulshan-1, Dhaka</div>
    <div class="small">Mobile: 01404-009000</div>
    <div class="small">support@germanbutcher.com</div>
    <div class="separator"></div>
    <div style="font-weight: 700; margin: 3px 0;">INVOICE</div>
  </div>

  <div class="separator"></div>

  <div class="row"><span>Order #:</span><span class="bold">${order.orderNo}</span></div>
  <div class="row"><span>Date:</span><span>${formatDateTime(order.createdAt)}</span></div>

  <div class="separator"></div>

  <!-- Customer Info -->
  <div class="bold" style="margin-bottom: 3px;">CUSTOMER DETAILS</div>
  <div style="margin-top: 4px;">
  <div style="margin-bottom: 2px;"><strong>Name:</strong> ${order.user.name || ""}</div>
  <div style="margin-bottom: 2px;"><strong>Email:</strong> ${order.user.email || "N/A"}</div>
  <div><strong>Mobile:</strong> ${order.user.mobileNumber || "N/A"}</div>
  </div>

  ${
    order.address
      ? `
      <div class="small" style="margin-top: 5px;">
        <strong>Shipping Address:</strong><br>
        <span style="margin-left: 2px;">${order.address.address}, ${order.address.area}, ${order.address.city}</span>
      </div>
      `
      : ""
  }

  <div class="separator"></div>

  <!-- Order Items -->
  <div class="bold" style="margin-bottom: 5px;">ORDER ITEMS</div>

  ${order.items
    .map((item: OrderItem) => {
      const unitPrice =
        Number(item.unitPrice) || Number(item.product.sellingPrice) || 0;
      const totalPrice = Number(item.totalPrice) || unitPrice * item.quantity;
      const unitDiscount = Number(item.unitDiscount) || 0;
      const weight =
        item.product.weight &&
        Number(item.product.weight).toString().replace(/\.0+$/, "");
      const unitName = item.product.unit?.name?.toLowerCase() || "";

      return `
        <div class="item-row">
          <div class="item-line">
            <span class="item-name" title="${item.product.name}">${item.product.name}</span>
            <span class="item-qty" title="Quantity: ${item.quantity} × ${weight}${unitName}">${item.quantity} × ${weight}${unitName}</span>
            <span class="item-price" title="Price: ${formatCurrencyEnglish(totalPrice)}">${formatCurrencyEnglish(totalPrice)}</span>
          </div>
        </div>
      `;
    })
    .join("")}

  <div class="separator"></div>

  <!-- Summary -->
  <div class="row"><span>Subtotal:</span><span style="font-weight: 600;">${formatCurrencyEnglish(orderSummary.originalSubtotal)}</span></div>

  ${
    orderSummary.productDiscountTotal > 0
      ? `<div class="row"><span>Product Discount:</span><span style="font-weight: 600;">-${formatCurrencyEnglish(orderSummary.productDiscountTotal)}</span></div>`
      : ""
  }

  ${
    order.coupon && orderSummary.couponDiscount > 0
      ? `<div class="row"><span>Coupon (${order.coupon.code}):</span><span style="font-weight: 600;">-${formatCurrencyEnglish(orderSummary.couponDiscount)}</span></div>`
      : ""
  }

  <div class="row"><span>Shipping:</span><span style="font-weight: 600;">${formatCurrencyEnglish(orderSummary.shippingCost)}</span></div>

  <div class="separator"></div>

  <div class="row bold" style="font-size: 15px; margin: 5px 0;"><span>TOTAL:</span><span>${formatCurrencyEnglish(orderSummary.total)}</span></div>

  ${
    order.paymentStatus === "pending"
      ? `<div class="row" style="color: #000; background: #fff; padding: 3px 0;"><span>DUE:</span><span class="bold">${formatCurrencyEnglish(order.totalValue - order.paidAmount)}</span></div>`
      : ""
  }

  <div class="row"><span>Payment:</span><span class="bold">${order.paymentStatus.toUpperCase()}</span></div>

  <div class="separator"></div>

  <!-- Footer -->
  <div class="footer" style="margin-top: 15px;">
    <div style="margin-bottom: 5px;">Thank you for your order!</div>
    <div>Visit again at <strong>germanbutcherbd.com</strong></div>
  </div>

  <div class="footer" style="margin-top: 15px; padding-top: 10px;">
    .................................<br>
    <span style="display: block; margin-top: 5px;">Customer Signature</span>
  </div>

</body>
</html>
`;

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
}

function calculateOrderSummary(order: Order) {
  const itemsSubtotal = order.items.reduce((sum, item) => {
    const itemTotal =
      Number(item.totalPrice) ||
      (Number(item.unitPrice) || 0) * item.quantity;
    return sum + itemTotal;
  }, 0);

  const productDiscountTotal = order.items.reduce((sum, item) => {
    const discountTotal = (item.unitDiscount || 0) * item.quantity;
    return sum + Number(discountTotal);
  }, 0);

  const originalSubtotal = itemsSubtotal + productDiscountTotal;

  const couponDiscount = Number(order.totalDiscount) - productDiscountTotal;

  const shippingCost = Number(order.shippingCost ?? order.shippingMethod.cost);

  const total = Number(order.totalValue);

  return {
    originalSubtotal,
    productDiscountTotal,
    couponDiscount,
    itemsSubtotal,
    shippingCost,
    total,
  };
}
