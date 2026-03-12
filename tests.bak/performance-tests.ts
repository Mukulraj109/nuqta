/**
 * REZ App - Performance Tests
 *
 * Tests API response times and performance benchmarks
 * Run with: npx ts-node tests/performance-tests.ts
 */

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';
const TEST_PHONE = '+919999999999';
const TEST_OTP = '123456';

// Performance targets (in milliseconds)
const TARGETS = {
  API_RESPONSE: 500, // API responses should be < 500ms
  PAGE_LOAD: 3000, // Page loads should be < 3s
  SEARCH: 1000, // Search should be < 1s
  IMAGE_LOAD: 2000, // Images should load < 2s
  CART_OPS: 300, // Cart operations < 300ms
};

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
interface PerformanceResult {
  test: string;
  duration: number;
  target: number;
  passed: boolean;
}

const results: PerformanceResult[] = [];
let authToken = '';

/**
 * Measure execution time
 */
async function measureTime<T>(
  fn: () => Promise<T>,
  testName: string,
  target: number
): Promise<PerformanceResult> {
  const start = Date.now();

  try {
    await fn();
    const duration = Date.now() - start;
    const passed = duration < target;

    const result = {
      test: testName,
      duration,
      target,
      passed,
    };

    results.push(result);

    const status = passed ? colors.green + '✓' : colors.red + '✗';
    const color = passed ? colors.green : colors.red;
    console.log(
      `${status} ${testName}: ${color}${duration}ms${colors.reset} (target: ${target}ms)`
    );

    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    const result = {
      test: testName,
      duration,
      target,
      passed: false,
    };

    results.push(result);
    console.log(
      `${colors.red}✗ ${testName}: FAILED after ${duration}ms - ${error.message}${colors.reset}`
    );

    return result;
  }
}

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

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return await response.json();
}

/**
 * Test group header
 */
function testGroup(name: string): void {
  console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}\n`);
}

// ==================== AUTHENTICATION PERFORMANCE ====================

async function testAuthPerformance() {
  testGroup('AUTHENTICATION PERFORMANCE');

  // Test 1: Send OTP speed
  await measureTime(
    async () => {
      await apiRequest('POST', '/user/auth/send-otp', {
        phoneNumber: TEST_PHONE,
      });
    },
    'Send OTP',
    TARGETS.API_RESPONSE
  );

  // Test 2: Verify OTP speed
  await measureTime(
    async () => {
      const response = await apiRequest('POST', '/user/auth/verify-otp', {
        phoneNumber: TEST_PHONE,
        otp: TEST_OTP,
      });
      if (response?.data?.tokens?.accessToken) {
        authToken = response.data.tokens.accessToken;
      }
    },
    'Verify OTP',
    TARGETS.API_RESPONSE
  );

  // Test 3: Get profile speed
  await measureTime(
    async () => {
      await apiRequest('GET', '/user/auth/me', null, authToken);
    },
    'Get User Profile',
    TARGETS.API_RESPONSE
  );

  // Test 4: Get user statistics
  await measureTime(
    async () => {
      await apiRequest('GET', '/user/auth/statistics', null, authToken);
    },
    'Get User Statistics',
    TARGETS.API_RESPONSE
  );
}

// ==================== PRODUCT PERFORMANCE ====================

async function testProductPerformance() {
  testGroup('PRODUCT PERFORMANCE');

  // Test 1: Get all products (paginated)
  await measureTime(
    async () => {
      await apiRequest('GET', '/products?limit=20&page=1');
    },
    'Get Products (20 items)',
    TARGETS.API_RESPONSE
  );

  // Test 2: Get featured products
  await measureTime(
    async () => {
      await apiRequest('GET', '/products/featured?limit=10');
    },
    'Get Featured Products',
    TARGETS.API_RESPONSE
  );

  // Test 3: Product search
  await measureTime(
    async () => {
      await apiRequest('GET', '/products/search?q=laptop&limit=10');
    },
    'Product Search',
    TARGETS.SEARCH
  );

  // Test 4: Get product by ID
  const products = await apiRequest('GET', '/products?limit=1');
  if (products?.data && products.data.length > 0) {
    const productId = products.data[0]._id || products.data[0].id;

    await measureTime(
      async () => {
        await apiRequest('GET', `/products/${productId}`);
      },
      'Get Product Details',
      TARGETS.API_RESPONSE
    );

    // Test 5: Get product recommendations
    await measureTime(
      async () => {
        await apiRequest('GET', `/products/${productId}/recommendations?limit=5`);
      },
      'Get Product Recommendations',
      TARGETS.API_RESPONSE
    );
  }

  // Test 6: Search with filters
  await measureTime(
    async () => {
      await apiRequest('GET', '/products?category=electronics&minPrice=1000&maxPrice=50000&limit=20');
    },
    'Search with Filters',
    TARGETS.SEARCH
  );
}

// ==================== CATEGORY & STORE PERFORMANCE ====================

async function testCategoryStorePerformance() {
  testGroup('CATEGORY & STORE PERFORMANCE');

  // Test 1: Get all categories
  await measureTime(
    async () => {
      await apiRequest('GET', '/categories');
    },
    'Get All Categories',
    TARGETS.API_RESPONSE
  );

  // Test 2: Get all stores
  await measureTime(
    async () => {
      await apiRequest('GET', '/stores?limit=20');
    },
    'Get All Stores',
    TARGETS.API_RESPONSE
  );

  // Test 3: Get store details
  const stores = await apiRequest('GET', '/stores?limit=1');
  if (stores?.data && stores.data.length > 0) {
    const storeId = stores.data[0]._id || stores.data[0].id;

    await measureTime(
      async () => {
        await apiRequest('GET', `/stores/${storeId}`);
      },
      'Get Store Details',
      TARGETS.API_RESPONSE
    );

    // Test 4: Get store products
    await measureTime(
      async () => {
        await apiRequest('GET', `/products/store/${storeId}?limit=20`);
      },
      'Get Store Products',
      TARGETS.API_RESPONSE
    );
  }
}

// ==================== CART PERFORMANCE ====================

async function testCartPerformance() {
  testGroup('CART PERFORMANCE');

  // Test 1: Get cart
  await measureTime(
    async () => {
      await apiRequest('GET', '/cart', null, authToken);
    },
    'Get Cart',
    TARGETS.CART_OPS
  );

  // Get a product to add
  const products = await apiRequest('GET', '/products?limit=1');
  if (products?.data && products.data.length > 0) {
    const productId = products.data[0]._id || products.data[0].id;

    // Test 2: Add to cart
    await measureTime(
      async () => {
        await apiRequest('POST', '/cart/add', { productId, quantity: 1 }, authToken);
      },
      'Add to Cart',
      TARGETS.CART_OPS
    );

    // Test 3: Update cart
    await measureTime(
      async () => {
        await apiRequest('PUT', `/cart/item/${productId}`, { quantity: 2 }, authToken);
      },
      'Update Cart Item',
      TARGETS.CART_OPS
    );

    // Test 4: Get cart summary
    await measureTime(
      async () => {
        await apiRequest('GET', '/cart/summary', null, authToken);
      },
      'Get Cart Summary',
      TARGETS.CART_OPS
    );

    // Test 5: Validate cart
    await measureTime(
      async () => {
        await apiRequest('GET', '/cart/validate', null, authToken);
      },
      'Validate Cart',
      TARGETS.API_RESPONSE
    );

    // Cleanup: Remove from cart
    await apiRequest('DELETE', `/cart/item/${productId}`, null, authToken);
  }
}

// ==================== GAMIFICATION PERFORMANCE ====================

async function testGamificationPerformance() {
  testGroup('GAMIFICATION PERFORMANCE');

  // Test 1: Get gamification stats
  await measureTime(
    async () => {
      await apiRequest('GET', '/gamification/stats', null, authToken);
    },
    'Get Gamification Stats',
    TARGETS.API_RESPONSE
  );

  // Test 2: Get challenges
  await measureTime(
    async () => {
      await apiRequest('GET', '/gamification/challenges', null, authToken);
    },
    'Get Challenges',
    TARGETS.API_RESPONSE
  );

  // Test 3: Get achievements
  await measureTime(
    async () => {
      await apiRequest('GET', '/gamification/achievements', null, authToken);
    },
    'Get Achievements',
    TARGETS.API_RESPONSE
  );

  // Test 4: Get leaderboard
  await measureTime(
    async () => {
      await apiRequest('GET', '/gamification/leaderboard?period=monthly&limit=50', null, authToken);
    },
    'Get Leaderboard (50 users)',
    TARGETS.API_RESPONSE
  );

  // Test 5: Get leaderboard (large dataset)
  await measureTime(
    async () => {
      await apiRequest('GET', '/gamification/leaderboard?period=all-time&limit=100', null, authToken);
    },
    'Get Leaderboard (100 users)',
    TARGETS.API_RESPONSE
  );

  // Test 6: Get coin balance
  await measureTime(
    async () => {
      await apiRequest('GET', '/gamification/coins/balance', null, authToken);
    },
    'Get Coin Balance',
    TARGETS.API_RESPONSE
  );
}

// ==================== SUBSCRIPTION PERFORMANCE ====================

async function testSubscriptionPerformance() {
  testGroup('SUBSCRIPTION PERFORMANCE');

  // Test 1: Get subscription tiers
  await measureTime(
    async () => {
      await apiRequest('GET', '/subscriptions/tiers');
    },
    'Get Subscription Tiers',
    TARGETS.API_RESPONSE
  );

  // Test 2: Get current subscription
  await measureTime(
    async () => {
      await apiRequest('GET', '/subscriptions/current', null, authToken);
    },
    'Get Current Subscription',
    TARGETS.API_RESPONSE
  );

  // Test 3: Get subscription benefits
  await measureTime(
    async () => {
      await apiRequest('GET', '/subscriptions/benefits', null, authToken);
    },
    'Get Subscription Benefits',
    TARGETS.API_RESPONSE
  );

  // Test 4: Get subscription usage
  await measureTime(
    async () => {
      await apiRequest('GET', '/subscriptions/usage', null, authToken);
    },
    'Get Subscription Usage',
    TARGETS.API_RESPONSE
  );
}

// ==================== REFERRAL PERFORMANCE ====================

async function testReferralPerformance() {
  testGroup('REFERRAL PERFORMANCE');

  // Test 1: Get referral data
  await measureTime(
    async () => {
      await apiRequest('GET', '/referral/data', null, authToken);
    },
    'Get Referral Data',
    TARGETS.API_RESPONSE
  );

  // Test 2: Get referral history
  await measureTime(
    async () => {
      await apiRequest('GET', '/referral/history?page=1&limit=20', null, authToken);
    },
    'Get Referral History',
    TARGETS.API_RESPONSE
  );

  // Test 3: Get referral statistics
  await measureTime(
    async () => {
      await apiRequest('GET', '/referral/statistics', null, authToken);
    },
    'Get Referral Statistics',
    TARGETS.API_RESPONSE
  );
}

// ==================== CONCURRENT REQUEST PERFORMANCE ====================

async function testConcurrentRequests() {
  testGroup('CONCURRENT REQUEST PERFORMANCE');

  // Test 1: 5 concurrent product requests
  await measureTime(
    async () => {
      await Promise.all([
        apiRequest('GET', '/products?limit=10'),
        apiRequest('GET', '/products/featured?limit=5'),
        apiRequest('GET', '/categories'),
        apiRequest('GET', '/stores?limit=10'),
        apiRequest('GET', '/offers', null, authToken),
      ]);
    },
    '5 Concurrent Requests',
    TARGETS.PAGE_LOAD
  );

  // Test 2: 10 concurrent requests
  await measureTime(
    async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(apiRequest('GET', '/products?limit=5'));
      }
      await Promise.all(requests);
    },
    '10 Concurrent Product Requests',
    TARGETS.PAGE_LOAD
  );

  // Test 3: 20 concurrent requests
  await measureTime(
    async () => {
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(apiRequest('GET', '/products/featured?limit=3'));
      }
      await Promise.all(requests);
    },
    '20 Concurrent Featured Requests',
    TARGETS.PAGE_LOAD * 2
  );
}

// ==================== DATABASE QUERY PERFORMANCE ====================

async function testDatabasePerformance() {
  testGroup('DATABASE QUERY PERFORMANCE');

  // Test 1: Large product query
  await measureTime(
    async () => {
      await apiRequest('GET', '/products?limit=100');
    },
    'Get 100 Products',
    TARGETS.API_RESPONSE * 2
  );

  // Test 2: Complex search query
  await measureTime(
    async () => {
      await apiRequest(
        'GET',
        '/products/search?q=electronics&minPrice=1000&maxPrice=100000&sort=price&order=asc&limit=50'
      );
    },
    'Complex Search Query',
    TARGETS.SEARCH
  );

  // Test 3: Get order history (if orders exist)
  await measureTime(
    async () => {
      await apiRequest('GET', '/orders?page=1&limit=50', null, authToken);
    },
    'Get Order History (50 orders)',
    TARGETS.API_RESPONSE
  );

  // Test 4: Get wallet transactions
  await measureTime(
    async () => {
      await apiRequest('GET', '/wallet/transactions?page=1&limit=50', null, authToken);
    },
    'Get Wallet Transactions (50)',
    TARGETS.API_RESPONSE
  );
}

// ==================== MAIN TEST RUNNER ====================

async function runPerformanceTests() {
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  REZ APP - PERFORMANCE TEST SUITE                            ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.yellow}API Base URL: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}Performance Targets:${colors.reset}`);
  console.log(`  - API Response: < ${TARGETS.API_RESPONSE}ms`);
  console.log(`  - Page Load: < ${TARGETS.PAGE_LOAD}ms`);
  console.log(`  - Search: < ${TARGETS.SEARCH}ms`);
  console.log(`  - Cart Operations: < ${TARGETS.CART_OPS}ms\n`);

  const startTime = Date.now();

  try {
    await testAuthPerformance();
    await testProductPerformance();
    await testCategoryStorePerformance();
    await testCartPerformance();
    await testGamificationPerformance();
    await testSubscriptionPerformance();
    await testReferralPerformance();
    await testConcurrentRequests();
    await testDatabasePerformance();
  } catch (error: any) {
    console.error(`\n${colors.red}Fatal error during performance tests:${colors.reset}`, error.message);
  }

  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

  // Calculate statistics
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;
  const totalTests = results.length;
  const avgDuration = (results.reduce((sum, r) => sum + r.duration, 0) / totalTests).toFixed(2);
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));

  // Print summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  console.log(`${colors.blue}PERFORMANCE TEST SUMMARY${colors.reset}\n`);
  console.log(`Total Tests:     ${totalTests}`);
  console.log(`${colors.green}Passed:          ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed:          ${failedTests}${colors.reset}`);
  console.log(`Success Rate:    ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`\nPerformance Metrics:`);
  console.log(`Average Time:    ${avgDuration}ms`);
  console.log(`Fastest Test:    ${minDuration}ms`);
  console.log(`Slowest Test:    ${maxDuration}ms`);
  console.log(`Total Duration:  ${totalDuration}s`);

  // Print slowest tests
  const slowestTests = [...results]
    .filter(r => !r.passed)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);

  if (slowestTests.length > 0) {
    console.log(`\n${colors.red}Slowest/Failed Tests:${colors.reset}`);
    slowestTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.test}: ${test.duration}ms (target: ${test.target}ms)`);
    });
  }

  // Print performance grades
  console.log(`\n${colors.blue}Performance Grades:${colors.reset}`);
  const gradeA = results.filter(r => r.duration < r.target * 0.5).length;
  const gradeB = results.filter(r => r.duration >= r.target * 0.5 && r.duration < r.target * 0.75).length;
  const gradeC = results.filter(r => r.duration >= r.target * 0.75 && r.duration < r.target).length;
  const gradeD = results.filter(r => r.duration >= r.target && r.duration < r.target * 1.5).length;
  const gradeF = results.filter(r => r.duration >= r.target * 1.5).length;

  console.log(`  ${colors.green}A (Excellent - < 50% of target): ${gradeA}${colors.reset}`);
  console.log(`  ${colors.green}B (Good - 50-75% of target):     ${gradeB}${colors.reset}`);
  console.log(`  ${colors.yellow}C (Fair - 75-100% of target):    ${gradeC}${colors.reset}`);
  console.log(`  ${colors.red}D (Poor - 100-150% of target):   ${gradeD}${colors.reset}`);
  console.log(`  ${colors.red}F (Very Poor - > 150% of target): ${gradeF}${colors.reset}`);

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run performance tests
runPerformanceTests();
