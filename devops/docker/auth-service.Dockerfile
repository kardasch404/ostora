# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules and Prisma OpenSSL detection/runtime
RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

# Install workspace deps (including dev deps needed for TypeScript/Nx build) while skipping prepare scripts like husky.
# Rebuild native bcrypt binding explicitly since install scripts are skipped.
RUN npm ci --include=dev --ignore-scripts \
  && npm rebuild bcrypt --build-from-source \
  && npm cache clean --force

COPY apps/auth-service ./apps/auth-service
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate
RUN npx tsc -p apps/auth-service/tsconfig.json

# ==================== RUNNER STAGE ====================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -g 1001 -S ostora && \
    adduser -S ostora -u 1001 -G ostora

WORKDIR /app

# Copy dependencies and built files
COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/auth-service ./dist
COPY --from=builder --chown=ostora:ostora /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=ostora:ostora /app/package.json ./package.json

# Create logs directory
RUN mkdir -p logs && chown -R ostora:ostora logs

# Switch to non-root user
USER ostora

# Environment variables
ENV NODE_ENV=production
ENV PORT=4718

EXPOSE 4718

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4718/api/v1/auth/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/apps/auth-service/src/main.js"]
