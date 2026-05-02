FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/job-service/package*.json ./apps/job-service/
RUN npm install --workspace=@ostora/job-service --ignore-scripts || npm install --prefix apps/job-service --ignore-scripts

COPY tsconfig.base.json ./
COPY apps/job-service/tsconfig.json ./apps/job-service/
COPY apps/job-service/src ./apps/job-service/src

WORKDIR /app/apps/job-service
RUN npm run build

FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S ostora && adduser -S ostora -u 1001

WORKDIR /app

COPY --from=builder /app/apps/job-service/node_modules ./node_modules
COPY --from=builder /app/apps/job-service/dist ./dist

RUN mkdir -p logs && chown ostora:ostora logs

USER ostora

ENV NODE_ENV=production
ENV PORT=4720

EXPOSE 4720

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4720/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
