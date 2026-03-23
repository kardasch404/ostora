# ==================== BUILDER STAGE ====================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY apps/email-service/package.json ./apps/email-service/package.json
RUN npm --prefix ./apps/email-service install --no-audit --no-fund

COPY apps/email-service ./apps/email-service
COPY prisma ./prisma

RUN cd ./apps/email-service && npx prisma generate --schema=../../prisma/schema.prisma
RUN npm --prefix ./apps/email-service run build

# ==================== RUNNER STAGE ====================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
RUN addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/apps/email-service/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/apps/email-service/dist ./dist
COPY --from=builder --chown=ostora:ostora /app/apps/email-service/src/template/hbs ./dist/template/hbs

RUN mkdir -p logs templates && chown -R ostora:ostora logs templates

USER ostora

ENV NODE_ENV=production
ENV PORT=4721

EXPOSE 4721

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4721/api/docs', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
