# Email Service Diagnostic Guide

## Problem: OTP emails not being sent

### Root Cause
Gmail SMTP authentication was failing due to incorrect app password format.

### Solution Applied
1. ✅ Created `.env` file with correct Gmail app password: `phyojupvncdsvbzv`
2. ✅ Verified SMTP connection works (test-gmail.js passed)
3. ✅ Auth service publishes to `email.events` Kafka topic
4. ✅ Email service consumes from `email.events` topic

### How to Test

#### 1. Test Gmail SMTP Directly
```bash
cd apps/email-service
node test-gmail.js
```

Expected output:
```
✅ SMTP connection verified!
✅ Email sent successfully!
Message ID: <...@gmail.com>
```

#### 2. Start Email Service
```bash
cd apps/email-service
npm install
npm run dev
```

#### 3. Start Auth Service
```bash
cd apps/auth-service
npm run dev
```

#### 4. Start Kafka (if not running)
```bash
docker-compose up -d kafka zookeeper
```

#### 5. Test Registration Flow
```bash
curl -X POST http://localhost:4718/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zz2406143@gmail.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Verify Email Sent

Check your inbox at `zz2406143@gmail.com` for OTP code email.

### Troubleshooting

#### If email not received:

1. **Check Kafka is running:**
```bash
docker ps | grep kafka
```

2. **Check email service logs:**
```bash
# Look for "Received email event: OTP_CODE"
# Look for "Email sent successfully"
```

3. **Check auth service logs:**
```bash
# Look for "OTP requested for user"
```

4. **Check Kafdrop UI:**
Open http://localhost:9000 and verify:
- Topic `email.events` exists
- Messages are being produced
- Consumer group `email-service-group` is active

5. **Check Gmail App Password:**
- Go to https://myaccount.google.com/apppasswords
- Verify app password is: `phyo jupv ncds vbzv` (with spaces)
- In .env file use: `phyojupvncdsvbzv` (without spaces)

6. **Check Redis:**
```bash
docker exec -it ostora-redis redis-cli
> KEYS otp:*
> GET otp:<userId>
```

### Email Service Environment Variables

Required in `apps/email-service/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreplayostora@gmail.com
SMTP_PASSWORD=phyojupvncdsvbzv
SMTP_FROM_EMAIL=noreplayostora@gmail.com
KAFKA_BROKER=localhost:9095
REDIS_HOST=localhost
REDIS_PORT=6345
```

### Auth Service Environment Variables

Required in `apps/auth-service/.env`:
```env
KAFKA_BROKER=localhost:9095
KAFKA_ENABLED=true
```

### Complete Flow

1. User registers → Auth Service
2. Auth Service generates OTP → Stores in Redis
3. Auth Service publishes to Kafka topic `email.events`
4. Email Service consumes from Kafka
5. Email Service renders OTP template
6. Email Service sends via Gmail SMTP
7. User receives OTP email

### Success Indicators

✅ SMTP test passes
✅ Kafka topic `email.events` has messages
✅ Email service logs show "Email sent successfully"
✅ User receives email at zz2406143@gmail.com

### Current Status

- ✅ Gmail SMTP configured correctly
- ✅ App password working
- ✅ Test email sent successfully
- ⏳ Need to start email-service to consume Kafka events
- ⏳ Need to verify Kafka is running

### Next Steps

1. Start Kafka: `docker-compose up -d kafka zookeeper`
2. Start Email Service: `cd apps/email-service && npm run dev`
3. Start Auth Service: `cd apps/auth-service && npm run dev`
4. Test registration
5. Check email inbox
