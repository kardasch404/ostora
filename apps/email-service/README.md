# Email Service

Microservice for handling all email communications with Nodemailer, Kafka, and Handlebars templates.

## Features

- **Kafka Consumer**: Listens to `email.events` topic
- **Event Types**: EMAIL_VERIFICATION, PASSWORD_RESET, PASSWORD_CHANGED, NEW_DEVICE_LOGIN, OTP_CODE, APPLICATION_SENT, WELCOME
- **Templates**: Handlebars HTML templates with plain-text fallback
- **Transport**: User's SMTP config (via gRPC) OR AWS SES fallback
- **Retry Logic**: 3 attempts with exponential backoff
- **Email Logs**: Records every send attempt in database
- **Attachments**: Fetches presigned S3 URLs and attaches to emails

## Architecture

```
Kafka (email.events) → Consumer → BullMQ Queue → Processor → Transport (SMTP/SES) → Email Log
```

## Email Event Types

### 1. EMAIL_VERIFICATION
```json
{
  "eventType": "EMAIL_VERIFICATION",
  "userId": "uuid",
  "to": "user@example.com",
  "data": {
    "name": "John Doe",
    "verificationUrl": "https://ostora.com/verify?token=..."
  }
}
```

### 2. PASSWORD_RESET
```json
{
  "eventType": "PASSWORD_RESET",
  "userId": "uuid",
  "to": "user@example.com",
  "data": {
    "name": "John Doe",
    "resetUrl": "https://ostora.com/reset?token=..."
  }
}
```

### 3. OTP_CODE
```json
{
  "eventType": "OTP_CODE",
  "userId": "uuid",
  "to": "user@example.com",
  "data": {
    "name": "John Doe",
    "otpCode": "123456",
    "expiryMinutes": "5"
  }
}
```

### 4. APPLICATION_SENT
```json
{
  "eventType": "APPLICATION_SENT",
  "userId": "uuid",
  "to": "user@example.com",
  "data": {
    "name": "John Doe",
    "jobTitle": "Senior Developer",
    "companyName": "Tech Corp",
    "location": "Berlin, Germany",
    "appliedDate": "2024-01-15",
    "documents": ["CV.pdf", "Cover Letter.pdf"],
    "dashboardUrl": "https://ostora.com/dashboard"
  },
  "attachments": ["cv-s3-key", "cover-letter-s3-key"]
}
```

## Placeholder Substitution

Templates support placeholder substitution with `~#` prefix:

```handlebars
Hello {{~#rh_name}}
```

The service will replace `~#rh_name` with the actual value from the data object.

## Retry Logic

- **Attempt 1**: Immediate
- **Attempt 2**: After 2 minutes (2^1 * 60s)
- **Attempt 3**: After 4 minutes (2^2 * 60s)

If all attempts fail, the email is marked as FAILED in the log.

## Transport Selection

1. **User SMTP Config** (Priority 1): Fetched from user-service via gRPC
2. **AWS SES** (Fallback): Used if SMTP config is unavailable or fails verification

## API Endpoints

### POST /email/send
Send email directly (internal use)

```json
{
  "to": "user@example.com",
  "subject": "Test Email",
  "body": "<h1>Hello</h1>",
  "plainText": "Hello",
  "attachments": ["https://s3.amazonaws.com/..."]
}
```

### POST /email/send-application
Send job application email

```json
{
  "jobPostId": "uuid",
  "bundleId": "uuid",
  "emailConfigId": "uuid",
  "templateId": "uuid",
  "recipientEmail": "hr@company.com",
  "placeholders": {
    "companyName": "Tech Corp"
  }
}
```

## Environment Variables

See `.env.example` for all required environment variables.

## Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Docker

```bash
docker build -t ostora-email-service .
docker run -p 4721:4721 ostora-email-service
```

## Testing

Send a test event to Kafka:

```bash
kafka-console-producer --broker-list localhost:9095 --topic email.events

# Paste this JSON:
{"eventType":"WELCOME","userId":"test-user","to":"test@example.com","data":{"name":"Test User","dashboardUrl":"https://ostora.com/dashboard","helpUrl":"https://ostora.com/help"}}
```

## Monitoring

- **Swagger UI**: http://localhost:4721/api/docs
- **Bull Dashboard**: Install `bull-board` for queue monitoring

## License

Proprietary - All rights reserved
