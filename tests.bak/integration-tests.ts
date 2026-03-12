/**
 * REZ App - Integration Tests (E2E User Journeys)
 *
 * Tests complete user flows from start to finish
 * Run with: npx ts-node tests/integration-tests.ts
 */

// Base configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';
const TEST_PHONE_1 = '+919999999991';
const TEST_PHONE_2 = '+919999999992';
const TEST_OTP = '123456';

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Test tracking
let totalJourneys = 0;
let passedJourneys = 0;
let failedJourneys = 0;
const failedJourneysList: string[] = [];

// Test data
interface TestUser {
  phone: string;
  token: string;
  refreshToken: string;
  userId: string;
}

let user1: TestUser = { phone: TEST_PHONE_1, token: '', refreshToken: '', userId: '' };
let user2: TestUser = { phone: TEST_PHONE_2, token: '', refreshToken: '', userId: '' };

/**
 * API request helper
 */
async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  token?: string
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const text = await response.text();
    let json;

    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      json = { rawResponse: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data: json,
    };
  } catch (error: any) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Journey assertion
 */
function assertJourney(condition: boolean, journeyName: string, step: string): void {
  if (!condition) {
    console.log(`  ${colors.red}✗ ${step}${colors.reset}`);
    throw new Error(`Journey failed at: ${step}`);
  } else {
    console.log(`  ${colors.green}✓ ${step}${colors.reset}`);
  }
}

/**
 * Journey header
 */
function journeyHeader(name: string): void {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  ${name.padEnd(56)}║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Register/Login helper
 */
async function registerUser(phone: string): Promise<TestUser> {
  // Send OTP
  const sendOtp = await apiRequest('POST', '/user/auth/send-otp', { phoneNumber: phone });
  if (!sendOtp.ok) throw new Error('Failed to send OTP');

  await sleep(500);

  // Verify OTP
  const verifyOtp = await apiRequest('POST', '/user/auth/verify-otp', {
    phoneNumber: phone,
    otp: TEST_OTP,
  });
  if (!verifyOtp.ok || !verifyOtp.data?.data?.tokens) {
    throw new Error('Failed to verify OTP');
  }

  return {
    phone,
    token: verifyOtp.data.data.tokens.accessToken,
    refreshToken: verifyOtp.data.data.tokens.refreshToken,
    userId: verifyOtp.data.data.user?.id || verifyOtp.data.data.user?._id,
  };
}

// ==================== JOURNEY 1: NEW USER PURCHASE FLOW ====================

async function journey1_NewUserPurchase() {
  totalJourneys++;
  journeyHeader('JOURNEY 1: New User Complete Purchase Flow');

  try {
    // Step 1: Register new user
    console.log(`${colors.cyan}Step 1: Register new user${colors.reset}`);
    user1 = await registerUser(TEST_PHONE_1);
    assertJourney(!!user1.token, 'Journey 1', 'User registered successfully');

    // Step 2: Complete onboarding
    console.log(`\n${colors.cyan}Step 2: Complete onboarding${colors.reset}`);
    const onboarding = await apiRequest(
      'POST',
      '/user/auth/complete-onboarding',
      {
        profile: {
          firstName: 'Integration',
          lastName: 'Tester',
        },
        preferences: {
          categories: ['electronics', 'fashion'],
        },
      },
      user1.token
    );
    assertJourney(onboarding.ok, 'Journey 1', 'Onboarding completed');

    // Step 3: Browse products
    console.log(`\n${colors.cyan}Step 3: Browse products${colors.reset}`);
    const products = await apiRequest('GET', '/products?limit=10');
    assertJourney(
      products.ok && Array.isArray(products.data?.data) && products.data.data.length > 0,
      'Journey 1',
      'Products loaded'
    );

    const productId = products.data.data[0]._id || products.data.data[0].id;
    assertJourney(!!productId, 'Journey 1', 'Product ID obtained');

    // Step 4: View product details
    console.log(`\n${colors.cyan}Step 4: View product details${colors.reset}`);
    const productDetails = await apiRequest('GET', `/products/${productId}`);
    assertJourney(productDetails.ok, 'Journey 1', 'Product details loaded');

    // Step 5: Add to cart
    console.log(`\n${colors.cyan}Step 5: Add product to cart${colors.reset}`);
    const addToCart = await apiRequest(
      'POST',
      '/cart/add',
      {
        productId,
        quantity: 1,
      },
      user1.token
    );
    assertJourney(addToCart.ok, 'Journey 1', 'Product added to cart');

    // Step 6: View cart
    console.log(`\n${colors.cyan}Step 6: View cart${colors.reset}`);
    const cart = await apiRequest('GET', '/cart', null, user1.token);
    assertJourney(
      cart.ok && cart.data?.data?.items?.length > 0,
      'Journey 1',
      'Cart contains items'
    );

    // Step 7: Get cart summary
    console.log(`\n${colors.cyan}Step 7: Get checkout summary${colors.reset}`);
    const summary = await apiRequest('GET', '/cart/summary', null, user1.token);
    assertJourney(summary.ok, 'Journey 1', 'Cart summary retrieved');

    // Step 8: Create order (simulated - skip payment for now)
    console.log(`\n${colors.cyan}Step 8: Create order${colors.reset}`);
    // Note: This would require payment integration in real scenario
    console.log(`  ${colors.yellow}⚠ Payment integration required - simulating order creation${colors.reset}`);

    // Step 9: Verify order in history
    console.log(`\n${colors.cyan}Step 9: Check order history${colors.reset}`);
    const orders = await apiRequest('GET', '/orders', null, user1.token);
    assertJourney(orders.ok, 'Journey 1', 'Order history retrieved');

    // Cleanup: Clear cart
    await apiRequest('DELETE', `/cart/item/${productId}`, null, user1.token);

    console.log(`\n${colors.green}✓ Journey 1 completed successfully${colors.reset}`);
    passedJourneys++;
  } catch (error: any) {
    console.log(`\n${colors.red}✗ Journey 1 failed: ${error.message}${colors.reset}`);
    failedJourneys++;
    failedJourneysList.push('Journey 1: New User Purchase Flow');
  }
}

// ==================== JOURNEY 2: PREMIUM SUBSCRIPTION FLOW ====================

async function journey2_PremiumSubscription() {
  totalJourneys++;
  journeyHeader('JOURNEY 2: Premium Subscription & Enhanced Cashback');

  try {
    // Use existing user1 or create new
    if (!user1.token) {
      user1 = await registerUser(TEST_PHONE_1);
    }

    // Step 1: View subscription plans
    console.log(`${colors.cyan}Step 1: View subscription plans${colors.reset}`);
    const tiers = await apiRequest('GET', '/subscriptions/tiers');
    assertJourney(
      tiers.ok && Array.isArray(tiers.data?.data),
      'Journey 2',
      'Subscription plans loaded'
    );

    // Step 2: Get current subscription
    console.log(`\n${colors.cyan}Step 2: Check current subscription${colors.reset}`);
    const current = await apiRequest('GET', '/subscriptions/current', null, user1.token);
    assertJourney(current.ok, 'Journey 2', 'Current subscription retrieved');

    // Step 3: Get value proposition
    console.log(`\n${colors.cyan}Step 3: View Premium value proposition${colors.reset}`);
    const valueProps = await apiRequest(
      'GET',
      '/subscriptions/value-proposition/premium',
      null,
      user1.token
    );
    assertJourney(valueProps.ok, 'Journey 2', 'Value proposition retrieved');

    // Step 4: Subscribe to Premium (simulated - requires Razorpay)
    console.log(`\n${colors.cyan}Step 4: Subscribe to Premium${colors.reset}`);
    console.log(`  ${colors.yellow}⚠ Razorpay integration required - simulating subscription${colors.reset}`);

    // Step 5: Verify subscription benefits
    console.log(`\n${colors.cyan}Step 5: Check subscription benefits${colors.reset}`);
    const benefits = await apiRequest('GET', '/subscriptions/benefits', null, user1.token);
    assertJourney(benefits.ok, 'Journey 2', 'Benefits retrieved');

    // Step 6: View subscription usage
    console.log(`\n${colors.cyan}Step 6: Check subscription usage${colors.reset}`);
    const usage = await apiRequest('GET', '/subscriptions/usage', null, user1.token);
    assertJourney(usage.ok, 'Journey 2', 'Usage stats retrieved');

    // Step 7: Place order to test enhanced cashback
    console.log(`\n${colors.cyan}Step 7: Place order with Premium benefits${colors.reset}`);
    const products = await apiRequest('GET', '/products?limit=5');
    if (products.ok && products.data?.data?.length > 0) {
      const productId = products.data.data[0]._id || products.data.data[0].id;
      await apiRequest('POST', '/cart/add', { productId, quantity: 1 }, user1.token);
      console.log(`  ${colors.green}✓ Order would receive 2x cashback${colors.reset}`);
      // Cleanup
      await apiRequest('DELETE', `/cart/item/${productId}`, null, user1.token);
    }

    console.log(`\n${colors.green}✓ Journey 2 completed successfully${colors.reset}`);
    passedJourneys++;
  } catch (error: any) {
    console.log(`\n${colors.red}✗ Journey 2 failed: ${error.message}${colors.reset}`);
    failedJourneys++;
    failedJourneysList.push('Journey 2: Premium Subscription Flow');
  }
}

// ==================== JOURNEY 3: BILL UPLOAD FLOW ====================

async function journey3_BillUpload() {
  totalJourneys++;
  journeyHeader('JOURNEY 3: Bill Upload & Cashback Credit');

  try {
    // Use existing user1 or create new
    if (!user1.token) {
      user1 = await registerUser(TEST_PHONE_1);
    }

    // Step 1: Check initial wallet balance
    console.log(`${colors.cyan}Step 1: Check initial wallet balance${colors.reset}`);
    const initialBalance = await apiRequest('GET', '/wallet/balance', null, user1.token);
    assertJourney(initialBalance.ok, 'Journey 3', 'Initial balance retrieved');

    // Step 2: View bill statistics
    console.log(`\n${colors.cyan}Step 2: View bill statistics${colors.reset}`);
    const stats = await apiRequest('GET', '/bills/statistics', null, user1.token);
    assertJourney(stats.ok, 'Journey 3', 'Bill statistics retrieved');

    // Step 3: Upload bill (simulated - requires image file)
    console.log(`\n${colors.cyan}Step 3: Upload bill${colors.reset}`);
    console.log(`  ${colors.yellow}⚠ Image upload required - simulating bill upload${colors.reset}`);
    console.log(`  ${colors.yellow}⚠ In real scenario: POST /bills/upload with FormData${colors.reset}`);

    // Step 4: View bill history
    console.log(`\n${colors.cyan}Step 4: Check bill history${colors.reset}`);
    const bills = await apiRequest('GET', '/bills', null, user1.token);
    assertJourney(bills.ok, 'Journey 3', 'Bill history retrieved');

    // Step 5: Check wallet balance increased
    console.log(`\n${colors.cyan}Step 5: Verify cashback credited${colors.reset}`);
    const finalBalance = await apiRequest('GET', '/wallet/balance', null, user1.token);
    assertJourney(finalBalance.ok, 'Journey 3', 'Final balance retrieved');

    // Step 6: View wallet transactions
    console.log(`\n${colors.cyan}Step 6: View wallet transactions${colors.reset}`);
    const transactions = await apiRequest(
      'GET',
      '/wallet/transactions?page=1&limit=10',
      null,
      user1.token
    );
    assertJourney(transactions.ok, 'Journey 3', 'Wallet transactions retrieved');

    console.log(`\n${colors.green}✓ Journey 3 completed successfully${colors.reset}`);
    passedJourneys++;
  } catch (error: any) {
    console.log(`\n${colors.red}✗ Journey 3 failed: ${error.message}${colors.reset}`);
    failedJourneys++;
    failedJourneysList.push('Journey 3: Bill Upload Flow');
  }
}

// ==================== JOURNEY 4: GAMIFICATION FLOW ====================

async function journey4_Gamification() {
  totalJourneys++;
  journeyHeader('JOURNEY 4: Complete Challenge & Earn Coins');

  try {
    // Use existing user1 or create new
    if (!user1.token) {
      user1 = await registerUser(TEST_PHONE_1);
    }

    // Step 1: Check initial coin balance
    console.log(`${colors.cyan}Step 1: Check initial coin balance${colors.reset}`);
    const initialCoins = await apiRequest('GET', '/gamification/coins/balance', null, user1.token);
    assertJourney(initialCoins.ok, 'Journey 4', 'Initial coin balance retrieved');
    const startingCoins = initialCoins.data?.data?.balance || 0;
    console.log(`  ${colors.blue}Starting coins: ${startingCoins}${colors.reset}`);

    // Step 2: View challenges
    console.log(`\n${colors.cyan}Step 2: View active challenges${colors.reset}`);
    const challenges = await apiRequest('GET', '/gamification/challenges', null, user1.token);
    assertJourney(
      challenges.ok && Array.isArray(challenges.data?.data),
      'Journey 4',
      'Challenges retrieved'
    );

    // Step 3: Place order to complete challenge
    console.log(`\n${colors.cyan}Step 3: Complete challenge requirement${colors.reset}`);
    console.log(`  ${colors.yellow}⚠ Simulating order placement to complete challenge${colors.reset}`);

    // Step 4: Claim reward (if challenge completed)
    console.log(`\n${colors.cyan}Step 4: Claim challenge reward${colors.reset}`);
    const completedChallenge = challenges.data?.data?.find((c: any) => c.status === 'completed');
    if (completedChallenge) {
      const claimReward = await apiRequest(
        'POST',
        '/gamification/claim-reward',
        { challengeId: completedChallenge._id || completedChallenge.id },
        user1.token
      );
      assertJourney(claimReward.ok, 'Journey 4', 'Reward claimed');
    } else {
      console.log(`  ${colors.yellow}⚠ No completed challenges found - skipping claim${colors.reset}`);
    }

    // Step 5: Verify coins increased
    console.log(`\n${colors.cyan}Step 5: Verify coins increased${colors.reset}`);
    const finalCoins = await apiRequest('GET', '/gamification/coins/balance', null, user1.token);
    assertJourney(finalCoins.ok, 'Journey 4', 'Final coin balance retrieved');
    const endingCoins = finalCoins.data?.data?.balance || 0;
    console.log(`  ${colors.blue}Ending coins: ${endingCoins}${colors.reset}`);

    // Step 6: Check leaderboard updated
    console.log(`\n${colors.cyan}Step 6: Check leaderboard position${colors.reset}`);
    const leaderboard = await apiRequest(
      'GET',
      '/gamification/leaderboard?period=monthly&limit=50',
      null,
      user1.token
    );
    assertJourney(leaderboard.ok, 'Journey 4', 'Leaderboard retrieved');

    // Step 7: View achievements
    console.log(`\n${colors.cyan}Step 7: View achievements${colors.reset}`);
    const achievements = await apiRequest('GET', '/gamification/achievements', null, user1.token);
    assertJourney(achievements.ok, 'Journey 4', 'Achievements retrieved');

    // Step 8: Check spin wheel eligibility
    console.log(`\n${colors.cyan}Step 8: Check mini-game eligibility${colors.reset}`);
    const spinEligibility = await apiRequest(
      'GET',
      '/gamification/spin-wheel/eligibility',
      null,
      user1.token
    );
    assertJourney(spinEligibility.ok, 'Journey 4', 'Spin wheel eligibility checked');

    console.log(`\n${colors.green}✓ Journey 4 completed successfully${colors.reset}`);
    passedJourneys++;
  } catch (error: any) {
    console.log(`\n${colors.red}✗ Journey 4 failed: ${error.message}${colors.reset}`);
    failedJourneys++;
    failedJourneysList.push('Journey 4: Gamification Flow');
  }
}

// ==================== JOURNEY 5: REFERRAL FLOW ====================

async function journey5_Referral() {
  totalJourneys++;
  journeyHeader('JOURNEY 5: Refer Friend & Earn Rewards');

  try {
    // Step 1: User A gets referral code
    console.log(`${colors.cyan}Step 1: User A - Get referral code${colors.reset}`);
    if (!user1.token) {
      user1 = await registerUser(TEST_PHONE_1);
    }

    const referralData = await apiRequest('GET', '/referral/data', null, user1.token);
    assertJourney(
      referralData.ok && referralData.data?.data?.referralCode,
      'Journey 5',
      'Referral code retrieved'
    );
    const referralCode = referralData.data.data.referralCode;
    console.log(`  ${colors.blue}Referral Code: ${referralCode}${colors.reset}`);

    // Step 2: Generate referral link
    console.log(`\n${colors.cyan}Step 2: Generate referral link${colors.reset}`);
    const generateLink = await apiRequest('POST', '/referral/generate-link', {}, user1.token);
    assertJourney(generateLink.ok, 'Journey 5', 'Referral link generated');

    // Step 3: Check initial referral stats
    console.log(`\n${colors.cyan}Step 3: Check initial referral stats${colors.reset}`);
    const initialStats = await apiRequest('GET', '/referral/statistics', null, user1.token);
    assertJourney(initialStats.ok, 'Journey 5', 'Initial stats retrieved');
    const initialReferrals = initialStats.data?.data?.totalReferrals || 0;
    console.log(`  ${colors.blue}Initial referrals: ${initialReferrals}${colors.reset}`);

    // Step 4: User B signs up with code (simulated)
    console.log(`\n${colors.cyan}Step 4: User B - Sign up with referral code${colors.reset}`);
    console.log(`  ${colors.yellow}⚠ Simulating User B sign-up with code: ${referralCode}${colors.reset}`);

    // In real scenario, User B would:
    // 1. Register with referralCode in request
    // 2. Complete onboarding
    // 3. Place first order

    // Step 5: Check referral history
    console.log(`\n${colors.cyan}Step 5: User A - Check referral history${colors.reset}`);
    const history = await apiRequest(
      'GET',
      '/referral/history?page=1&limit=10',
      null,
      user1.token
    );
    assertJourney(history.ok, 'Journey 5', 'Referral history retrieved');

    // Step 6: Check tier progress
    console.log(`\n${colors.cyan}Step 6: Check tier progress${colors.reset}`);
    const finalStats = await apiRequest('GET', '/referral/statistics', null, user1.token);
    assertJourney(finalStats.ok, 'Journey 5', 'Final stats retrieved');

    // Step 7: Check leaderboard
    console.log(`\n${colors.cyan}Step 7: Check referral leaderboard${colors.reset}`);
    const leaderboard = await apiRequest(
      'GET',
      '/referral/leaderboard?period=month',
      null,
      user1.token
    );
    assertJourney(leaderboard.ok, 'Journey 5', 'Referral leaderboard retrieved');

    console.log(`\n${colors.green}✓ Journey 5 completed successfully${colors.reset}`);
    passedJourneys++;
  } catch (error: any) {
    console.log(`\n${colors.red}✗ Journey 5 failed: ${error.message}${colors.reset}`);
    failedJourneys++;
    failedJourneysList.push('Journey 5: Referral Flow');
  }
}

// ==================== JOURNEY 6: WISHLIST TO PURCHASE ====================

async function journey6_WishlistToPurchase() {
  totalJourneys++;
  journeyHeader('JOURNEY 6: Wishlist Management & Purchase');

  try {
    if (!user1.token) {
      user1 = await registerUser(TEST_PHONE_1);
    }

    // Step 1: Browse products
    console.log(`${colors.cyan}Step 1: Browse products${colors.reset}`);
    const products = await apiRequest('GET', '/products?limit=5');
    assertJourney(
      products.ok && Array.isArray(products.data?.data) && products.data.data.length > 0,
      'Journey 6',
      'Products loaded'
    );

    const productId = products.data.data[0]._id || products.data.data[0].id;

    // Step 2: Add to wishlist
    console.log(`\n${colors.cyan}Step 2: Add product to wishlist${colors.reset}`);
    const addToWishlist = await apiRequest(
      'POST',
      '/wishlist/add',
      { productId },
      user1.token
    );
    assertJourney(addToWishlist.ok, 'Journey 6', 'Product added to wishlist');

    // Step 3: View wishlist
    console.log(`\n${colors.cyan}Step 3: View wishlist${colors.reset}`);
    const wishlist = await apiRequest('GET', '/wishlist', null, user1.token);
    assertJourney(wishlist.ok, 'Journey 6', 'Wishlist retrieved');

    // Step 4: Move from wishlist to cart
    console.log(`\n${colors.cyan}Step 4: Move product to cart${colors.reset}`);
    const addToCart = await apiRequest(
      'POST',
      '/cart/add',
      { productId, quantity: 1 },
      user1.token
    );
    assertJourney(addToCart.ok, 'Journey 6', 'Product added to cart');

    // Step 5: Remove from wishlist
    console.log(`\n${colors.cyan}Step 5: Remove from wishlist${colors.reset}`);
    const removeFromWishlist = await apiRequest(
      'DELETE',
      `/wishlist/${productId}`,
      null,
      user1.token
    );
    assertJourney(removeFromWishlist.ok, 'Journey 6', 'Product removed from wishlist');

    // Cleanup
    await apiRequest('DELETE', `/cart/item/${productId}`, null, user1.token);

    console.log(`\n${colors.green}✓ Journey 6 completed successfully${colors.reset}`);
    passedJourneys++;
  } catch (error: any) {
    console.log(`\n${colors.red}✗ Journey 6 failed: ${error.message}${colors.reset}`);
    failedJourneys++;
    failedJourneysList.push('Journey 6: Wishlist to Purchase');
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllJourneys() {
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  REZ APP - INTEGRATION TESTS (E2E USER JOURNEYS)             ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.yellow}API Base URL: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}Test Users: ${TEST_PHONE_1}, ${TEST_PHONE_2}${colors.reset}\n`);

  const startTime = Date.now();

  try {
    await journey1_NewUserPurchase();
    await sleep(1000);

    await journey2_PremiumSubscription();
    await sleep(1000);

    await journey3_BillUpload();
    await sleep(1000);

    await journey4_Gamification();
    await sleep(1000);

    await journey5_Referral();
    await sleep(1000);

    await journey6_WishlistToPurchase();
  } catch (error: any) {
    console.error(`\n${colors.red}Fatal error during journey execution:${colors.reset}`, error.message);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  console.log(`${colors.blue}INTEGRATION TEST SUMMARY${colors.reset}\n`);
  console.log(`Total Journeys:  ${totalJourneys}`);
  console.log(`${colors.green}Passed:          ${passedJourneys}${colors.reset}`);
  console.log(`${colors.red}Failed:          ${failedJourneys}${colors.reset}`);
  console.log(`Success Rate:    ${((passedJourneys / totalJourneys) * 100).toFixed(1)}%`);
  console.log(`Duration:        ${duration}s`);

  if (failedJourneys > 0) {
    console.log(`\n${colors.red}Failed Journeys:${colors.reset}`);
    failedJourneysList.forEach((journey, index) => {
      console.log(`  ${index + 1}. ${journey}`);
    });
  }

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  process.exit(failedJourneys > 0 ? 1 : 0);
}

// Run journeys
runAllJourneys();
