# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nx.json ./

RUN npm ci && npm cache clean --force

COPY apps/ai-service ./apps/ai-service
COPY libs ./libs

RUN npx nx build ai-service --prod

# ==================== RUNNER STAGE ====================
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/dist/apps/ai-service ./dist

RUN mkdir -p logs cache && chown -R ostora:ostora logs cache

USER ostora

ENV NODE_ENV=production
ENV PORT=4723

EXPOSE 4723

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4723/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
