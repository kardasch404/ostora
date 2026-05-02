FROM node:20-bookworm-slim AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN sh -c 'for i in 1 2 3 4; do npm ci --ignore-scripts --no-audit --no-fund --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 && npm cache clean --force && exit 0; echo "npm ci failed (attempt $i), retrying..."; npm cache clean --force; done; exit 1'

COPY prisma ./prisma
RUN npx prisma generate

COPY apps/user-service ./apps/user-service

FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl \
    python3 \
    python3-venv \
    python3-pip \
    chromium \
    ca-certificates \
    fonts-freefont-ttf \
    libnss3 \
  && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/pyenv \
  && /opt/pyenv/bin/pip install --no-cache-dir playwright \
  && PLAYWRIGHT_BROWSERS_PATH=/ms-playwright /opt/pyenv/bin/python -m playwright install chromium

RUN groupadd -g 1001 ostora && useradd -m -u 1001 -g ostora ostora

WORKDIR /app

COPY --from=builder --chown=ostora:ostora /app/node_modules ./node_modules
COPY --from=builder --chown=ostora:ostora /app/apps/user-service ./apps/user-service
COPY --from=builder --chown=ostora:ostora /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=ostora:ostora apps/scraping-service/src ./apps/scraping-service/src

RUN npm install -g ts-node typescript @swc/core @swc/helpers && chown -R ostora:ostora /app

RUN mkdir -p logs uploads && chown -R ostora:ostora logs uploads

USER ostora

ENV NODE_ENV=production
ENV PORT=4719
ENV TS_NODE_TRANSPILE_ONLY=true
ENV PATH=/opt/pyenv/bin:$PATH
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV LINKEDIN_SCRAPER_SCRIPT_PATH=/app/apps/scraping-service/src/scrape_profil.py
ENV LINKEDIN_SCRAPER_PYTHON_CMD=/opt/pyenv/bin/python

EXPOSE 4719

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4719/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["ts-node", "-P", "apps/user-service/tsconfig.json", "apps/user-service/src/main.ts"]
