# German Butcher E-commerce Platform

A monorepo containing the German Butcher e-commerce platform with Next.js frontend and NestJS backend.

## Project Structure

```
germanbutcher/
├── apps/
│   ├── frontend/       # Next.js 16 e-commerce frontend
│   └── backend/        # NestJS 11 API backend
├── docker-compose.yml  # Docker orchestration
├── package.json        # Root package.json
└── pnpm-workspace.yaml # pnpm workspace configuration
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20.x
- [pnpm](https://pnpm.io/) >= 9.x
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## Quick Start

### Local Development

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment files:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

3. Update environment variables with your actual values

4. Run both applications:
```bash
pnpm dev
```

Or run individually:
```bash
pnpm dev:frontend  # Next.js on http://localhost:3002
pnpm dev:backend   # NestJS on http://localhost:3000
```

### Docker Deployment

1. Set up environment files (as above)

2. Build and run with Docker Compose:
```bash
pnpm docker:up
```

3. Services will be available at:
- Frontend: http://localhost:3002
- Backend API: http://localhost:3000/v1
- API Docs: http://localhost:3000/docs

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development |
| `pnpm dev:frontend` | Start frontend only |
| `pnpm dev:backend` | Start backend only |
| `pnpm build` | Build all apps |
| `pnpm docker:up` | Build and start Docker containers |
| `pnpm docker:down` | Stop Docker containers |
| `pnpm docker:logs` | View Docker logs |

## Applications

### Frontend (Next.js 16)
- Port: 3002
- Tech: React 19, Tailwind CSS v4, Radix UI, TipTap
- Location: `apps/frontend/`

### Backend (NestJS 11)
- Port: 3000
- Tech: TypeORM, PostgreSQL, Socket.IO, Swagger
- API Base: `/v1`
- Docs: `/docs`
- Location: `apps/backend/`

## Environment Variables

See `.env.example` files in each app directory:
- [apps/backend/.env.example](apps/backend/.env.example)
- [apps/frontend/.env.example](apps/frontend/.env.example)

## Database

This project uses an external PostgreSQL database (not included in Docker Compose). Update `apps/backend/.env` with your database credentials.

## License

Proprietary - All rights reserved

## Author

Mahabub Hossain
