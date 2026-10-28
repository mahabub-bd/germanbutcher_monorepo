# Feature Update — Invoice (Bill) for Client

**Date:** October 28, 2026
**Module:** Frontend — Customer Account (Orders)
**Status:** Planned / Ready for implementation

---

## 1. Overview

Add a client-facing **Invoice (Bill) page** so registered customers can view,
print, and download a formal bill for any of their orders — directly from
their account, without contacting support.

The platform already has:

| Existing | Where |
|---|---|
| PDF invoice download (react-pdf) | Customer order list → "Invoice" button; Admin order view |
| Admin invoice PDF + thermal print | Admin order detail |
| Order confirmation page | Storefront after checkout |

**What is missing** is a proper **in-browser bill page** for the client:
a branded, printable invoice view that opens like a document — not just a
file download.

---

## 2. Objectives

1. Customer can open a full-page **bill view** for any of their own orders.
2. Customer can **print** the bill directly (A4-friendly, clean print layout
   with site header/footer hidden).
3. Customer can still **download the PDF** from the same page.
4. Bill branding comes from **Business Settings** (invoice logo, business
   name, address, phone, email, website) — no hardcoding.
5. Totals on the bill **always match** the existing PDF invoice and the
   admin-side order summary (single source of truth for the calculation).

---

## 3. Feature List

### 3.1 Invoice page (`/user/{id}/order/{orderId}/invoice`)

| # | Feature | Description |
|---|---|---|
| 1 | Invoice header | Business logo (invoice logo → fallback to main logo), business name, address, phone, email |
| 2 | Invoice title block | "INVOICE" heading, order number (`ORD-…`), order date, payment-status pill (Paid / Pending / …) |
| 3 | Bill To | Customer name, email, mobile |
| 4 | Delivery address | Shipping address (falls back to billing address) + payment method |
| 5 | Itemized table | Product name, quantity, unit price, line total (uses stored order-item prices) |
| 6 | Totals block | Subtotal, product discount, BOGO discount, coupon discount, delivery charge, **Grand Total**, **Paid**, **Due** (red when due > 0) |
| 7 | Footer | Thank-you note + website URL |
| 8 | Print | `Print Bill` button — prints only the invoice sheet (toolbar and site chrome hidden via print CSS) |
| 9 | PDF download | Same page offers the existing PDF invoice download |
| 10 | Back navigation | Returns to the order details page |

### 3.2 Entry points

| Location | Addition |
|---|---|
| **My Orders** list (`/user/{id}/orders`) | New **"Bill"** button next to the existing Invoice (PDF) button → opens the invoice page |
| **Order details** page (`/user/{id}/order/{orderId}`) | New **"View Bill"** button in the header actions |

### 3.3 Access & security

- Page loads the order through the **authenticated** order endpoint
  (`Bearer token`), same as the existing order details page.
- A customer can only open bills for orders the API returns to them
  (existing backend authorization applies — no new endpoint needed).

---

## 4. Totals Calculation (must match PDF invoice)

Reuses the exact logic from the existing PDF invoice
(`order-pdf-document.tsx`) so the printed bill and the PDF never disagree:

```
itemsSubtotal       = Σ (item.totalPrice || unitPrice × quantity)
productDiscount     = Σ (unitDiscount × quantity)
bogoDiscount        = Σ bogoUsage.discountAmount
couponDiscount      = totalDiscount − productDiscount − bogoDiscount   (min 0)
deliveryCharge      = shippingCost || shippingMethod.cost
Grand Total         = order.totalValue
Paid                = order.paidAmount
Due                 = max(0, Grand Total − Paid)
```

---

## 5. UI / UX Notes

- Clean A4-style sheet: white card, centered, on a neutral background.
- Dark-mode supported on screen; print output is always light.
- Toolbar (Back / PDF / Print) is screen-only — never printed.
- Currency formatted as `BDT 1,234.00` (consistent with the PDF).

---

## 6. Out of Scope (future enhancements)

- Emailing the bill to the customer automatically (currently: manual print/PDF)
- Multi-currency support
- Partial-payment history table on the bill (payments are visible on the
  order details page)
- Admin-send-invoice-by-email action

---

## 7. Implementation Checklist

- [ ] `components/user-account/client-invoice.tsx` — printable bill component
- [ ] `app/(main)/user/(account)/[id]/order/[orderId]/invoice/page.tsx` — route
- [ ] "Bill" button in **My Orders** list
- [ ] "View Bill" button in **Order Details** header
- [ ] Verify totals match PDF invoice for: normal order, coupon order,
      BOGO order, partially paid order
- [ ] Verify print output (A4) hides toolbar/site chrome
