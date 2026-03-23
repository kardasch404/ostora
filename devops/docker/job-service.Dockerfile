FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/job-service/package*.json ./
RUN npm install --ignore-scripts

COPY tsconfig.base.json /
COPY apps/job-service/tsconfig.json ./
COPY apps/job-service/src ./src

RUN npm run build

FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p logs && chown ostora:ostora logs

USER ostora

ENV NODE_ENV=production
ENV PORT=4720

EXPOSE 4720

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4720/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/app/src/main.js"]
