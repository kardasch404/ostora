# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

RUN npm ci && npm cache clean --force

COPY apps/user-service ./apps/user-service
COPY libs ./libs
COPY prisma ./prisma

RUN npx prisma generate
RUN npx nx build user-service --prod

# ==================== RUNNER STAGE ====================
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/user-service ./dist
COPY --from=builder --chown=ostora:ostora /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p logs uploads && chown -R ostora:ostora logs uploads

USER ostora

ENV NODE_ENV=production
ENV PORT=4719

EXPOSE 4719

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4719/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
