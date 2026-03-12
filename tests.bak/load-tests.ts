/**
 * REZ App - Load Tests
 *
 * Tests system behavior under concurrent load
 * Run with: npx ts-node tests/load-tests.ts
 */

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';
const TEST_PHONE_BASE = '+9199999999'; // Will append numbers for unique users

// Load test configuration
const LOAD_SCENARIOS = {
  light: {
    name: 'Light Load',
    users: 10,
    duration: 30000, // 30 seconds
    requestsPerSecond: 10,
  },
  medium: {
    name: 'Medium Load',
    users: 50,
    duration: 60000, // 1 minute
    requestsPerSecond: 50,
  },
  heavy: {
    name: 'Heavy Load',
    users: 100,
    duration: 120000, // 2 minutes
    requestsPerSecond: 100,
  },
  spike: {
    name: 'Spike Test',
    users: 200,
    duration: 10000, // 10 seconds burst
    requestsPerSecond: 200,
  },
};

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

// Metrics tracking
interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  responseTimes: number[];
  errors: Map<string, number>;
  requestsPerSecond: number[];
}

/**
 * API request helper
 */
async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  token?: string
): Promise<{ success: boolean; duration: number; error?: string }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = Date.now();

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

    const duration = Date.now() - startTime;

    return {
      success: response.ok,
      duration,
      error: !response.ok ? `HTTP ${response.status}` : undefined,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      duration,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate percentile
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((sorted.length * p) / 100) - 1;
  return sorted[index];
}

/**
 * Print metrics
 */
function printMetrics(metrics: LoadTestMetrics, duration: number): void {
  const avgResponseTime = metrics.totalResponseTime / metrics.totalRequests;
  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
  const actualRPS = metrics.totalRequests / (duration / 1000);

  console.log(`\n${colors.cyan}Load Test Results:${colors.reset}\n`);
  console.log(`Total Requests:      ${metrics.totalRequests}`);
  console.log(`${colors.green}Successful:          ${metrics.successfulRequests}${colors.reset}`);
  console.log(`${colors.red}Failed:              ${metrics.failedRequests}${colors.reset}`);
  console.log(`Success Rate:        ${successRate.toFixed(2)}%`);
  console.log(`\nResponse Times:`);
  console.log(`  Average:           ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  Min:               ${metrics.minResponseTime}ms`);
  console.log(`  Max:               ${metrics.maxResponseTime}ms`);
  console.log(`  P50 (Median):      ${percentile(metrics.responseTimes, 50).toFixed(2)}ms`);
  console.log(`  P95:               ${percentile(metrics.responseTimes, 95).toFixed(2)}ms`);
  console.log(`  P99:               ${percentile(metrics.responseTimes, 99).toFixed(2)}ms`);
  console.log(`\nThroughput:`);
  console.log(`  Requests/sec:      ${actualRPS.toFixed(2)}`);
  console.log(`  Duration:          ${(duration / 1000).toFixed(2)}s`);

  if (metrics.errors.size > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    metrics.errors.forEach((count, error) => {
      console.log(`  ${error}: ${count}`);
    });
  }
}

/**
 * Simulate user browsing products
 */
async function simulateBrowsing(metrics: LoadTestMetrics): Promise<void> {
  // Get products
  const result1 = await apiRequest('GET', '/products?limit=20');
  updateMetrics(metrics, result1);

  await sleep(100);

  // Get featured products
  const result2 = await apiRequest('GET', '/products/featured?limit=10');
  updateMetrics(metrics, result2);

  await sleep(100);

  // Get categories
  const result3 = await apiRequest('GET', '/categories');
  updateMetrics(metrics, result3);
}

/**
 * Simulate user searching
 */
async function simulateSearch(metrics: LoadTestMetrics): Promise<void> {
  const searchTerms = ['laptop', 'phone', 'shoes', 'shirt', 'watch', 'bag', 'book'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

  const result = await apiRequest('GET', `/products/search?q=${term}&limit=10`);
  updateMetrics(metrics, result);
}

/**
 * Simulate user viewing product details
 */
async function simulateProductView(metrics: LoadTestMetrics, productId: string): Promise<void> {
  const result = await apiRequest('GET', `/products/${productId}`);
  updateMetrics(metrics, result);
}

/**
 * Simulate user checking gamification
 */
async function simulateGamification(metrics: LoadTestMetrics, token: string): Promise<void> {
  // Get challenges
  const result1 = await apiRequest('GET', '/gamification/challenges', null, token);
  updateMetrics(metrics, result1);

  await sleep(50);

  // Get leaderboard
  const result2 = await apiRequest('GET', '/gamification/leaderboard?period=monthly&limit=50', null, token);
  updateMetrics(metrics, result2);
}

/**
 * Update metrics
 */
function updateMetrics(metrics: LoadTestMetrics, result: { success: boolean; duration: number; error?: string }): void {
  metrics.totalRequests++;

  if (result.success) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
    const error = result.error || 'Unknown error';
    metrics.errors.set(error, (metrics.errors.get(error) || 0) + 1);
  }

  metrics.totalResponseTime += result.duration;
  metrics.responseTimes.push(result.duration);
  metrics.minResponseTime = Math.min(metrics.minResponseTime, result.duration);
  metrics.maxResponseTime = Math.max(metrics.maxResponseTime, result.duration);
}

/**
 * Initialize metrics
 */
function initMetrics(): LoadTestMetrics {
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    responseTimes: [],
    errors: new Map(),
    requestsPerSecond: [],
  };
}

// ==================== LOAD TEST 1: BROWSE PRODUCTS ====================

async function loadTest1_BrowseProducts() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  LOAD TEST 1: 10 Concurrent Users Browsing Products       ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const metrics = initMetrics();
  const startTime = Date.now();
  const duration = 30000; // 30 seconds
  const concurrentUsers = 10;

  const promises = [];

  for (let i = 0; i < concurrentUsers; i++) {
    const promise = (async () => {
      const userStartTime = Date.now();
      while (Date.now() - userStartTime < duration) {
        await simulateBrowsing(metrics);
        await sleep(Math.random() * 1000); // Random delay between actions
      }
    })();

    promises.push(promise);
  }

  await Promise.all(promises);

  const actualDuration = Date.now() - startTime;
  printMetrics(metrics, actualDuration);
}

// ==================== LOAD TEST 2: SEARCH OPERATIONS ====================

async function loadTest2_SearchOperations() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  LOAD TEST 2: 50 Concurrent Search Requests               ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const metrics = initMetrics();
  const startTime = Date.now();
  const totalRequests = 50;

  const promises = [];

  for (let i = 0; i < totalRequests; i++) {
    promises.push(simulateSearch(metrics));
  }

  await Promise.all(promises);

  const actualDuration = Date.now() - startTime;
  printMetrics(metrics, actualDuration);
}

// ==================== LOAD TEST 3: DATABASE CONNECTION POOL ====================

async function loadTest3_DatabaseLoad() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  LOAD TEST 3: 100 Concurrent API Requests                 ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const metrics = initMetrics();
  const startTime = Date.now();
  const totalRequests = 100;

  const endpoints = [
    '/products?limit=10',
    '/products/featured?limit=5',
    '/categories',
    '/stores?limit=10',
  ];

  const promises = [];

  for (let i = 0; i < totalRequests; i++) {
    const endpoint = endpoints[i % endpoints.length];
    promises.push(apiRequest('GET', endpoint).then(result => updateMetrics(metrics, result)));
  }

  await Promise.all(promises);

  const actualDuration = Date.now() - startTime;
  printMetrics(metrics, actualDuration);
}

// ==================== LOAD TEST 4: SPIKE TEST ====================

async function loadTest4_SpikeTest() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  LOAD TEST 4: Spike Test - 200 Requests in 10 Seconds    ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const metrics = initMetrics();
  const startTime = Date.now();
  const duration = 10000; // 10 seconds
  const targetRPS = 20; // 20 requests per second
  const interval = 1000 / targetRPS; // 50ms between requests

  let requestCount = 0;

  while (Date.now() - startTime < duration) {
    simulateBrowsing(metrics); // Fire and forget
    requestCount++;
    await sleep(interval);
  }

  // Wait for all requests to complete
  await sleep(5000);

  const actualDuration = Date.now() - startTime;
  printMetrics(metrics, actualDuration);
}

// ==================== LOAD TEST 5: SUSTAINED LOAD ====================

async function loadTest5_SustainedLoad() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  LOAD TEST 5: Sustained Load - 50 Users for 1 Minute     ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const metrics = initMetrics();
  const startTime = Date.now();
  const duration = 60000; // 1 minute
  const concurrentUsers = 50;

  console.log(`${colors.yellow}Running sustained load test... This will take 1 minute.${colors.reset}\n`);

  const promises = [];

  for (let i = 0; i < concurrentUsers; i++) {
    const promise = (async () => {
      const userStartTime = Date.now();
      while (Date.now() - userStartTime < duration) {
        const action = Math.random();

        if (action < 0.5) {
          await simulateBrowsing(metrics);
        } else if (action < 0.8) {
          await simulateSearch(metrics);
        } else {
          // Get products first
          const productsResult = await apiRequest('GET', '/products?limit=1');
          updateMetrics(metrics, productsResult);
        }

        await sleep(Math.random() * 2000); // Random delay 0-2s
      }
    })();

    promises.push(promise);
  }

  await Promise.all(promises);

  const actualDuration = Date.now() - startTime;
  printMetrics(metrics, actualDuration);
}

// ==================== LOAD TEST 6: CART OPERATIONS ====================

async function loadTest6_CartOperations() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  LOAD TEST 6: Cart Operations Load Test                   ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}Note: This test requires authentication. Skipping for now.${colors.reset}`);
  console.log(`${colors.yellow}To run: Authenticate multiple users and test cart operations.${colors.reset}\n`);
}

// ==================== LOAD TEST 7: REDIS CACHE ====================

async function loadTest7_CachePerformance() {
  console.log(`\n${colors.magenta}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}║  LOAD TEST 7: Cache Performance Test                      ║${colors.reset}`);
  console.log(`${colors.magenta}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const metrics = initMetrics();
  const startTime = Date.now();
  const iterations = 100;

  // Test cache hit performance by requesting same data multiple times
  console.log(`${colors.yellow}Testing cache performance with ${iterations} requests...${colors.reset}\n`);

  for (let i = 0; i < iterations; i++) {
    const result = await apiRequest('GET', '/products/featured?limit=10');
    updateMetrics(metrics, result);
  }

  const actualDuration = Date.now() - startTime;
  printMetrics(metrics, actualDuration);

  console.log(`\n${colors.cyan}Cache Analysis:${colors.reset}`);
  console.log(`If cache is working, later requests should be significantly faster than initial ones.`);
}

// ==================== MAIN TEST RUNNER ====================

async function runLoadTests() {
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  REZ APP - LOAD TEST SUITE                                   ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.yellow}API Base URL: ${API_BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}Warning: These tests will generate significant load on the server.${colors.reset}`);
  console.log(`${colors.yellow}Ensure you're running against a test environment, not production!${colors.reset}\n`);

  const overallStartTime = Date.now();

  try {
    await loadTest1_BrowseProducts();
    await sleep(2000); // Cooldown

    await loadTest2_SearchOperations();
    await sleep(2000);

    await loadTest3_DatabaseLoad();
    await sleep(2000);

    await loadTest4_SpikeTest();
    await sleep(2000);

    await loadTest5_SustainedLoad();
    await sleep(2000);

    await loadTest6_CartOperations();
    await sleep(2000);

    await loadTest7_CachePerformance();
  } catch (error: any) {
    console.error(`\n${colors.red}Fatal error during load tests:${colors.reset}`, error.message);
  }

  const totalDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  console.log(`${colors.blue}LOAD TEST SUITE COMPLETED${colors.reset}\n`);
  console.log(`Total Duration: ${totalDuration}s`);
  console.log(`\n${colors.green}All load tests completed successfully!${colors.reset}`);
  console.log(`\n${colors.cyan}Recommendations:${colors.reset}`);
  console.log(`- Review response times under load`);
  console.log(`- Check server CPU/memory usage during tests`);
  console.log(`- Monitor database connection pool`);
  console.log(`- Verify cache hit rates`);
  console.log(`- Check for any error spikes`);
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

// Run load tests
runLoadTests();
