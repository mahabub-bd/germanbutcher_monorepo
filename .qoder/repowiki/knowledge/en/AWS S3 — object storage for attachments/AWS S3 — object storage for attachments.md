---
kind: external_dependency
name: AWS S3 — object storage for attachments
slug: aws-s3
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### AWS S3
- Role: Object storage backend for uploaded files; used via the attachment module.
- Integration point: `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner` declared in `apps/backend/package.json`; credentials come from the backend `.env` (`AWS_*` variables).
- Usage model: presigned URLs are generated for client-side upload/download rather than proxying file bodies through the API.
- Verify exact SDK calls and env var names against the official AWS docs.