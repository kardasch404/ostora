# ==================== BUILDER STAGE ====================
FROM node:20-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

RUN sh -c 'for i in 1 2 3 4; do npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && npm cache clean --force && exit 0; echo "npm ci failed (attempt $i), retrying..."; npm cache clean --force; done; exit 1'

COPY apps/payment-service ./apps/payment-service
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate
RUN npx nx build payment-service --prod

# ==================== RUNNER STAGE ====================
FROM node:20-bullseye-slim AS runner

RUN groupadd -g 1001 ostora && useradd -m -u 1001 -g 1001 ostora

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/payment-service ./dist
COPY --from=builder --chown=ostora:ostora /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p logs && chown ostora:ostora logs

USER ostora

ENV NODE_ENV=production
ENV PORT=4724

EXPOSE 4724

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4724/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/main.js"]
