# Auth Service DevOps - Task 3.5 (AUTH-11)

## ✅ Completed Infrastructure

### 1. Docker Configuration
- **Multi-stage Dockerfile** (`devops/docker/auth-service.Dockerfile`)
  - Builder stage with native module support
  - Runner stage with non-root user (ostora:1001)
  - Health check on `/api/v1/auth/health`
  - EXPOSE 4718
  - Production-optimized image size

### 2. Kubernetes Manifests

#### Base Configuration (`devops/k8s/base/`)
- **Deployment** (`auth-service.yaml`)
  - 2 replicas minimum
  - Non-root security context (user 1001)
  - Resource limits: 256Mi-512Mi RAM, 250m-500m CPU
  - Liveness probe: `/api/v1/auth/live`
  - Readiness probe: `/api/v1/auth/ready`
  - Startup probe: `/api/v1/auth/health`

- **Service** (`auth-service.yaml`)
  - Type: ClusterIP
  - Port: 4718
  - Internal service discovery

- **HorizontalPodAutoscaler** (`auth-service.yaml`)
  - Min replicas: 2
  - Max replicas: 10
  - CPU target: 70%
  - Memory target: 80%
  - Scale-up: 100% or 2 pods per 30s
  - Scale-down: 50% per 60s with 5min stabilization

- **ConfigMap** (`auth-service-configmap.yaml`)
  - Environment configuration
  - JWT settings
  - Security parameters
  - Service endpoints

- **Secret** (`auth-service-secret.yaml`)
  - Database credentials
  - JWT secret
  - OAuth credentials

#### Environment Overlays
- **Staging** (`devops/k8s/staging/`)
  - 1 replica minimum
  - Reduced resources (128Mi-256Mi)
  - Max 5 replicas

- **Production** (`devops/k8s/production/`)
  - 3 replicas minimum
  - Enhanced resources (512Mi-1Gi)
  - Max 20 replicas

### 3. CI/CD Pipeline

**Jenkinsfile** (`devops/jenkins/Jenkinsfile.auth-service`)

Pipeline stages:
1. **Checkout** - Clone repo, get commit hash
2. **Install Dependencies** - npm ci
3. **Lint** - Code quality checks
4. **Unit Tests** - Jest with coverage
5. **E2E Tests** - Supertest with test database
6. **Build Docker Image** - Multi-stage build
7. **Security Scan** - Trivy vulnerability scan
8. **Push to ECR** - AWS ECR registry
9. **Deploy to Staging** - Auto-deploy on develop branch
10. **Deploy to Production** - Manual approval on main branch
11. **Smoke Tests** - Health check validation

### 4. PM2 Configuration

**Ecosystem Config** (`apps/auth-service/ecosystem.config.js`)
- Cluster mode with 2 instances
- Auto-restart on failure
- Max 10 restarts
- 500MB memory limit
- Log rotation
- Graceful shutdown (5s kill timeout)

### 5. Health & Metrics

#### Health Endpoints (`src/health/health.controller.ts`)
- **GET /api/v1/auth/health** - Full health check
  - PostgreSQL connectivity
  - Redis connectivity
  - Kafka status
  - Returns: `ok`, `degraded`, or `unhealthy`

- **GET /api/v1/auth/ready** - Readiness probe
  - Database + Redis check
  - K8s readiness gate

- **GET /api/v1/auth/live** - Liveness probe
  - Basic uptime check
  - K8s liveness gate

#### Prometheus Metrics (`src/health/metrics.controller.ts`)
- **GET /metrics** - Prometheus format
  - `auth_service_requests_total` - Request counter
  - `auth_service_errors_total` - Error counter
  - `auth_service_request_duration_seconds` - Latency histogram
    - Buckets: 0.1s, 0.5s, 1s, 5s, +Inf
  - `auth_service_up` - Service uptime gauge
  - `nodejs_memory_usage_bytes` - Memory metrics

## 📁 Files Created/Modified

```
apps/auth-service/
├── src/
│   ├── health/
│   │   ├── health.controller.ts      # Health checks
│   │   ├── health.module.ts          # Health module
│   │   └── metrics.controller.ts     # Prometheus metrics
│   └── app.module.ts                 # Added HealthModule
├── ecosystem.config.js               # PM2 config
└── .dockerignore                     # Docker ignore rules

devops/
├── docker/
│   └── auth-service.Dockerfile       # Multi-stage Dockerfile
├── k8s/
│   ├── base/
│   │   ├── auth-service.yaml         # Deployment + Service + HPA
│   │   ├── auth-service-configmap.yaml
│   │   └── auth-service-secret.yaml
│   ├── staging/
│   │   └── auth-service.yaml         # Staging overlay
│   └── production/
│       └── auth-service.yaml         # Production overlay
└── jenkins/
    └── Jenkinsfile.auth-service      # CI/CD pipeline
```

## 🚀 Deployment Guide

### Local Development with PM2
```bash
cd apps/auth-service
npm run build
pm2 start ecosystem.config.js
pm2 logs auth-service
pm2 monit
```

### Docker Build & Run
```bash
# Build image
docker build -t ostora-auth-service:latest \
  -f devops/docker/auth-service.Dockerfile .

# Run container
docker run -d \
  -p 4718:4718 \
  --name auth-service \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_HOST="localhost" \
  ostora-auth-service:latest

# Check health
curl http://localhost:4718/api/v1/auth/health
```

### Kubernetes Deployment
```bash
# Create namespace
kubectl create namespace ostora

# Apply base configuration
kubectl apply -f devops/k8s/base/auth-service-configmap.yaml
kubectl apply -f devops/k8s/base/auth-service-secret.yaml
kubectl apply -f devops/k8s/base/auth-service.yaml

# Check deployment
kubectl get pods -n ostora -l app=auth-service
kubectl logs -n ostora -l app=auth-service --tail=100

# Check HPA
kubectl get hpa -n ostora auth-service-hpa

# Port forward for testing
kubectl port-forward -n ostora svc/auth-service 4718:4718
```

### Jenkins Pipeline
```bash
# Trigger build
curl -X POST http://jenkins.example.com/job/auth-service/build

# View logs
jenkins-cli console auth-service
```

## 📊 Monitoring

### Health Checks
```bash
# Health check
curl http://auth-service:4718/api/v1/auth/health

# Readiness
curl http://auth-service:4718/api/v1/auth/ready

# Liveness
curl http://auth-service:4718/api/v1/auth/live
```

### Prometheus Metrics
```bash
# Scrape metrics
curl http://auth-service:4718/metrics

# Example output:
# auth_service_requests_total 1234
# auth_service_errors_total 5
# auth_service_request_duration_seconds_sum 45.6
```

### Kubernetes Monitoring
```bash
# Pod status
kubectl get pods -n ostora -l app=auth-service

# Resource usage
kubectl top pods -n ostora -l app=auth-service

# HPA status
kubectl get hpa -n ostora auth-service-hpa

# Events
kubectl get events -n ostora --field-selector involvedObject.name=auth-service
```

## 🔒 Security Features

1. **Non-root user** (UID 1001)
2. **Read-only root filesystem** (security context)
3. **Resource limits** (prevent resource exhaustion)
4. **Health probes** (automatic recovery)
5. **Security scanning** (Trivy in pipeline)
6. **Secret management** (K8s secrets)

## 🎯 Auto-scaling

### HPA Configuration
- **CPU threshold**: 70% → scale up
- **Memory threshold**: 80% → scale up
- **Scale-up**: Fast (30s, 100% or 2 pods)
- **Scale-down**: Slow (60s, 50% with 5min stabilization)

### Scaling Behavior
```
Load increases → CPU > 70% → Add pods (max 2 per 30s)
Load decreases → CPU < 70% → Remove pods (50% per 60s after 5min)
```

## 📝 Commit Messages

```bash
infra(AUTH-11): Dockerfile multi-stage for auth-service
infra(AUTH-11): K8s Deployment + HPA + Service manifests
infra(AUTH-11): Jenkinsfile CI/CD pipeline for auth-service
infra(AUTH-11): PM2 config and Prometheus metrics
```

## ✨ Key Features

1. **Multi-stage Docker build** - Optimized image size
2. **Non-root container** - Enhanced security
3. **Horizontal auto-scaling** - CPU/memory based
4. **Health probes** - Liveness, readiness, startup
5. **Prometheus metrics** - Request count, latency, errors
6. **CI/CD pipeline** - Lint → Test → Build → Deploy
7. **PM2 cluster mode** - 2 instances for local dev
8. **Environment overlays** - Staging vs Production
9. **Security scanning** - Trivy vulnerability checks
10. **Graceful shutdown** - 5s kill timeout

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/staging/production)
- `PORT` - Service port (4718)
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_HOST` - Redis host
- `JWT_SECRET` - JWT signing key
- `MAX_LOGIN_ATTEMPTS` - Brute-force limit (5)
- `LOCKOUT_DURATION` - Lockout time (900s)

### Resource Limits
- **Staging**: 128Mi-256Mi RAM, 100m-250m CPU
- **Production**: 512Mi-1Gi RAM, 500m-1000m CPU

## 🎉 Next Steps

1. Configure AWS ECR credentials in Jenkins
2. Update K8s secrets with production values
3. Configure Prometheus scraping
4. Set up Grafana dashboards
5. Configure Slack notifications
6. Run first deployment to staging
