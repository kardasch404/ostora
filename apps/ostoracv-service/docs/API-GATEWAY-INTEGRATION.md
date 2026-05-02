# API Gateway Integration for OstorCV Service

## Overview
This document describes how to integrate OstorCV service into the API Gateway.

## Routes to Add

### 1. CV Generation Route

```typescript
// apps/api-gateway/src/routes/ostoracv.routes.ts

import { Router } from 'express';
import axios from 'axios';

const router = Router();
const OSTORACV_SERVICE_URL = process.env.OSTORACV_SERVICE_URL || 'http://ostoracv-service:4731';

// Generate CV
router.post('/cv/generate', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${OSTORACV_SERVICE_URL}/api/v1/ostoracv/generate-cv`,
      req.body,
      {
        headers: {
          authorization: req.headers.authorization,
        },
        timeout: 30000,
      }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Generate Cover Letter
router.post('/cover-letter/generate', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${OSTORACV_SERVICE_URL}/api/v1/ostoracv/generate-cover-letter`,
      req.body,
      {
        headers: {
          authorization: req.headers.authorization,
        },
        timeout: 30000,
      }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### 2. Register Routes in Gateway

```typescript
// apps/api-gateway/src/app.ts

import ostoracvRoutes from './routes/ostoracv.routes';

// ... existing code ...

app.use('/api/v1/ostoracv', ostoracvRoutes);
```

### 3. Environment Variables

Add to `apps/api-gateway/.env`:

```bash
OSTORACV_SERVICE_URL=http://ostoracv-service:4731
```

## NestJS Gateway Integration (Alternative)

If using NestJS for API Gateway:

```typescript
// apps/api-gateway/src/ostoracv/ostoracv.controller.ts

import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OstoracvService } from './ostoracv.service';

@ApiTags('OstorCV')
@Controller('ostoracv')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OstoracvController {
  constructor(private readonly ostoracvService: OstoracvService) {}

  @Post('cv/generate')
  async generateCv(
    @Body() dto: any,
    @Headers('authorization') authorization: string,
  ) {
    return this.ostoracvService.generateCv(dto, authorization);
  }

  @Post('cover-letter/generate')
  async generateCoverLetter(
    @Body() dto: any,
    @Headers('authorization') authorization: string,
  ) {
    return this.ostoracvService.generateCoverLetter(dto, authorization);
  }
}
```

```typescript
// apps/api-gateway/src/ostoracv/ostoracv.service.ts

import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OstoracvService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('OSTORACV_SERVICE_URL') || 'http://ostoracv-service:4731';
  }

  async generateCv(dto: any, authorization: string) {
    const response = await this.httpService
      .post(`${this.baseUrl}/api/v1/ostoracv/generate-cv`, dto, {
        headers: { authorization },
      })
      .toPromise();
    return response.data;
  }

  async generateCoverLetter(dto: any, authorization: string) {
    const response = await this.httpService
      .post(`${this.baseUrl}/api/v1/ostoracv/generate-cover-letter`, dto, {
        headers: { authorization },
      })
      .toPromise();
    return response.data;
  }
}
```

## Rate Limiting

Add rate limiting for PDF generation:

```typescript
import rateLimit from 'express-rate-limit';

const cvGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 CV generations per 15 minutes
  message: 'Too many CV generation requests, please try again later',
});

router.post('/cv/generate', cvGenerationLimiter, async (req, res, next) => {
  // ... handler
});
```

## Error Handling

```typescript
// apps/api-gateway/src/middleware/error-handler.ts

export const ostoracvErrorHandler = (error: any, req: any, res: any, next: any) => {
  if (error.response?.status === 404) {
    return res.status(404).json({
      error: 'Template not found',
      message: error.response.data.message,
    });
  }

  if (error.response?.status === 500) {
    return res.status(500).json({
      error: 'PDF generation failed',
      message: 'Unable to generate document at this time',
    });
  }

  next(error);
};
```

## Testing

```bash
# Test CV generation through gateway
curl -X POST http://localhost:4717/api/v1/ostoracv/cv/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "modern-cv",
    "lang": "de",
    "userId": "user-uuid"
  }'

# Test cover letter generation
curl -X POST http://localhost:4717/api/v1/ostoracv/cover-letter/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "template-only",
    "lang": "en",
    "userId": "user-uuid",
    "jobTitle": "Backend Engineer",
    "companyName": "Comply World"
  }'
```

## Monitoring

Add metrics collection:

```typescript
import { Counter, Histogram } from 'prom-client';

const cvGenerationCounter = new Counter({
  name: 'ostoracv_cv_generation_total',
  help: 'Total CV generation requests',
  labelNames: ['status', 'template', 'lang'],
});

const cvGenerationDuration = new Histogram({
  name: 'ostoracv_cv_generation_duration_seconds',
  help: 'CV generation duration',
  buckets: [1, 5, 10, 30, 60],
});

router.post('/cv/generate', async (req, res, next) => {
  const start = Date.now();
  try {
    const response = await axios.post(/* ... */);
    cvGenerationCounter.inc({ status: 'success', template: req.body.templateId, lang: req.body.lang });
    res.json(response.data);
  } catch (error) {
    cvGenerationCounter.inc({ status: 'error', template: req.body.templateId, lang: req.body.lang });
    next(error);
  } finally {
    cvGenerationDuration.observe((Date.now() - start) / 1000);
  }
});
```
