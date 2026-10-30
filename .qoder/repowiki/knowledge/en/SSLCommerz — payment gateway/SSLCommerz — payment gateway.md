---
kind: external_dependency
name: SSLCommerz — payment gateway
slug: sslcommerz
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### SSLCommerz
- Role: Payment gateway integration for order payments.
- Integration point: `apps/backend/src/ssl-payment/` module using the `sslcommerz-lts` SDK.
- Credentials configured through backend environment variables.
- Verify exact SDK methods and callback flow against the SSLCommerz docs.