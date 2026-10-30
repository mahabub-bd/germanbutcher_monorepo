---
kind: logging_system
name: NestJS Logger-Based Logging in Backend Services
category: logging_system
scope:
    - '**'
source_files:
    - apps/backend/src/main.ts
    - apps/backend/src/auth/auth.service.ts
    - apps/backend/src/auth/sms.service.ts
    - apps/backend/src/analytics/analytics.service.ts
    - apps/backend/src/attachment/attachment.service.ts
    - apps/backend/src/email/email.service.ts
    - apps/backend/src/order/order.service.ts
    - apps/backend/src/user/user.service.ts
    - apps/backend/src/notification/notification.service.ts
    - apps/backend/src/notification/notification.gateway.ts
---

## What system/approach is used

The backend (`apps/backend`, NestJS 11) uses **NestJS built-in `Logger`** from `@nestjs/common` for all application logging. There is no third-party logging framework (no Winston, Pino, Bunyan, log4js, or similar). The frontend (`apps/frontend`, Next.js 16) does not define a dedicated logging system — it relies on standard browser/Node console output.

There is no centralized logger configuration file: `apps/backend/src/main.ts` bootstraps the Nest application without calling `Logger.setLogLevels()` or configuring transports/sinks. Log output therefore goes to the default NestJS console sink (stdout/stderr), and log levels are not programmatically filtered at startup.

## Key files and packages

- `apps/backend/package.json` — declares `@nestjs/common` as the source of `Logger`; no additional logging dependency.
- `apps/backend/src/main.ts` — bootstrap; no custom logger setup.
- Service classes that instantiate a per-class logger instance:
  - `src/auth/auth.service.ts`
  - `src/auth/sms.service.ts`
  - `src/analytics/analytics.service.ts`
  - `src/attachment/attachment.service.ts`
  - `src/email/email.service.ts`
  - `src/order/order.service.ts`
  - `src/user/user.service.ts`
  - `src/user-activity/user-activity.service.ts`
  - `src/notification/notification.service.ts`
  - `src/notification/notification.gateway.ts`
  - `src/bogo-campaigns/bogo-campaigns.service.ts`
  - `src/bogo-usage-log/bogo-usage-log.service.ts`
  - `src/coupon-usage-log/coupon-usage-log.service.ts`
  - `src/flash-sale-campaigns/flash-sale-campaigns.service.ts`
  - `src/flash-sale-usage-log/flash-sale-usage-log.service.ts`
  - `src/free-delivery-usage-log/free-delivery-usage-log.service.ts`
  - `src/delivery-man/delivery-man.service.ts`
  - `src/product-history/product-history.service.ts`
  - `src/stock-movement/stock-movement.service.ts`

## Architecture and conventions

### Per-class logger instances
Every service that logs declares a private field typed as `Logger` and instantiates it with the class name as the context prefix:

```ts
private readonly logger = new Logger(AuthService.name);
```

This is consistent across ~20 services. The `NotificationGateway` uses a string literal `'NotificationGateway'` instead of the class name. The pattern ensures each log line is prefixed with the originating class name by Nest's internal logger.

### Log level usage
Services use all four public methods of NestJS `Logger`:
- `logger.log(...)` — informational messages (e.g. "Analytics index ready", "File deleted successfully", "SMS sent successfully").
- `logger.warn(...)` — non-fatal warnings (e.g. missing SMS/email config, campaign maxUsage reached).
- `logger.error(...)` — error paths, often including the caught exception message and sometimes `err.stack` (e.g. attachment deletion failure).
- No usage of `logger.debug()`, `logger.verbose()`, or `logger.fatal()` was observed in the codebase.

### Message format
Messages are plain template strings concatenated with values (e.g. `` `Failed to update lastLoginAt: ${err?.message}` ``). There is no structured logging object shape — fields like user id, request id, correlation id, or operation name are embedded inline rather than emitted as separate JSON keys.

### Error handling around logging calls
Non-critical logging writes are fire-and-forget using `void this.someAsync().catch((err) => this.logger.error(...))`. This pattern appears in login flows where audit/activity writes must not block the HTTP response.

### Frontend
No equivalent logging abstraction exists in `apps/frontend`. Console output (if any) would go through the browser `console` API directly; there is no shared logger utility found under `lib/`, `utils/`, or `common/`.

## Conventions and constraints

- **Convention**: Every NestJS service that needs to emit logs creates a `private readonly logger = new Logger(<ClassName>.name);` field and uses it exclusively — no direct `console.log` calls appear inside business services for runtime events. Startup banner text in `main.ts` still uses raw `console.log`, which is acceptable since it is process bootstrap output.
- **Convention**: Log contexts are always the class name (or an explicit string for gateways), never ad-hoc labels.
- **Convention**: Warning-level logs are used for configuration issues (missing env vars for SMS/email) and boundary conditions (campaign limits reached).
- **Constraint**: There is no configured log level threshold — all `log`/`warn`/`error` calls pass through to stdout regardless of environment. Production vs development behavior is not differentiated via `NODE_ENV` in the logging layer.
- **Constraint**: No structured log schema is enforced. Fields are interpolated into message strings rather than emitted as objects, so downstream consumers cannot rely on stable key names.
- **Constraint**: No transport, file sink, remote collector, or log rotation is configured in this repository; output is terminal/console-bound.