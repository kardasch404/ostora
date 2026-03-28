# Promo Code System

Complete gift/promo code system for MAD local users, referrals, and marketing campaigns.

## Features

✅ **Code Generation** - UUID-based unique codes with prefixes
✅ **Multiple Types** - Gift, Referral, Marketing, Partner
✅ **Validation** - Expiry, usage limits, status checks
✅ **Redemption** - Direct subscription activation
✅ **Usage Tracking** - Complete audit trail
✅ **Admin Management** - Full CRUD operations
✅ **Statistics** - Usage analytics and reporting

## Promo Code Types

### 1. GIFT
- For MAD local users without payment methods
- One-time use codes
- Example: `GIFT-A1B2C3D4`

### 2. REFERRAL
- For user referral programs
- Can be multi-use
- Example: `REF-X9Y8Z7W6`

### 3. MARKETING
- For promotional campaigns
- Bulk generation support
- Example: `PROMO-M5N4O3P2`

### 4. PARTNER
- For business partnerships
- Custom codes allowed
- Example: `PARTNER-ACME2024`

## API Endpoints

### Admin Endpoints

#### 1. Generate Promo Code

```http
POST /promo-codes/generate
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "plan": "PREMIUM_MONTHLY",
  "durationDays": 30,
  "type": "GIFT",
  "maxUses": 1,
  "expiresAt": "2024-12-31T23:59:59Z",
  "description": "New Year Gift",
  "customCode": "NEWYEAR2024"
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "NEWYEAR2024",
  "plan": "PREMIUM_MONTHLY",
  "durationDays": 30,
  "type": "GIFT",
  "status": "ACTIVE",
  "maxUses": 1,
  "usedCount": 0,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. List Promo Codes

```http
GET /promo-codes/list?type=GIFT&status=ACTIVE&plan=PREMIUM_MONTHLY
Authorization: Bearer ADMIN_TOKEN
```

#### 3. Get Promo Code Details

```http
GET /promo-codes/GIFT-A1B2C3D4
Authorization: Bearer ADMIN_TOKEN
```

#### 4. Get Usage Statistics

```http
GET /promo-codes/GIFT-A1B2C3D4/stats
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "code": "GIFT-A1B2C3D4",
  "plan": "PREMIUM_MONTHLY",
  "type": "GIFT",
  "status": "DEPLETED",
  "maxUses": 1,
  "usedCount": 1,
  "remainingUses": 0,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "usages": [
    {
      "userId": "user-123",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "redeemedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### 5. Deactivate Promo Code

```http
DELETE /promo-codes/GIFT-A1B2C3D4
Authorization: Bearer ADMIN_TOKEN
```

### User Endpoints

#### 1. Validate Promo Code

```http
GET /promo-codes/validate/GIFT-A1B2C3D4
```

**Response:**
```json
{
  "valid": true
}
```

#### 2. Redeem Promo Code

```http
POST /promo-codes/redeem
Authorization: Bearer USER_TOKEN
Content-Type: application/json

{
  "code": "GIFT-A1B2C3D4"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub-123",
    "plan": "PREMIUM_MONTHLY",
    "status": "ACTIVE",
    "expiresAt": "2024-02-15T10:30:00.000Z"
  },
  "promoCode": {
    "code": "GIFT-A1B2C3D4",
    "type": "GIFT"
  }
}
```

## Validation Rules

### Code Format
- Length: 8-36 characters
- Pattern: `^[A-Z0-9-]+$`
- Case-insensitive (converted to uppercase)

### Validation Checks
1. **Exists** - Code must exist in database
2. **Not Expired** - Current date < expiresAt
3. **Not Depleted** - usedCount < maxUses
4. **Not Disabled** - status != DISABLED
5. **Not Already Used** - User hasn't redeemed this code
6. **No Active Subscription** - User doesn't have active paid plan

## Code Generation Logic

### Auto-Generated Codes
```
GIFT-{8_CHAR_UUID}      → GIFT-A1B2C3D4
REF-{8_CHAR_UUID}       → REF-X9Y8Z7W6
PROMO-{8_CHAR_UUID}     → PROMO-M5N4O3P2
PARTNER-{8_CHAR_UUID}   → PARTNER-Q7R6S5T4
```

### Custom Codes
- Admin can specify custom code
- Must be unique
- Follows same validation rules

## Database Schema

### PromoCode Table
```prisma
model PromoCode {
  id            String   @id @default(uuid())
  code          String   @unique
  plan          Plan
  durationDays  Int
  type          PromoCodeType
  status        PromoCodeStatus
  maxUses       Int      @default(1)
  usedCount     Int      @default(0)
  expiresAt     DateTime?
  description   String?
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  usages        PromoCodeUsage[]
  subscriptions Subscription[]
}
```

### PromoCodeUsage Table
```prisma
model PromoCodeUsage {
  id          String   @id @default(uuid())
  userId      String
  promoCodeId String
  redeemedAt  DateTime @default(now())
  
  user      User      @relation(fields: [userId], references: [id])
  promoCode PromoCode @relation(fields: [promoCodeId], references: [id])
  
  @@unique([userId, promoCodeId])
}
```

## Use Cases

### 1. MAD Local Users
```bash
# Admin generates gift code
POST /promo-codes/generate
{
  "plan": "PREMIUM_MONTHLY",
  "durationDays": 30,
  "type": "GIFT",
  "maxUses": 1
}

# User redeems code
POST /promo-codes/redeem
{
  "code": "GIFT-A1B2C3D4"
}
```

### 2. Referral Program
```bash
# Generate referral code for user
POST /promo-codes/generate
{
  "plan": "PREMIUM_MONTHLY",
  "durationDays": 7,
  "type": "REFERRAL",
  "maxUses": 10,
  "customCode": "REFER-JOHN123"
}
```

### 3. Marketing Campaign
```bash
# Bulk generate promo codes
for i in {1..100}; do
  curl -X POST /promo-codes/generate \
    -d '{
      "plan": "PREMIUM_MONTHLY",
      "durationDays": 14,
      "type": "MARKETING",
      "maxUses": 1,
      "expiresAt": "2024-12-31T23:59:59Z"
    }'
done
```

### 4. Partner Integration
```bash
# Generate partner code
POST /promo-codes/generate
{
  "plan": "PREMIUM_ANNUAL",
  "durationDays": 365,
  "type": "PARTNER",
  "maxUses": 1000,
  "customCode": "PARTNER-ACME2024",
  "description": "ACME Corp Partnership"
}
```

## Best Practices

✅ **Expiration Dates** - Always set reasonable expiry
✅ **Usage Limits** - Prevent abuse with maxUses
✅ **Audit Trail** - Track all redemptions
✅ **Validation** - Check before redemption
✅ **Status Management** - Disable compromised codes
✅ **Analytics** - Monitor usage patterns
✅ **Security** - Admin-only generation
✅ **User Experience** - Clear error messages

## Error Handling

### Common Errors

**Code Not Found**
```json
{
  "statusCode": 404,
  "message": "Promo code not found"
}
```

**Code Expired**
```json
{
  "statusCode": 400,
  "message": "This promo code has expired"
}
```

**Code Depleted**
```json
{
  "statusCode": 400,
  "message": "This promo code has reached its usage limit"
}
```

**Already Used**
```json
{
  "statusCode": 400,
  "message": "You have already used this promo code"
}
```

**Active Subscription**
```json
{
  "statusCode": 400,
  "message": "You already have an active subscription"
}
```

## Testing

### Manual Test Script
```bash
node test/manual/promo-code.test.js
```

### Unit Tests
```bash
npm test -- promo-code.service.spec.ts
```

### Integration Tests
```bash
npm test -- promo-code.integration.spec.ts
```

### E2E Tests
```bash
npm test -- promo-code.e2e.spec.ts
```

## Monitoring

### Key Metrics
- Total codes generated
- Redemption rate
- Active vs expired codes
- Most popular code types
- Average duration
- Fraud attempts

### Analytics Queries
```sql
-- Redemption rate by type
SELECT type, 
       COUNT(*) as total,
       SUM(usedCount) as redeemed,
       (SUM(usedCount) * 100.0 / SUM(maxUses)) as redemption_rate
FROM PromoCode
GROUP BY type;

-- Top performing codes
SELECT code, type, usedCount, maxUses
FROM PromoCode
WHERE usedCount > 0
ORDER BY usedCount DESC
LIMIT 10;
```

## Production Checklist

- [ ] Setup admin authentication
- [ ] Add rate limiting
- [ ] Implement fraud detection
- [ ] Setup monitoring alerts
- [ ] Create bulk generation tool
- [ ] Add export functionality
- [ ] Setup automated expiry cleanup
- [ ] Document code distribution process
- [ ] Train support team
- [ ] Create user documentation
