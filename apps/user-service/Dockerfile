# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY apps/user-service ./apps/user-service
COPY libs ./libs
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build user-service

# Stage 2: Production
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Copy environment file template
COPY --chown=nestjs:nodejs .env.example .env

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 4719

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4719/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/apps/user-service/main.js"]
