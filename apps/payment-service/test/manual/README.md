# Manual Test Scripts

These scripts test the payment service using real Stripe API credentials from `.env`.

## Prerequisites

```bash
npm install
npm install -D ts-node @types/node
```

## Running Tests

### 1. Stripe API Connection Test (JavaScript - Recommended)

Tests basic Stripe connectivity and operations:

```bash
node test/manual/stripe-api.test.js
```

### 2. Stripe API Connection Test (TypeScript)

Alternatively, run the TypeScript version:

```bash
npx ts-node test/manual/stripe-api.test.ts
```

This will:
- ✅ Verify API key validity
- ✅ Check account balance
- ✅ Create test customer
- ✅ Create payment intent
- ✅ List products and prices
- ✅ Create subscription with trial
- ✅ Cleanup test data

### 2. Expected Output

```
🔍 Testing Stripe API Connection...

✅ Test 1: Verify API Key
   Balance: 0 usd
   Pending: 0

✅ Test 2: Create Test Customer
   Customer ID: cus_xxxxxxxxxxxxx
   Email: test@ostora.com

✅ Test 3: Create Payment Intent
   Payment Intent ID: pi_xxxxxxxxxxxxx
   Amount: $50
   Status: requires_payment_method

✅ Test 4: List Products
   Found 3 products
   - Premium Plan (prod_xxxxx)
   - B2B Starter (prod_xxxxx)
   - B2B Pro (prod_xxxxx)

✅ Test 5: List Prices
   Found 4 prices
   - price_xxxxx: $5 usd (recurring)
   - price_xxxxx: $40 usd (recurring)

✅ Test 6: Create Subscription with Trial
   Subscription ID: sub_xxxxxxxxxxxxx
   Status: trialing
   Trial End: 2024-01-15T12:00:00.000Z

🧹 Cleanup: Deleting test customer
   ✅ Customer deleted

✅ All tests passed! Stripe integration is working correctly.
```

## Troubleshooting

### Error: Invalid API Key

Check your `.env` file:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
```

### Error: Price not found

Create prices in Stripe Dashboard or update `.env`:
```bash
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM_ANNUAL=price_xxxxxxxxxxxxx
```

## Notes

- Tests use **test mode** API keys (sk_test_*)
- All test data is automatically cleaned up
- No charges are made to real cards
- Safe to run multiple times
