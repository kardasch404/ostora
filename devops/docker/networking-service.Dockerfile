# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && npm cache clean --force

COPY apps/networking-service ./apps/networking-service
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate
RUN npx nx build networking-service --prod

# ==================== RUNNER STAGE ====================
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/networking-service ./dist
COPY --from=builder --chown=ostora:ostora /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p logs && chown ostora:ostora logs

USER ostora

ENV NODE_ENV=production
ENV PORT=4728

EXPOSE 4728

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4728/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
