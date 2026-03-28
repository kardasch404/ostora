# PayPal Testing Guide

## Quick Start

### 1. Test API Connection

```bash
node test/manual/paypal-api.test.js
```

**Expected Output:**
```
✅ Test 1: Get Access Token
   Token: A21AAK6YY8CmWAJPVvrc...
   Mode: sandbox

✅ Test 2: Create PayPal Order
   Order ID: 9TG79947LN5362129
   Status: CREATED
   Approve URL: https://www.sandbox.paypal.com/checkoutnow?token=...

✅ Test 3: Get Order Details
   Order Status: CREATED
   Amount: $5.00

✅ All tests passed!
```

### 2. Setup Products & Plans (Optional)

```bash
node test/manual/paypal-setup.js
```

This creates:
- 2 Products (Premium, B2B)
- 4 Billing Plans (Monthly, Annual, Starter, Pro)

### 3. Run Unit Tests

```bash
npm test -- paypal.service.spec.ts
```

### 4. Run Integration Tests

```bash
npm test -- paypal.integration.spec.ts
```

### 5. Run E2E Tests

```bash
npm test -- paypal.e2e.spec.ts
```

## Manual Testing Flow

### Test Order Creation & Capture

1. **Create Order:**
```bash
curl -X POST http://localhost:4724/paypal/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "PREMIUM_MONTHLY",
    "returnUrl": "https://ostora.com/success",
    "cancelUrl": "https://ostora.com/cancel"
  }'
```

2. **Copy `approveUrl` and open in browser**

3. **Login with PayPal Sandbox account**

4. **Approve payment**

5. **Capture Order:**
```bash
curl -X POST http://localhost:4724/paypal/orders/ORDER_ID/capture \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Subscription Creation

1. **Create Subscription:**
```bash
curl -X POST http://localhost:4724/paypal/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "PREMIUM_MONTHLY",
    "returnUrl": "https://ostora.com/success",
    "cancelUrl": "https://ostora.com/cancel"
  }'
```

2. **Approve subscription in browser**

3. **Check subscription status:**
```bash
curl http://localhost:4724/paypal/subscriptions/SUBSCRIPTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## PayPal Sandbox Accounts

### Create Test Accounts

1. Go to [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts)
2. Create **Business Account** (merchant)
3. Create **Personal Account** (buyer)
4. Use personal account to test payments

### Test Cards

PayPal Sandbox accepts any valid card format:
- Visa: 4111 1111 1111 1111
- Mastercard: 5555 5555 5555 4444
- Amex: 3782 822463 10005

## Webhook Testing

### Using ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 4724

# Copy URL and configure in PayPal Dashboard
# Example: https://abc123.ngrok.io/webhooks/paypal
```

### Simulate Webhook Events

```bash
curl -X POST http://localhost:4724/webhooks/paypal \
  -H "paypal-transmission-id: test-id" \
  -H "paypal-transmission-time: 2024-01-01T00:00:00Z" \
  -H "paypal-transmission-sig: test-sig" \
  -H "paypal-cert-url: https://api.paypal.com/cert" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "test-capture-id",
      "amount": { "value": "5.00" },
      "custom_id": "user-123"
    }
  }'
```

## Troubleshooting

### Error: AUTHENTICATION_FAILURE

Check credentials in `.env`:
```bash
PAYPAL_CLIENT_ID=Ab85fqMqQRb7Hj2fzq9hVWEmiadbzbbeE4E4-fh9Gqkst1ONYY1zsMCX5rOZ-zxsxVb7hv3oWsBcrOGf
PAYPAL_CLIENT_SECRET=EEu7CqOguH7eJ431UfjA9Eq1b2T8gNW86oAssu9pzNi4Vh80XJeZ4qD10VbkcVgC2cpp9R-JS6KPHxrO
```

### Error: INVALID_REQUEST

- Verify request payload matches API docs
- Check plan IDs are configured
- Ensure URLs are valid

### Error: RESOURCE_NOT_FOUND

- Order/subscription doesn't exist
- Check ID is correct
- Verify using correct environment (sandbox/live)

## Best Practices

✅ **Always validate webhooks** - Verify signature before processing
✅ **Handle idempotency** - Store transaction IDs to prevent duplicates
✅ **Log all events** - Keep audit trail of payments
✅ **Test error scenarios** - Failed payments, cancellations, refunds
✅ **Monitor webhook delivery** - Set up alerts for failures
✅ **Use custom_id** - Track user/order in PayPal events
✅ **Implement retry logic** - Handle API timeouts gracefully

## Production Checklist

- [ ] Switch to live credentials
- [ ] Update `PAYPAL_MODE=live`
- [ ] Configure production webhook URL
- [ ] Test with real PayPal account
- [ ] Implement full signature validation
- [ ] Setup monitoring and alerts
- [ ] Add payment reconciliation
- [ ] Document refund process
- [ ] Setup customer support flow
- [ ] Test all error scenarios

## Resources

- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
- [REST API Reference](https://developer.paypal.com/api/rest/)
- [Webhooks Guide](https://developer.paypal.com/api/rest/webhooks/)
- [Testing Guide](https://developer.paypal.com/tools/sandbox/)
