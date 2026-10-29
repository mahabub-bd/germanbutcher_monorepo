---
kind: external_dependency
name: ZeptoMail — transactional email provider
slug: zeptomail
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### ZeptoMail
- Role: Transactional email delivery service for the platform.
- Integration point: `apps/backend/src/email/` module using the `zeptomail` npm package.
- Credentials injected via backend environment variables.
- Verify exact API shape against the ZeptoMail docs.