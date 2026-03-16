# API Gateway - Ostora Platform

Enterprise-grade API Gateway for Ostora microservices platform.

## 🏗️ Architecture

- **Framework**: NestJS 10
- **Transport**: Kafka (microservices communication)
- **Port**: 4717
- **Container**: ostora-api-gateway

## 📦 Features

### Security
- ✅ Helmet (security headers)
- ✅ CORS configuration
- ✅ Rate limiting (Throttler)
- ✅ Request validation (class-validator)
- ✅ JWT authentication ready

### Observability
- ✅ Winston logging
- ✅ Request/Response logging
- ✅ Correlation ID tracking
- ✅ Health checks (Terminus)
- ✅ Kubernetes probes (liveness/readiness)

### API Features
- ✅ API versioning (URI-based)
- ✅ Swagger documentation
- ✅ Global exception handling
- ✅ Request/Response interceptors
- ✅ Standardized error responses

### Microservices Integration
- ✅ Auth Service
- ✅ User Service
- ✅ Job Service
- ✅ Email Service
- ✅ Payment Service
- ✅ AI Service
- ✅ Notification Service
- ✅ Analytics Service

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Kafka running on port 9095
- Redis running on port 6345

### Installation
```bash
npm install
```

### Development
```bash
npm run start:gateway
```

### Build
```bash
npm run build api-gateway
```

### Docker
```bash
docker build -t ostora-api-gateway -f devops/docker/api-gateway.Dockerfile .
docker run -p 4717:4717 ostora-api-gateway
```

## 📚 API Documentation

Swagger UI available at:
```
http://localhost:4717/api/docs
```

## 🏥 Health Checks

### General Health
```
GET /api/health
```

### Liveness Probe (Kubernetes)
```
GET /api/health/liveness
```

### Readiness Probe (Kubernetes)
```
GET /api/health/readiness
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/documents` - Upload document
- `GET /api/v1/users/documents` - Get user documents

### Jobs
- `GET /api/v1/jobs` - Search jobs
- `GET /api/v1/jobs/:id` - Get job by ID
- `POST /api/v1/jobs/:id/apply` - Apply to job
- `POST /api/v1/jobs/:id/save` - Save job
- `GET /api/v1/jobs/applications/my` - Get my applications

### Payments
- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/webhook` - Stripe webhook
- `GET /api/v1/payments/subscriptions` - Get subscriptions

### AI
- `POST /api/v1/ai/analyze-cv` - Analyze CV
- `POST /api/v1/ai/generate-cover-letter` - Generate cover letter
- `POST /api/v1/ai/match-jobs` - AI job matching

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read

### Analytics
- `GET /api/v1/analytics/dashboard` - Get dashboard
- `GET /api/v1/analytics/job-stats` - Get job stats

## ⚙️ Configuration

### Environment Variables
```env
# Application
NODE_ENV=development
API_GATEWAY_PORT=4717

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:4717

# Kafka
KAFKA_BROKER=localhost:9095

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6345
REDIS_PASSWORD=your-password

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info
```

## 📊 Rate Limiting

### Default Limits
- **Short**: 10 requests per second
- **Medium**: 100 requests per 10 seconds
- **Long**: 500 requests per minute

### Custom Limits
- **Register**: 5 requests per minute
- **Login**: 10 requests per minute
- **Forgot Password**: 3 requests per minute
- **AI Analyze CV**: 5 requests per minute
- **AI Generate Cover Letter**: 3 requests per minute

## 🔍 Request Tracking

Every request gets a unique correlation ID:
- Header: `X-Correlation-ID` or `X-Request-ID`
- Auto-generated if not provided
- Included in all logs and error responses

## 🐛 Error Handling

Standardized error response format:
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "correlationId": "uuid-here"
}
```

## 📝 Logging

Winston logger with:
- Console output (development)
- File output (production)
- Structured JSON logs
- Correlation ID tracking
- Request/Response logging

Log files:
- `logs/api-gateway-error.log` - Errors only
- `logs/api-gateway-combined.log` - All logs

## 🧪 Testing

```bash
# Unit tests
npm run test api-gateway

# E2E tests
npm run test:e2e api-gateway

# Coverage
npm run test:cov api-gateway
```

## 🚢 Deployment

### Docker Compose
```bash
docker-compose up api-gateway
```

### Kubernetes
```bash
kubectl apply -f devops/k8s/base/api-gateway.yaml
```

## 📈 Monitoring

### Metrics
- Request count
- Response time
- Error rate
- Memory usage
- CPU usage

### Health Checks
- Memory heap < 150MB
- Memory RSS < 300MB
- Disk usage < 90%

## 🔐 Security Best Practices

- ✅ Helmet security headers
- ✅ CORS whitelist
- ✅ Rate limiting
- ✅ Input validation
- ✅ Request sanitization
- ✅ Error message sanitization (production)
- ✅ Correlation ID for request tracking

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/kardasch404/ostora/issues
- Email: support@ostora.com
