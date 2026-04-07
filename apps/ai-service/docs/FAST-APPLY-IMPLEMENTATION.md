# Fast Apply Engine - Premium Feature

## Overview

Fast Apply is a premium feature that allows users to apply to multiple jobs (up to 50) simultaneously. The system generates personalized emails and cover letters for each job using AI, then dispatches them via the user's SMTP configuration. All processing is done in parallel using BullMQ with dynamic concurrency.

## Architecture

### Components

1. **FastApplyController** - HTTP endpoint handler
2. **FastApplyService** - Orchestrator and business logic
3. **FastApplyProcessor** - BullMQ worker for individual job applications
4. **FastApplyProgressService** - Redis-based progress tracking

### Flow

```
POST /api/ai/fast-apply
  ↓
Guard: Check user plan (PREMIUM/ANNUAL/B2B only)
  ↓
Validate: Max 50 jobs, email config, bundle, template
  ↓
Dynamic Concurrency Decision:
  - ≤5 jobs → 3 workers
  - ≤20 jobs → 5 workers
  - >20 jobs → 8 workers
  ↓
AI Provider Selection:
  - BlazeAI credits available → BlazeAI (fast)
  - No credits → Ollama (slower, free)
  ↓
Enqueue all jobs to BullMQ
  ↓
Workers process in parallel:
  1. Load job post from DB
  2. Load user profile
  3. Generate personalized email (AI)
  4. Replace placeholders
  5. Send email via SMTP
  6. Create job application record
  7. Update progress in Redis
  8. Notify via WebSocket
  ↓
GET /api/ai/fast-apply/:batchId/progress
```

## API Endpoints

### Start Fast Apply

```http
POST /api/ai/fast-apply
Content-Type: application/json

{
  "jobIds": ["job-uuid-1", "job-uuid-2", ...],
  "bundleId": "bundle-uuid",
  "emailConfigId": "email-config-uuid",
  "templateId": "template-uuid",
  "userId": "user-uuid" // Optional, extracted from auth
}
```

**Response:**
```json
{
  "batchId": "batch-uuid",
  "message": "Processing 25 applications...",
  "jobCount": 25,
  "status": "processing"
}
```

**Errors:**
- `403` - User plan is FREE (upgrade required)
- `400` - More than 50 jobs
- `404` - Email config, bundle, or template not found
- `401` - User not authenticated

### Get Progress

```http
GET /api/ai/fast-apply/:batchId/progress
```

**Response:**
```json
{
  "batchId": "batch-uuid",
  "total": 25,
  "completed": 18,
  "failed": 2,
  "status": "processing",
  "progress": 72,
  "startTime": 1234567890,
  "endTime": null
}
```

## Database Schema

### Required Tables

```prisma
model EmailConfig {
  id                String
  userId            String
  email             String
  passwordEncrypted String
  smtpHost          String
  smtpPort          Int
  encryption        EmailEncryption
  fromName          String
  isActive          Boolean
}

model ApplicationBundle {
  id          String
  userId      String
  name        String
  slug        String
  documents   ApplicationDocument[]
}

model ApplicationDocument {
  id        String
  bundleId  String
  type      ApplicationDocumentType // CV, COVER_LETTER, etc.
  filename  String
  s3Key     String
  s3Url     String
  fileSize  Int
  mimeType  String
}

model MessageTemplate {
  id        String
  userId    String
  name      String
  subject   String
  body      String
  language  String
}

model JobPost {
  id          String
  title       String
  companyId   String
  company     Company
  description String
  requirements String
  location    String
  url         String
}

model JobPostApplication {
  id            String
  userId        String
  jobPostId     String
  bundleId      String
  emailConfigId String
  templateId    String
  sentAt        DateTime
  status        JobPostApplicationStatus // PENDING, SENT, FAILED
}
```

## Dynamic Concurrency

The system adjusts worker concurrency based on batch size:

| Job Count | Concurrency | Rationale |
|-----------|-------------|-----------|
| 1-5       | 3           | Small batch, conservative |
| 6-20      | 5           | Medium batch, balanced |
| 21-50     | 8           | Large batch, aggressive |

## AI Provider Routing

### BlazeAI (Premium)
- Used when credits available (>100 remaining)
- Fast response times
- Daily quota: 1000 credits
- Threshold: 950 credits (protection)

### Ollama (Fallback)
- Used when BlazeAI unavailable or quota exceeded
- Slower but free
- Local deployment
- Model: llama3

## Email Personalization

### Template Placeholders

- `~#rh_name` - Hiring manager name
- `~#job_title` - Job title
- `~#company_name` - Company name

### AI Prompt

```
Personalize this email template for a job application.

User Profile:
- Name: {user.name}
- Experience: {user.experience}
- Skills: {user.skills}

Job:
- Title: {job.title}
- Company: {job.company}
- Requirements: {job.requirements}

Template:
Subject: {template.subject}
Body: {template.body}

Generate a personalized, professional email.
```

## Redis Keys

### Batch Progress
```
fast-apply:batch:{batchId}
  - total: number
  - completed: number
  - failed: number
  - status: "processing" | "completed" | "failed"
  - startTime: timestamp
  - endTime: timestamp
```

### WebSocket Notifications
```
fast-apply:progress
  - batchId
  - done
  - total
  - currentJob
```

## Priority Queue

Jobs are prioritized based on user plan:

| Plan    | Priority | Description |
|---------|----------|-------------|
| B2B     | 1        | Highest priority |
| ANNUAL  | 2        | High priority |
| PREMIUM | 3        | Normal priority |
| FREE    | 5        | Lowest (blocked) |

## Error Handling

### Retry Strategy
- Attempts: 3
- Backoff: 5000ms (exponential)

### Failure Scenarios
1. **Job not found** - Skip, increment failed
2. **Email send failure** - Retry 3x, then fail
3. **AI generation timeout** - Fallback to Ollama
4. **SMTP error** - Log, increment failed

## Monitoring

### Metrics to Track
- Batch completion rate
- Average time per job
- AI provider usage (BlazeAI vs Ollama)
- Email delivery success rate
- Concurrency utilization

### Logs
```
[FastApply] Processing job {jobId} in batch {batchId}
[FastApply] Completed job {jobId}
[FastApply] Failed job {jobId}: {error}
```

## Testing

### Unit Tests
```bash
npm run test apps/ai-service/src/fast-apply
```

### Integration Test
```bash
curl -X POST http://localhost:4723/api/ai/fast-apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "jobIds": ["job-1", "job-2"],
    "bundleId": "bundle-1",
    "emailConfigId": "email-1",
    "templateId": "template-1"
  }'
```

## Configuration

### Environment Variables
```env
FAST_APPLY_MAX_JOBS=50
FAST_APPLY_CONCURRENCY_LOW=3
FAST_APPLY_CONCURRENCY_MED=5
FAST_APPLY_CONCURRENCY_HIGH=8
```

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/apps/ai-service/main.js"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: ai-service
        image: ostora/ai-service:latest
        env:
        - name: REDIS_HOST
          value: redis-service
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Future Enhancements

1. **A/B Testing** - Test different email templates
2. **Smart Scheduling** - Send emails at optimal times
3. **Follow-up Automation** - Auto-follow-up after N days
4. **Analytics Dashboard** - Track application success rates
5. **Multi-language Support** - Generate emails in user's language
6. **LinkedIn Integration** - Auto-apply via LinkedIn API

## Support

For issues or questions:
- Email: support@ostora.com
- Docs: https://docs.ostora.com/fast-apply
- Slack: #ai-service
