---
kind: error_handling
name: Error Handling in German Butcher Monorepo (NestJS + Next.js)
category: error_handling
scope:
    - '**'
source_files:
    - apps/backend/src/main.ts
    - apps/backend/src/coupon/coupon.service.ts
    - apps/backend/src/address/address.service.ts
    - apps/backend/src/auth/auth.service.ts
    - apps/backend/src/auth/guards/jwt-refresh.guard.ts
    - apps/backend/src/auth/decorators/get-user.decorator.ts
    - apps/backend/src/address/address.controller.ts
    - apps/backend/src/common/interceptors/http-cache.interceptor.ts
    - apps/frontend/app/error.tsx
    - apps/frontend/app/global-error.tsx
    - apps/frontend/app/not-found.tsx
    - apps/frontend/actions/auth.ts
    - apps/frontend/actions/jwt-utils.ts
---

# Error Handling in German Butcher Monorepo

## Overview

The monorepo has two distinct error-handling approaches, one per application:

- **Backend (`apps/backend`)** — NestJS-based, using Nest's built-in `HttpException` hierarchy and global pipes/interceptors.
- **Frontend (`apps/frontend`)** — Next.js App Router, using plain `try/catch` around server actions and API routes, with dedicated `error.tsx` / `global-error.tsx` page-level error boundaries.

There is no shared error type library between the two apps; each side handles errors independently.

---

## Backend: NestJS Exception Hierarchy

### Core approach

All domain/business errors are raised by throwing Nest's built-in HTTP exception classes from services and controllers:

| Exception class | Typical use |
|---|---|
| `BadRequestException` | Invalid input, validation failures, business-rule violations (e.g. inactive/expired coupon) |
| `UnauthorizedException` | Missing or invalid JWT, OTP failures |
| `ForbiddenException` | Insufficient permissions |
| `NotFoundException` | Entity not found (user, address, etc.) |
| `InternalServerErrorException` | Generic fallback for unexpected failures |
| `ServiceUnavailableException` | External service down (e.g. SMS provider) |
| `HttpException` (base) | Custom status codes (e.g. `HttpStatus.GONE` for expired coupons) |

No custom `*Exception` subclasses are defined anywhere in the codebase — all thrown errors come directly from `@nestjs/common`.

### Global error shaping

`src/main.ts` registers a single global `ValidationPipe` that:

- Enables `whitelist: true` (strips unknown fields)
- Enables `transform: true` with `enableImplicitConversion`

This pipe converts DTO validation failures into `BadRequestException`s automatically. There is **no** global `ExceptionFilter` registered — Nest's default `BaseExceptionFilter` handles the remaining exceptions and serializes them as JSON responses.

Global interceptors applied in `main.ts`:

- `ClassSerializerInterceptor` — strips `@Exclude()` fields (password, otp) from every response.
- `AnalyticsInterceptor` — records request analytics.

Neither of these interceptors catches or transforms errors; they pass through the observable chain.

### Local try/catch pattern

Where raw database/repository calls can throw non-HTTP errors, services wrap them in `try/catch` blocks that follow a consistent shape:

```ts
try {
  // ... operation ...
} catch (error) {
  if (error instanceof HttpException) {
    throw error;          // re-throw known HTTP errors unchanged
  }
  throw new HttpException(
    'Failed to <operation>',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
```

This pattern is visible in `coupon.service.ts` (`validateCoupon`, `applyCoupon`) and repeated across other services (`address.service.ts`, `auth.service.ts`, `analytics.service.ts`, `attachment.service.ts`, `business-settings.service.ts`, `client.service.ts`). The intent is to preserve already-shaped HTTP exceptions while wrapping unexpected errors in a generic 500 response.

### Guard/controller-level authorization errors

Authorization failures are thrown explicitly:

- `auth/guards/jwt-refresh.guard.ts` throws `UnauthorizedException` when refresh tokens are missing or invalid.
- `auth/decorators/get-user.decorator.ts` throws `UnauthorizedException('User not found in request')` when the user is absent from the request context.
- `address.controller.ts` throws `ForbiddenException` when a user tries to access another user's address.

### No panic/recover

There is no `process.on('uncaughtException')` or `process.on('unhandledRejection')` handler in `main.ts`. Unhandled promise rejections and uncaught exceptions will propagate to Node's default handlers.

---

## Frontend: Next.js App Router

### Server-side actions

Server actions under `apps/frontend/actions/` (e.g. `auth.ts`, `jwt-utils.ts`) use plain `try/catch` blocks around fetch calls. Errors are caught locally and typically surfaced to the UI via toast/notification state rather than being re-thrown. Example pattern in `actions/auth.ts`:

```ts
try {
  // login / logout / token refresh
} catch (error) {
  // handle locally (toast, redirect, etc.)
}
```

`jwt-utils.ts` throws a plain `Error('Invalid JWT format')` when token parsing fails.

### Route handlers

Route handlers under `apps/frontend/app/api/` (e.g. `pdf-image/route.ts`) also use `try/catch` and return explicit `NextResponse` objects on failure paths.

### Page-level error boundaries

- `apps/frontend/app/error.tsx` — catches errors within route segments.
- `apps/frontend/app/global-error.tsx` — catches top-level app errors.
- `apps/frontend/app/not-found.tsx` — renders 404 pages.

These are standard Next.js App Router error boundary files; there is no custom error middleware or global error formatter beyond what Next provides.

### Client-side utilities

Client helpers under `apps/frontend/utils/` (e.g. `api-utils.ts`, `token-refresh.ts`) use `try/catch` around fetch calls and surface errors via React state or toast notifications. There is no centralized error-reporting SDK or Sentry integration in the code inspected.

---

## Conventions Observed

1. **Backend services throw typed Nest exceptions** (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ForbiddenException`, `InternalServerErrorException`, `ServiceUnavailableException`) rather than returning error objects or strings.
2. **Business-rule violations map to specific HTTP statuses**: e.g. expired coupon → `HttpException(..., HttpStatus.GONE)` (410), inactive coupon → `BadRequestException` (400).
3. **Unexpected errors are wrapped** in a generic `HttpException` with `INTERNAL_SERVER_ERROR` inside `try/catch` blocks, after first re-throwing any already-shaped `HttpException`.
4. **Input validation is delegated** to Nest's global `ValidationPipe`; controllers/services do not manually validate DTOs before throwing `BadRequestException`.
5. **Authorization checks throw `UnauthorizedException` / `ForbiddenException`** at guard, decorator, and controller boundaries.
6. **Frontend server actions swallow errors locally** and communicate failures to the UI layer (toasts, form state) instead of propagating them up.
7. **No custom exception filter or global error reporter** is registered on either side — Nest's default filter and Next.js default error pages are used.
8. **No `panic`/`recover` equivalent** exists; unhandled exceptions are left to the runtime.

### Rules enforced by the framework

- Nest's `ValidationPipe` (registered globally in `main.ts`) enforces DTO schemas and rejects unknown fields (`whitelist: true`), converting schema mismatches into `BadRequestException`s automatically.
- Nest's `ClassSerializerInterceptor` (registered globally) enforces stripping of `@Exclude()` fields from every serialized response.
- Next.js App Router enforces the presence of `error.tsx` / `global-error.tsx` as the canonical place to render error states for route segments and the whole app.