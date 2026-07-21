# German Butcher E-commerce Platform

A modern, full-stack e-commerce platform built as a monorepo with Next.js 16 frontend and NestJS 11 backend. Designed for performance, scalability, and developer experience.

## 🏗️ Architecture Overview

```
germanbutcher-monorepo/
├── apps/
│   ├── frontend/              # Next.js 16 e-commerce frontend
│   │   ├── app/              # App Router pages and layouts
│   │   ├── components/       # Reusable UI components (Radix UI + custom)
│   │   ├── lib/              # Utilities and configurations
│   │   ├── public/           # Static assets
│   │   ├── Dockerfile        # Multi-stage production build
│   │   └── package.json
│   │
│   └── backend/               # NestJS 11 API backend
│       ├── src/              # Application source code
│       │   ├── modules/      # Feature modules (auth, products, orders, etc.)
│       │   ├── common/       # Shared utilities, guards, decorators
│       │   ├── config/       # Configuration files
│       │   └── main.ts       # Application entry point
│       ├── public/           # Static files
│       ├── Dockerfile        # Multi-stage production build
│       └── package.json
│
├── docker-compose.yml        # Container orchestration
├── package.json             # Root package.json with workspace scripts
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── README.md                # This file
```

## ✨ Key Features

### Frontend (Next.js 16)
- **Modern Stack**: React 19, Next.js 16 with App Router, Turbopack for dev
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS v4 with modern design system
- **Rich Text Editor**: TipTap with image, link, and alignment extensions
- **State Management**: Redux Toolkit for global state
- **Real-time**: Socket.IO client for live updates
- **Data Visualization**: Recharts for analytics dashboards
- **Form Handling**: React Hook Form with Zod validation
- **PDF Generation**: React PDF renderer for invoices/reports
- **Image Optimization**: Sharp and Plaiceholder for blur placeholders
- **Dark Mode**: next-themes for seamless theme switching
- **Responsive**: Mobile-first design with react-responsive
- **Animations**: Framer Motion for smooth transitions
- **Date Handling**: date-fns and react-day-picker

### Backend (NestJS 11)
- **Modern Framework**: NestJS 11 with TypeScript 6
- **Database**: TypeORM with PostgreSQL
- **Authentication**: JWT-based auth with Passport
- **Real-time**: Socket.IO for WebSocket connections
- **API Documentation**: Swagger/OpenAPI auto-generated docs
- **File Storage**: AWS S3 integration with presigned URLs
- **Email**: ZeptoMail for transactional emails
- **Payment**: SSLCommerz integration
- **Security**: Helmet for security headers, rate limiting with Throttler
- **Caching**: Cache-manager for performance optimization
- **Task Scheduling**: NestJS Schedule for cron jobs
- **Validation**: class-validator and class-transformer
- **Testing**: Jest for unit and e2e tests

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x (22.x recommended for production)
- **pnpm** >= 9.x
- **PostgreSQL** database (external or managed)
- **Docker** (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd germanbutcher_monorepo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment files**
   ```bash
   # Create environment files from examples (if available)
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Configure environment variables**
   
   Edit the `.env` files with your actual values:
   
   **Backend (.env)**:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=your-secret-key
   PORT=3000
   NODE_ENV=development
   # AWS S3, Email, Payment gateway credentials...
   ```
   
   **Frontend (.env.local)**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/v1
   NEXT_PUBLIC_BASE_URL=http://localhost:3002
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   ```

### Development

Start all applications in development mode:
```bash
pnpm dev
```

Or run individual applications:
```bash
pnpm dev:frontend  # Next.js on http://localhost:3002
pnpm dev:backend   # NestJS on http://localhost:3000
```

## 🐳 Docker Deployment

### Build and Run with Docker Compose

1. **Set up environment files** (as above)

2. **Build and start containers**
   ```bash
   pnpm docker:up
   ```

3. **Services will be available at:**
   - **Frontend**: http://localhost:3002
   - **Backend API**: http://localhost:3000/v1
   - **API Documentation**: http://localhost:3000/docs

### Docker Management Commands

```bash
pnpm docker:build    # Build images without starting
pnpm docker:down     # Stop and remove containers
pnpm docker:logs     # View container logs
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm dev:frontend` | Start frontend only (Next.js with Turbopack) |
| `pnpm dev:backend` | Start backend only (NestJS with watch mode) |
| `pnpm build` | Build all applications for production |
| `pnpm build:frontend` | Build frontend only |
| `pnpm build:backend` | Build backend only |
| `pnpm start` | Start all production builds |
| `pnpm docker:up` | Build and start Docker containers |
| `pnpm docker:down` | Stop Docker containers |
| `pnpm docker:logs` | View Docker container logs |

### Backend-Specific Scripts

```bash
cd apps/backend
pnpm test          # Run unit tests
pnpm test:e2e      # Run end-to-end tests
pnpm test:cov      # Run tests with coverage
pnpm lint          # Lint code
pnpm format        # Format code with Prettier
```

### Frontend-Specific Scripts

```bash
cd apps/frontend
pnpm lint          # Lint code with ESLint
```

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 16.2.3 (App Router)
- **UI Library**: React 19.2.5
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI primitives
- **State**: Redux Toolkit
- **Forms**: React Hook Form + Zod
- **Rich Text**: TipTap editor
- **Charts**: Recharts
- **PDF**: React PDF Renderer
- **Icons**: Lucide React, React Icons
- **Animation**: Framer Motion
- **Socket**: Socket.IO Client
- **Image**: Sharp, Plaiceholder

### Backend
- **Framework**: NestJS 11.1.17
- **Language**: TypeScript 6
- **Database**: PostgreSQL with TypeORM 0.3.28
- **Validation**: class-validator, class-transformer
- **Auth**: JWT, Passport
- **Real-time**: Socket.IO 4.8.3
- **Docs**: Swagger/OpenAPI
- **Storage**: AWS S3 SDK
- **Email**: ZeptoMail
- **Payment**: SSLCommerz
- **Security**: Helmet, Throttler
- **Cache**: Cache Manager
- **Schedule**: NestJS Schedule

### DevOps
- **Package Manager**: pnpm 9.x (workspace)
- **Containers**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Node**: 22-alpine (frontend), 20-alpine (backend)

## 🌐 API Documentation

Once the backend is running, access the interactive API documentation at:
```
http://localhost:3000/docs
```

The Swagger UI provides:
- Endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication testing

## 🗄️ Database

This project uses an external PostgreSQL database. Ensure you have:

1. A running PostgreSQL instance
2. A database created for the application
3. Connection string in `apps/backend/.env`

Example connection string format:
```
postgresql://username:password@host:5432/database_name
```

## 🔐 Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Configurable throttling per endpoint
- **Security Headers**: Helmet for HTTP protection
- **Input Validation**: class-validator on all DTOs
- **SQL Injection**: TypeORM parameterized queries
- **CORS**: Configured for specific origins
- **File Upload**: Validated and processed safely

## 🧪 Testing

### Backend Testing

```bash
cd apps/backend

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:cov
```

### Frontend Testing

The frontend is configured with testing infrastructure. Add test scripts as needed in `apps/frontend/package.json`.

## 🛠️ Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 3002 (Windows)
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

**2. Database connection errors**
- Verify PostgreSQL is running
- Check connection string in `.env`
- Ensure database exists and user has permissions

**3. Docker build failures**
- Clear Docker cache: `docker system prune -a`
- Ensure pnpm is installed correctly in container
- Check for network connectivity issues

**4. Frontend build issues**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `pnpm install --force`
- Check Node.js version compatibility

## 📦 Production Deployment

### Environment Variables

Required production environment variables:

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `NODE_ENV=production`
- AWS S3 credentials for file storage
- Email service credentials
- Payment gateway credentials

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Production API endpoint
- `NEXT_PUBLIC_BASE_URL` - Production frontend URL
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket endpoint

### Build Commands

```bash
# Build for production
pnpm build

# Start production servers
pnpm start
```

### Docker Production

The included Dockerfiles use multi-stage builds for optimized production images:

- **Frontend**: Node.js 22 Alpine with standalone Next.js output
- **Backend**: Node.js 20 Alpine with compiled TypeScript

Both run as non-root users for security.

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js and NestJS configs
- **Formatting**: Prettier for consistent code style
- **Commit Messages**: Follow conventional commits

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Ensure linting passes
6. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 👤 Author

**Mahabub Hossain**

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check API documentation at `/docs` endpoint

---

Built with ❤️ using Next.js, NestJS, and modern web technologies.
