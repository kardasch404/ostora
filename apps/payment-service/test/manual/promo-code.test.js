/**
 * Manual Promo Code Test Script
 * Run with: node test/manual/promo-code.test.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4724';
const ADMIN_TOKEN = 'mock-admin-token';
const USER_TOKEN = 'mock-user-token';

async function testPromoCodeSystem() {
  console.log('🔍 Testing Promo Code System...\n');

  try {
    // Test 1: Generate Gift Code
    console.log('✅ Test 1: Generate Gift Code');
    const giftCode = await axios.post(
      `${BASE_URL}/promo-codes/generate`,
      {
        plan: 'PREMIUM_MONTHLY',
        durationDays: 30,
        type: 'GIFT',
        maxUses: 1,
        description: 'Test Gift Code',
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
    );
    console.log(`   Code: ${giftCode.data.code}`);
    console.log(`   Plan: ${giftCode.data.plan}`);
    console.log(`   Duration: ${giftCode.data.durationDays} days`);
    console.log(`   Max Uses: ${giftCode.data.maxUses}\n`);

    const testCode = giftCode.data.code;

    // Test 2: Validate Code
    console.log('✅ Test 2: Validate Promo Code');
    const validation = await axios.get(
      `${BASE_URL}/promo-codes/validate/${testCode}`,
    );
    console.log(`   Valid: ${validation.data.valid}\n`);

    // Test 3: Get Code Details
    console.log('✅ Test 3: Get Code Details');
    const details = await axios.get(
      `${BASE_URL}/promo-codes/${testCode}`,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
    );
    console.log(`   Code: ${details.data.code}`);
    console.log(`   Status: ${details.data.status}`);
    console.log(`   Used: ${details.data.usedCount}/${details.data.maxUses}\n`);

    // Test 4: Redeem Code
    console.log('✅ Test 4: Redeem Promo Code');
    const redemption = await axios.post(
      `${BASE_URL}/promo-codes/redeem`,
      { code: testCode },
      {
        headers: { Authorization: `Bearer ${USER_TOKEN}` },
      },
    );
    console.log(`   Success: ${redemption.data.success}`);
    console.log(`   Subscription ID: ${redemption.data.subscription.id}`);
    console.log(`   Plan: ${redemption.data.subscription.plan}`);
    console.log(`   Expires: ${redemption.data.subscription.expiresAt}\n`);

    // Test 5: Get Usage Stats
    console.log('✅ Test 5: Get Usage Statistics');
    const stats = await axios.get(
      `${BASE_URL}/promo-codes/${testCode}/stats`,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
    );
    console.log(`   Total Uses: ${stats.data.usedCount}/${stats.data.maxUses}`);
    console.log(`   Remaining: ${stats.data.remainingUses}`);
    console.log(`   Status: ${stats.data.status}\n`);

    // Test 6: Generate Referral Code
    console.log('✅ Test 6: Generate Referral Code');
    const refCode = await axios.post(
      `${BASE_URL}/promo-codes/generate`,
      {
        plan: 'PREMIUM_MONTHLY',
        durationDays: 7,
        type: 'REFERRAL',
        maxUses: 10,
        customCode: 'REF-TEST123',
      },
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
    );
    console.log(`   Code: ${refCode.data.code}`);
    console.log(`   Type: ${refCode.data.type}`);
    console.log(`   Max Uses: ${refCode.data.maxUses}\n`);

    // Test 7: List Promo Codes
    console.log('✅ Test 7: List Promo Codes');
    const list = await axios.get(
      `${BASE_URL}/promo-codes/list?type=GIFT`,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
    );
    console.log(`   Found ${list.data.length} GIFT codes\n`);

    // Test 8: Deactivate Code
    console.log('✅ Test 8: Deactivate Promo Code');
    const deactivated = await axios.delete(
      `${BASE_URL}/promo-codes/${testCode}`,
      {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
    );
    console.log(`   Code: ${deactivated.data.code}`);
    console.log(`   Status: ${deactivated.data.status}\n`);

    console.log('✅ All tests passed! Promo code system is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testPromoCodeSystem();
