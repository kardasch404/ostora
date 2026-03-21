FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY apps/user-service ./apps/user-service

FROM node:20-alpine

RUN apk add --no-cache openssl && addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/apps/user-service ./apps/user-service
COPY --from=builder --chown=ostora:ostora /app/node_modules/.prisma ./node_modules/.prisma

RUN npm install -g ts-node typescript @swc/core @swc/helpers && chown -R ostora:ostora /app

RUN mkdir -p logs uploads && chown -R ostora:ostora logs uploads

USER ostora

ENV NODE_ENV=production
ENV PORT=4719
ENV TS_NODE_TRANSPILE_ONLY=true

EXPOSE 4719

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4719/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["ts-node", "-P", "apps/user-service/tsconfig.json", "apps/user-service/src/main.ts"]
