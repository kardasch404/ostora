FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.base.json ./
COPY apps/ostoracv-service ./apps/ostoracv-service

RUN npx tsc -p apps/ostoracv-service/tsconfig.json

FROM node:20-bookworm-slim

ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 ostora && useradd -m -u 1001 -g ostora ostora

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

COPY --from=builder /app/apps/ostoracv-service/dist ./apps/ostoracv-service/dist
COPY apps/ostoracv-service/src/templates ./apps/ostoracv-service/src/templates

RUN chown -R ostora:ostora /app

USER ostora

ENV NODE_ENV=production
ENV PORT=4731
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 4731

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4731/api/v1/ostoracv/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/ostoracv-service/dist/main.js"]
