---
kind: build_system
name: pnpm Workspaces Monorepo with Multi-Stage Docker Builds and Compose Orchestration
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - pnpm-workspace.yaml
    - Dockerfile.backend
    - Dockerfile.frontend
    - docker-compose.yml
    - apps/backend/package.json
    - apps/frontend/package.json
---

## Build System Overview

The German Butcher e-commerce monorepo is built around **pnpm workspaces** (v11) orchestrating two apps — a NestJS backend (`apps/backend`) and a Next.js 16 frontend (`apps/frontend`). There is no Makefile or shell-based build script; all orchestration flows through `package.json` scripts, pnpm workspace filters, and multi-stage Dockerfiles.

## Workspace & Dependency Management

- Root `package.json` declares the monorepo name `germanbutcher-monorepo` and exposes top-level scripts that delegate to pnpm filters: `dev`, `build`, `start`, plus per-app variants (`dev:frontend`, `dev:backend`, `build:frontend`, `build:backend`).
- `pnpm-workspace.yaml` registers `apps/*` as workspace packages. It also whitelists native buildable packages via `allowBuilds` (`@scarf/scarf`, `bcrypt`, `sharp`, `unrs-resolver`) and excludes Next.js 16.4.3 packages from the minimum release age check via `minimumReleaseAgeExclude`.
- Both apps are marked `private: true`; there is no shared internal package — each app owns its own `package.json` and dependencies.
- The lockfile is pinned (`pnpm-lock.yaml`); Docker builds use `pnpm install --frozen-lockfile` for reproducible installs.

## App-Level Build Scripts

### Backend (`apps/backend/package.json`)
- `nest build` compiles TypeScript via the Nest CLI; the script then copies the `public/` directory into `dist/public` (`cp -r public dist/public || true`).
- Runtime entrypoint is `node dist/main` (set by Nest's default output).
- Test suite uses Jest (`jest`, `ts-jest`, `supertest`), configured in the `jest` field of `package.json` with `rootDir: src`, `testRegex: .*\.spec\.ts$`, and coverage collected under `../coverage`.
- E2E tests live in `test/jest-e2e.json` and are invoked via `test:e2e`.

### Frontend (`apps/frontend/package.json`)
- Development runs Next.js with Turbopack on port 3002: `next dev --turbopack -p 3002`.
- Production build uses webpack mode: `next build --webpack` (producing `.next/standalone` output consumed by the Dockerfile).
- Linting is delegated to `next lint`.

## Docker Build Pipeline

Two separate multi-stage Dockerfiles produce production images:

### `Dockerfile.backend`
- **Stage 1 (`deps`)**: Installs pnpm v11 globally, copies root manifests + both apps' `package.json` files, runs `pnpm install --frozen-lockfile`. This mirrors the workspace layout required by pnpm's importer tracking.
- **Stage 2 (`builder`)**: Copies only `apps/backend`, sets `NODE_ENV=production`, runs `pnpm --filter germanbutcher-backend build`.
- **Stage 3 (`runner`)**: Runs as non-root user `nestjs` (uid 1001). Copies `node_modules`, `apps/backend/node_modules`, `dist`, `package.json`, and `public` from the builder stage. Exposes port 3000, CMD `node dist/main`.

### `Dockerfile.frontend`
- **Base**: `node:24-alpine` with `libc6-compat`.
- **`build-tools`**: Adds `python3 make g++` for native module compilation, then installs pnpm v11.
- **`deps`**: Same frozen lockfile install pattern as backend, copying both apps' manifests.
- **`builder`**: Copies `apps/frontend`, sets `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `CI=true`, and forwards `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SOCKET_URL` as both build args and env vars. Runs `pnpm --filter germanbutcher-frontend run build`.
- **`production`**: Minimal runtime image running as non-root user `nextjs` (uid 1001). Copies `.next/standalone`, `.next/static`, and `public`. Exposes port 3002, CMD `node apps/frontend/server.js`.

Both images use `node:24-alpine` as the base runtime.

## Local Orchestration

`docker-compose.yml` defines two services on a shared bridge network `germanbutcher-network`:
- `frontend`: built from `Dockerfile.frontend`, port 3002, healthcheck via `wget --spider http://localhost:3002`, env file `./apps/frontend/.env`.
- `backend`: built from `Dockerfile.backend`, port 3000, healthcheck via `wget --spider http://localhost:3000/v1`, env file `./apps/backend/.env`.
- Two named volumes (`frontend-cache`, `backend-cache`) are declared but not attached to any service.

Top-level npm scripts wrap compose: `docker:dev`, `docker:build`, `docker:up`, `docker:down`, `docker:logs`.

## Per-App Config Files

- Backend: `nest-cli.json`, `tsconfig.build.json`, `tsconfig.json`, `.eslintrc.js`, `.prettierrc`, `vercel.json`.
- Frontend: `next.config.js`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json` (shadcn/ui), `proxy.ts`, `tsconfig.json`.
- Both apps have `.dockerignore` files to exclude `node_modules` and build artifacts from the Docker context.

## Conventions Observed

- All dependency installation is done through pnpm workspaces; no `yarn.lock` or `package-lock.json` exists at the root.
- Docker builds always use `--frozen-lockfile` to pin dependency resolution.
- Each Dockerfile follows a three-stage pattern: deps → builder → runner, with a minimal Alpine runtime and a dedicated non-root user.
- Environment variables for the frontend are passed as Docker `ARG`s and promoted to `ENV` so they are baked into the Next.js standalone build.
- Healthchecks target known endpoints: `/v1` for the backend and the root path for the frontend.
- Native Node modules (`bcrypt`, `sharp`, `unrs-resolver`, `@scarf/scarf`) are explicitly whitelisted in `pnpm-workspace.yaml` via `allowBuilds`.
- No CI pipeline configuration (GitHub Actions, GitLab CI, etc.) was found in the repository tree.