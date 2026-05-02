# Job Service

Job CRUD, Search (Elasticsearch), Favorites, Email Dispatch

## Port
- **4720** - Job Service

## Features
- ✅ Job CRUD operations
- ✅ Advanced search with Elasticsearch
- ✅ Job favorites
- ✅ MySQL to PostgreSQL sync (every 30 min)
- ✅ Deduplication by externalId + source
- ✅ Redis caching
- ✅ Swagger documentation

## Tech Stack
- NestJS 10
- Prisma ORM
- Elasticsearch
- Redis
- MySQL (data-server25)
- PostgreSQL

## Installation

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Jobs
- `GET /jobs/search` - Search jobs with filters
- `GET /jobs/:id` - Get job by ID

### Favorites
- `POST /favorites/toggle` - Toggle favorite
- `GET /favorites` - List user favorites

## Swagger
http://localhost:4720/api/docs
