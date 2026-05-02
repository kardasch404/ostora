# AI-Assisted Cover Letter Flow - Implementation Complete

## Overview
Two-service collaboration: **ai-service** generates text, **ostoracv-service** renders PDF.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /ai/cover-letter
       ▼
┌─────────────────────┐
│   ai-service        │
│   (Port 4723)       │
│                     │
│  1. Enqueue job     │
│  2. Return job ID   │
└─────────────────────┘
       │
       │ Background Worker
       ▼
┌─────────────────────┐
│ cover-letter        │
│ .processor.ts       │
│                     │
│  3. Generate text   │
│     via Ollama      │
└──────┬──────────────┘
       │
       │ HTTP POST /internal/render-cover-letter
       │ x-internal-secret: <secret>
       ▼
┌─────────────────────┐
│ ostoracv-service    │
│   (Port 4731)       │
│                     │
│  4. Render PDF      │
│  5. Upload to S3    │
│  6. Return URL      │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Redis Cache       │
│   Result stored     │
└─────────────────────┘
       │
       │ GET /ai/cover-letter/status/:jobId
       ▼
┌─────────────────────┐
│   Client gets       │
│   - Text            │
│   - PDF URL         │
│   - S3 Key          │
└─────────────────────┘
```

## Flow Steps

### Step 1: Client Request
```http
POST /api/v1/ai/cover-letter
Authorization: Bearer <token>

{
  "userId": "user-uuid",
  "jobTitle": "Backend Engineer",
  "companyName": "Comply World",
  "jobDescription": "We are looking for...",
  "cvText": "Optional CV summary",
  "language": "de",
  "tone": "confident",
  "bundleId": "optional-bundle-uuid",
  "renderPdf": true
}
```

**Response:**
```json
{
  "jobId": "123",
  "status": "processing",
  "message": "Cover letter generation started. Check /ai/cover-letter/status/:jobId for status.",
  "estimatedTime": "10-30 seconds"
}
```

### Step 2: Background Processing (ai-service)

**cover-letter.processor.ts:**
```typescript
1. Load system prompt for GENERATE_COVER_LETTER
2. Build prompt with job details + user profile
3. Route to Ollama via TokenRouter
4. Generate cover letter text (max 1000 tokens)
5. If renderPdf=true, call ostoracv-service
```

### Step 3: Internal API Call (ai-service → ostoracv-service)

```http
POST http://ostoracv-service:4731/api/v1/internal/render-cover-letter
x-internal-secret: <INTERNAL_SERVICE_SECRET>
Content-Type: application/json

{
  "userId": "user-uuid",
  "lang": "de",
  "generatedText": "Dear Hiring Team...",
  "bundleId": "optional-bundle-uuid",
  "mode": "ai-assisted"
}
```

### Step 4: PDF Rendering (ostoracv-service)

**internal.controller.ts:**
```typescript
1. Validate x-internal-secret header
2. Load user profile from user-service
3. Select template: cover-letter-{lang}.hbs
4. Inject generatedText into template
5. Render HTML with Handlebars
6. Convert to PDF via Puppeteer
7. Upload to S3: users/{userId}/cover-letter/{uuid}-cover-letter-{lang}.pdf
8. Generate presigned URL (1 hour TTL)
9. Optionally attach to bundle
10. Return { downloadUrl, s3Key, generatedAt }
```

### Step 5: Result Storage

**ai-service stores in Bull job:**
```json
{
  "userId": "user-uuid",
  "coverLetterText": "Generated text...",
  "wordCount": 350,
  "timestamp": 1705320000000,
  "pdf": {
    "downloadUrl": "https://s3.../presigned-url",
    "s3Key": "users/uuid/cover-letter/uuid-cover-letter-de.pdf",
    "generatedAt": "2024-01-15T10:30:00Z",
    "templateId": "cover-letter-de",
    "lang": "de"
  }
}
```

### Step 6: Client Polls Status

```http
GET /api/v1/ai/cover-letter/status/123
Authorization: Bearer <token>
```

**Response (completed):**
```json
{
  "status": "completed",
  "result": {
    "coverLetterText": "Dear Hiring Team at Comply World...",
    "wordCount": 350,
    "pdf": {
      "downloadUrl": "https://s3.amazonaws.com/...",
      "s3Key": "users/uuid/cover-letter/uuid-cover-letter-de.pdf",
      "generatedAt": "2024-01-15T10:30:00Z"
    },
    "timestamp": 1705320000000
  }
}
```

## Configuration

### ai-service Environment Variables
```bash
# Add to apps/ai-service/.env
OSTORACV_SERVICE_URL=http://ostoracv-service:4731
INTERNAL_SERVICE_SECRET=your-shared-secret-here
```

### ostoracv-service Environment Variables
```bash
# Already configured in apps/ostoracv-service/.env.example
INTERNAL_SERVICE_SECRET=your-shared-secret-here
USER_SERVICE_URL=http://user-service:4719
AWS_S3_BUCKET=ostora-documents-prod
```

### Docker Compose
```yaml
# Already configured in docker-compose.yml
ai-service:
  environment:
    OSTORACV_SERVICE_URL: http://ostoracv-service:4731
    INTERNAL_SERVICE_SECRET: ${INTERNAL_SERVICE_SECRET:-ostora-internal-secret}

ostoracv-service:
  environment:
    INTERNAL_SERVICE_SECRET: ${INTERNAL_SERVICE_SECRET:-ostora-internal-secret}
```

## Files Modified/Created

### ai-service
- ✅ `src/queues/cover-letter.processor.ts` - Updated with PDF rendering
- ✅ `src/cover-letter/cover-letter.controller.ts` - New public API
- ✅ `src/cover-letter/dto/generate-cover-letter.dto.ts` - Request DTO
- ✅ `src/app.module.ts` - Registered controller

### ostoracv-service
- ✅ `src/internal/internal.controller.ts` - Already exists
- ✅ `src/internal/internal-auth.guard.ts` - Already exists
- ✅ `src/cover-letter/cover-letter.service.ts` - Already has renderFromInternalPayload

## API Endpoints

### Public Endpoints (ai-service)

#### Generate Cover Letter
```
POST /api/v1/ai/cover-letter
- Enqueues job
- Returns job ID
- Async processing
```

#### Check Status
```
GET /api/v1/ai/cover-letter/status/:jobId
- Returns job state
- Includes text + PDF when complete
```

### Internal Endpoints (ostoracv-service)

#### Render Cover Letter PDF
```
POST /api/v1/internal/render-cover-letter
- Called by ai-service only
- Requires x-internal-secret header
- Returns PDF URL + S3 key
```

## Testing

### Test AI-Assisted Flow

```bash
# 1. Start cover letter generation
curl -X POST http://localhost:4723/api/v1/ai/cover-letter \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "jobTitle": "Backend Engineer",
    "companyName": "Comply World",
    "jobDescription": "We need a skilled backend engineer...",
    "language": "de",
    "tone": "confident",
    "renderPdf": true
  }'

# Response: { "jobId": "123", "status": "processing" }

# 2. Check status (poll every 5 seconds)
curl http://localhost:4723/api/v1/ai/cover-letter/status/123 \
  -H "Authorization: Bearer TOKEN"

# 3. When completed, download PDF
curl "https://s3.amazonaws.com/..." -o cover-letter.pdf
```

### Test Internal Endpoint Directly

```bash
curl -X POST http://localhost:4731/api/v1/internal/render-cover-letter \
  -H "x-internal-secret: ostora-internal-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "lang": "de",
    "generatedText": "Dear Hiring Team,\n\nI am excited to apply...",
    "mode": "ai-assisted"
  }'
```

## Error Handling

### AI Generation Fails
- Job status: `failed`
- Error returned in status endpoint
- No PDF generated

### PDF Rendering Fails
- AI text still returned
- PDF field is `null`
- Warning logged in ai-service
- User gets text, can retry PDF separately

### S3 Upload Fails
- PDF generation fails
- Error logged
- Job marked as failed

## Performance

### Expected Timings
- AI text generation: 5-15 seconds (Ollama)
- PDF rendering: 2-5 seconds (Puppeteer)
- S3 upload: 500ms-1s
- Total: 10-30 seconds

### Optimization
- Bull queue concurrency: 1 (sequential)
- Puppeteer browser reuse (future)
- S3 multipart upload (future)
- Redis result caching: 24 hours

## Monitoring

### Logs to Watch

**ai-service:**
```
[AI] Generating cover letter for user {userId}
[AI] Cover letter text generated for user {userId}
[AI] PDF rendered for user {userId}: {s3Key}
[AI] PDF rendering failed for user {userId}: {error}
```

**ostoracv-service:**
```
[OstorCV] Internal render request from ai-service
[OstorCV] PDF generated: {s3Key}
[OstorCV] S3 upload completed
```

### Metrics to Track
- Cover letter generation count
- Success rate (text + PDF)
- Average generation time
- PDF rendering failures
- S3 upload failures

## Security

### Internal Communication
- Shared secret: `INTERNAL_SERVICE_SECRET`
- Header: `x-internal-secret`
- No JWT required for internal endpoints
- Network isolation in Kubernetes

### S3 Access
- Presigned URLs expire after 1 hour
- Bucket not publicly accessible
- IAM role-based access
- Encryption at rest

## Future Enhancements

### Short Term
- [ ] WebSocket notifications when complete
- [ ] Kafka event: `ai.cover-letter.completed`
- [ ] Email notification with PDF link
- [ ] Retry mechanism for failed renders

### Medium Term
- [ ] Template selection in AI request
- [ ] Multiple language versions in one request
- [ ] Batch cover letter generation
- [ ] A/B testing for prompts

### Long Term
- [ ] Real-time streaming generation
- [ ] Custom branding/styling
- [ ] Multi-page cover letters
- [ ] Video cover letters

## Troubleshooting

### Job Stuck in Processing
```bash
# Check Bull queue
redis-cli
> KEYS bull:cover-letter:*
> HGETALL bull:cover-letter:123
```

### PDF Not Generated
```bash
# Check ostoracv-service logs
kubectl logs -f deployment/ostoracv-service

# Verify internal secret
echo $INTERNAL_SERVICE_SECRET
```

### S3 Upload Fails
```bash
# Verify AWS credentials
aws s3 ls s3://ostora-documents-prod/

# Check IAM permissions
aws iam get-user
```

## Status: Production Ready ✅

All components implemented and integrated. Ready for testing and deployment.
