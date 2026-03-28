/**
 * PayPal Setup Script - Create Products and Billing Plans
 * Run with: node test/manual/paypal-setup.js
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const BASE_URL = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(
    `${BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return response.data.access_token;
}

async function createProduct(token, name, description) {
  const response = await axios.post(
    `${BASE_URL}/v1/catalogs/products`,
    {
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

async function createBillingPlan(token, productId, name, price, interval) {
  const response = await axios.post(
    `${BASE_URL}/v1/billing/plans`,
    {
      product_id: productId,
      name,
      description: `Ostora ${name} Plan`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: interval,
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: price.toString(),
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}

async function setupPayPal() {
  console.log('🚀 Setting up PayPal Products and Billing Plans...\n');

  try {
    const token = await getAccessToken();
    console.log('✅ Authenticated with PayPal\n');

    // Create Products
    console.log('📦 Creating Products...\n');

    const premiumProduct = await createProduct(
      token,
      'Ostora Premium',
      'Premium job seeker subscription with AI features',
    );
    console.log(`✅ Premium Product: ${premiumProduct.id}`);

    const b2bProduct = await createProduct(
      token,
      'Ostora B2B',
      'Enterprise API access for businesses',
    );
    console.log(`✅ B2B Product: ${b2bProduct.id}\n`);

    // Create Billing Plans
    console.log('💳 Creating Billing Plans...\n');

    const premiumMonthly = await createBillingPlan(
      token,
      premiumProduct.id,
      'Premium Monthly',
      5,
      'MONTH',
    );
    console.log(`✅ Premium Monthly Plan: ${premiumMonthly.id}`);

    const premiumAnnual = await createBillingPlan(
      token,
      premiumProduct.id,
      'Premium Annual',
      40,
      'YEAR',
    );
    console.log(`✅ Premium Annual Plan: ${premiumAnnual.id}`);

    const b2bStarter = await createBillingPlan(
      token,
      b2bProduct.id,
      'B2B Starter',
      100,
      'MONTH',
    );
    console.log(`✅ B2B Starter Plan: ${b2bStarter.id}`);

    const b2bPro = await createBillingPlan(
      token,
      b2bProduct.id,
      'B2B Pro',
      250,
      'MONTH',
    );
    console.log(`✅ B2B Pro Plan: ${b2bPro.id}\n`);

    // Print .env configuration
    console.log('📝 Add these to your .env file:\n');
    console.log(`PAYPAL_PLAN_PREMIUM_MONTHLY=${premiumMonthly.id}`);
    console.log(`PAYPAL_PLAN_PREMIUM_ANNUAL=${premiumAnnual.id}`);
    console.log(`PAYPAL_PLAN_B2B_STARTER=${b2bStarter.id}`);
    console.log(`PAYPAL_PLAN_B2B_PRO=${b2bPro.id}\n`);

    console.log('✅ PayPal setup completed successfully!\n');
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', JSON.stringify(error.response.data.details, null, 2));
    }
    process.exit(1);
  }
}

setupPayPal();
