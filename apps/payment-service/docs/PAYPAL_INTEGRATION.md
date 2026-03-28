# PayPal Integration

Complete PayPal REST API v2 integration for users without credit cards.

## Features

✅ **One-time Payments** - Create and capture PayPal orders
✅ **Recurring Subscriptions** - Billing plans and subscriptions
✅ **Webhook Events** - Handle payment and subscription events
✅ **Signature Validation** - Verify webhook authenticity

## API Endpoints

### 1. Create PayPal Order

```http
POST /paypal/orders
Content-Type: application/json

{
  "plan": "PREMIUM_MONTHLY",
  "returnUrl": "https://ostora.com/success",
  "cancelUrl": "https://ostora.com/cancel"
}
```

**Response:**
```json
{
  "orderId": "8XY12345ABC67890",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=8XY12345ABC67890",
  "status": "CREATED"
}
```

### 2. Capture Order

```http
POST /paypal/orders/:orderId/capture
```

**Response:**
```json
{
  "orderId": "8XY12345ABC67890",
  "status": "COMPLETED",
  "captureId": "9AB12345CDE67890"
}
```

### 3. Create Subscription

```http
POST /paypal/subscriptions
Content-Type: application/json

{
  "plan": "PREMIUM_MONTHLY",
  "returnUrl": "https://ostora.com/success",
  "cancelUrl": "https://ostora.com/cancel"
}
```

**Response:**
```json
{
  "subscriptionId": "I-BW452GLLEP1G",
  "approveUrl": "https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-2M839401L3456789",
  "status": "APPROVAL_PENDING"
}
```

### 4. Get Subscription

```http
GET /paypal/subscriptions/:subscriptionId
```

## Webhook Events

Configure webhook URL in PayPal Dashboard:
```
https://api.ostora.com/webhooks/paypal
```

### Supported Events:

1. **PAYMENT.CAPTURE.COMPLETED** - Payment successfully captured
2. **BILLING.SUBSCRIPTION.ACTIVATED** - Subscription activated
3. **BILLING.SUBSCRIPTION.CANCELLED** - Subscription cancelled
4. **BILLING.SUBSCRIPTION.SUSPENDED** - Payment failed, subscription suspended
5. **BILLING.SUBSCRIPTION.EXPIRED** - Subscription expired
6. **PAYMENT.CAPTURE.DENIED** - Payment denied
7. **PAYMENT.CAPTURE.REFUNDED** - Payment refunded

### Webhook Signature Validation

PayPal sends these headers:
- `paypal-transmission-id`
- `paypal-transmission-time`
- `paypal-transmission-sig`
- `paypal-cert-url`
- `paypal-auth-algo`

## Setup

### 1. Create PayPal App

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create new app
3. Get Client ID and Secret
4. Switch to Live when ready

### 2. Create Billing Plans

```bash
# Create product
curl -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "name": "Ostora Premium",
    "type": "SERVICE"
  }'

# Create billing plan
curl -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "product_id": "PROD-XXXX",
    "name": "Premium Monthly",
    "billing_cycles": [{
      "frequency": {
        "interval_unit": "MONTH",
        "interval_count": 1
      },
      "tenure_type": "REGULAR",
      "sequence": 1,
      "total_cycles": 0,
      "pricing_scheme": {
        "fixed_price": {
          "value": "5",
          "currency_code": "USD"
        }
      }
    }],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "payment_failure_threshold": 3
    }
  }'
```

### 3. Configure Environment

Update `.env`:
```bash
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id

PAYPAL_PLAN_PREMIUM_MONTHLY=P-XXXXXXXXXXXX
PAYPAL_PLAN_PREMIUM_ANNUAL=P-XXXXXXXXXXXX
PAYPAL_PLAN_B2B_STARTER=P-XXXXXXXXXXXX
PAYPAL_PLAN_B2B_PRO=P-XXXXXXXXXXXX
```

### 4. Setup Webhooks

1. Go to PayPal Dashboard → Webhooks
2. Create webhook: `https://api.ostora.com/webhooks/paypal`
3. Select events:
   - All Billing Subscription events
   - All Payment Capture events
4. Copy Webhook ID to `.env`

## Testing

### Manual Test

```bash
node test/manual/paypal-api.test.js
```

### Integration Tests

```bash
npm test -- paypal.integration.spec.ts
```

## Flow Diagrams

### One-time Payment Flow

```
User → Create Order → Redirect to PayPal → User Approves → Capture Order → Success
```

### Subscription Flow

```
User → Create Subscription → Redirect to PayPal → User Approves → Webhook Activated → Success
```

## Error Handling

Common errors:
- `INVALID_REQUEST` - Check request payload
- `AUTHENTICATION_FAILURE` - Verify credentials
- `PERMISSION_DENIED` - Check app permissions
- `RESOURCE_NOT_FOUND` - Order/subscription doesn't exist

## Production Checklist

- [ ] Switch to live credentials
- [ ] Update `PAYPAL_MODE=live`
- [ ] Configure live webhook URL
- [ ] Test with real PayPal account
- [ ] Implement full signature validation
- [ ] Add error monitoring
- [ ] Setup payment reconciliation

## Resources

- [PayPal REST API Docs](https://developer.paypal.com/api/rest/)
- [Webhooks Guide](https://developer.paypal.com/api/rest/webhooks/)
- [Subscriptions API](https://developer.paypal.com/docs/subscriptions/)
