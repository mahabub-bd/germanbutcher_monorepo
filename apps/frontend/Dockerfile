# Base stage - minimal Alpine with Node.js only
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Build stage with tools for compiling native modules
FROM base AS build-tools

# Install build tools only for this stage
RUN apk add --no-cache libc6-compat python3 make g++ \
    && rm -rf /var/cache/apk/*

# Install pnpm
RUN npm install -g pnpm@9

FROM build-tools AS deps

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./
COPY .npmrc* ./

# Install dependencies with frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .

# Set environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Build arguments for public environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

# Build the application
RUN pnpm run build

# Production stage - start from clean base (no build tools)
FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Build arguments for runtime environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone output - this already includes only necessary production dependencies
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]
