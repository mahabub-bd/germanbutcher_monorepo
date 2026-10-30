# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [pnpm-workspace.yaml](file://pnpm-workspace.yaml)
- [docker-compose.yml](file://docker-compose.yml)
- [Dockerfile.backend](file://Dockerfile.backend)
- [Dockerfile.frontend](file://Dockerfile.frontend)
- [apps/backend/package.json](file://apps/backend/package.json)
- [apps/frontend/package.json](file://apps/frontend/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Environment Configuration](#environment-configuration)
6. [Development Workflow](#development-workflow)
7. [Docker Compose Setup](#docker-compose-setup)
8. [Database, Migrations, and Seed Data](#database-migrations-and-seed-data)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)
11. [Conclusion](#conclusion)

## Introduction
This guide helps you set up the German Butcher e-commerce platform locally or in production using Docker Compose. The project is a monorepo with:
- Frontend: Next.js 16 (App Router)
- Backend: NestJS 11 API
- Database: PostgreSQL (external or managed)
- Orchestration: Docker Compose for containerized development and production

The repository includes scripts to run both apps together, build them, and manage containers.

## Project Structure
At the root, you will find workspace configuration and orchestration files. Applications live under apps/:
- apps/frontend: Next.js application
- apps/backend: NestJS application

```mermaid
graph TB
Root["Repository Root"] --> Workspace["pnpm-workspace.yaml"]
Root --> Scripts["Root package.json scripts"]
Root --> Compose["docker-compose.yml"]
Root --> DFront["Dockerfile.frontend"]
Root --> DBack["Dockerfile.backend"]
Apps["apps/"] --> FE["apps/frontend/"]
Apps --> BE["apps/backend/"]
FE --> FPackage["apps/frontend/package.json"]
BE --> BPackage["apps/backend/package.json"]
```

**Diagram sources**
- [pnpm-workspace.yaml:1-19](file://pnpm-workspace.yaml#L1-L19)
- [package.json:6-18](file://package.json#L6-L18)
- [docker-compose.yml:1-55](file://docker-compose.yml#L1-L55)
- [Dockerfile.frontend:1-83](file://Dockerfile.frontend#L1-L83)
- [Dockerfile.backend:1-61](file://Dockerfile.backend#L1-L61)
- [apps/frontend/package.json:1-88](file://apps/frontend/package.json#L1-L88)
- [apps/backend/package.json:1-114](file://apps/backend/package.json#L1-L114)

**Section sources**
- [README.md:5-32](file://README.md#L5-L32)
- [pnpm-workspace.yaml:1-19](file://pnpm-workspace.yaml#L1-L19)
- [package.json:6-18](file://package.json#L6-L18)

## Prerequisites
Ensure your machine has the following tools installed before proceeding:
- Node.js: version 20.x or newer (the README recommends 22.x for production; the backend Dockerfile uses node:24-alpine)
- pnpm: version 9.x or newer (the Dockerfiles install pnpm@11 globally)
- PostgreSQL: a running instance and a database created for the application
- Docker and Docker Compose: for containerized setup and builds

Notes:
- The frontend runs on port 3002 by default.
- The backend runs on port 3000 by default.
- The backend uses TypeORM with PostgreSQL.

**Section sources**
- [README.md:67-75](file://README.md#L67-L75)
- [Dockerfile.frontend:1-83](file://Dockerfile.frontend#L1-L83)
- [Dockerfile.backend:1-61](file://Dockerfile.backend#L1-L61)
- [apps/backend/package.json:23-63](file://apps/backend/package.json#L23-L63)

## Installation
Follow these steps to install dependencies and prepare the environment.

1. Clone the repository and enter the project directory.
2. Install all workspace dependencies:
   - Run from the repository root: `pnpm install`
3. Create environment files for the frontend and backend:
   - Frontend: create `apps/frontend/.env.local`
   - Backend: create `apps/backend/.env`
4. Populate the environment variables as described in the next section.

If you prefer containerized setup, proceed to the Docker Compose section after creating the environment files.

**Section sources**
- [README.md:76-94](file://README.md#L76-L94)
- [package.json:6-18](file://package.json#L6-L18)

## Environment Configuration
You must configure environment variables for both applications.

Frontend (.env.local)
- NEXT_PUBLIC_API_URL: URL of the backend API (for example, http://localhost:3000/v1)
- NEXT_PUBLIC_BASE_URL: URL where the frontend is served (for example, http://localhost:3002)
- NEXT_PUBLIC_SOCKET_URL: WebSocket endpoint for real-time features (for example, http://localhost:3000)

Backend (.env)
- DATABASE_URL: PostgreSQL connection string (for example, postgresql://user:password@host:5432/database)
- JWT_SECRET: Secret used for signing JWT tokens
- PORT: Port the backend listens on (default 3000)
- NODE_ENV: Set to development or production
- Optional integrations: AWS S3 credentials, email service credentials, payment gateway credentials

Important notes:
- The Docker Compose file loads env_file for each service from apps/frontend/.env and apps/backend/.env.
- For local development without Docker, the frontend reads .env.local.
- The Dockerfiles pass NEXT_PUBLIC_* variables at build time via ARG and ENV.

**Section sources**
- [README.md:96-114](file://README.md#L96-L114)
- [docker-compose.yml:11-15](file://docker-compose.yml#L11-L15)
- [docker-compose.yml:33-37](file://docker-compose.yml#L33-L37)
- [Dockerfile.frontend:41-47](file://Dockerfile.frontend#L41-L47)
- [Dockerfile.frontend:62-68](file://Dockerfile.frontend#L62-L68)

## Development Workflow
Start the development servers either together or individually.

Run all apps in development mode:
- From the repository root: `pnpm dev`

Run individual apps:
- Frontend only: `pnpm dev:frontend` (Next.js on http://localhost:3002)
- Backend only: `pnpm dev:backend` (NestJS on http://localhost:3000)

Build commands:
- Build all apps: `pnpm build`
- Build frontend only: `pnpm build:frontend`
- Build backend only: `pnpm build:backend`

Production start:
- Start all production builds: `pnpm start`

Backend-specific scripts:
- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`
- Coverage: `pnpm test:cov`
- Lint: `pnpm lint`
- Format: `pnpm format`

Frontend-specific scripts:
- Lint: `pnpm lint`

Workspace navigation:
- The pnpm workspace targets apps/*, so you can run commands scoped to an app using pnpm --filter or navigate into apps/frontend or apps/backend.

**Section sources**
- [README.md:116-184](file://README.md#L116-L184)
- [package.json:6-18](file://package.json#L6-L18)
- [apps/frontend/package.json:5-9](file://apps/frontend/package.json#L5-L9)
- [apps/backend/package.json:8-21](file://apps/backend/package.json#L8-L21)
- [pnpm-workspace.yaml:1-2](file://pnpm-workspace.yaml#L1-L2)

## Docker Compose Setup
Use Docker Compose to build and run the frontend and backend services.

Commands:
- Build and start containers: `pnpm docker:up`
- Build images without starting: `pnpm docker:build`
- Stop and remove containers: `pnpm docker:down`
- View logs: `pnpm docker:logs`

Services:
- Frontend: exposed on port 3002
- Backend: exposed on port 3000

Environment loading:
- Frontend: env_file ./apps/frontend/.env
- Backend: env_file ./apps/backend/.env

Health checks:
- Frontend health check probes http://localhost:3002
- Backend health check probes http://localhost:3000/v1

Network:
- Both services are connected via a bridge network named germanbutcher-network.

Note:
- Ensure ports 3000 and 3002 are free on your host.
- If you use external PostgreSQL, make sure the backend .env points to it.

**Section sources**
- [README.md:129-151](file://README.md#L129-L151)
- [package.json:14-18](file://package.json#L14-L18)
- [docker-compose.yml:1-55](file://docker-compose.yml#L1-L55)

## Database, Migrations, and Seed Data
The backend uses TypeORM with PostgreSQL. You need a running PostgreSQL instance and a database configured via DATABASE_URL in apps/backend/.env.

Migrations and seed data:
- The repository does not include a dedicated migration runner script in the root or apps/backend/package.json scripts.
- There are SQL and JS utility scripts under apps/backend/scripts that may assist with data operations. Use them according to your database setup and TypeORM configuration.
- If you have TypeORM CLI configured, you can run migrations and seeds from within apps/backend using standard TypeORM commands. Otherwise, apply schema changes manually or via your preferred database tooling.

Recommendation:
- Confirm your database connection works by checking the backend logs when starting the server.
- If you need to reset or seed initial data, review the scripts under apps/backend/scripts and execute them against your configured database.

**Section sources**
- [README.md:237-248](file://README.md#L237-L248)
- [apps/backend/package.json:23-63](file://apps/backend/package.json#L23-L63)

## Verification
After installation and configuration, verify that both services are running correctly.

Local development:
- Frontend: open http://localhost:3002
- Backend API: open http://localhost:3000/v1
- API documentation: open http://localhost:3000/docs

Docker Compose:
- Frontend: http://localhost:3002
- Backend API: http://localhost:3000/v1
- API documentation: http://localhost:3000/docs

Checks:
- Ensure the frontend loads and can reach the backend API.
- Ensure the backend responds to requests and serves the OpenAPI docs.
- Check browser console for any CORS or network errors if the frontend cannot call the backend.

**Section sources**
- [README.md:140-144](file://README.md#L140-L144)
- [README.md:224-229](file://README.md#L224-L229)
- [docker-compose.yml:9-10](file://docker-compose.yml#L9-L10)
- [docker-compose.yml:31-32](file://docker-compose.yml#L31-L32)

## Troubleshooting
Common issues and resolutions:

Port conflicts:
- If port 3000 or 3002 is already in use, stop the conflicting process or change the port in the respective environment configuration.
- On Windows, you can identify and terminate processes using the system’s networking utilities.

Database connection problems:
- Verify PostgreSQL is running and accessible.
- Confirm DATABASE_URL in apps/backend/.env is correct and the database exists.
- Ensure the database user has sufficient permissions.

Dependency installation errors:
- Clear caches and reinstall dependencies:
  - Frontend cache: delete the .next directory and reinstall.
  - Force reinstall if needed: `pnpm install --force`.
- Ensure Node.js and pnpm versions match the requirements.

Docker build failures:
- Clear Docker cache if necessary.
- Ensure pnpm is available inside the container (the Dockerfiles install pnpm@11).
- Check network connectivity during dependency installation.

Frontend build issues:
- Clear Next.js cache: delete .next.
- Reinstall dependencies: `pnpm install --force`.
- Validate Node.js version compatibility.

**Section sources**
- [README.md:282-310](file://README.md#L282-L310)
- [Dockerfile.frontend:1-83](file://Dockerfile.frontend#L1-L83)
- [Dockerfile.backend:1-61](file://Dockerfile.backend#L1-L61)

## Conclusion
You now have the prerequisites, installation steps, environment configuration, development workflow, Docker Compose usage, database guidance, verification steps, and troubleshooting tips to get the German Butcher e-commerce platform running. For production deployments, ensure all required environment variables are set securely and consider using managed services for PostgreSQL and other integrations.