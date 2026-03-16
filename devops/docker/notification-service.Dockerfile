# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

RUN npm ci && npm cache clean --force

COPY apps/notification-service ./apps/notification-service
COPY libs ./libs

RUN npx nx build notification-service --prod

# ==================== RUNNER STAGE ====================
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/notification-service ./dist

RUN mkdir -p logs && chown ostora:ostora logs

USER ostora

ENV NODE_ENV=production
ENV PORT=4727

EXPOSE 4727

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4727/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
