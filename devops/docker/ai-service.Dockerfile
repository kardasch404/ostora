# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

RUN sh -c 'for i in 1 2 3 4; do npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && npm cache clean --force && exit 0; echo "npm ci failed (attempt $i), retrying..."; npm cache clean --force; done; exit 1'

COPY apps/ai-service ./apps/ai-service
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate

RUN npx nx build ai-service --prod

# ==================== RUNNER STAGE ====================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl && addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/ai-service ./dist

RUN mkdir -p logs cache && chown -R ostora:ostora logs cache

USER ostora

ENV NODE_ENV=production
ENV PORT=4723

EXPOSE 4723

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4723/api', (r) => {process.exit((r.statusCode || 500) < 500 ? 0 : 1)}).on('error', () => process.exit(1))"

CMD ["node", "dist/src/main.js"]
