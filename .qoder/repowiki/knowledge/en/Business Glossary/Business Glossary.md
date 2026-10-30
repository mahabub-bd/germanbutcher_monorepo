---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Stock Movement
- Definition：A single recorded change to a product's inventory, capturing the signed quantity delta plus the before/after stock levels. Movements are created automatically on purchases, sales, cancellations/reversals, and manually via adjustments.
- Aliases：movement、stock change

### Movement Type
- Definition：The category of a stock movement, one of: `purchase`, `purchase_reversal`, `order_sale`, `order_cancel`, or `adjustment`. Drives the icon, label, and color coding in the ledger UI.
- Aliases：type、kind

### Units In
- Definition：Summary metric counting the total positive quantity added to stock across the filtered set of movements (purchases, returns, restocks). Computed server-side by summing `GREATEST(quantity, 0)`.
- Aliases：inbound units

### Units Out
- Definition：Summary metric counting the total negative quantity removed from stock across the filtered set of movements (sales, reversals, shrinkage). Computed server-side by summing `LEAST(quantity, 0)` and taking its absolute value.
- Aliases：outbound units

### Stock Movement History
- Definition：The admin page/component (`/admin/products/stock-movements`) that renders the chronological ledger of stock changes, with per-type chips, product-name search, date-range presets, pagination, and mobile card layout. It is also reused inside product detail views and dialogs.
- Aliases：movements ledger、stock history
