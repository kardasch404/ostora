# Payment Service

Handles subscriptions, payments, and billing for Ostora platform.

## Features

- ✅ Stripe integration (cards, subscriptions)
- ✅ Multiple subscription plans (FREE, PREMIUM, B2B)
- ✅ Webhook handling with signature validation
- ✅ Trial periods (7 days for Premium)
- ✅ Proration on plan changes
- ✅ Currency conversion (MAD/USD)
- 🔄 PayPal integration (coming soon)
- 🔄 Promo codes (coming soon)
- 🔄 Invoice PDF generation (coming soon)

## Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| FREE | 0 MAD | 5 applications/month, 1 bundle |
| PREMIUM_MONTHLY | 49 MAD | Unlimited applications, AI features, 7-day trial |
| PREMIUM_ANNUAL | 399 MAD | Everything + priority AI, analytics |
| B2B_STARTER | 999 MAD | 1000 API calls/day, webhooks |
| B2B_PRO | 2499 MAD | 10000 API calls/day, SLA 99.9% |

## API Endpoints

### Subscriptions
- `POST /subscriptions` - Create/upgrade subscription
- `GET /subscriptions/me` - Get current subscription
- `DELETE /subscriptions` - Cancel subscription

### Webhooks
- `POST /webhooks/stripe` - Stripe webhook handler

## Stripe Events Handled

- `payment_intent.succeeded` - One-time payment success
- `invoice.payment_succeeded` - Subscription payment success
- `invoice.payment_failed` - Payment failure
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription change
- `customer.subscription.deleted` - Subscription cancelled
- `customer.subscription.trial_will_end` - Trial ending soon

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Stripe keys
```

3. Run migrations:
```bash
npm run prisma:migrate
```

4. Start service:
```bash
npm run start:dev
```

## Stripe Setup

1. Create products in Stripe Dashboard
2. Create prices for each plan
3. Copy price IDs to `.env`
4. Configure webhook endpoint: `https://your-domain.com/webhooks/stripe`
5. Copy webhook secret to `.env`

## Testing Webhooks Locally

```bash
stripe listen --forward-to localhost:4724/webhooks/stripe
```

## Architecture

```
payment-service/
├── subscription/          # Subscription business logic
│   ├── subscription.service.ts
│   ├── subscription.controller.ts
│   └── dto/
├── providers/
│   └── stripe/           # Stripe integration
│       ├── stripe.service.ts
│       ├── stripe-webhook.controller.ts
│       └── stripe-event-handler.ts
├── webhook/              # Webhook validation
├── value-objects/        # Domain objects (Money, etc)
└── main.ts
```

## Environment Variables

See `.env.example` for all required variables.
