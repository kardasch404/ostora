# Fast Apply - Quick Start Guide

## Prerequisites

- Node.js >= 18
- PostgreSQL running on port 5445
- Redis running on port 6345
- Ollama installed (optional, for local AI)

## Setup

### 1. Install Dependencies

```bash
cd apps/ai-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key variables:
```env
PORT=4723
DATABASE_URL=postgresql://postgres:postgres@localhost:5445/ostora
REDIS_HOST=localhost
REDIS_PORT=6345
BLAZEAI_API_KEY=your_key_here
OLLAMA_API_URL=http://localhost:11434
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

```bash
npx prisma migrate deploy
```

### 5. Start the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Usage

### 1. Create Required Data

#### Email Config
```sql
INSERT INTO email_configs (id, user_id, email, password_encrypted, smtp_host, smtp_port, encryption, from_name, is_active)
VALUES (
  'email-config-1',
  'user-1',
  'user@example.com',
  'encrypted_password',
  'smtp.gmail.com',
  587,
  'TLS',
  'John Doe',
  true
);
```

#### Application Bundle
```sql
INSERT INTO application_bundles (id, user_id, name, slug)
VALUES ('bundle-1', 'user-1', 'My Bundle', 'my-bundle');

INSERT INTO application_documents (id, bundle_id, type, filename, s3_key, s3_url, file_size, mime_type)
VALUES (
  'doc-1',
  'bundle-1',
  'CV',
  'resume.pdf',
  'users/user-1/resume.pdf',
  'https://s3.amazonaws.com/ostora/users/user-1/resume.pdf',
  102400,
  'application/pdf'
);
```

#### Message Template
```sql
INSERT INTO message_templates (id, user_id, name, subject, body, language, is_default, is_active)
VALUES (
  'template-1',
  'user-1',
  'Professional Template',
  'Application for ~#job_title at ~#company_name',
  'Dear ~#rh_name,\n\nI am writing to express my interest in the ~#job_title position at ~#company_name...',
  'en',
  true,
  true
);
```

#### User Subscription (Premium)
```sql
INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end)
VALUES (
  'sub-1',
  'user-1',
  'PREMIUM_MONTHLY',
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '30 days'
);
```

### 2. Start Fast Apply

```bash
curl -X POST http://localhost:4723/api/ai/fast-apply \
  -H "Content-Type: application/json" \
  -d '{
    "jobIds": ["job-1", "job-2", "job-3"],
    "bundleId": "bundle-1",
    "emailConfigId": "email-config-1",
    "templateId": "template-1",
    "userId": "user-1"
  }'
```

**Response:**
```json
{
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Processing 3 applications...",
  "jobCount": 3,
  "status": "processing"
}
```

### 3. Check Progress

```bash
curl http://localhost:4723/api/ai/fast-apply/550e8400-e29b-41d4-a716-446655440000/progress
```

**Response:**
```json
{
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "total": 3,
  "completed": 2,
  "failed": 0,
  "status": "processing",
  "progress": 66,
  "startTime": 1234567890,
  "endTime": null
}
```

## Testing with Postman

### Collection

```json
{
  "info": {
    "name": "Fast Apply API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Start Fast Apply",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"jobIds\": [\"job-1\", \"job-2\"],\n  \"bundleId\": \"bundle-1\",\n  \"emailConfigId\": \"email-config-1\",\n  \"templateId\": \"template-1\",\n  \"userId\": \"user-1\"\n}"
        },
        "url": {
          "raw": "http://localhost:4723/api/ai/fast-apply",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4723",
          "path": ["api", "ai", "fast-apply"]
        }
      }
    },
    {
      "name": "Get Progress",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:4723/api/ai/fast-apply/{{batchId}}/progress",
          "protocol": "http",
          "host": ["localhost"],
          "port": "4723",
          "path": ["api", "ai", "fast-apply", "{{batchId}}", "progress"]
        }
      }
    }
  ]
}
```

## Troubleshooting

### Service won't start

**Error:** `Cannot connect to database`
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL
```

**Error:** `Cannot connect to Redis`
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6345 ping
```

### Jobs not processing

**Check BullMQ queue:**
```bash
# Install Bull Board for monitoring
npm install @bull-board/express

# Access at http://localhost:4723/admin/queues
```

**Check Redis keys:**
```bash
redis-cli -h localhost -p 6345
> KEYS fast-apply:*
> HGETALL fast-apply:batch:{batchId}
```

### AI generation failing

**BlazeAI not available:**
```bash
# Check API key
echo $BLAZEAI_API_KEY

# Test endpoint
curl https://blazeai.boxu.dev/v1/models \
  -H "Authorization: Bearer $BLAZEAI_API_KEY"
```

**Ollama not running:**
```bash
# Start Ollama
ollama serve

# Pull model
ollama pull llama3

# Test
curl http://localhost:11434/api/tags
```

### Email not sending

**Check email config:**
```sql
SELECT * FROM email_configs WHERE id = 'email-config-1';
```

**Test SMTP:**
```bash
# Use telnet to test SMTP
telnet smtp.gmail.com 587
```

## Monitoring

### Redis Keys to Monitor

```bash
# Batch progress
KEYS fast-apply:batch:*

# Session data
KEYS ai:session:*

# BlazeAI credits
KEYS blazeai:credits:used:*
```

### Database Queries

```sql
-- Check applications created
SELECT COUNT(*) FROM job_post_applications 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check batch status
SELECT 
  user_id,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
FROM job_post_applications
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY user_id;
```

### Logs

```bash
# Follow logs
tail -f logs/ai-service.log

# Filter Fast Apply logs
tail -f logs/ai-service.log | grep FastApply
```

## Performance Tips

### 1. Optimize Concurrency

For large batches (>30 jobs), increase concurrency:

```typescript
// In fast-apply.service.ts
if (jobCount > 30) concurrency = 10;
```

### 2. Use BlazeAI for Speed

Ensure BlazeAI credits are available for faster processing:

```bash
curl http://localhost:4723/api/ai/credits
```

### 3. Batch Size

Optimal batch size: 10-25 jobs
- Too small: Overhead
- Too large: Long wait times

### 4. Redis Connection Pool

```typescript
// In app.module.ts
BullModule.forRoot({
  redis: {
    host: 'localhost',
    port: 6345,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  },
})
```

## Next Steps

1. ✅ Service running
2. ✅ Test with sample data
3. 🔄 Integrate with email-service
4. 🔄 Add WebSocket notifications
5. 🔄 Write unit tests
6. 🔄 Deploy to staging

## Support

- Documentation: `FAST-APPLY-IMPLEMENTATION.md`
- Issues: Create GitHub issue
- Slack: #ai-service channel
- Email: dev@ostora.com
