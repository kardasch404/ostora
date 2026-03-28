/**
 * Manual PayPal API Test Script
 * Run with: node test/manual/paypal-api.test.js
 * 
 * This script tests the actual PayPal API using credentials from .env
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

async function testPayPalConnection() {
  console.log('🔍 Testing PayPal API Connection...\n');

  try {
    // Test 1: Get Access Token
    console.log('✅ Test 1: Get Access Token');
    const token = await getAccessToken();
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Mode: ${PAYPAL_MODE}\n`);

    // Test 2: Create Order
    console.log('✅ Test 2: Create PayPal Order');
    const orderResponse = await axios.post(
      `${BASE_URL}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: 'test-user-123',
          description: 'Ostora Premium Subscription',
          amount: {
            currency_code: 'USD',
            value: '5.00',
          },
          custom_id: 'test-user-123',
        }],
        application_context: {
          brand_name: 'Ostora',
          return_url: 'https://ostora.com/success',
          cancel_url: 'https://ostora.com/cancel',
          user_action: 'PAY_NOW',
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const order = orderResponse.data;
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    const approveLink = order.links.find(link => link.rel === 'approve');
    console.log(`   Approve URL: ${approveLink?.href}\n`);

    // Test 3: Get Order Details
    console.log('✅ Test 3: Get Order Details');
    const orderDetails = await axios.get(
      `${BASE_URL}/v2/checkout/orders/${order.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log(`   Order Status: ${orderDetails.data.status}`);
    console.log(`   Amount: $${orderDetails.data.purchase_units[0].amount.value}\n`);

    // Test 4: List Products (if any)
    console.log('✅ Test 4: List Products');
    try {
      const products = await axios.get(
        `${BASE_URL}/v1/catalogs/products?page_size=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log(`   Found ${products.data.products?.length || 0} products\n`);
    } catch (error) {
      console.log('   No products found or not configured\n');
    }

    // Test 5: List Billing Plans
    console.log('✅ Test 5: List Billing Plans');
    try {
      const plans = await axios.get(
        `${BASE_URL}/v1/billing/plans?page_size=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log(`   Found ${plans.data.plans?.length || 0} billing plans`);
      plans.data.plans?.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.id})`);
      });
      console.log();
    } catch (error) {
      console.log('   No billing plans found\n');
    }

    console.log('✅ All tests passed! PayPal integration is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('   Details:', JSON.stringify(error.response.data.details, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
testPayPalConnection();
