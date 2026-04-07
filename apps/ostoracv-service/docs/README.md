# OstorCV Service

Standalone CV and cover letter rendering service. Converts HTML/CSS templates to PDF using Puppeteer.

## Overview

OstorCV handles document generation independently from AI processing:
- **CV Generation**: Template-based PDF rendering from user profiles
- **Cover Letter Generation**: Template-only or AI-assisted modes
- **S3 Storage**: Automatic upload with presigned URLs
- **Bundle Integration**: Optional attachment to user document bundles

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────┐
│ API Gateway │─────▶│ OstorCV      │─────▶│   S3    │
└─────────────┘      │ Service      │      └─────────┘
                     └──────────────┘
                            │
                     ┌──────┴──────┐
                     ▼             ▼
              ┌──────────┐  ┌──────────┐
              │   User   │  │    AI    │
              │ Service  │  │ Service  │
              └──────────┘  └──────────┘
```

## Features

### CV Generation
- **3 Templates**: Modern, Classic, Minimal
- **3 Languages**: FR, DE, EN
- **Auto-fill**: Profile data from user-service
- **S3 Storage**: Automatic upload with versioning
- **Bundle Support**: Optional attachment to document bundles

### Cover Letter Generation
- **2 Modes**:
  - `template-only`: Simple template rendering
  - `ai-assisted`: AI-generated text + template rendering
- **Customizable**: Custom text override
- **Tone Control**: Professional, confident, friendly
- **Same Storage**: S3 with presigned URLs

## API Endpoints

### Public Endpoints

#### Generate CV
```http
POST /api/v1/ostoracv/generate-cv
Authorization: Bearer <token>

{
  "templateId": "modern-cv",
  "lang": "de",
  "userId": "uuid",
  "bundleId": "optional-bundle-uuid"
}
```

**Response:**
```json
{
  "downloadUrl": "https://s3.../presigned-url",
  "s3Key": "users/{userId}/cv/{uuid}-cv-de.pdf",
  "generatedAt": "2024-01-15T10:30:00Z",
  "templateId": "modern-cv",
  "lang": "de"
}
```

#### Generate Cover Letter
```http
POST /api/v1/ostoracv/generate-cover-letter
Authorization: Bearer <token>

{
  "mode": "ai-assisted",
  "lang": "en",
  "userId": "uuid",
  "jobTitle": "Backend Engineer",
  "companyName": "Comply World",
  "tone": "confident",
  "bundleId": "optional-bundle-uuid",
  "customText": "optional override"
}
```

### Internal Endpoints

#### Render Cover Letter (AI Service Only)
```http
POST /api/v1/internal/render-cover-letter
x-internal-secret: <secret>

{
  "userId": "uuid",
  "lang": "de",
  "generatedText": "AI-generated cover letter text...",
  "bundleId": "optional"
}
```

### Health Check
```http
GET /api/v1/ostoracv/health
```

## Templates

### CV Templates

**modern-cv.hbs**
- Gradient hero section
- Clean card-based layout
- Chip-style skills display

**classic-cv.hbs**
- Traditional serif font
- Centered header
- Line separators

**minimal-cv.hbs**
- Monospace font
- Compact layout
- Minimal styling

### Cover Letter Templates

**cover-letter-{lang}.hbs**
- Simple paragraph layout
- Language-specific labels
- Consistent styling across languages

## Configuration

### Environment Variables

```bash
# Service
PORT=4731
NODE_ENV=production

# AWS S3
AWS_REGION=us-east-1
AWS_S3_BUCKET=ostora-documents-prod
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_SIGNED_URL_TTL_SECONDS=3600

# Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Internal Communication
INTERNAL_SERVICE_SECRET=<secret>
USER_SERVICE_URL=http://user-service:4719
AI_SERVICE_URL=http://ai-service:4723
AI_SERVICE_COVER_LETTER_ENDPOINT=/api/v1/ai/cover-letter

# CORS
CORS_ORIGIN=*
```

## Development

### Local Setup

```bash
# Install dependencies
npm install

# Start service
npm run start:dev

# Build
npm run build

# Production
npm run start:prod
```

### Docker

```bash
# Build
docker build -f devops/docker/ostoracv-service.Dockerfile -t ostoracv-service .

# Run
docker run -p 4731:4731 --env-file .env ostoracv-service
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Integration

### From API Gateway

```typescript
// Route CV generation
app.post('/cv/generate', async (req, res) => {
  const response = await axios.post(
    'http://ostoracv-service:4731/api/v1/ostoracv/generate-cv',
    req.body,
    { headers: { authorization: req.headers.authorization } }
  );
  res.json(response.data);
});
```

### From AI Service

```typescript
// Generate AI text, then render PDF
const aiText = await generateCoverLetterText(profile, jobDetails);

const pdfResponse = await axios.post(
  'http://ostoracv-service:4731/api/v1/internal/render-cover-letter',
  {
    userId,
    lang,
    generatedText: aiText,
    bundleId
  },
  {
    headers: { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET }
  }
);
```

## S3 Storage Structure

```
ostora-documents-prod/
└── users/
    └── {userId}/
        ├── cv/
        │   ├── {uuid}-cv-fr.pdf
        │   ├── {uuid}-cv-de.pdf
        │   └── {uuid}-cv-en.pdf
        └── cover-letter/
            ├── {uuid}-cover-letter-fr.pdf
            ├── {uuid}-cover-letter-de.pdf
            └── {uuid}-cover-letter-en.pdf
```

## Best Practices

### Template Development
- Keep templates under 200KB
- Use inline CSS only
- Test with real profile data
- Support missing fields gracefully

### PDF Generation
- Use A4 format consistently
- Set proper margins (15mm top/bottom, 10mm sides)
- Enable printBackground for gradients
- Wait for networkidle0 before rendering

### Error Handling
- Fallback to template-only if AI fails
- Log bundle attachment failures (non-blocking)
- Retry profile loading with multiple endpoints
- Return meaningful error messages

### Performance
- Reuse Puppeteer browser instances (future optimization)
- Precompile templates at startup
- Cache compiled templates in memory
- Use streaming for large PDFs (future)

## Monitoring

### Health Check
```bash
curl http://localhost:4731/api/v1/ostoracv/health
```

### Logs
```bash
# Docker logs
docker logs ostoracv-service -f

# Kubernetes logs
kubectl logs -f deployment/ostoracv-service
```

### Metrics
- PDF generation time
- S3 upload success rate
- Template rendering errors
- AI service fallback rate

## Troubleshooting

### Puppeteer Issues
```bash
# Missing Chromium
apt-get install chromium

# Sandbox errors
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Add --no-sandbox flag (already configured)
```

### S3 Upload Failures
- Verify AWS credentials
- Check bucket permissions
- Ensure bucket exists
- Validate region configuration

### Template Not Found
- Verify template files exist in src/templates/
- Check template ID matches filename
- Ensure .hbs extension
- Rebuild after template changes

## Deployment

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ostoracv-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: ostoracv
        image: ostoracv-service:latest
        ports:
        - containerPort: 4731
        env:
        - name: PORT
          value: "4731"
        - name: AWS_S3_BUCKET
          valueFrom:
            secretKeyRef:
              name: aws-secrets
              key: s3-bucket
```

### CI/CD

```bash
# Jenkins pipeline
stage('Build') {
  docker build -f devops/docker/ostoracv-service.Dockerfile -t ostoracv:${BUILD_ID} .
}

stage('Test') {
  npm test
}

stage('Deploy') {
  kubectl set image deployment/ostoracv-service ostoracv=ostoracv:${BUILD_ID}
}
```

## License

Proprietary - All rights reserved

## Support

For issues: support@ostora.com
