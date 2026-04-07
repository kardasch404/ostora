# Ostora — Plateforme intelligente de recherche d'emploi

Ostora est une application SaaS qui automatise et optimise la recherche d'emploi pour les candidats. Elle centralise les offres de plusieurs sources (LinkedIn, sites allemands), permet d'envoyer des candidatures personnalisées en masse, analyse les CVs avec l'IA, génère des lettres de motivation, et met en relation les candidats avec des recruteurs. Elle propose aussi une API B2B pour les entreprises qui souhaitent accéder aux données du marché de l'emploi.

## 🚀 Fonctionnalités principales

- ✅ **Candidature automatique** - Envoi massif de candidatures personnalisées
- ✅ **Analyse IA de CV** - Analyse intelligente et scoring des CVs
- ✅ **Génération lettre de motivation** - Lettres personnalisées par IA
- ✅ **Fast Apply** - Postuler à 50 offres en un clic
- ✅ **Matching automatique** - Correspondance intelligente candidat-offre
- ✅ **Génération CV PDF** - CVs professionnels en PDF
- ✅ **Networking Premium RH** - Mise en relation avec recruteurs
- ✅ **API B2B marché emploi** - Accès données pour entreprises

---

## 🏗️ Architecture

### Microservices (12 Services)
- **api-gateway** (Port 4717) - Point d'entrée principal
- **auth-service** (Port 4718) - JWT, OAuth, 2FA
- **user-service** (Port 4719) - Profils, documents
- **job-service** (Port 4720) - Offres d'emploi, recherche
- **email-service** (Port 4721) - Envoi d'emails
- **scraping-service** (Port 4722) - Scraping Playwright
- **ai-service** (Port 4723) - Analyse CV, IA
- **payment-service** (Port 4724) - Stripe, PayPal
- **analytics-service** (Port 4725) - Statistiques
- **b2b-service** (Port 4726) - API entreprise
- **notification-service** (Port 4727) - Notifications temps réel
- **networking-service** (Port 4728) - Automation LinkedIn

### Infrastructure
- **PostgreSQL** (Port 5445) - Base de données principale
- **MySQL** (Port 3345) - Base analytics
- **MongoDB** (Port 27045) - Logs
- **Redis** (Port 6345) - Cache & sessions
- **Elasticsearch** (Port 9245) - Moteur de recherche
- **Kafka** (Port 9095) - Message broker
- **Kafdrop** (Port 9000) - Interface Kafka

---

## 🛠️ Stack technique global

### Langage & Framework
- **TypeScript** (strict mode)
- **NestJS** 10
- **Node.js** 20

### Bases de données
- **PostgreSQL** 16 (principale)
- **MySQL** 8 (read-only analytics)
- **MongoDB** 7 (logs)
- **Redis** 7 (cache)
- **Elasticsearch** 8 (recherche)

### ORM & Accès DB
- **Prisma** (PostgreSQL)
- **mysql2** (MySQL)
- **ioredis** (Redis)
- **@elastic/elasticsearch** (Elasticsearch)
- **mongoose** (MongoDB)

### Message broker & Queues
- **Apache Kafka**
- **KafkaJS**
- **BullMQ**
- **Zookeeper**

### Stockage fichiers
- **AWS S3**
- **@aws-sdk/client-s3**
- **@aws-sdk/s3-request-presigner**

### DevOps & Infra
- **Docker** & **Docker Compose**
- **Kubernetes** (K8s)
- **Jenkins** (CI/CD)
- **Terraform** (IaC)
- **AWS** (ECR, EKS, RDS, MSK)
- **PM2** (Process manager)

### Monitoring & Logs
- **Winston** (logging)
- **Prometheus** (metrics)
- **nest-winston**
- **Kafdrop** (UI Kafka)

### Tests
- **Jest** (unit tests)
- **Supertest** (integration tests)
- **Playwright** (E2E tests)

### Validation & Transformation
- **class-validator**
- **class-transformer**
- **@nestjs/swagger**

### Monorepo
- **NX Workspace**
- **ESLint**
- **Prettier**
- **Husky**
- **Commitlint**

---

## 📦 Installation

### Prérequis
- Node.js >= 18
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/your-org/ostora.git
cd ostora
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration environnement**
```bash
cp .env.example .env
# Éditer .env avec votre configuration
```

4. **Générer Prisma client**
```bash
npm run prisma:generate
```

5. **Lancer les migrations**
```bash
npm run prisma:migrate
```

6. **Démarrer l'infrastructure (Docker)**
```bash
npm run docker:up
```

7. **Démarrer les services**
```bash
# Tous les services
npm run build
npm start

# Ou services individuels
npm run start:gateway
npm run start:auth
npm run start:user
```

---

## 🚀 Développement

### Mode développement
```bash
nx serve api-gateway
nx serve auth-service
nx serve user-service
```

### Tests
```bash
npm run test
```

### Lint
```bash
npm run lint
```

### Format
```bash
npm run format
```

---

## 📁 Structure du projet

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
├── libs/                      # Bibliothèques partagées
│   ├── shared-dto/
│   ├── shared-interfaces/
│   ├── shared-guards/
│   ├── shared-decorators/
│   ├── shared-filters/
│   ├── shared-interceptors/
│   └── shared-utils/
├── devops/                    # Infrastructure
│   ├── docker/
│   ├── k8s/
│   ├── jenkins/
│   └── terraform/
├── prisma/                    # Schéma base de données
├── scripts/                   # Scripts utilitaires
├── docs/                      # Documentation
└── frontend/                  # Application Next.js
```

---

## 📚 Documentation

- **[Documentation complète](docs/README.md)** - Guide complet
- **[Architecture base de données](docs/DATABASE_DOCUMENTATION.md)** - Schéma DB
- **[Diagramme de classes](docs/database-schema-v2.png)** - Diagramme UML
- **[Structure services](docs/SERVICES_DOCUMENTATION_STRUCTURE.md)** - Organisation services
- **[API Swagger](http://localhost:4717/api/docs)** - Documentation API

---

## 🔄 Git Workflow (GitFlow)

### Branches
- `main` - Production (protégée)
- `develop` - Branche d'intégration
- `feature/OSTORA-*` - Branches de fonctionnalités
- `release/v1.x.x` - Branches de release
- `hotfix/OSTORA-*` - Branches de hotfix

### Workflow
1. Créer une branche feature depuis `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/OSTORA-123-add-job-search
```

2. Commiter les changements
```bash
git add .
git commit -m "feat(job): add advanced search filters"
```

3. Push et créer PR
```bash
git push origin feature/OSTORA-123-add-job-search
```

4. Merge vers `develop` (nécessite 1 reviewer)
5. Créer release branch pour staging
6. Merge vers `main` pour production

---

## 🚢 Déploiement

### Docker Compose (Local/Dev)
```bash
docker-compose up -d
```

### Kubernetes (Staging/Production)
```bash
# Configuration de base
kubectl apply -f devops/k8s/base/

# Déploiement staging
kubectl apply -f devops/k8s/staging/

# Déploiement production
kubectl apply -f devops/k8s/production/
```

### Terraform (Infrastructure AWS)
```bash
cd devops/terraform
terraform init
terraform plan
terraform apply
```

---

## 🔐 Variables d'environnement

Voir `.env.example` pour toutes les variables requises.

Principales variables:
- `DATABASE_URL` - URL PostgreSQL
- `REDIS_HOST` - Hôte Redis
- `KAFKA_BROKER` - Broker Kafka
- `AWS_ACCESS_KEY_ID` - Clé AWS
- `JWT_SECRET` - Secret JWT
- `STRIPE_SECRET_KEY` - Clé Stripe
- `PAYPAL_CLIENT_ID` - Client PayPal

---

## 📊 Monitoring

- **Kafdrop** (Kafka UI): http://localhost:9000
- **Prisma Studio**: `npm run prisma:studio`
- **API Gateway**: http://localhost:4717/api/docs

---

## 🤝 Contribution

1. Suivre la stratégie GitFlow
2. Écrire des tests pour les nouvelles fonctionnalités
3. Respecter les règles TypeScript/ESLint
4. Mettre à jour la documentation
5. Créer une PR avec description

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

## 📞 Support

Pour questions et problèmes:
- **Email**: support@ostora.com
- **Documentation**: `/docs`
- **API Docs**: http://localhost:4717/api/docs

---

*Dernière mise à jour: 2026-04-06*
