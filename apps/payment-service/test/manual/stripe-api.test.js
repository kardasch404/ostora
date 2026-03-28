/**
 * Manual Stripe API Test Script (JavaScript)
 * Run with: node test/manual/stripe-api.test.js
 * 
 * This script tests the actual Stripe API using credentials from .env
 */

const Stripe = require('stripe');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

async function testStripeConnection() {
  console.log('🔍 Testing Stripe API Connection...\n');

  try {
    // Test 1: Verify API Key
    console.log('✅ Test 1: Verify API Key');
    const balance = await stripe.balance.retrieve();
    console.log(`   Balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'usd'}`);
    console.log(`   Pending: ${balance.pending[0]?.amount || 0}\n`);

    // Test 2: Create Customer
    console.log('✅ Test 2: Create Test Customer');
    const customer = await stripe.customers.create({
      email: 'test@ostora.com',
      name: 'Ostora Test User',
      metadata: { userId: 'test-123', source: 'manual-test' },
    });
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}\n`);

    // Test 3: Create Payment Intent
    console.log('✅ Test 3: Create Payment Intent');
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customer.id,
      amount: 5000, // $50.00
      currency: 'usd',
      metadata: { orderId: 'test-order-123' },
      automatic_payment_methods: { enabled: true },
    });
    console.log(`   Payment Intent ID: ${paymentIntent.id}`);
    console.log(`   Amount: $${paymentIntent.amount / 100}`);
    console.log(`   Status: ${paymentIntent.status}\n`);

    // Test 4: List Products
    console.log('✅ Test 4: List Products');
    const products = await stripe.products.list({ limit: 5 });
    console.log(`   Found ${products.data.length} products`);
    products.data.forEach((product) => {
      console.log(`   - ${product.name} (${product.id})`);
    });
    console.log();

    // Test 5: List Prices
    console.log('✅ Test 5: List Prices');
    const prices = await stripe.prices.list({ limit: 5 });
    console.log(`   Found ${prices.data.length} prices`);
    prices.data.forEach((price) => {
      const amount = price.unit_amount ? `$${price.unit_amount / 100}` : 'Custom';
      console.log(`   - ${price.id}: ${amount} ${price.currency} (${price.type})`);
    });
    console.log();

    // Test 6: Create Subscription (with trial)
    console.log('✅ Test 6: Create Subscription with Trial');
    const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
    
    if (priceId && priceId !== 'price_premium_monthly_id') {
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: 7,
        metadata: { plan: 'PREMIUM_MONTHLY' },
      });
      console.log(`   Subscription ID: ${subscription.id}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Trial End: ${new Date(subscription.trial_end * 1000).toISOString()}\n`);
    } else {
      console.log('   ⚠️  Skipped: STRIPE_PRICE_PREMIUM_MONTHLY not configured\n');
    }

    // Cleanup
    console.log('🧹 Cleanup: Deleting test customer');
    await stripe.customers.del(customer.id);
    console.log('   ✅ Customer deleted\n');

    console.log('✅ All tests passed! Stripe integration is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.type) {
      console.error(`   Type: ${error.type}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Run tests
testStripeConnection();
