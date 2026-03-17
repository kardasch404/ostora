# Task 5.1 — Job Schema + Ingestion from data-server25

**Branch:** `feat/OSTORA-JOB-1-schema-ingestion`

## ✅ Completed

### 1. Prisma Models

#### JobPost Model
- `id` (UUID)
- `externalId` (String) - External job ID from source
- `source` (Enum: LINKEDIN/INDEED/STELLEN/OTHER)
- `title` (String)
- `companyId` (UUID) - Foreign key to Company
- `location`, `city`, `country` (String)
- `salary` (String)
- `contractType` (Enum: FULL_TIME/PART_TIME/CONTRACT/FREELANCE/INTERNSHIP/TEMPORARY)
- `remote` (Boolean)
- `description` (Text)
- `requirements` (Text)
- `url` (String)
- `postedAt` (DateTime)
- `scrapedAt` (DateTime)
- `isActive` (Boolean)
- **Unique constraint:** `externalId + source` (deduplication)

#### Company Model
- `id` (UUID)
- `name` (String, unique)
- `website` (String)
- `industry` (String)
- `size` (String)
- `country`, `city` (String)
- `logoUrl` (String)
- `description` (Text)

#### JobFavorite Model
- `id` (UUID)
- `userId` (UUID)
- `jobPostId` (UUID)
- `savedAt` (DateTime)
- **Unique constraint:** `userId + jobPostId`

#### JobApplication Model
- `id` (UUID)
- `userId` (UUID)
- `jobPostId` (UUID)
- `bundleId` (UUID, optional)
- `emailConfigId` (UUID, optional)
- `templateId` (UUID, optional)
- `sentAt` (DateTime)
- `status` (Enum: PENDING/SENT/FAILED/REPLIED)
- **Unique constraint:** `userId + jobPostId`

### 2. Migration Script

**File:** `scripts/migration/mysql-to-postgres.ts`

- Reads from MySQL `data-server25`:
  - Database: `linkedin` → Table: `job_posts`
  - Database: `stellen` → Table: `stellen`
- Transforms data to match Prisma schema
- Upserts into PostgreSQL with deduplication
- Maps contract types correctly
- Creates/updates companies automatically

### 3. Deduplication Logic

**File:** `apps/job-service/src/job/job-dedup.service.ts`

- Uses Prisma's `upsert` with unique constraint `externalId_source`
- Prevents duplicate jobs from same source
- Marks old duplicates as inactive
- Ensures data integrity

### 4. Job Service Structure

```
apps/job-service/
├── src/
│   ├── job/
│   │   ├── dto/
│   │   │   ├── search-jobs.dto.ts
│   │   │   └── job.response.ts
│   │   ├── value-objects/
│   │   │   ├── job-search-query.vo.ts
│   │   │   └── salary-range.vo.ts
│   │   ├── job.controller.ts
│   │   ├── job.service.ts
│   │   ├── job.module.ts
│   │   └── job-dedup.service.ts
│   ├── search/
│   │   └── elasticsearch.service.ts
│   ├── sync/
│   │   ├── mysql-reader.service.ts
│   │   ├── job-sync.service.ts
│   │   └── sync.cron.ts (every 30 min)
│   ├── favorite/
│   │   ├── dto/
│   │   │   └── toggle-favorite.dto.ts
│   │   ├── favorite.controller.ts
│   │   └── favorite.service.ts
│   ├── company/
│   │   └── company.service.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── redis/
│   │   ├── redis.service.ts
│   │   └── redis.module.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### 5. Key Features Implemented

✅ **Job CRUD**
- Search jobs with filters (city, country, remote, salary, contract type)
- Get job by ID
- Elasticsearch integration for fast search

✅ **Favorites**
- Toggle favorite
- List user favorites

✅ **Deduplication**
- Unique constraint on `externalId + source`
- Upsert logic prevents duplicates
- Marks old entries as inactive

✅ **Sync Service**
- Reads from MySQL data-server25
- Syncs to PostgreSQL + Elasticsearch
- Runs every 30 minutes via cron
- Handles LinkedIn and Stellen sources

✅ **Caching**
- Redis caching for search results (5 min TTL)
- SHA256 hash for cache keys

✅ **Value Objects**
- `JobSearchQuery` - Builds Elasticsearch DSL
- `SalaryRange` - Validates and formats salary ranges

### 6. Dependencies Installed

```json
{
  "@nestjs/core": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "@nestjs/microservices": "^10.0.0",
  "@nestjs/swagger": "^7.0.0",
  "@prisma/client": "^5.0.0",
  "@elastic/elasticsearch": "^8.0.0",
  "mysql2": "^3.0.0",
  "ioredis": "^5.0.0",
  "kafkajs": "^2.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1",
  "winston": "^3.0.0",
  "nest-winston": "^1.9.0"
}
```

### 7. API Endpoints

**Jobs**
- `GET /jobs/search` - Search with filters (q, city, country, remote, salary, contractType, page, limit)
- `GET /jobs/:id` - Get job details

**Favorites**
- `POST /favorites/toggle` - Toggle favorite
- `GET /favorites` - List user favorites

### 8. Commits

1. ✅ `feat(JOB-1): Prisma models for JobPost, Company, Favorite, Application`
2. ✅ `feat(JOB-1): migration script from data-server25 MySQL to PostgreSQL`
3. ✅ `feat(JOB-1): deduplication logic by externalId + source`

## Next Steps

- Run Prisma migration: `npx prisma migrate dev --name add_job_models`
- Generate Prisma client: `npx prisma generate`
- Run migration script: `ts-node scripts/migration/mysql-to-postgres.ts`
- Start job-service: `npm run dev` (Port 4720)
- Access Swagger: http://localhost:4720/api/docs

## Configuration

Create `.env` file in `apps/job-service/`:

```env
PORT=4720
DATABASE_URL=postgresql://postgres:postgres@localhost:5445/ostora
MYSQL_HOST=localhost
MYSQL_PORT=3345
MYSQL_USER=root
MYSQL_PASSWORD=root
REDIS_HOST=localhost
REDIS_PORT=6345
ELASTICSEARCH_URL=http://localhost:9245
```

---

**Status:** ✅ COMPLETE
**Branch:** `feat/OSTORA-JOB-1-schema-ingestion`
**Ready for:** Push to remote and create PR to `dev`
