# Auth Service

Authentication and authorization microservice for Ostora platform.

## Features

- User registration with email verification
- Email verification via token (24h TTL in Redis)
- Password hashing with bcrypt (cost 12)
- Role-based access control (RBAC)
- hCaptcha anti-bot validation
- Kafka event publishing
- Swagger API documentation

## Endpoints

### POST /api/v1/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "hCaptchaToken": "optional_token"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "uuid-v7"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/v1/auth/verify-email?token=uuid
Verify email address using token from email.

**Response:**
```json
{
  "statusCode": 200,
  "message": "Email verified successfully. You can now login.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

See `.env.example` for required configuration.

## Running the Service

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Port

Default: 4718

## Dependencies

- NestJS 10
- Prisma ORM
- Redis (ioredis)
- Kafka (kafkajs)
- bcrypt
- class-validator
- axios (hCaptcha validation)
