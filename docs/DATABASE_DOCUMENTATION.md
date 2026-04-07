# Ostora Platform - Database Documentation

## Overview
This document provides a comprehensive overview of the Ostora platform database schema, including all entities, relationships, and business logic.

---

## Table of Contents
1. [Core Modules](#core-modules)
2. [Entity Relationships](#entity-relationships)
3. [Services Architecture](#services-architecture)

---

## Core Modules

### 1. Authentication & Authorization Module

#### User
- **Purpose**: Core user entity for the platform
- **Key Fields**: email, username, password, firstName, lastName, roleId, status
- **Relationships**: 
  - One-to-One: Profile, ProfileSettings
  - One-to-Many: Sessions, RefreshTokens, OAuthAccounts, Documents, JobApplications, Subscriptions, Payments, Notifications

#### Role
- **Purpose**: Define user roles (USER, ADMIN, RECRUITER)
- **Relationships**: Many-to-Many with Permissions through RolePermission

#### Permission
- **Purpose**: Granular access control (resource + action)
- **Relationships**: Many-to-Many with Roles through RolePermission

#### Session & RefreshToken
- **Purpose**: Manage user authentication sessions
- **Security**: Token-based authentication with expiration

#### OAuthAccount
- **Purpose**: Third-party authentication (Google, Apple, LinkedIn)
- **Providers**: Google, Apple, LinkedIn

#### AuditLog
- **Purpose**: Track all user actions for security and compliance
- **Fields**: userId, action, resource, metadata, ipAddress, userAgent

---

### 2. User Profile Module

#### Profile
- **Purpose**: Extended user information
- **Sections**:
  - Basic Info: firstName, lastName, phone, bio, avatar, birthDate
  - Address: city, country, postalCode, address
  - Professional: title, company, industry, experienceYears, salary
  - URLs: linkedinUrl, githubUrl, portfolioUrl, websiteUrl
  - Preferences: jobPreferences, visibility

#### Education
- **Purpose**: Academic background
- **Fields**: institution, degree, field, startDate, endDate, current, description, grade

#### Experience
- **Purpose**: Work history
- **Fields**: company, title, location, employmentType, startDate, endDate, current, description
- **Types**: FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP, SELF_EMPLOYED

#### Skill
- **Purpose**: Technical and soft skills
- **Fields**: name, level, category, yearsOfExperience
- **Levels**: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

#### Language
- **Purpose**: Language proficiency
- **Fields**: name, proficiency
- **Levels**: A1, A2, B1, B2, C1, C2 (CEFR standard)

#### SocialLink
- **Purpose**: Social media profiles
- **Platforms**: LinkedIn, GitHub, XING, Portfolio, Twitter

#### ProfileSettings
- **Purpose**: Job search preferences
- **Fields**: jobSearchStatus, desiredSalary, desiredContractType, desiredLocations, remotePreference, visibility

---

### 3. Job Management Module

#### Job
- **Purpose**: Job listings from various sources
- **Key Fields**: title, company, description, requirements, location, salary, type, level, category, skills
- **Status**: ACTIVE, INACTIVE, EXPIRED, FILLED, DRAFT
- **Types**: FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP, TEMPORARY
- **Levels**: ENTRY, JUNIOR, MID, SENIOR, LEAD, MANAGER, DIRECTOR, EXECUTIVE

#### Company
- **Purpose**: Company information for job posts
- **Fields**: name, website, industry, size, country, city, logoUrl, description

#### JobPost
- **Purpose**: Scraped job posts from external sources
- **Sources**: LINKEDIN, INDEED, STELLEN, OTHER
- **Fields**: externalId, source, title, companyId, location, salary, contractType, remote, description, url

#### JobApplication
- **Purpose**: User applications to jobs
- **Fields**: userId, jobId, status, coverLetter, resumeUrl, aiScore, aiInsights
- **Status**: PENDING, REVIEWING, SHORTLISTED, INTERVIEW, OFFER, ACCEPTED, REJECTED, WITHDRAWN

#### SavedJob / JobFavorite
- **Purpose**: Bookmarked jobs for later review
- **Fields**: userId, jobId/jobPostId, notes, savedAt

#### JobAlert
- **Purpose**: Automated job notifications based on criteria
- **Fields**: userId, name, criteria (JSON), frequency, active, lastSentAt

---

### 4. Document Management Module

#### Document
- **Purpose**: User-uploaded documents (CV, certificates, etc.)
- **Types**: CV, RESUME, COVER_LETTER, CERTIFICATE, PORTFOLIO, OTHER
- **Fields**: userId, type, name, originalName, url, size, mimeType, aiAnalysis

#### ApplicationBundle
- **Purpose**: Grouped documents for job applications
- **Fields**: userId, name, slug, description
- **Relationships**: One-to-Many with ApplicationDocument

#### ApplicationDocument
- **Purpose**: Documents within a bundle
- **Types**: CV, COVER_LETTER, PORTFOLIO, OTHER
- **Storage**: AWS S3 (s3Key, s3Url)

---

### 5. Payment & Subscription Module

#### Subscription
- **Purpose**: User subscription management
- **Plans**: FREE, PREMIUM_MONTHLY, PREMIUM_ANNUAL, B2B_STARTER, B2B_PRO
- **Status**: TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED
- **Providers**: Stripe, PayPal
- **Fields**: stripeSubscriptionId, paypalSubscriptionId, currentPeriodStart, currentPeriodEnd, trialEnd

#### Payment
- **Purpose**: Payment transaction records
- **Status**: PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELED, REFUNDED
- **Providers**: Stripe, PayPal
- **Fields**: amount, currency, provider, stripePaymentIntentId, paypalOrderId

---

### 6. Notification Module

#### Notification
- **Purpose**: In-app notifications
- **Types**: JOB_MATCH, APPLICATION_UPDATE, MESSAGE, PAYMENT, SYSTEM, ALERT, AI_TASK_COMPLETED, TRIAL_EXPIRING, SUBSCRIPTION_RENEWED
- **Fields**: userId, type, title, message, data (JSON), read, readAt

#### NotificationPreference
- **Purpose**: User notification settings
- **Channels**: In-App, Push, Email, Weekly Digest
- **Fields**: inAppEnabled, pushEnabled, emailEnabled, weeklyDigestEnabled, digestFrequency, quietHours, types

#### FcmToken
- **Purpose**: Firebase Cloud Messaging tokens for push notifications
- **Fields**: userId, token, platform, deviceName, isActive, lastUsedAt

---

### 7. Networking Module

#### NetworkingAction
- **Purpose**: Track networking activities (LinkedIn, email outreach)
- **Types**: CONNECTION_REQUEST, MESSAGE, INMAIL, EMAIL_OUTREACH
- **Status**: PENDING, SENT, ACCEPTED, REJECTED, NO_RESPONSE
- **Fields**: userId, type, platform, targetName, targetEmail, targetLinkedin, message, sentAt, respondedAt

#### MessageTemplate
- **Purpose**: Reusable message templates for outreach
- **Fields**: userId, name, subject, body, language, isDefault, isActive

#### EmailConfig
- **Purpose**: User's email configuration for sending applications
- **Fields**: userId, email, passwordEncrypted, smtpHost, smtpPort, encryption, fromName, isActive
- **Encryption**: SSL, TLS, STARTTLS, NONE

---

### 8. B2B Module

#### B2BClient
- **Purpose**: Enterprise API clients
- **Fields**: companyName, contactEmail, contactName, apiKey, plan, rateLimit, active, metadata
- **Plans**: FREE, B2B_STARTER, B2B_PRO

---

### 9. Activity Tracking Module

#### UserActivity
- **Purpose**: Track user actions for analytics
- **Fields**: userId, action, metadata (JSON), ipAddress, userAgent, createdAt

---

## Entity Relationships

### Core Relationships

```
User (1) ─── (1) Profile
User (1) ─── (0..1) ProfileSettings
User (1) ─── (*) Session
User (1) ─── (*) RefreshToken
User (1) ─── (*) OAuthAccount
User (1) ─── (*) Document
User (1) ─── (*) JobApplication
User (1) ─── (*) SavedJob
User (1) ─── (*) JobAlert
User (1) ─── (*) Subscription
User (1) ─── (*) Payment
User (1) ─── (*) Notification
User (1) ─── (*) NetworkingAction
User (1) ─── (*) MessageTemplate
User (1) ─── (*) EmailConfig
User (1) ─── (*) ApplicationBundle
User (1) ─── (*) UserSocialLink
User (1) ─── (*) UserActivity

Profile (1) ─── (*) Education
Profile (1) ─── (*) Experience
Profile (1) ─── (*) Skill
Profile (1) ─── (*) Language
Profile (1) ─── (*) SocialLink

Job (1) ─── (*) JobApplication
Job (1) ─── (*) SavedJob

Company (1) ─── (*) JobPost
JobPost (1) ─── (*) JobFavorite
JobPost (1) ─── (*) JobPostApplication

ApplicationBundle (1) ─── (*) ApplicationDocument

Role (*) ─── (*) Permission (through RolePermission)
User (*) ─── (1) Role
```

---

## Services Architecture

### 1. **auth-service** (Port 4718)
- **Entities**: User, Role, Permission, RolePermission, Session, RefreshToken, OAuthAccount, AuditLog, UserSession
- **Responsibilities**: Authentication, Authorization, JWT, OAuth, 2FA, Session Management, Audit Logging

### 2. **user-service** (Port 4719)
- **Entities**: Profile, Education, Experience, Skill, Language, SocialLink, UserSocialLink, ProfileSettings, MessageTemplate, EmailConfig, ApplicationBundle, ApplicationDocument
- **Responsibilities**: User profiles, CV management, Document storage (S3), Profile settings

### 3. **job-service** (Port 4720)
- **Entities**: Job, Company, JobPost, JobApplication, SavedJob, JobFavorite, JobAlert, JobPostApplication
- **Responsibilities**: Job listings, Job search, Job applications, Favorites, Alerts, MySQL integration

### 4. **payment-service** (Port 4724)
- **Entities**: Subscription, Payment
- **Responsibilities**: Stripe integration, PayPal integration, Subscription management, Payment processing

### 5. **notification-service** (Port 4727)
- **Entities**: Notification, NotificationPreference, FcmToken
- **Responsibilities**: Real-time notifications, Push notifications (FCM), Email notifications, WebSocket (Socket.io)

### 6. **networking-service** (Port 4728)
- **Entities**: NetworkingAction
- **Responsibilities**: LinkedIn automation, HR outreach, Connection requests

### 7. **email-service** (Port 4721)
- **Entities**: None (uses Kafka for async processing)
- **Responsibilities**: Email sending (Nodemailer, AWS SES), Email templates, Queue management

### 8. **ai-service** (Port 4723)
- **Entities**: None (processes documents)
- **Responsibilities**: CV analysis, Cover letter generation, Job matching, AI scoring

### 9. **scraping-service** (Port 4722)
- **Entities**: None (Python Playwright)
- **Responsibilities**: Job scraping (LinkedIn, Indeed, Stellen), Data deduplication

### 10. **analytics-service** (Port 4725)
- **Entities**: UserActivity
- **Responsibilities**: Statistics, Reports, Performance metrics, MySQL analytics DB

### 11. **b2b-service** (Port 4726)
- **Entities**: B2BClient
- **Responsibilities**: Enterprise API, API key management, Rate limiting

### 12. **api-gateway** (Port 4717)
- **Entities**: None
- **Responsibilities**: Request routing, Rate limiting, Load balancing, Authentication proxy

---

## Database Technologies

### PostgreSQL (Port 5445)
- **Purpose**: Main transactional database
- **Entities**: All core entities (User, Profile, Job, Payment, etc.)
- **Features**: ACID compliance, Complex queries, Relationships

### MySQL (Port 3345)
- **Purpose**: Analytics database
- **Entities**: JobPost, Company, Analytics data
- **Features**: Fast reads, Reporting, Job scraping data

### MongoDB (Port 27045)
- **Purpose**: Logs storage
- **Entities**: Application logs, Error logs
- **Features**: Flexible schema, High write throughput

### Redis (Port 6345)
- **Purpose**: Cache & sessions
- **Data**: Session tokens, Cache data, Rate limiting counters
- **Features**: In-memory, Fast access, TTL support

### Elasticsearch (Port 9245)
- **Purpose**: Job search engine
- **Data**: Job listings, Full-text search
- **Features**: Fast search, Fuzzy matching, Filters

---

## Best Practices Implemented

1. **UUID v7**: Time-ordered UUIDs for better indexing
2. **Soft Deletes**: deletedAt field for User entity
3. **Timestamps**: createdAt, updatedAt on all entities
4. **Indexes**: Strategic indexes on foreign keys and frequently queried fields
5. **Enums**: Type-safe status and type fields
6. **JSON Fields**: Flexible metadata storage
7. **Cascade Deletes**: Proper cleanup of related data
8. **Unique Constraints**: Prevent duplicate data
9. **Normalization**: Proper table relationships
10. **Security**: Password encryption, token management, audit logging

---

## Migration Strategy

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

---

## Backup & Recovery

- **PostgreSQL**: Daily automated backups
- **MySQL**: Daily automated backups
- **MongoDB**: Log rotation and archival
- **Redis**: RDB snapshots + AOF persistence

---

## Monitoring

- **Database Metrics**: Connection pool, Query performance, Slow queries
- **Application Metrics**: API response times, Error rates
- **Infrastructure**: CPU, Memory, Disk usage

---

*Last Updated: 2026-04-06*
