/**
 * REZ App - Automated API Tests
 *
 * Run with: npx ts-node tests/api-tests.ts
 * Or compile: tsc tests/api-tests.ts && node tests/api-tests.js
 */

// Base configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';
const TEST_PHONE = '+919999999999';
const TEST_OTP = '123456'; // Dev bypass OTP

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestsList: string[] = [];

// Global test data
let authToken = '';
let refreshToken = '';
let userId = '';
let productId = '';
let storeId = '';
let cartId = '';
let orderId = '';
let billId = '';
let subscriptionId = '';
let challengeId = '';
let referralCode = '';

/**
 * Helper function to make API requests
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
 * Test assertion function
 */
function assert(condition: boolean, testName: string, message?: string): void {
  totalTests++;

  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    failedTests++;
    failedTestsList.push(testName);
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (message) {
      console.log(`  ${colors.red}${message}${colors.reset}`);
    }
  }
}

/**
 * Test group header
 */
function testGroup(name: string): void {
  console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}\n`);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== BACKEND HEALTH TESTS ====================

async function testBackendHealth() {
  testGroup('BACKEND HEALTH');

  // Test 1: Backend is running
  const health = await apiRequest('GET', '/health');
  assert(
    health.status === 200 || health.data?.status === 'ok',
    'Backend health check',
    `Status: ${health.status}`
  );
}

// ==================== AUTHENTICATION TESTS ====================

async function testAuthentication() {
  testGroup('AUTHENTICATION');

  // Test 1: Send OTP
  const sendOtp = await apiRequest('POST', '/user/auth/send-otp', {
    phoneNumber: TEST_PHONE,
  });
  assert(
    sendOtp.ok && sendOtp.data?.success !== false,
    'Send OTP',
    `Response: ${JSON.stringify(sendOtp.data)}`
  );

  // Wait for OTP (in production, this would be received via SMS)
  await sleep(1000);

  // Test 2: Verify OTP
  const verifyOtp = await apiRequest('POST', '/user/auth/verify-otp', {
    phoneNumber: TEST_PHONE,
    otp: TEST_OTP,
  });
  assert(
    verifyOtp.ok && verifyOtp.data?.data?.tokens,
    'Verify OTP',
    `Response: ${JSON.stringify(verifyOtp.data)}`
  );

  if (verifyOtp.data?.data?.tokens) {
    authToken = verifyOtp.data.data.tokens.accessToken;
    refreshToken = verifyOtp.data.data.tokens.refreshToken;
    userId = verifyOtp.data.data.user?.id || verifyOtp.data.data.user?._id;
    console.log(`  ${colors.blue}Token acquired${colors.reset}`);
  }

  // Test 3: Get user profile
  const profile = await apiRequest('GET', '/user/auth/me', null, authToken);
  assert(
    profile.ok && profile.data?.data?.id,
    'Get user profile',
    `Response: ${JSON.stringify(profile.data)}`
  );

  // Test 4: Update profile
  const updateProfile = await apiRequest(
    'PUT',
    '/user/auth/profile',
    {
      profile: {
        firstName: 'Test',
        lastName: 'User',
      },
    },
    authToken
  );
  assert(
    updateProfile.ok,
    'Update user profile',
    `Response: ${JSON.stringify(updateProfile.data)}`
  );

  // Test 5: Refresh token
  const refresh = await apiRequest('POST', '/user/auth/refresh-token', {
    refreshToken,
  });
  assert(
    refresh.ok && refresh.data?.data?.tokens,
    'Refresh access token',
    `Response: ${JSON.stringify(refresh.data)}`
  );

  // Test 6: Get user statistics
  const stats = await apiRequest('GET', '/user/auth/statistics', null, authToken);
  assert(
    stats.ok,
    'Get user statistics',
    `Response: ${JSON.stringify(stats.data)}`
  );
}

// ==================== PRODUCT TESTS ====================

async function testProducts() {
  testGroup('PRODUCTS');

  // Test 1: Get all products
  const products = await apiRequest('GET', '/products?limit=10');
  assert(
    products.ok && Array.isArray(products.data?.data),
    'Get all products',
    `Response: ${JSON.stringify(products.data)}`
  );

  if (products.data?.data && products.data.data.length > 0) {
    productId = products.data.data[0]._id || products.data.data[0].id;
    console.log(`  ${colors.blue}Product ID: ${productId}${colors.reset}`);
  }

  // Test 2: Get featured products
  const featured = await apiRequest('GET', '/products/featured?limit=5');
  assert(
    featured.ok && Array.isArray(featured.data?.data),
    'Get featured products',
    `Response: ${JSON.stringify(featured.data)}`
  );

  // Test 3: Get new arrivals
  const newArrivals = await apiRequest('GET', '/products/new-arrivals?limit=5');
  assert(
    newArrivals.ok,
    'Get new arrivals',
    `Response: ${JSON.stringify(newArrivals.data)}`
  );

  // Test 4: Get product by ID (if we have one)
  if (productId) {
    const product = await apiRequest('GET', `/products/${productId}`);
    assert(
      product.ok && product.data?.data,
      'Get product by ID',
      `Response: ${JSON.stringify(product.data)}`
    );
  }

  // Test 5: Search products
  const search = await apiRequest('GET', '/products/search?q=test&limit=5');
  assert(
    search.ok,
    'Search products',
    `Response: ${JSON.stringify(search.data)}`
  );
}

// ==================== CATEGORY TESTS ====================

async function testCategories() {
  testGroup('CATEGORIES');

  // Test 1: Get all categories
  const categories = await apiRequest('GET', '/categories');
  assert(
    categories.ok && Array.isArray(categories.data?.data),
    'Get all categories',
    `Response: ${JSON.stringify(categories.data)}`
  );

  // Test 2: Get category by slug (if available)
  if (categories.data?.data && categories.data.data.length > 0) {
    const categorySlug = categories.data.data[0].slug;
    const category = await apiRequest('GET', `/categories/${categorySlug}`);
    assert(
      category.ok,
      'Get category by slug',
      `Response: ${JSON.stringify(category.data)}`
    );
  }
}

// ==================== STORE TESTS ====================

async function testStores() {
  testGroup('STORES');

  // Test 1: Get all stores
  const stores = await apiRequest('GET', '/stores?limit=10');
  assert(
    stores.ok && Array.isArray(stores.data?.data),
    'Get all stores',
    `Response: ${JSON.stringify(stores.data)}`
  );

  if (stores.data?.data && stores.data.data.length > 0) {
    storeId = stores.data.data[0]._id || stores.data.data[0].id;
    console.log(`  ${colors.blue}Store ID: ${storeId}${colors.reset}`);
  }

  // Test 2: Get store by ID (if we have one)
  if (storeId) {
    const store = await apiRequest('GET', `/stores/${storeId}`);
    assert(
      store.ok && store.data?.data,
      'Get store by ID',
      `Response: ${JSON.stringify(store.data)}`
    );
  }

  // Test 3: Get store products (if we have store ID)
  if (storeId) {
    const storeProducts = await apiRequest('GET', `/products/store/${storeId}?limit=5`);
    assert(
      storeProducts.ok,
      'Get store products',
      `Response: ${JSON.stringify(storeProducts.data)}`
    );
  }
}

// ==================== CART TESTS ====================

async function testCart() {
  testGroup('CART');

  // Test 1: Get cart
  const cart = await apiRequest('GET', '/cart', null, authToken);
  assert(
    cart.ok,
    'Get user cart',
    `Response: ${JSON.stringify(cart.data)}`
  );

  if (cart.data?.data) {
    cartId = cart.data.data._id || cart.data.data.id;
  }

  // Test 2: Add to cart (if we have product ID)
  if (productId) {
    const addToCart = await apiRequest(
      'POST',
      '/cart/add',
      {
        productId,
        quantity: 1,
      },
      authToken
    );
    assert(
      addToCart.ok,
      'Add product to cart',
      `Response: ${JSON.stringify(addToCart.data)}`
    );
  }

  // Test 3: Update cart item (if we have product ID)
  if (productId) {
    const updateCart = await apiRequest(
      'PUT',
      `/cart/item/${productId}`,
      {
        quantity: 2,
      },
      authToken
    );
    assert(
      updateCart.ok,
      'Update cart item quantity',
      `Response: ${JSON.stringify(updateCart.data)}`
    );
  }

  // Test 4: Get cart summary
  const summary = await apiRequest('GET', '/cart/summary', null, authToken);
  assert(
    summary.ok,
    'Get cart summary',
    `Response: ${JSON.stringify(summary.data)}`
  );

  // Test 5: Validate cart
  const validate = await apiRequest('GET', '/cart/validate', null, authToken);
  assert(
    validate.ok,
    'Validate cart',
    `Response: ${JSON.stringify(validate.data)}`
  );

  // Test 6: Remove cart item (if we have product ID) - cleanup
  if (productId) {
    const removeCart = await apiRequest(
      'DELETE',
      `/cart/item/${productId}`,
      null,
      authToken
    );
    assert(
      removeCart.ok,
      'Remove cart item',
      `Response: ${JSON.stringify(removeCart.data)}`
    );
  }
}

// ==================== WISHLIST TESTS ====================

async function testWishlist() {
  testGroup('WISHLIST');

  // Test 1: Get wishlist
  const wishlist = await apiRequest('GET', '/wishlist', null, authToken);
  assert(
    wishlist.ok,
    'Get user wishlist',
    `Response: ${JSON.stringify(wishlist.data)}`
  );

  // Test 2: Add to wishlist (if we have product ID)
  if (productId) {
    const addToWishlist = await apiRequest(
      'POST',
      '/wishlist/add',
      {
        productId,
      },
      authToken
    );
    assert(
      addToWishlist.ok,
      'Add product to wishlist',
      `Response: ${JSON.stringify(addToWishlist.data)}`
    );
  }

  // Test 3: Remove from wishlist (cleanup)
  if (productId) {
    const removeFromWishlist = await apiRequest(
      'DELETE',
      `/wishlist/${productId}`,
      null,
      authToken
    );
    assert(
      removeFromWishlist.ok,
      'Remove product from wishlist',
      `Response: ${JSON.stringify(removeFromWishlist.data)}`
    );
  }
}

// ==================== ORDER TESTS ====================

async function testOrders() {
  testGroup('ORDERS');

  // Test 1: Get order history
  const orders = await apiRequest('GET', '/orders', null, authToken);
  assert(
    orders.ok,
    'Get order history',
    `Response: ${JSON.stringify(orders.data)}`
  );

  if (orders.data?.data && orders.data.data.length > 0) {
    orderId = orders.data.data[0]._id || orders.data.data[0].id;
    console.log(`  ${colors.blue}Order ID: ${orderId}${colors.reset}`);
  }

  // Test 2: Get order by ID (if we have one)
  if (orderId) {
    const order = await apiRequest('GET', `/orders/${orderId}`, null, authToken);
    assert(
      order.ok && order.data?.data,
      'Get order by ID',
      `Response: ${JSON.stringify(order.data)}`
    );
  }

  // Note: Creating orders requires cart items and payment flow
  // This should be tested in integration tests
}

// ==================== PHASE 3: BILL UPLOAD TESTS ====================

async function testBillUpload() {
  testGroup('BILL UPLOAD');

  // Test 1: Get bill history
  const bills = await apiRequest('GET', '/bills', null, authToken);
  assert(
    bills.ok,
    'Get bill history',
    `Response: ${JSON.stringify(bills.data)}`
  );

  // Test 2: Get bill statistics
  const stats = await apiRequest('GET', '/bills/statistics', null, authToken);
  assert(
    stats.ok,
    'Get bill statistics',
    `Response: ${JSON.stringify(stats.data)}`
  );

  // Note: Uploading bills requires multipart/form-data
  // This should be tested separately with actual image files
}

// ==================== PHASE 3: SUBSCRIPTION TESTS ====================

async function testSubscriptions() {
  testGroup('SUBSCRIPTIONS');

  // Test 1: Get subscription tiers
  const tiers = await apiRequest('GET', '/subscriptions/tiers');
  assert(
    tiers.ok && Array.isArray(tiers.data?.data),
    'Get subscription tiers',
    `Response: ${JSON.stringify(tiers.data)}`
  );

  // Test 2: Get current subscription
  const current = await apiRequest('GET', '/subscriptions/current', null, authToken);
  assert(
    current.ok,
    'Get current subscription',
    `Response: ${JSON.stringify(current.data)}`
  );

  // Test 3: Get subscription benefits
  const benefits = await apiRequest('GET', '/subscriptions/benefits', null, authToken);
  assert(
    benefits.ok,
    'Get subscription benefits',
    `Response: ${JSON.stringify(benefits.data)}`
  );

  // Test 4: Get subscription usage
  const usage = await apiRequest('GET', '/subscriptions/usage', null, authToken);
  assert(
    usage.ok,
    'Get subscription usage',
    `Response: ${JSON.stringify(usage.data)}`
  );

  // Test 5: Get value proposition
  const valueProps = await apiRequest(
    'GET',
    '/subscriptions/value-proposition/premium',
    null,
    authToken
  );
  assert(
    valueProps.ok,
    'Get value proposition',
    `Response: ${JSON.stringify(valueProps.data)}`
  );

  // Note: Subscribing requires payment flow
  // This should be tested in integration tests with Razorpay sandbox
}

// ==================== PHASE 3: GAMIFICATION TESTS ====================

async function testGamification() {
  testGroup('GAMIFICATION');

  // Test 1: Get gamification stats
  const stats = await apiRequest('GET', '/gamification/stats', null, authToken);
  assert(
    stats.ok,
    'Get gamification stats',
    `Response: ${JSON.stringify(stats.data)}`
  );

  // Test 2: Get coin balance
  const balance = await apiRequest('GET', '/gamification/coins/balance', null, authToken);
  assert(
    balance.ok,
    'Get coin balance',
    `Response: ${JSON.stringify(balance.data)}`
  );

  // Test 3: Get coin transactions
  const transactions = await apiRequest(
    'GET',
    '/gamification/coins/transactions?page=1&limit=20',
    null,
    authToken
  );
  assert(
    transactions.ok,
    'Get coin transactions',
    `Response: ${JSON.stringify(transactions.data)}`
  );

  // Test 4: Get challenges
  const challenges = await apiRequest('GET', '/gamification/challenges', null, authToken);
  assert(
    challenges.ok && Array.isArray(challenges.data?.data),
    'Get challenges',
    `Response: ${JSON.stringify(challenges.data)}`
  );

  if (challenges.data?.data && challenges.data.data.length > 0) {
    const completedChallenge = challenges.data.data.find(
      (c: any) => c.status === 'completed'
    );
    if (completedChallenge) {
      challengeId = completedChallenge._id || completedChallenge.id;
    }
  }

  // Test 5: Get achievements
  const achievements = await apiRequest('GET', '/gamification/achievements', null, authToken);
  assert(
    achievements.ok && Array.isArray(achievements.data?.data),
    'Get achievements',
    `Response: ${JSON.stringify(achievements.data)}`
  );

  // Test 6: Get leaderboard
  const leaderboard = await apiRequest(
    'GET',
    '/gamification/leaderboard?period=monthly&limit=50',
    null,
    authToken
  );
  assert(
    leaderboard.ok,
    'Get leaderboard',
    `Response: ${JSON.stringify(leaderboard.data)}`
  );

  // Test 7: Check spin wheel eligibility
  const spinEligibility = await apiRequest(
    'GET',
    '/gamification/spin-wheel/eligibility',
    null,
    authToken
  );
  assert(
    spinEligibility.ok,
    'Check spin wheel eligibility',
    `Response: ${JSON.stringify(spinEligibility.data)}`
  );

  // Test 8: Check scratch card eligibility
  const scratchEligibility = await apiRequest(
    'GET',
    '/gamification/scratch-card/eligibility',
    null,
    authToken
  );
  assert(
    scratchEligibility.ok,
    'Check scratch card eligibility',
    `Response: ${JSON.stringify(scratchEligibility.data)}`
  );

  // Test 9: Get current quiz
  const currentQuiz = await apiRequest('GET', '/gamification/quiz/current', null, authToken);
  assert(
    currentQuiz.ok,
    'Get current quiz',
    `Response: ${JSON.stringify(currentQuiz.data)}`
  );
}

// ==================== PHASE 3: REFERRAL TESTS ====================

async function testReferrals() {
  testGroup('REFERRALS');

  // Test 1: Get referral data
  const referralData = await apiRequest('GET', '/referral/data', null, authToken);
  assert(
    referralData.ok && referralData.data?.data?.referralCode,
    'Get referral data',
    `Response: ${JSON.stringify(referralData.data)}`
  );

  if (referralData.data?.data?.referralCode) {
    referralCode = referralData.data.data.referralCode;
    console.log(`  ${colors.blue}Referral Code: ${referralCode}${colors.reset}`);
  }

  // Test 2: Get referral history
  const history = await apiRequest('GET', '/referral/history?page=1&limit=20', null, authToken);
  assert(
    history.ok,
    'Get referral history',
    `Response: ${JSON.stringify(history.data)}`
  );

  // Test 3: Get referral statistics
  const stats = await apiRequest('GET', '/referral/statistics', null, authToken);
  assert(
    stats.ok,
    'Get referral statistics',
    `Response: ${JSON.stringify(stats.data)}`
  );

  // Test 4: Generate referral link
  const generateLink = await apiRequest('POST', '/referral/generate-link', {}, authToken);
  assert(
    generateLink.ok,
    'Generate referral link',
    `Response: ${JSON.stringify(generateLink.data)}`
  );

  // Test 5: Get referral leaderboard
  const leaderboard = await apiRequest(
    'GET',
    '/referral/leaderboard?period=month',
    null,
    authToken
  );
  assert(
    leaderboard.ok,
    'Get referral leaderboard',
    `Response: ${JSON.stringify(leaderboard.data)}`
  );
}

// ==================== WALLET TESTS ====================

async function testWallet() {
  testGroup('WALLET');

  // Test 1: Get wallet balance
  const balance = await apiRequest('GET', '/wallet/balance', null, authToken);
  assert(
    balance.ok,
    'Get wallet balance',
    `Response: ${JSON.stringify(balance.data)}`
  );

  // Test 2: Get wallet transactions
  const transactions = await apiRequest(
    'GET',
    '/wallet/transactions?page=1&limit=20',
    null,
    authToken
  );
  assert(
    transactions.ok,
    'Get wallet transactions',
    `Response: ${JSON.stringify(transactions.data)}`
  );
}

// ==================== OFFERS TESTS ====================

async function testOffers() {
  testGroup('OFFERS');

  // Test 1: Get all offers
  const offers = await apiRequest('GET', '/offers', null, authToken);
  assert(
    offers.ok,
    'Get all offers',
    `Response: ${JSON.stringify(offers.data)}`
  );

  // Test 2: Get active offers
  const activeOffers = await apiRequest('GET', '/offers/active', null, authToken);
  assert(
    activeOffers.ok,
    'Get active offers',
    `Response: ${JSON.stringify(activeOffers.data)}`
  );
}

// ==================== REVIEW TESTS ====================

async function testReviews() {
  testGroup('REVIEWS');

  // Test 1: Get product reviews (if we have product ID)
  if (productId) {
    const reviews = await apiRequest('GET', `/reviews/product/${productId}`);
    assert(
      reviews.ok,
      'Get product reviews',
      `Response: ${JSON.stringify(reviews.data)}`
    );
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  REZ APP - AUTOMATED API TEST SUITE   ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.yellow}API Base URL: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}Test Phone: ${TEST_PHONE}${colors.reset}\n`);

  const startTime = Date.now();

  try {
    await testBackendHealth();
    await testAuthentication();
    await testProducts();
    await testCategories();
    await testStores();
    await testCart();
    await testWishlist();
    await testOrders();
    await testBillUpload();
    await testSubscriptions();
    await testGamification();
    await testReferrals();
    await testWallet();
    await testOffers();
    await testReviews();
  } catch (error: any) {
    console.error(`\n${colors.red}Fatal error during test execution:${colors.reset}`, error.message);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  console.log(`${colors.blue}TEST SUMMARY${colors.reset}\n`);
  console.log(`Total Tests:  ${totalTests}`);
  console.log(`${colors.green}Passed:       ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${failedTests}${colors.reset}`);
  console.log(`Pass Rate:    ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Duration:     ${duration}s`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failedTestsList.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test}`);
    });
  }

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests();
