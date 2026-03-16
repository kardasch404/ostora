# Ostora - Enterprise Job Platform

Microservices-based job platform with AI-powered matching, scraping, and enterprise features.

## Architecture

### Microservices (12 Services)
- **api-gateway** (Port 4717) - Main entry point, routes to all services
- **auth-service** (Port 4718) - JWT, OAuth, 2FA, sessions
- **user-service** (Port 4719) - Profiles, documents, roles
- **job-service** (Port 4720) - Job listings, search, matching
- **scraping-service** (Port 4722) - Playwright scraping, deduplication
- **email-service** (Port 4721) - Nodemailer, templates, AWS SES
- **ai-service** (Port 4723) - CV analysis, cover letter generation
- **payment-service** (Port 4724) - Stripe, PayPal, subscriptions
- **analytics-service** (Port 4725) - Stats, reports, performance
- **b2b-service** (Port 4726) - Enterprise API, rate limits
- **notification-service** (Port 4727) - Socket.io, real-time alerts
- **networking-service** (Port 4728) - LinkedIn automation, HR outreach

### Infrastructure
- **PostgreSQL** (Port 5445) - Main database
- **MySQL** (Port 3345) - Analytics database
- **MongoDB** (Port 27045) - Logs storage
- **Redis** (Port 6345) - Cache & sessions
- **Elasticsearch** (Port 9245) - Job search engine
- **Kafka** (Port 9095) - Message broker
- **Kafdrop** (Port 9000) - Kafka UI

## Tech Stack

### Backend
- NestJS 10 (TypeScript)
- Prisma ORM
- GraphQL + REST
- Kafka (Microservices communication)
- Socket.io (WebSockets)

### Databases
- PostgreSQL (Main)
- MySQL (Analytics)
- MongoDB (Logs)
- Redis (Cache)
- Elasticsearch (Search)

### DevOps
- Docker & Docker Compose
- Kubernetes (EKS)
- Jenkins (CI/CD)
- Terraform (IaC)
- AWS (Cloud)

## Project Structure

```
ostora/
├── apps/                      # Microservices
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── job-service/
│   ├── scraping-service/
│   ├── email-service/
│   ├── ai-service/
│   ├── payment-service/
│   ├── analytics-service/
│   ├── b2b-service/
│   ├── notification-service/
│   └── networking-service/
├── libs/                      # Shared libraries
│   ├── shared-dto/
│   ├── shared-interfaces/
│   ├── shared-guards/
│   ├── shared-decorators/
│   ├── shared-filters/
│   ├── shared-interceptors/
│   └── shared-utils/
├── devops/                    # Infrastructure
│   ├── docker/               # Dockerfiles
│   ├── k8s/                  # Kubernetes manifests
│   ├── jenkins/              # CI/CD pipeline
│   └── terraform/            # AWS infrastructure
├── prisma/                    # Database schema
├── scripts/                   # Utility scripts
│   ├── scraper/              # Python Playwright
│   └── seed/                 # DB seeds
└── docs/                      # Documentation
    └── swagger/              # API specs
```

## Getting Started

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Installation

1. **Clone repository**
```bash
git clone https://github.com/your-org/ostora.git
cd ostora
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Generate Prisma client**
```bash
npm run prisma:generate
```

5. **Run database migrations**
```bash
npm run prisma:migrate
```

6. **Start infrastructure (Docker)**
```bash
npm run docker:up
```

7. **Start services**
```bash
# Start all services
npm run build
npm start

# Or start individual services
npm run start:gateway
npm run start:auth
npm run start:user
```

## Development

### Run in development mode
```bash
nx serve api-gateway
nx serve auth-service
nx serve user-service
```

### Run tests
```bash
npm run test
```

### Lint code
```bash
npm run lint
```

### Format code
```bash
npm run format
```

## Git Workflow (GitFlow)

### Branches
- `main` - Production (protected)
- `develop` - Integration branch
- `feature/OSTORA-*` - Feature branches
- `release/v1.x.x` - Release branches
- `hotfix/OSTORA-*` - Hotfix branches

### Workflow
1. Create feature branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/OSTORA-123-add-job-search
```

2. Commit changes
```bash
git add .
git commit -m "feat(job): add advanced search filters"
```

3. Push and create PR
```bash
git push origin feature/OSTORA-123-add-job-search
```

4. Merge to `develop` (requires 1 reviewer)
5. Create release branch for staging
6. Merge to `main` for production

## Deployment

### Docker Compose (Local/Dev)
```bash
docker-compose up -d
```

### Kubernetes (Staging/Production)
```bash
# Apply base configuration
kubectl apply -f devops/k8s/base/

# Deploy to staging
kubectl apply -f devops/k8s/staging/

# Deploy to production
kubectl apply -f devops/k8s/production/
```

### Terraform (AWS Infrastructure)
```bash
cd devops/terraform
terraform init
terraform plan
terraform apply
```

## API Documentation

Swagger UI available at:
- API Gateway: http://localhost:4717/api/docs

## Monitoring & Logs

- Kafdrop (Kafka UI): http://localhost:9000
- Prisma Studio: `npm run prisma:studio`

## Environment Variables

See `.env.example` for all required environment variables.

## Contributing

1. Follow GitFlow branching strategy
2. Write tests for new features
3. Follow TypeScript/ESLint rules
4. Update documentation
5. Create PR with description

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact: support@ostora.com
