# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./
COPY prisma ./prisma

RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && npm cache clean --force

RUN npx prisma generate

COPY apps/notification-service ./apps/notification-service
COPY libs ./libs

RUN npx nx build notification-service --prod

# ==================== RUNNER STAGE ====================
FROM node:20-bullseye-slim AS runner

RUN groupadd -g 1001 ostora && useradd -m -u 1001 -g 1001 ostora

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/notification-service ./dist
COPY --from=builder --chown=ostora:ostora /app/apps/notification-service/package*.json ./
COPY --from=builder --chown=ostora:ostora /app/prisma ./prisma

RUN npx prisma generate --schema=./prisma/schema.prisma

RUN mkdir -p logs && chown ostora:ostora logs

USER ostora

ENV NODE_ENV=production
ENV PORT=4727

EXPOSE 4727

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const net=require('net');const s=net.connect(4727,'127.0.0.1');s.on('connect',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),2000);"

CMD ["node", "dist/src/main.js"]
