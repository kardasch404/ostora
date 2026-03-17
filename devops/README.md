# Ostora Infrastructure - Docker & Kafka

Complete infrastructure setup for Ostora microservices platform.

## 📦 Components

### Databases
- **PostgreSQL 16** (Port 5445) - Main database for users, jobs, applications
- **MySQL 8.0** (Port 3345) - Analytics database
- **MongoDB 7** (Port 27045) - Logs storage
- **Redis 7** (Port 6345) - Cache & sessions
- **Elasticsearch 8.11** (Port 9245) - Job search engine

### Message Broker
- **Kafka 7.5.3** (Port 9095) - Event streaming
- **Zookeeper 7.5.3** (Port 2181) - Kafka coordination
- **Kafdrop** (Port 9000) - Kafka UI

### Kafka Topics
- `auth.events` - Authentication events (login, logout, register)
- `user.events` - User profile events (create, update, delete)
- `job.events` - Job events (create, apply, save)
- `email.events` - Email notifications
- `payment.events` - Payment transactions
- `notification.events` - Real-time notifications
- `analytics.events` - Analytics tracking
- `ai.events` - AI processing requests

## 🚀 Quick Start

### Start All Infrastructure
```bash
docker-compose up -d
```

### Start Specific Services
```bash
# Databases only
docker-compose up -d postgres mysql mongodb redis elasticsearch

# Kafka only
docker-compose up -d zookeeper kafka kafka-init kafdrop
```

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

## 📊 Service Health Checks

All services include health checks:

```bash
# Check all services status
docker-compose ps

# Check specific service logs
docker-compose logs -f postgres
docker-compose logs -f kafka
docker-compose logs -f redis
```

## 🔍 Access Services

### Databases
```bash
# PostgreSQL
psql -h localhost -p 5445 -U ostora -d ostora_db
# Password: ostora_secret_2024

# MySQL
mysql -h localhost -P 3345 -u ostora -p ostora_analytics
# Password: ostora_secret_2024

# MongoDB
mongosh mongodb://ostora:ostora_secret_2024@localhost:27045/ostora_logs

# Redis
redis-cli -h localhost -p 6345 -a ostora_redis_2024

# Elasticsearch
curl http://localhost:9245
```

### Kafka
```bash
# Kafdrop UI
http://localhost:9000

# List topics
docker exec ostora-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Describe topic
docker exec ostora-kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic auth.events

# Consume messages
docker exec ostora-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic auth.events --from-beginning
```

## 🐳 Docker Images

### Multi-Stage Build
All service Dockerfiles use multi-stage builds:
1. **Builder Stage**: Install dependencies, build TypeScript
2. **Runner Stage**: Copy only dist files, run as non-root user

### Base Image
- `node:20-alpine` - Minimal Node.js image
- Non-root user: `ostora` (UID 1001)
- Security: Only dist files copied, no source code

### Build Service Image
```bash
# Build specific service
docker build -t ostora-api-gateway -f devops/docker/api-gateway.Dockerfile .
docker build -t ostora-auth-service -f devops/docker/auth-service.Dockerfile .

# Build all services
docker-compose build
```

## 📁 Volume Management

### Named Volumes
All data is persisted in named volumes:
- `ostora-postgres-data`
- `ostora-mysql-data`
- `ostora-mongodb-data`
- `ostora-mongodb-config`
- `ostora-redis-data`
- `ostora-elasticsearch-data`
- `ostora-zookeeper-data`
- `ostora-zookeeper-logs`
- `ostora-kafka-data`

### Backup Volumes
```bash
# Backup PostgreSQL
docker exec ostora-postgres pg_dump -U ostora ostora_db > backup.sql

# Backup MySQL
docker exec ostora-mysql mysqldump -u ostora -postora_secret_2024 ostora_analytics > backup.sql

# Backup MongoDB
docker exec ostora-mongodb mongodump --uri="mongodb://ostora:ostora_secret_2024@localhost:27017/ostora_logs" --out=/backup
```

## 🔧 Configuration

### Environment Variables
All services use environment variables from `.env` file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Kafka Configuration
- **Partitions**: 3 per topic
- **Replication Factor**: 1 (single broker)
- **Retention**: 7 days (168 hours)
- **Auto Create Topics**: Enabled

### Resource Limits
```yaml
# Elasticsearch
ES_JAVA_OPTS: -Xms512m -Xmx512m

# Kafdrop
JVM_OPTS: -Xms32M -Xmx64M

# Redis
maxmemory: 256mb
maxmemory-policy: allkeys-lru
```

## 🛡️ Security

### Network Isolation
- All services run in `ostora-network` bridge network
- Services communicate via internal network
- Only necessary ports exposed to host

### Non-Root Users
- All application containers run as `ostora` user (UID 1001)
- No root privileges in containers

### Secrets Management
- Database passwords in environment variables
- Use Docker secrets in production
- Never commit `.env` file

## 📈 Monitoring

### Health Checks
All services have health checks configured:
- **Interval**: 10-30s
- **Timeout**: 3-10s
- **Retries**: 3-5
- **Start Period**: 5-60s

### Restart Policies
- **restart**: `unless-stopped` for all services
- Automatic restart on failure
- Manual stop persists across reboots

## 🔄 Kafka Topics & Consumer Groups

### Topics Configuration
```bash
# auth.events
- Partitions: 3
- Consumer Groups: auth-consumer, api-gateway-auth-consumer

# user.events
- Partitions: 3
- Consumer Groups: user-consumer, api-gateway-user-consumer

# job.events
- Partitions: 3
- Consumer Groups: job-consumer, api-gateway-job-consumer

# email.events
- Partitions: 3
- Consumer Groups: email-consumer

# payment.events
- Partitions: 3
- Consumer Groups: payment-consumer, api-gateway-payment-consumer

# notification.events
- Partitions: 3
- Consumer Groups: notification-consumer

# analytics.events
- Partitions: 3
- Consumer Groups: analytics-consumer

# ai.events
- Partitions: 3
- Consumer Groups: ai-consumer, api-gateway-ai-consumer
```

## 🐛 Troubleshooting

### Kafka Not Starting
```bash
# Check Zookeeper first
docker-compose logs zookeeper

# Restart Kafka
docker-compose restart kafka

# Recreate topics
docker-compose up kafka-init
```

### Database Connection Issues
```bash
# Check if database is healthy
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5445

# Kill process or change port in docker-compose.yml
```

## 📝 Development vs Production

### Development
- All services in single docker-compose
- Volumes mounted for hot reload
- Debug logging enabled
- Exposed ports for direct access

### Production
- Separate docker-compose per environment
- No volume mounts
- Production logging
- Load balancer for port access
- Use Kubernetes for orchestration

## 🚀 Next Steps

1. Start infrastructure: `docker-compose up -d`
2. Wait for health checks: `docker-compose ps`
3. Run Prisma migrations: `npm run prisma:migrate`
4. Start microservices: `npm run start:gateway`
5. Access Swagger docs: `http://localhost:4717/api/docs`
6. Monitor Kafka: `http://localhost:9000`

## 📞 Support

For infrastructure issues:
- Check logs: `docker-compose logs -f [service]`
- GitHub Issues: https://github.com/kardasch404/ostora/issues
- Email: devops@ostora.com
