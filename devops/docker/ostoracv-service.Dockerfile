FROM node:20-bookworm-slim

ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 ostora && useradd -m -u 1001 -g ostora ostora

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

COPY tsconfig.base.json ./
COPY apps/ostoracv-service ./apps/ostoracv-service

RUN npm install -g ts-node typescript @swc/core @swc/helpers && chown -R ostora:ostora /app

USER ostora

ENV NODE_ENV=production
ENV PORT=4731
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV TS_NODE_TRANSPILE_ONLY=true

EXPOSE 4731

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4731/api/v1/ostoracv/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["ts-node", "-P", "apps/ostoracv-service/tsconfig.json", "apps/ostoracv-service/src/main.ts"]
